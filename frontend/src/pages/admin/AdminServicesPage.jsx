import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { adminAPI } from '../../services/api'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', description: '', price: '', duration: '30', status: 'active' }

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><FiX /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

const formatRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

export default function AdminServicesPage() {
  const [services, setServices] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const limit = 10

  const fetch = useCallback(() => {
    setLoading(true)
    adminAPI.getServices({ page, limit, search })
      .then(res => {
        setServices(res.data.data.services || [])
        setTotal(res.data.data.total || 0)
      })
      .catch(() => toast.error('Gagal memuat layanan'))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { fetch() }, [fetch])

  const openAdd = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowModal(true) }
  const openEdit = (s) => {
    setForm({ name: s.name, description: s.description || '', price: String(s.price), duration: String(s.duration), status: s.status })
    setEditTarget(s)
    setShowModal(true)
  }
  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = async () => {
    if (!form.name || !form.price) return toast.error('Nama dan harga wajib diisi')
    setSaving(true)
    try {
      const payload = { ...form, price: parseFloat(form.price), duration: parseInt(form.duration) || 30 }
      if (editTarget) {
        await adminAPI.updateService(editTarget.service_id, payload)
        toast.success('Layanan berhasil diperbarui')
      } else {
        await adminAPI.createService(payload)
        toast.success('Layanan berhasil ditambahkan')
      }
      setShowModal(false)
      fetch()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await adminAPI.deleteService(deleteTarget.service_id)
      toast.success('Layanan berhasil dihapus')
      setDeleteTarget(null)
      fetch()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Gagal menghapus')
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manajemen Layanan</h1>
            <p className="text-slate-500 text-sm mt-1">{total} layanan terdaftar</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm">
            <FiPlus /> Tambah Layanan
          </button>
        </div>

        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari layanan..." className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {['#', 'Nama Layanan', 'Deskripsi', 'Harga', 'Durasi', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Memuat...</td></tr>
                ) : services.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Tidak ada layanan</td></tr>
                ) : services.map((s, i) => (
                  <tr key={s.service_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-400">{(page - 1) * limit + i + 1}</td>
                    <td className="px-5 py-3 font-medium text-slate-700">{s.name}</td>
                    <td className="px-5 py-3 text-slate-500 max-w-xs truncate">{s.description || '-'}</td>
                    <td className="px-5 py-3 text-slate-700 font-medium">{formatRp(s.price)}</td>
                    <td className="px-5 py-3 text-slate-500">{s.duration} menit</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.status === 'active' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                        {s.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><FiEdit2 /></button>
                        <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 /></button>
                      </div>
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

      {showModal && (
        <Modal title={editTarget ? 'Edit Layanan' : 'Tambah Layanan'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Layanan *</label>
              <input name="name" value={form.name} onChange={onChange} placeholder="Perawatan Gigi" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
              <textarea name="description" value={form.description} onChange={onChange} rows={3} placeholder="Deskripsi layanan..." className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Harga (Rp) *</label>
                <input type="number" name="price" value={form.price} onChange={onChange} placeholder="150000" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Durasi (menit)</label>
                <input type="number" name="duration" value={form.duration} onChange={onChange} placeholder="30" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select name="status" value={form.status} onChange={onChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50">Batal</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Hapus Layanan" onClose={() => setDeleteTarget(null)}>
          <p className="text-slate-600 mb-6">Apakah Anda yakin ingin menghapus layanan <strong>{deleteTarget.name}</strong>?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50">Batal</button>
            <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">Hapus</button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
