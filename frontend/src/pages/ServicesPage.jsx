import { useState, useEffect } from 'react'
import { servicesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function ServiceCard({ service }) {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(service.price)

  return (
    <div className="card p-6 hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-lg mb-3 group-hover:bg-teal-100 transition-colors">
            🦷
          </div>
          <h3 className="font-semibold text-teal-900">{service.name}</h3>
        </div>
        <div className="text-right ml-4">
          <span className="font-mono text-sm font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg block">
            {formatted}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', price: '' })
  const [submitting, setSubmitting] = useState(false)
  const { isAdmin } = useAuth()

  const fetchServices = async () => {
    try {
      const res = await servicesAPI.getAll()
      setServices(res.data.data || [])
    } catch {
      toast.error('Gagal memuat layanan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchServices() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await servicesAPI.create({ name: form.name, price: parseFloat(form.price) })
      toast.success('Layanan berhasil ditambahkan')
      setForm({ name: '', price: '' })
      setShowForm(false)
      fetchServices()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menambahkan layanan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-page">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-teal-900">Layanan Kami</h1>
          <p className="text-gray-500 mt-1">Perawatan gigi profesional dan terjangkau</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <span className="text-lg">+</span> Tambah Layanan
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <div className="card p-6 mb-8 bg-teal-50/30 border-teal-100">
          <h2 className="font-semibold text-teal-900 mb-4">Tambah Layanan Baru</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Layanan</label>
              <input
                className="input-field"
                placeholder="Scaling Gigi"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga (IDR)</label>
              <input
                className="input-field"
                placeholder="150000"
                type="number"
                min="0"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting && <span className="spinner" />}
                Simpan
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Batal</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="spinner text-teal-500 w-8 h-8 border-2" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">📋</p>
          <p className="font-medium">Belum ada layanan terdaftar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => <ServiceCard key={s.service_id} service={s} />)}
        </div>
      )}
    </div>
  )
}
