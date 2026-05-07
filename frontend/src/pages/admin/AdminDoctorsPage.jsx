import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { adminAPI } from '../../services/api'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', specialization: '', experience: '', schedule: '', phone: '', email: '', photo: '' }

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

function Field({ label, name, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
      />
    </div>
  )
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([])
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
    adminAPI.getDoctors({ page, limit, search })
      .then(res => {
        setDoctors(res.data.data.doctors || [])
        setTotal(res.data.data.total || 0)
      })
      .catch(() => toast.error('Gagal memuat data dokter'))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { fetch() }, [fetch])

  const openAdd = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowModal(true) }
  const openEdit = (d) => { setForm({ name: d.name, specialization: d.specialization, experience: d.experience || '', schedule: d.schedule || '', phone: d.phone || '', email: d.email || '', photo: d.photo || '' }); setEditTarget(d); setShowModal(true) }
  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = async () => {
    if (!form.name || !form.specialization) return toast.error('Nama dan spesialisasi wajib diisi')
    setSaving(true)
    try {
      if (editTarget) {
        await adminAPI.updateDoctor(editTarget.doctor_id, form)
        toast.success('Dokter berhasil diperbarui')
      } else {
        await adminAPI.createDoctor(form)
        toast.success('Dokter berhasil ditambahkan')
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
      await adminAPI.deleteDoctor(deleteTarget.doctor_id)
      toast.success('Dokter berhasil dihapus')
      setDeleteTarget(null)
      fetch()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Gagal menghapus dokter')
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manajemen Dokter</h1>
            <p className="text-slate-500 text-sm mt-1">{total} dokter terdaftar</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm">
            <FiPlus /> Tambah Dokter
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari dokter..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {['#', 'Nama', 'Spesialisasi', 'Pengalaman', 'Jadwal', 'Kontak', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Memuat...</td></tr>
                ) : doctors.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Tidak ada dokter</td></tr>
                ) : doctors.map((d, i) => (
                  <tr key={d.doctor_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-400">{(page - 1) * limit + i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-teal-700 text-xs font-bold">{d.name?.[0]}</span>
                        </div>
                        <span className="font-medium text-slate-700">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{d.specialization}</td>
                    <td className="px-5 py-3 text-slate-500">{d.experience || '-'}</td>
                    <td className="px-5 py-3 text-slate-500">{d.schedule || '-'}</td>
                    <td className="px-5 py-3 text-slate-500">{d.phone || d.email || '-'}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(d)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <FiEdit2 className="text-base" />
                        </button>
                        <button onClick={() => setDeleteTarget(d)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <FiTrash2 className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-500">Halaman {page} dari {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50">
                  ‹ Sebelumnya
                </button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50">
                  Berikutnya ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showModal && (
        <Modal title={editTarget ? 'Edit Dokter' : 'Tambah Dokter'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Field label="Nama Lengkap *" name="name" value={form.name} onChange={onChange} placeholder="Dr. Budi Santoso" /></div>
              <div className="col-span-2"><Field label="Spesialisasi *" name="specialization" value={form.specialization} onChange={onChange} placeholder="Dokter Gigi Umum" /></div>
              <Field label="Pengalaman" name="experience" value={form.experience} onChange={onChange} placeholder="5 Tahun" />
              <Field label="Jadwal" name="schedule" value={form.schedule} onChange={onChange} placeholder="Senin-Jumat 08:00-17:00" />
              <Field label="No. HP" name="phone" value={form.phone} onChange={onChange} placeholder="0812xxxx" />
              <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} placeholder="dr@klinik.com" />
              <div className="col-span-2"><Field label="URL Foto" name="photo" value={form.photo} onChange={onChange} placeholder="https://..." /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal title="Hapus Dokter" onClose={() => setDeleteTarget(null)}>
          <p className="text-slate-600 mb-6">Apakah Anda yakin ingin menghapus <strong>{deleteTarget.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50">Batal</button>
            <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">Hapus</button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
