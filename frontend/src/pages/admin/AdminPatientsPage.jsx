import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { adminAPI } from '../../services/api'
import { FiSearch, FiX, FiEye } from 'react-icons/fi'
import toast from 'react-hot-toast'

const STATUS_BADGE = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  ongoing:   'bg-purple-100 text-purple-700',
  done:      'bg-teal-100 text-teal-700',
  cancelled: 'bg-red-100 text-red-700',
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><FiX /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const limit = 10

  const fetch = useCallback(() => {
    setLoading(true)
    adminAPI.getPatients({ page, limit, search })
      .then(res => {
        setPatients(res.data.data.patients || [])
        setTotal(res.data.data.total || 0)
      })
      .catch(() => toast.error('Gagal memuat data pasien'))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { fetch() }, [fetch])

  const openDetail = (p) => {
    setLoadingDetail(true)
    adminAPI.getPatientDetail(p.user_id)
      .then(res => setDetail(res.data.data))
      .catch(() => toast.error('Gagal memuat detail pasien'))
      .finally(() => setLoadingDetail(false))
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Pasien</h1>
          <p className="text-slate-500 text-sm mt-1">{total} pasien terdaftar</p>
        </div>

        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari pasien..." className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {['#', 'Nama', 'Email', 'No. HP', 'Total Booking', 'Terdaftar', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Memuat...</td></tr>
                ) : patients.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Tidak ada pasien</td></tr>
                ) : patients.map((p, i) => (
                  <tr key={p.user_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-400">{(page - 1) * limit + i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-700 text-xs font-bold">{p.name?.[0]}</span>
                        </div>
                        <span className="font-medium text-slate-700">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{p.email}</td>
                    <td className="px-5 py-3 text-slate-500">{p.phone || '-'}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                        {p.total_bookings} booking
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => openDetail(p)} className="p-1.5 text-teal-500 hover:bg-teal-50 rounded-lg transition-colors">
                        <FiEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-500">Halaman {page} dari {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50">‹ Sebelumnya</button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50">Berikutnya ›</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {(detail || loadingDetail) && (
        <Modal title="Detail Pasien" onClose={() => setDetail(null)}>
          {loadingDetail ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Info */}
              <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Nama', detail.patient?.name],
                  ['Email', detail.patient?.email],
                  ['No. HP', detail.patient?.phone || '-'],
                  ['Total Booking', detail.patient?.total_bookings],
                  ['Alamat', detail.patient?.address || '-'],
                  ['Terdaftar', new Date(detail.patient?.created_at).toLocaleDateString('id-ID')],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-slate-400 text-xs">{k}</p>
                    <p className="text-slate-700 font-medium mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              {/* Booking history */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-3">Riwayat Booking ({detail.bookings?.length || 0})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(!detail.bookings || detail.bookings.length === 0) ? (
                    <p className="text-slate-400 text-sm text-center py-6">Belum ada riwayat booking</p>
                  ) : detail.bookings.map(b => (
                    <div key={b.booking_id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-slate-700">{b.doctor?.name || '-'}</p>
                        <p className="text-slate-500 text-xs">{b.service?.name} · {new Date(b.booking_datetime).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[b.status] || 'bg-slate-100 text-slate-500'}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </AdminLayout>
  )
}
