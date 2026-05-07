import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FiGrid, FiUsers, FiUser, FiCalendar, FiPackage,
  FiMenu, FiX, FiLogOut, FiChevronRight
} from 'react-icons/fi'
import { FaTooth } from 'react-icons/fa'

const navItems = [
  { to: '/admin', icon: FiGrid, label: 'Dashboard', end: true },
  { to: '/admin/doctors', icon: FiUser, label: 'Dokter' },
  { to: '/admin/services', icon: FiPackage, label: 'Layanan' },
  { to: '/admin/patients', icon: FiUsers, label: 'Pasien' },
  { to: '/admin/bookings', icon: FiCalendar, label: 'Booking' },
]

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 bg-slate-900 flex flex-col transition-transform duration-300
        lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
            <FaTooth className="text-white text-lg" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">DentalCare</p>
            <p className="text-slate-400 text-xs">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group
                ${isActive
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="text-lg flex-shrink-0" />
              <span className="flex-1">{label}</span>
              <FiChevronRight className="text-xs opacity-0 group-hover:opacity-60 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-teal-500/20 rounded-full flex items-center justify-center">
              <span className="text-teal-400 text-sm font-bold">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg text-sm transition-all"
          >
            <FiLogOut />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <FiMenu className="text-xl" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
            <span>Sistem Aktif</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
