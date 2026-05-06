package models

import (
	"time"
)

type User struct {
	UserID       uint      `gorm:"primaryKey;autoIncrement;column:user_id" json:"user_id"`
	Name         string    `gorm:"type:varchar(100);not null" json:"name"`
	Email        string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"`
	Role         string    `gorm:"type:varchar(20);default:pasien;check:role IN ('admin','pasien')" json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Doctor struct {
	DoctorID       uint      `gorm:"primaryKey;autoIncrement;column:doctor_id" json:"doctor_id"`
	Name           string    `gorm:"type:varchar(100);not null" json:"name"`
	Specialization string    `gorm:"type:varchar(100);not null" json:"specialization"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Service struct {
	ServiceID uint      `gorm:"primaryKey;autoIncrement;column:service_id" json:"service_id"`
	Name      string    `gorm:"type:varchar(100);not null" json:"name"`
	Price     float64   `gorm:"type:decimal(10,2);check:price >= 0" json:"price"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Booking struct {
	BookingID       uint      `gorm:"primaryKey;autoIncrement;column:booking_id" json:"booking_id"`
	UserID          uint      `gorm:"not null;index" json:"user_id"`
	DoctorID        uint      `gorm:"not null;uniqueIndex:idx_doctor_slot" json:"doctor_id"`
	ServiceID       uint      `gorm:"not null" json:"service_id"`
	BookingDatetime time.Time `gorm:"not null;uniqueIndex:idx_doctor_slot" json:"booking_datetime"`
	IsEmergency     bool      `gorm:"default:false" json:"is_emergency"`
	Status          string    `gorm:"type:varchar(20);default:pending;check:status IN ('pending','confirmed','cancelled','done')" json:"status"`
	Notes           string    `gorm:"type:text" json:"notes"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// Preload-only — no constraint tags here (causes GORM to reverse FK direction)
	User    *User    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Doctor  *Doctor  `gorm:"foreignKey:DoctorID" json:"doctor,omitempty"`
	Service *Service `gorm:"foreignKey:ServiceID" json:"service,omitempty"`
}

// ── Request DTOs ──────────────────────────────────────────────────────────────

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type CreateDoctorRequest struct {
	Name           string `json:"name" binding:"required,min=2,max=100"`
	Specialization string `json:"specialization" binding:"required,min=2,max=100"`
}

type CreateServiceRequest struct {
	Name  string  `json:"name" binding:"required,min=2,max=100"`
	Price float64 `json:"price" binding:"required,min=0"`
}

type CreateBookingRequest struct {
	DoctorID        uint      `json:"doctor_id" binding:"required"`
	ServiceID       uint      `json:"service_id" binding:"required"`
	BookingDatetime time.Time `json:"booking_datetime" binding:"required"`
	IsEmergency     bool      `json:"is_emergency"`
	Notes           string    `json:"notes"`
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type BookingRecommendation struct {
	Available         bool      `json:"available"`
	RequestedTime     time.Time `json:"requested_time"`
	SuggestedTime     time.Time `json:"suggested_time,omitempty"`
	ConflictExists    bool      `json:"conflict_exists"`
	EmergencyOverride bool      `json:"emergency_override"`
	ShiftedBookingID  uint      `json:"shifted_booking_id,omitempty"`
	Message           string    `json:"message"`
}
