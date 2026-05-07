package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"dental-clinic/config"
	"dental-clinic/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const slotInterval = 30 * time.Minute
const maxSlotSearch = 20 // look up to 10 hours ahead

// findAvailableSlot checks if a slot is free and finds the next one if not
func findAvailableSlot(doctorID uint, requested time.Time, excludeBookingID uint) (time.Time, bool) {
	// Round to nearest 30-min slot
	minutes := requested.Minute()
	if minutes < 30 {
		minutes = 0
	} else {
		minutes = 30
	}
	rounded := time.Date(requested.Year(), requested.Month(), requested.Day(),
		requested.Hour(), minutes, 0, 0, requested.Location())

	for i := 0; i < maxSlotSearch; i++ {
		candidate := rounded.Add(time.Duration(i) * slotInterval)

		var count int64
		query := config.DB.Model(&models.Booking{}).
			Where("doctor_id = ? AND booking_datetime = ? AND status NOT IN ('cancelled')", doctorID, candidate)
		if excludeBookingID > 0 {
			query = query.Where("booking_id != ?", excludeBookingID)
		}
		query.Count(&count)

		if count == 0 {
			return candidate, i == 0
		}
	}
	return time.Time{}, false
}

func CreateBooking(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req models.CreateBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// Validate doctor exists
	var doctor models.Doctor
	if err := config.DB.First(&doctor, req.DoctorID).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{Success: false, Error: "Doctor not found"})
		return
	}

	// Validate service exists
	var service models.Service
	if err := config.DB.First(&service, req.ServiceID).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{Success: false, Error: "Service not found"})
		return
	}

	// Don't allow past bookings
	if req.BookingDatetime.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Cannot book a past date/time",
		})
		return
	}

	recommendation := models.BookingRecommendation{
		RequestedTime: req.BookingDatetime,
	}

	// Check for conflict at requested time
	var conflictingBooking models.Booking
	conflictErr := config.DB.Where(
		"doctor_id = ? AND booking_datetime = ? AND status NOT IN ('cancelled')",
		req.DoctorID, req.BookingDatetime,
	).First(&conflictingBooking).Error

	hasConflict := conflictErr == nil // found a conflicting booking

	var finalTime time.Time
	//	var bookingErr error

	// Use DB transaction
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if hasConflict {
		recommendation.ConflictExists = true

		if req.IsEmergency && !conflictingBooking.IsEmergency {
			// Emergency override: shift the existing normal booking
			recommendation.EmergencyOverride = true
			recommendation.ShiftedBookingID = conflictingBooking.BookingID

			// Find next free slot to shift the conflicting booking
			shiftedTime, found := findAvailableSlot(req.DoctorID, req.BookingDatetime.Add(slotInterval), 0)
			if !found {
				tx.Rollback()
				c.JSON(http.StatusConflict, models.APIResponse{
					Success: false,
					Error:   "No available slots to shift existing booking",
				})
				return
			}

			// Shift the conflicting booking
			if err := tx.Model(&conflictingBooking).Update("booking_datetime", shiftedTime).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, models.APIResponse{
					Success: false,
					Error:   "Failed to shift existing booking",
				})
				return
			}

			recommendation.Message = "Emergency booking placed. Existing booking shifted to " + shiftedTime.Format("2006-01-02 15:04")
			finalTime = req.BookingDatetime

		} else {
			// Suggest next available time
			suggestedTime, found := findAvailableSlot(req.DoctorID, req.BookingDatetime, 0)
			if !found {
				tx.Rollback()
				c.JSON(http.StatusConflict, models.APIResponse{
					Success: false,
					Error:   "No available time slots found",
				})
				return
			}

			tx.Rollback()
			recommendation.Available = false
			recommendation.SuggestedTime = suggestedTime
			recommendation.Message = "Time slot unavailable. Suggested time: " + suggestedTime.Format("2006-01-02 15:04")

			c.JSON(http.StatusConflict, models.APIResponse{
				Success: false,
				Data:    recommendation,
				Error:   "Time slot unavailable. See suggestion in data.",
			})
			return
		}
	} else {
		finalTime = req.BookingDatetime
		recommendation.Available = true
		recommendation.Message = "Booking confirmed at requested time"
	}

	// Create the booking
	booking := models.Booking{
		UserID:          userID.(uint),
		DoctorID:        req.DoctorID,
		ServiceID:       req.ServiceID,
		BookingDatetime: finalTime,
		IsEmergency:     req.IsEmergency,
		Status:          "pending",
		Notes:           req.Notes,
	}

	if err := tx.Create(&booking).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrDuplicatedKey) || isUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, models.APIResponse{
				Success: false,
				Error:   "Time slot already taken (race condition). Please try again.",
			})
		} else {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Error:   "Failed to create booking: " + err.Error(),
			})
		}
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Transaction failed",
		})
		return
	}

	// Load relations for response
	config.DB.Preload("Doctor").Preload("Service").First(&booking, booking.BookingID)

	recommendation.SuggestedTime = finalTime

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data: gin.H{
			"booking":        booking,
			"recommendation": recommendation,
		},
	})
}

