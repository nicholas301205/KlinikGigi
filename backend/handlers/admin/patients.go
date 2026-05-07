package admin

import (
	"net/http"
	"strconv"
	"strings"

	"dental-clinic/config"
	"dental-clinic/models"

	"github.com/gin-gonic/gin"
)

func GetAllPatients(c *gin.Context) {
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	query := config.DB.Model(&models.User{}).Where("role = ?", "pasien")
	if search != "" {
		like := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(email) LIKE ?", like, like)
	}

	var total int64
	query.Count(&total)

	var users []models.User
	query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&users)

	// Build patient summaries with booking counts
	var summaries []models.PatientSummary
	for _, u := range users {
		var bookingCount int64
		config.DB.Model(&models.Booking{}).Where("user_id = ?", u.UserID).Count(&bookingCount)
		summaries = append(summaries, models.PatientSummary{
			UserID:        u.UserID,
			Name:          u.Name,
			Email:         u.Email,
			Phone:         u.Phone,
			Address:       u.Address,
			TotalBookings: bookingCount,
			CreatedAt:     u.CreatedAt,
		})
	}

	if summaries == nil {
		summaries = []models.PatientSummary{}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"patients": summaries,
			"total":    total,
			"page":     page,
			"limit":    limit,
		},
	})
}

func GetPatientDetail(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: "Invalid ID"})
		return
	}

	var user models.User
	if err := config.DB.Where("user_id = ? AND role = ?", id, "pasien").First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{Success: false, Error: "Patient not found"})
		return
	}

	var bookings []models.Booking
	config.DB.Preload("Doctor").Preload("Service").
		Where("user_id = ?", id).
		Order("booking_datetime DESC").
		Find(&bookings)

	var bookingCount int64
	config.DB.Model(&models.Booking{}).Where("user_id = ?", id).Count(&bookingCount)

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"patient": models.PatientSummary{
				UserID:        user.UserID,
				Name:          user.Name,
				Email:         user.Email,
				Phone:         user.Phone,
				Address:       user.Address,
				TotalBookings: bookingCount,
				CreatedAt:     user.CreatedAt,
			},
			"bookings": bookings,
		},
	})
}
