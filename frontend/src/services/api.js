import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
}

// ── Public ────────────────────────────────────────────────────────────────────
export const doctorsAPI = {
  getAll: () => api.get('/doctors'),
}

export const servicesAPI = {
  getAll: () => api.get('/services'),
}

// ── Patient Bookings ──────────────────────────────────────────────────────────
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  cancel: (bookingId) => api.patch(`/bookings/${bookingId}/cancel`),
  getByUser: (userId) => api.get(`/bookings/user/${userId}`),
  getByDoctor: (doctorId) => api.get(`/bookings/doctor/${doctorId}`),
  checkAvailability: (doctorId, datetime) =>
    api.get(`/bookings/availability?doctor_id=${doctorId}&datetime=${encodeURIComponent(datetime)}`),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),

  // Doctors
  getDoctors: (params) => api.get('/admin/doctors', { params }),
  createDoctor: (data) => api.post('/admin/doctors', data),
  updateDoctor: (id, data) => api.put(`/admin/doctors/${id}`, data),
  deleteDoctor: (id) => api.delete(`/admin/doctors/${id}`),

  // Services
  getServices: (params) => api.get('/admin/services', { params }),
  createService: (data) => api.post('/admin/services', data),
  updateService: (id, data) => api.put(`/admin/services/${id}`, data),
  deleteService: (id) => api.delete(`/admin/services/${id}`),

  // Patients
  getPatients: (params) => api.get('/admin/patients', { params }),
  getPatientDetail: (id) => api.get(`/admin/patients/${id}`),

  // Bookings
  getBookings: (params) => api.get('/admin/bookings', { params }),
  updateBookingStatus: (id, data) => api.put(`/admin/bookings/${id}/status`, data),
}

export default api
