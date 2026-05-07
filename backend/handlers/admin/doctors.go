package admin

import (
	"net/http"
	"strconv"
	"strings"

	"dental-clinic/config"
	"dental-clinic/models"

	"github.com/gin-gonic/gin"
)

func GetAllDoctors(c *gin.Context) {
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	query := config.DB.Model(&models.Doctor{})
	if search != "" {
		like := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(specialization) LIKE ?", like, like)
	}

	var total int64
	query.Count(&total)

	var doctors []models.Doctor
	query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&doctors)

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"doctors": doctors,
			"total":   total,
			"page":    page,
			"limit":   limit,
		},
	})
}

func CreateDoctor(c *gin.Context) {
	var req models.CreateDoctorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: err.Error()})
		return
	}

	doctor := models.Doctor{
		Name:           req.Name,
		Specialization: req.Specialization,
		Experience:     req.Experience,
		Schedule:       req.Schedule,
		Phone:          req.Phone,
		Email:          req.Email,
		Photo:          req.Photo,
	}

	if err := config.DB.Create(&doctor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Error: "Failed to create doctor"})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{Success: true, Data: doctor})
}

func UpdateDoctor(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: "Invalid ID"})
		return
	}

	var doctor models.Doctor
	if err := config.DB.First(&doctor, id).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{Success: false, Error: "Doctor not found"})
		return
	}

	var req models.UpdateDoctorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Specialization != "" {
		updates["specialization"] = req.Specialization
	}
	if req.Experience != "" {
		updates["experience"] = req.Experience
	}
	if req.Schedule != "" {
		updates["schedule"] = req.Schedule
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.Photo != "" {
		updates["photo"] = req.Photo
	}

	config.DB.Model(&doctor).Updates(updates)
	config.DB.First(&doctor, id)

	c.JSON(http.StatusOK, models.APIResponse{Success: true, Data: doctor})
}

func DeleteDoctor(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: "Invalid ID"})
		return
	}

	var doctor models.Doctor
	if err := config.DB.First(&doctor, id).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{Success: false, Error: "Doctor not found"})
		return
	}

	// Check if doctor has active bookings
	var activeCount int64
	config.DB.Model(&models.Booking{}).
		Where("doctor_id = ? AND status IN ('pending','confirmed','ongoing')", id).
		Count(&activeCount)
	if activeCount > 0 {
		c.JSON(http.StatusConflict, models.APIResponse{
			Success: false,
			Error:   "Cannot delete doctor with active bookings",
		})
		return
	}

	config.DB.Delete(&doctor)
	c.JSON(http.StatusOK, models.APIResponse{Success: true, Data: gin.H{"message": "Doctor deleted successfully"}})
}
