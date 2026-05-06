# 🦷 Klinik Gigi — Full-Stack Dental Clinic System

A production-ready dental clinic booking system with smart scheduling and emergency priority handling.

---

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Backend  | Go · Gin · GORM · JWT · bcrypt |
| Database | MySQL 8.0+ |
| Frontend | React 18 · Vite · Tailwind CSS · Axios |

---

## Features

- **JWT Authentication** — Register, login, role-based access (pasien / admin)
- **Smart Scheduling** — Auto-detects conflicts, suggests nearest available 30-min slot
- **Emergency Priority** — Emergency bookings override and shift normal bookings
- **Double Booking Prevention** — Unique constraint on (doctor_id, booking_datetime) + DB transaction
- **Admin Panel** — Add doctors and services (admin role only)
- **Toast Notifications** — Real-time feedback on all actions
- **Availability Check** — Live slot checking as you pick doctor + time

---

## Quick Start

### 1. Database

```bash
mysql -u root -p < schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials

go mod tidy
go run main.go
# Server starts on :8080
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# App opens on http://localhost:5173
```

---

## API Reference

### Auth
```
POST /register    { name, email, password }
POST /login       { email, password }
```

### Doctors (requires auth)
```
GET  /doctors               List all doctors
POST /doctors               Create doctor [admin only]
```

### Services (requires auth)
```
GET  /services              List all services
POST /services              Create service [admin only]
```

### Bookings (requires auth)
```
POST /bookings              Create booking (with smart scheduling)
GET  /bookings/user/:id     Get bookings for a user
GET  /bookings/doctor/:id   Get bookings for a doctor
GET  /bookings/availability?doctor_id=1&datetime=ISO8601
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "error": "message if failed"
}
```

---

## Smart Scheduling Logic

```
User picks doctor + time
        │
   Is slot taken?
   ┌────┴────┐
  YES        NO
   │          └─ Book immediately ✅
   │
Is emergency?
   ┌────┴────┐
  YES        NO
   │          └─ Reject + suggest next 30-min slot ⏰
   │
Is existing booking non-emergency?
   ┌────┴────┐
  YES        NO
   │          └─ Reject (can't override another emergency)
   │
Override: shift existing to next free slot
Book emergency at requested time 🚨
```

---

## Default Admin Account

To create an admin: register normally, then update the role in DB:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Project Structure

```
dental-clinic/
├── backend/
│   ├── config/        database.go
│   ├── models/        models.go (User, Doctor, Service, Booking + DTOs)
│   ├── handlers/      auth.go, doctors_services.go, bookings.go
│   ├── middleware/    auth.go (JWT + AdminOnly)
│   ├── routes/        routes.go
│   ├── main.go
│   └── .env.example
├── frontend/
│   └── src/
│       ├── context/   AuthContext.jsx
│       ├── services/  api.js
│       ├── components/ Navbar.jsx, ProtectedRoute.jsx
│       └── pages/     HomePage, AuthPage, DoctorsPage, ServicesPage, BookingsPage
└── schema.sql
```
