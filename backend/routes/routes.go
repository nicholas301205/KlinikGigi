package routes

import (
	"dental-clinic/handlers"
	adminHandlers "dental-clinic/handlers/admin"
	"dental-clinic/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })

	// ── Public Routes ─────────────────────────────────────────────────────────
	r.POST("/register", handlers.Register)
	r.POST("/login", handlers.Login)

	// Public read endpoints
	r.GET("/doctors", handlers.GetDoctors)
	r.GET("/services", handlers.GetServices)

	// ── Authenticated Patient Routes ──────────────────────────────────────────
	patient := r.Group("/")
	patient.Use(middleware.AuthMiddleware())
	{
		patient.POST("/bookings", handlers.CreateBooking)
		patient.PATCH("/bookings/:id/cancel", handlers.CancelBooking)
		patient.GET("/bookings/user/:id", handlers.GetBookingsByUser)
		patient.GET("/bookings/doctor/:id", handlers.GetBookingsByDoctor)
		patient.GET("/bookings/availability", handlers.CheckSlotAvailability)
	}

	// ── Admin Routes ──────────────────────────────────────────────────────────
	admin := r.Group("/admin")
	admin.Use(middleware.AuthMiddleware(), middleware.AdminOnly())
	{
		// Dashboard
		admin.GET("/dashboard", adminHandlers.GetDashboardStats)

		// Doctors CRUD
		admin.GET("/doctors", adminHandlers.GetAllDoctors)
		admin.POST("/doctors", adminHandlers.CreateDoctor)
		admin.PUT("/doctors/:id", adminHandlers.UpdateDoctor)
		admin.DELETE("/doctors/:id", adminHandlers.DeleteDoctor)

		// Services CRUD
		admin.GET("/services", adminHandlers.GetAllServices)
		admin.POST("/services", adminHandlers.CreateService)
		admin.PUT("/services/:id", adminHandlers.UpdateService)
		admin.DELETE("/services/:id", adminHandlers.DeleteService)

		// Patients
		admin.GET("/patients", adminHandlers.GetAllPatients)
		admin.GET("/patients/:id", adminHandlers.GetPatientDetail)

		// Bookings management
		admin.GET("/bookings", adminHandlers.GetAllBookings)
		admin.PUT("/bookings/:id/status", adminHandlers.UpdateBookingStatus)
	}
}
