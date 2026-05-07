import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import AdminLayout from '../../layouts/AdminLayout'
import {
  FiUsers, FiUser, FiPackage, FiCalendar, FiClock,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiTrendingUp, FiPlus
} from 'react-icons/fi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

const STATUS_BADGE = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  ongoing:   'bg-purple-100 text-purple-700',
  done:      'bg-teal-100 text-teal-700',
  cancelled: 'bg-red-100 text-red-700',
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('-600', '-100').replace('-500', '-100')}`}>
          <Icon className={`text-xl ${color}`} />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Gagal memuat dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const s = data?.stats

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Ringkasan statistik klinik</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FiUsers}       label="Total Pasien"    value={s?.total_patients}    color="text-blue-600" />
          <StatCard icon={FiUser}        label="Total Dokter"    value={s?.total_doctors}     color="text-teal-600" />
          <StatCard icon={FiPackage}     label="Total Layanan"   value={s?.total_services}    color="text-purple-600" />
          <StatCard icon={FiCalendar}    label="Total Booking"   value={s?.total_bookings}    color="text-orange-600" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FiClock}       label="Booking Hari Ini"   value={s?.bookings_today}     color="text-indigo-600" />
          <StatCard icon={FiAlertCircle} label="Booking Pending"    value={s?.bookings_pending}   color="text-amber-600" />
          <StatCard icon={FiCheckCircle} label="Booking Selesai"    value={s?.bookings_completed} color="text-teal-600" />
          <StatCard icon={FiXCircle}     label="Booking Dibatalkan" value={s?.bookings_cancelled} color="text-red-500" />
        </div>

        {/* Chart + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <FiTrendingUp className="text-teal-500" />
              <h2 className="font-semibold text-slate-700">Booking per Bulan</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.monthly_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#334155', fontWeight: 600 }}
                />
                <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Booking" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-slate-700 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { label: 'Tambah Dokter', path: '/admin/doctors', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
                { label: 'Tambah Layanan', path: '/admin/services', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                { label: 'Lihat Pasien', path: '/admin/patients', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                { label: 'Kelola Booking', path: '/admin/bookings', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
              ].map(({ label, path, color }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${color}`}
                >
                  <FiPlus className="text-base" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Booking Terbaru</h2>
            <button
              onClick={() => navigate('/admin/bookings')}
              className="text-teal-600 text-sm font-medium hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Pasien</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Dokter</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Layanan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Jadwal</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data?.recent_bookings || []).map((b) => (
                  <tr key={b.booking_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-700">{b.user?.name || '-'}</td>
                    <td className="px-5 py-3 text-slate-600">{b.doctor?.name || '-'}</td>
                    <td className="px-5 py-3 text-slate-600">{b.service?.name || '-'}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(b.booking_datetime).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[b.status] || 'bg-slate-100 text-slate-600'}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data?.recent_bookings || data.recent_bookings.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">Belum ada booking</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
