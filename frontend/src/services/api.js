import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401
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

// Auth
export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
}

// Doctors
export const doctorsAPI = {
  getAll: () => api.get('/doctors'),
  create: (data) => api.post('/doctors', data),
}

// Services
export const servicesAPI = {
  getAll: () => api.get('/services'),
  create: (data) => api.post('/services', data),
}

// Bookings
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getByUser: (userId) => api.get(`/bookings/user/${userId}`),
  getByDoctor: (doctorId) => api.get(`/bookings/doctor/${doctorId}`),
  checkAvailability: (doctorId, datetime) =>
    api.get(`/bookings/availability?doctor_id=${doctorId}&datetime=${encodeURIComponent(datetime)}`),
}

export default api