func isUniqueConstraintError(err error) bool {
	if err == nil {
		return false
	}
	errStr := err.Error()
	return contains(errStr, "Duplicate entry") || contains(errStr, "UNIQUE constraint failed")
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func GetBookingsByUser(c *gin.Context) {
	userIDParam := c.Param("id")
	requestingUserID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	targetUserID, err := strconv.ParseUint(userIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: "Invalid user ID"})
		return
	}

	// Only admin or the user themselves can view
	if role != "admin" && requestingUserID.(uint) != uint(targetUserID) {
		c.JSON(http.StatusForbidden, models.APIResponse{Success: false, Error: "Access denied"})
		return
	}

	var bookings []models.Booking
	if err := config.DB.Preload("Doctor").Preload("Service").
		Where("user_id = ?", targetUserID).
		Order("booking_datetime DESC").
		Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to fetch bookings",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    bookings,
	})
}

func GetBookingsByDoctor(c *gin.Context) {
	doctorIDParam := c.Param("id")
	doctorID, err := strconv.ParseUint(doctorIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: "Invalid doctor ID"})
		return
	}

	var bookings []models.Booking
	if err := config.DB.Preload("User").Preload("Service").
		Where("doctor_id = ? AND status NOT IN ('cancelled')", doctorID).
		Order("booking_datetime ASC").
		Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to fetch bookings",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    bookings,
	})
}

func CancelBooking(c *gin.Context) {
	bookingIDParam := c.Param("id")
	bookingID, err := strconv.ParseUint(bookingIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: "Invalid booking ID"})
		return
	}

	requestingUserID, _ := c.Get("user_id")
	role, _ := c.Get("role")

	var booking models.Booking
	if err := config.DB.First(&booking, bookingID).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{Success: false, Error: "Booking not found"})
		return
	}

	if role != "admin" && booking.UserID != requestingUserID.(uint) {
		c.JSON(http.StatusForbidden, models.APIResponse{Success: false, Error: "Access denied"})
		return
	}

	if booking.Status == "cancelled" {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: "Booking already cancelled"})
		return
	}

	if booking.Status == "done" {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: "Cannot cancel completed booking"})
		return
	}

	if err := config.DB.Model(&booking).Update("status", "cancelled").Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Error: "Failed to cancel booking"})
		return
	}

	booking.Status = "cancelled"

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    booking,
	})
}

func CheckSlotAvailability(c *gin.Context) {
	doctorIDStr := c.Query("doctor_id")
	datetimeStr := c.Query("datetime")

	doctorID, err := strconv.ParseUint(doctorIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: "Invalid doctor_id"})
		return
	}

	dt, err := time.Parse(time.RFC3339, datetimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: "Invalid datetime format. Use RFC3339"})
		return
	}

	suggestedTime, isExact := findAvailableSlot(uint(doctorID), dt, 0)

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"available":      isExact,
			"requested_time": dt,
			"suggested_time": suggestedTime,
			"message": func() string {
				if isExact {
					return "Time slot is available"
				}
				return "Time slot taken. Next available: " + suggestedTime.Format("2006-01-02 15:04")
			}(),
		},
	})
}
