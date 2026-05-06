import { useState, useEffect } from 'react'
import { doctorsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const specialties = {
  'Ortodonti': '🦷',
  'Endodonti': '🔬',
  'Periodonti': '🩺',
  'Prostodontia': '⚙️',
  'Bedah Mulut': '🏥',
  'Umum': '👨‍⚕️',
}

function DoctorCard({ doctor }) {
  const emoji = Object.entries(specialties).find(([key]) =>
    doctor.specialization?.toLowerCase().includes(key.toLowerCase())
  )?.[1] || '👨‍⚕️'

  return (
    <div className="card p-6 hover:shadow-md transition-shadow duration-200 group">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-teal-100 transition-colors">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-teal-900 text-lg leading-tight">{doctor.name}</h3>
          <p className="text-teal-600 text-sm mt-0.5">{doctor.specialization}</p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 rounded-full text-xs text-teal-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block"></span>
              Tersedia
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', specialization: '' })
  const [submitting, setSubmitting] = useState(false)
  const { isAdmin } = useAuth()

  const fetchDoctors = async () => {
    try {
      const res = await doctorsAPI.getAll()
      setDoctors(res.data.data || [])
    } catch (err) {
      toast.error('Gagal memuat data dokter')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDoctors() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await doctorsAPI.create(form)
      toast.success('Dokter berhasil ditambahkan')
      setForm({ name: '', specialization: '' })
      setShowForm(false)
      fetchDoctors()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menambahkan dokter')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-page">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-teal-900">Tim Dokter</h1>
          <p className="text-gray-500 mt-1">Para dokter gigi terpercaya kami</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <span className="text-lg">+</span> Tambah Dokter
          </button>
        )}
      </div>

      {/* Add doctor form */}
      {isAdmin && showForm && (
        <div className="card p-6 mb-8 border-teal-100 bg-teal-50/30">
          <h2 className="font-semibold text-teal-900 mb-4">Tambah Dokter Baru</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama</label>
              <input
                className="input-field"
                placeholder="drg. Nama Dokter"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Spesialisasi</label>
              <input
                className="input-field"
                placeholder="Ortodonti"
                value={form.specialization}
                onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
                required
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting && <span className="spinner" />}
                Simpan
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="spinner text-teal-500 w-8 h-8 border-2" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🦷</p>
          <p className="font-medium">Belum ada dokter terdaftar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map(d => <DoctorCard key={d.doctor_id} doctor={d} />)}
        </div>
      )}
    </div>
  )
}
