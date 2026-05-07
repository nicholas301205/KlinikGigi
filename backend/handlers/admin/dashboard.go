package admin

import (
	"net/http"
	"time"

	"dental-clinic/config"
	"dental-clinic/models"

	"github.com/gin-gonic/gin"
)

func GetDashboardStats(c *gin.Context) {
	var stats models.DashboardStats

	config.DB.Model(&models.User{}).Where("role = ?", "pasien").Count(&stats.TotalPatients)
	config.DB.Model(&models.Doctor{}).Count(&stats.TotalDoctors)
	config.DB.Model(&models.Service{}).Count(&stats.TotalServices)
	config.DB.Model(&models.Booking{}).Count(&stats.TotalBookings)

	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)
	config.DB.Model(&models.Booking{}).
		Where("booking_datetime >= ? AND booking_datetime < ?", today, tomorrow).
		Count(&stats.BookingsToday)

	config.DB.Model(&models.Booking{}).Where("status = ?", "pending").Count(&stats.BookingsPending)
	config.DB.Model(&models.Booking{}).Where("status = ?", "done").Count(&stats.BookingsCompleted)
	config.DB.Model(&models.Booking{}).Where("status = ?", "cancelled").Count(&stats.BookingsCancelled)

	// Recent bookings (last 10)
	var recentBookings []models.Booking
	config.DB.Preload("User").Preload("Doctor").Preload("Service").
		Order("created_at DESC").Limit(10).Find(&recentBookings)

	// Monthly booking chart data (last 6 months)
	type MonthlyData struct {
		Month string `json:"month"`
		Count int64  `json:"count"`
	}
	var monthlyData []MonthlyData
	for i := 5; i >= 0; i-- {
		t := time.Now().AddDate(0, -i, 0)
		start := time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, time.Local)
		end := start.AddDate(0, 1, 0)
		var count int64
		config.DB.Model(&models.Booking{}).
			Where("created_at >= ? AND created_at < ?", start, end).
			Count(&count)
		monthlyData = append(monthlyData, MonthlyData{
			Month: start.Format("Jan 2006"),
			Count: count,
		})
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"stats":           stats,
			"recent_bookings": recentBookings,
			"monthly_data":    monthlyData,
		},
	})
}
