package handlers

import (
	"net/http"

	"dental-clinic/config"
	"dental-clinic/models"

	"github.com/gin-gonic/gin"
)

// --- DOCTORS ---

func GetDoctors(c *gin.Context) {
	var doctors []models.Doctor
	if err := config.DB.Find(&doctors).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to fetch doctors",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    doctors,
	})
}

func CreateDoctor(c *gin.Context) {
	var req models.CreateDoctorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	doctor := models.Doctor{
		Name:           req.Name,
		Specialization: req.Specialization,
	}

	if err := config.DB.Create(&doctor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to create doctor",
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data:    doctor,
	})
}

// --- SERVICES ---

func GetServices(c *gin.Context) {
	var services []models.Service
	if err := config.DB.Find(&services).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to fetch services",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    services,
	})
}

func CreateService(c *gin.Context) {
	var req models.CreateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	service := models.Service{
		Name:  req.Name,
		Price: req.Price,
	}

	if err := config.DB.Create(&service).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to create service",
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data:    service,
	})
}
