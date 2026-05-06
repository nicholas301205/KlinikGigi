import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'

import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import DoctorsPage from './pages/DoctorsPage'
import ServicesPage from './pages/ServicesPage'
import BookingsPage from './pages/BookingsPage'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/bookings" element={
                <ProtectedRoute><BookingsPage /></ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

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
            success: {
              iconTheme: { primary: '#0A7070', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#E85050', secondary: '#fff' },
            },
          }}
        />
      </Router>
    </AuthProvider>
  )
}
