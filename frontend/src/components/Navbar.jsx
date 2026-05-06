import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ToothIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-teal-500">
    <path d="M12 2C9.5 2 8 3.5 6.5 3.5C5 3.5 4 2.5 3 3C2 3.5 2 5.5 2.5 7C3 8.5 4 9 4.5 10.5C5 12 5 14 5.5 16C6 18 7.5 22 9 22C10 22 10.5 21 12 21C13.5 21 14 22 15 22C16.5 22 18 18 18.5 16C19 14 19 12 19.5 10.5C20 9 21 8.5 21.5 7C22 5.5 22 3.5 21 3C20 2.5 19 3.5 17.5 3.5C16 3.5 14.5 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
)

export default function Navbar() {
  const { user, logout, isAdmin, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinks = [
    { to: '/doctors', label: 'Dokter' },
    { to: '/services', label: 'Layanan' },
    ...(isAuthenticated ? [{ to: '/bookings', label: 'Booking' }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <ToothIcon />
          <span className="font-display text-xl font-semibold text-teal-900 tracking-tight">
            Klinik<span className="text-teal-500">Gigi</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                location.pathname.startsWith(to)
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-teal-900 leading-none">{user?.name}</p>
                <p className="text-xs text-teal-500 mt-0.5 capitalize">{user?.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Keluar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-outline text-sm py-2 px-4">Masuk</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">Daftar</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
