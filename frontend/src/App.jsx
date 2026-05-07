import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'

import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import DoctorsPage from './pages/DoctorsPage'
import ServicesPage from './pages/ServicesPage'
import BookingsPage from './pages/BookingsPage'

import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminDoctorsPage from './pages/admin/AdminDoctorsPage'
import AdminServicesPage from './pages/admin/AdminServicesPage'
import AdminPatientsPage from './pages/admin/AdminPatientsPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public / Patient routes — with Navbar */}
          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><AuthPage mode="login" /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><AuthPage mode="register" /></PublicLayout>} />
          <Route path="/doctors" element={<PublicLayout><DoctorsPage /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><ServicesPage /></PublicLayout>} />
          <Route path="/bookings" element={<ProtectedRoute><PublicLayout><BookingsPage /></PublicLayout></ProtectedRoute>} />

          {/* Admin routes — AdminLayout baked in to each page */}
          <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/doctors" element={<AdminRoute><AdminDoctorsPage /></AdminRoute>} />
          <Route path="/admin/services" element={<AdminRoute><AdminServicesPage /></AdminRoute>} />
          <Route path="/admin/patients" element={<AdminRoute><AdminPatientsPage /></AdminRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><AdminBookingsPage /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'Sora, sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#14b8a6', secondary: '#fff' } },
            error: { iconTheme: { primary: '#E85050', secondary: '#fff' } },
          }}
        />
      </Router>
    </AuthProvider>
  )
}
