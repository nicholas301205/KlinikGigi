package admin

import (
	"net/http"
	"strconv"
	"strings"

	"dental-clinic/config"
	"dental-clinic/models"

	"github.com/gin-gonic/gin"
)

func GetAllServices(c *gin.Context) {
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	query := config.DB.Model(&models.Service{})
	if search != "" {
		like := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(description) LIKE ?", like, like)
	}

	var total int64
	query.Count(&total)

	var services []models.Service
	query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&services)

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"services": services,
			"total":    total,
			"page":     page,
			"limit":    limit,
		},
	})
}

func CreateService(c *gin.Context) {
	var req models.CreateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: err.Error()})
		return
	}

	status := req.Status
	if status == "" {
		status = "active"
	}
	duration := req.Duration
	if duration == 0 {
		duration = 30
	}

	service := models.Service{
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Duration:    duration,
		Status:      status,
	}

	if err := config.DB.Create(&service).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Error: "Failed to create service"})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{Success: true, Data: service})
}

func UpdateService(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: "Invalid ID"})
		return
	}

	var service models.Service
	if err := config.DB.First(&service, id).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{Success: false, Error: "Service not found"})
		return
	}

	var req models.UpdateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Price > 0 {
		updates["price"] = req.Price
	}
	if req.Duration > 0 {
		updates["duration"] = req.Duration
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}

	config.DB.Model(&service).Updates(updates)
	config.DB.First(&service, id)

	c.JSON(http.StatusOK, models.APIResponse{Success: true, Data: service})
}

func DeleteService(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Error: "Invalid ID"})
		return
	}

	var service models.Service
	if err := config.DB.First(&service, id).Error; err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{Success: false, Error: "Service not found"})
		return
	}

	config.DB.Delete(&service)
	c.JSON(http.StatusOK, models.APIResponse{Success: true, Data: gin.H{"message": "Service deleted successfully"}})
}
