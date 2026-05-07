import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaTooth } from 'react-icons/fa'
import { FiShield } from 'react-icons/fi'

export default function Navbar() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => { logout(); navigate('/login') }

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${location.pathname === to ? 'text-teal-600' : 'text-slate-600 hover:text-teal-600'}`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-teal-700">
          <FaTooth />
          <span>DentalCare</span>
        </Link>

        <div className="flex items-center gap-5 flex-1">
          {navLink('/doctors', 'Dokter')}
          {navLink('/services', 'Layanan')}
          {isAuthenticated && navLink('/bookings', 'Booking Saya')}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link to="/admin"
                  className="flex items-center gap-1.5 text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg font-semibold transition-all">
                  <FiShield className="text-sm" />
                  Admin
                </Link>
              )}
              <span className="text-sm text-slate-600 hidden sm:block">{user?.name}</span>
              <button onClick={handleLogout}
                className="text-sm text-slate-500 hover:text-red-500 transition-colors">
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-600 hover:text-teal-600">Masuk</Link>
              <Link to="/register" className="text-sm bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
