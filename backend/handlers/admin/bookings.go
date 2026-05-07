package admin

import (
	"net/http"
	"strconv"
	"strings"

	"dental-clinic/config"
	"dental-clinic/models"

	"github.com/gin-gonic/gin"
)

func GetAllBookings(c *gin.Context) {
	search := c.Query("search")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	query := config.DB.Model(&models.Booking{}).
		Joins("LEFT JOIN users ON users.user_id = bookings.user_id").
		Joins("LEFT JOIN doctors ON doctors.doctor_id = bookings.doctor_id")

	if status != "" {
		query = query.Where("bookings.status = ?", status)
	}
	if search != "" {
		like := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(users.name) LIKE ? OR LOWER(doctors.name) LIKE ?", like, like)
	}

	var total int64
	query.Count(&total)

	var bookings []models.Booking
	query.Preload("User").Preload("Doctor").Preload("Service").
		Select("bookings.*").
		Offset(offset).Limit(limit).
		Order("bookings.created_at DESC").
		Find(&bookings)

	if bookings == nil {
		bookings = []models.Booking{}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"bookings": bookings,
			"total":    total,
			"page":     page,
			"limit":    limit,
		},
	})
}

func UpdateBookingStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: "Invalid ID"})
		return
	}

	var booking models.Booking
	if err := config.DB.First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{Success: false, Error: "Booking not found"})
		return
	}

	var req models.UpdateBookingStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: err.Error()})
		return
	}

	validStatuses := map[string]bool{
		"pending": true, "confirmed": true, "ongoing": true, "done": true, "cancelled": true,
	}
	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: "Invalid status"})
		return
	}

	updates := map[string]interface{}{
		"status": req.Status,
	}
	if req.AdminNotes != "" {
		updates["admin_notes"] = req.AdminNotes
	}
	if req.EstimatedTime != "" {
		updates["estimated_time"] = req.EstimatedTime
	}

	config.DB.Model(&booking).Updates(updates)
	config.DB.Preload("User").Preload("Doctor").Preload("Service").First(&booking, id)

	c.JSON(http.StatusOK, models.APIResponse{Success: true, Data: booking})
}
