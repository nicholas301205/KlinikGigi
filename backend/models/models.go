package models

import (
	"time"
)

// ── Core Models ───────────────────────────────────────────────────────────────

type User struct {
	UserID       uint      `gorm:"primaryKey;autoIncrement;column:user_id" json:"user_id"`
	Name         string    `gorm:"type:varchar(100);not null" json:"name"`
	Email        string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"`
	Phone        string    `gorm:"type:varchar(20)" json:"phone"`
	Address      string    `gorm:"type:text" json:"address"`
	Role         string    `gorm:"type:varchar(20);default:pasien;check:role IN ('admin','pasien')" json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Doctor struct {
	DoctorID       uint      `gorm:"primaryKey;autoIncrement;column:doctor_id" json:"doctor_id"`
	Name           string    `gorm:"type:varchar(100);not null" json:"name"`
	Specialization string    `gorm:"type:varchar(100);not null" json:"specialization"`
	Experience     string    `gorm:"type:varchar(100)" json:"experience"`
	Schedule       string    `gorm:"type:varchar(255)" json:"schedule"`
	Phone          string    `gorm:"type:varchar(20)" json:"phone"`
	Email          string    `gorm:"type:varchar(100)" json:"email"`
	Photo          string    `gorm:"type:varchar(500)" json:"photo"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Service struct {
	ServiceID   uint      `gorm:"primaryKey;autoIncrement;column:service_id" json:"service_id"`
	Name        string    `gorm:"type:varchar(100);not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	Price       float64   `gorm:"type:decimal(10,2);check:price >= 0" json:"price"`
	Duration    int       `gorm:"type:int;default:30" json:"duration"`
	Status      string    `gorm:"type:varchar(20);default:active;check:status IN ('active','inactive')" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Booking struct {
	BookingID       uint      `gorm:"primaryKey;autoIncrement;column:booking_id" json:"booking_id"`
	UserID          uint      `gorm:"not null;index;column:user_id" json:"user_id"`
	DoctorID        uint      `gorm:"not null;uniqueIndex:idx_doctor_slot;column:doctor_id" json:"doctor_id"`
	ServiceID       uint      `gorm:"not null;column:service_id" json:"service_id"`
	BookingDatetime time.Time `gorm:"not null;uniqueIndex:idx_doctor_slot;column:booking_datetime" json:"booking_datetime"`
	IsEmergency     bool      `gorm:"default:false;column:is_emergency" json:"is_emergency"`
	Status          string    `gorm:"type:varchar(20);default:pending;check:status IN ('pending','confirmed','cancelled','done','ongoing');column:status" json:"status"`
	Notes           string    `gorm:"type:text;column:notes" json:"notes"`
	AdminNotes      string    `gorm:"type:text;column:admin_notes" json:"admin_notes"`
	EstimatedTime   string    `gorm:"type:varchar(100);column:estimated_time" json:"estimated_time"`
	CreatedAt       time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt       time.Time `gorm:"column:updated_at" json:"updated_at"`

	User    *User    `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
	Doctor  *Doctor  `gorm:"foreignKey:DoctorID;references:DoctorID" json:"doctor,omitempty"`
	Service *Service `gorm:"foreignKey:ServiceID;references:ServiceID" json:"service,omitempty"`
}

// ── Request DTOs ──────────────────────────────────────────────────────────────

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Phone    string `json:"phone"`
	Address  string `json:"address"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type CreateDoctorRequest struct {
	Name           string `json:"name" binding:"required,min=2,max=100"`
	Specialization string `json:"specialization" binding:"required,min=2,max=100"`
	Experience     string `json:"experience"`
	Schedule       string `json:"schedule"`
	Phone          string `json:"phone"`
	Email          string `json:"email"`
	Photo          string `json:"photo"`
}

type UpdateDoctorRequest struct {
	Name           string `json:"name"`
	Specialization string `json:"specialization"`
	Experience     string `json:"experience"`
	Schedule       string `json:"schedule"`
	Phone          string `json:"phone"`
	Email          string `json:"email"`
	Photo          string `json:"photo"`
}

type CreateServiceRequest struct {
	Name        string  `json:"name" binding:"required,min=2,max=100"`
	Description string  `json:"description"`
	Price       float64 `json:"price" binding:"required,min=0"`
	Duration    int     `json:"duration"`
	Status      string  `json:"status"`
}

type UpdateServiceRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Duration    int     `json:"duration"`
	Status      string  `json:"status"`
}

type CreateBookingRequest struct {
	DoctorID        uint      `json:"doctor_id" binding:"required"`
	ServiceID       uint      `json:"service_id" binding:"required"`
	BookingDatetime time.Time `json:"booking_datetime" binding:"required"`
	IsEmergency     bool      `json:"is_emergency"`
	Notes           string    `json:"notes"`
}

type UpdateBookingStatusRequest struct {
	Status        string `json:"status" binding:"required"`
	AdminNotes    string `json:"admin_notes"`
	EstimatedTime string `json:"estimated_time"`
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

type DashboardStats struct {
	TotalPatients     int64 `json:"total_patients"`
	TotalDoctors      int64 `json:"total_doctors"`
	TotalServices     int64 `json:"total_services"`
	TotalBookings     int64 `json:"total_bookings"`
	BookingsToday     int64 `json:"bookings_today"`
	BookingsPending   int64 `json:"bookings_pending"`
	BookingsCompleted int64 `json:"bookings_completed"`
	BookingsCancelled int64 `json:"bookings_cancelled"`
}

type PatientSummary struct {
	UserID        uint      `json:"user_id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	Phone         string    `json:"phone"`
	Address       string    `json:"address"`
	TotalBookings int64     `json:"total_bookings"`
	CreatedAt     time.Time `json:"created_at"`
}
