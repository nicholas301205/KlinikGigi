import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { adminAPI } from '../../services/api'
import { FiSearch, FiX, FiFilter } from 'react-icons/fi'
import toast from 'react-hot-toast'

const STATUS_BADGE = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  ongoing:   'bg-purple-100 text-purple-700',
  done:      'bg-teal-100 text-teal-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABEL = {
  pending: 'Pending', confirmed: 'Dikonfirmasi', ongoing: 'Berlangsung', done: 'Selesai', cancelled: 'Dibatalkan'
}

const VALID_STATUSES = ['pending', 'confirmed', 'ongoing', 'done', 'cancelled']

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><FiX /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [updateTarget, setUpdateTarget] = useState(null)
  const [updateForm, setUpdateForm] = useState({ status: '', admin_notes: '', estimated_time: '' })
  const [saving, setSaving] = useState(false)
  const limit = 10

  const fetch = useCallback(() => {
    setLoading(true)
    adminAPI.getBookings({ page, limit, search, status: filterStatus })
      .then(res => {
        setBookings(res.data.data.bookings || [])
        setTotal(res.data.data.total || 0)
      })
      .catch(() => toast.error('Gagal memuat booking'))
      .finally(() => setLoading(false))
  }, [page, search, filterStatus])

  useEffect(() => { fetch() }, [fetch])

  const openUpdate = (b) => {
    setUpdateTarget(b)
    setUpdateForm({ status: b.status, admin_notes: b.admin_notes || '', estimated_time: b.estimated_time || '' })
  }

  const handleUpdate = async () => {
    if (!updateForm.status) return toast.error('Pilih status')
    setSaving(true)
    try {
      await adminAPI.updateBookingStatus(updateTarget.booking_id, updateForm)
      toast.success('Status booking diperbarui')
      setUpdateTarget(null)
      fetch()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Gagal memperbarui')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Booking</h1>
          <p className="text-slate-500 text-sm mt-1">{total} booking total</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Cari pasien / dokter..." className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
              className="pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
              <option value="">Semua Status</option>
              {VALID_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {['#', 'Pasien', 'Dokter', 'Layanan', 'Jadwal', 'Darurat', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">Memuat...</td></tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">Tidak ada booking</td></tr>
                ) : bookings.map((b, i) => (
                  <tr key={b.booking_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{b.user?.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{b.doctor?.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">{b.service?.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(b.booking_datetime).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                      <br />
                      <span className="text-xs">{new Date(b.booking_datetime).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })}</span>
                    </td>
                    <td className="px-4 py-3">
                      {b.is_emergency && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold">Darurat</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[b.status] || 'bg-slate-100 text-slate-500'}`}>
                        {STATUS_LABEL[b.status] || b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openUpdate(b)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg text-xs font-medium transition-colors">
                        Update
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

      {/* Update Status Modal */}
      {updateTarget && (
        <Modal title="Update Status Booking" onClose={() => setUpdateTarget(null)}>
          <div className="space-y-4">
            {/* Booking info */}
            <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
              <p><span className="text-slate-400">Pasien:</span> <span className="font-medium">{updateTarget.user?.name}</span></p>
              <p><span className="text-slate-400">Dokter:</span> <span className="font-medium">{updateTarget.doctor?.name}</span></p>
              <p><span className="text-slate-400">Layanan:</span> <span className="font-medium">{updateTarget.service?.name}</span></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status Baru *</label>
              <select value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                {VALID_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estimasi Waktu</label>
              <input value={updateForm.estimated_time} onChange={e => setUpdateForm(f => ({ ...f, estimated_time: e.target.value }))}
                placeholder="contoh: 30 menit"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Admin</label>
              <textarea value={updateForm.admin_notes} onChange={e => setUpdateForm(f => ({ ...f, admin_notes: e.target.value }))}
                rows={3} placeholder="Catatan untuk pasien..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setUpdateTarget(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50">Batal</button>
              <button onClick={handleUpdate} disabled={saving} className="flex-1 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
