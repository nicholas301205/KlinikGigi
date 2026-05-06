package routes

import (
	"dental-clinic/handlers"
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
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Auth routes (public)
	r.POST("/register", handlers.Register)
	r.POST("/login", handlers.Login)

	// Protected routes
	auth := r.Group("/")
	auth.Use(middleware.AuthMiddleware())
	{
		// Doctors
		auth.GET("/doctors", handlers.GetDoctors)
		auth.POST("/doctors", middleware.AdminOnly(), handlers.CreateDoctor)

		// Services
		auth.GET("/services", handlers.GetServices)
		auth.POST("/services", middleware.AdminOnly(), handlers.CreateService)

		// Bookings
		auth.POST("/bookings", handlers.CreateBooking)
		auth.GET("/bookings/user/:id", handlers.GetBookingsByUser)
		auth.GET("/bookings/doctor/:id", handlers.GetBookingsByDoctor)
		auth.GET("/bookings/availability", handlers.CheckSlotAvailability)
	}
}
