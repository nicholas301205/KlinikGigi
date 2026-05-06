package config

import (
	"log"

	"dental-clinic/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	dsn := "root:@tcp(127.0.0.1:3306)/klinik_gigi?parseTime=true"

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Info),
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto migrate
	err = db.AutoMigrate(
		&models.User{},
		&models.Doctor{},
		&models.Service{},
		&models.Booking{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Create indexes
	db.Exec("CREATE INDEX IF NOT EXISTS idx_bookings_doctor_datetime ON bookings(doctor_id, booking_datetime)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)")

	DB = db
	log.Println("Database connected and migrated successfully")
}
