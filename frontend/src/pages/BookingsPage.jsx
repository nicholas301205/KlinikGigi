import { useState, useEffect, useCallback } from 'react'
import { bookingsAPI, doctorsAPI, servicesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const statusLabels = { pending: 'Menunggu', confirmed: 'Dikonfirmasi', cancelled: 'Dibatalkan', done: 'Selesai' }
const statusClass = { pending: 'badge-pending', confirmed: 'badge-confirmed', cancelled: 'badge-cancelled', done: 'badge-done' }

function BookingCard({ booking, onCancel }) {
  const dateStr = booking.booking_datetime
    ? format(new Date(booking.booking_datetime), 'EEEE, d MMMM yyyy · HH:mm', { locale: idLocale })
    : '-'

  const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
    .format(booking.service?.price || 0)

  // Logika Batas Waktu Cancel (H-1 atau 24 Jam)
  const bookingTime = new Date(booking.booking_datetime).getTime()
  const now = new Date().getTime()
  const hoursDifference = (bookingTime - now) / (1000 * 60 * 60)
  
  // Hanya bisa dicancel jika status pending/confirmed DAN selisih waktu masih >= 24 jam
  const isCancellable = ['pending', 'confirmed'].includes(booking.status) && hoursDifference >= 24

  return (
    <div className={`card p-5 hover:shadow-md transition-shadow ${booking.is_emergency ? 'border-l-4 border-l-coral-500' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={statusClass[booking.status] || 'badge'}>{statusLabels[booking.status] || booking.status}</span>
            {booking.is_emergency && <span className="badge badge-emergency">🚨 Darurat</span>}
          </div>
          <h3 className="font-semibold text-teal-900">{booking.service?.name || '—'}</h3>
          <p className="text-sm text-gray-500 mt-0.5">drg. {booking.doctor?.name || '—'} · {booking.doctor?.specialization || ''}</p>
          <p className="text-sm text-teal-600 mt-1 font-medium">{dateStr}</p>
          {booking.notes && (
            <p className="text-xs text-gray-400 mt-1.5 italic">"{booking.notes}"</p>
          )}
        </div>
        
        <div className="text-right flex-shrink-0 flex flex-col items-end justify-between h-full">
          <div>
            <span className="font-mono text-sm font-semibold text-teal-700">{price}</span>
            <p className="text-xs text-gray-400 mt-0.5">#{booking.booking_id}</p>
          </div>
          
          {/* Tombol Cancel akan muncul jika isCancellable bernilai true */}
          {isCancellable && (
            <button 
              onClick={() => onCancel(booking.booking_id)}
              className="mt-3 text-xs px-3 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              Batalkan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [doctors, setDoctors] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [recommendation, setRecommendation] = useState(null)

  const [form, setForm] = useState({
    doctor_id: '',
    service_id: '',
    booking_datetime: '',
    is_emergency: false,
    notes: '',
  })

  const fetchData = useCallback(async () => {
    try {
      const [bookRes, docRes, svcRes] = await Promise.all([
        bookingsAPI.getByUser(user.user_id),
        doctorsAPI.getAll(),
        servicesAPI.getAll(),
      ])
      setBookings(bookRes.data.data || [])
      setDoctors(docRes.data.data || [])
      setServices(svcRes.data.data || [])
    } catch (err) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-check availability when doctor + datetime selected
  useEffect(() => {
    const check = async () => {
      if (!form.doctor_id || !form.booking_datetime) {
        setRecommendation(null)
        return
      }
      setChecking(true)
      try {
        const dt = new Date(form.booking_datetime).toISOString()
        const res = await bookingsAPI.checkAvailability(form.doctor_id, dt)
        setRecommendation(res.data.data)
      } catch {
        setRecommendation(null)
      } finally {
        setChecking(false)
      }
    }

    const timer = setTimeout(check, 600)
    return () => clearTimeout(timer)
  }, [form.doctor_id, form.booking_datetime])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const useSuggestedTime = () => {
    if (recommendation?.suggested_time) {
      const dt = new Date(recommendation.suggested_time)
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16)
      setForm(f => ({ ...f, booking_datetime: local }))
      toast.success('Waktu diganti ke slot yang tersedia')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        doctor_id: parseInt(form.doctor_id),
        service_id: parseInt(form.service_id),
        booking_datetime: new Date(form.booking_datetime).toISOString(),
      }
      await bookingsAPI.create(payload)
      toast.success('Booking berhasil dibuat!')
      setForm({ doctor_id: '', service_id: '', booking_datetime: '', is_emergency: false, notes: '' })
      setRecommendation(null)
      fetchData()
    } catch (err) {
      const data = err.response?.data
      if (data?.data?.suggested_time) {
        setRecommendation(data.data)
        toast.error('Waktu bentrok! Lihat saran waktu di bawah.')
      } else {
        toast.error(data?.error || 'Gagal membuat booking')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Fungsi Cancel Booking
  const handleCancel = async (bookingId) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan booking ini?')) return;

    try {
      // Pastikan bookingsAPI.cancel sudah dibuat di file ../services/api.js
      await bookingsAPI.cancel(bookingId); 
      toast.success('Booking berhasil dibatalkan');
      fetchData(); // Refresh data untuk update status UI
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal membatalkan booking');
    }
  }

  // Min datetime = now + 1 hour
  const minDatetime = new Date(Date.now() + 3600000)
    .toISOString().slice(0, 16)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-page">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-teal-900">Booking Perawatan</h1>
        <p className="text-gray-500 mt-1">Jadwalkan kunjungan dengan dokter pilihan Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="font-semibold text-teal-900 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center text-xs text-teal-700">+</span>
              Buat Booking Baru
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dokter</label>
                <select name="doctor_id" value={form.doctor_id} onChange={handleChange} className="input-field" required>
                  <option value="">Pilih dokter...</option>
                  {doctors.map(d => (
                    <option key={d.doctor_id} value={d.doctor_id}>
                      {d.name} — {d.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Layanan</label>
                <select name="service_id" value={form.service_id} onChange={handleChange} className="input-field" required>
                  <option value="">Pilih layanan...</option>
                  {services.map(s => (
                    <option key={s.service_id} value={s.service_id}>
                      {s.name} — {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(s.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tanggal & Waktu
                  {checking && <span className="ml-2 text-teal-500 text-xs">memeriksa...</span>}
                </label>
                <input
                  type="datetime-local"
                  name="booking_datetime"
                  value={form.booking_datetime}
                  onChange={handleChange}
                  min={minDatetime}
                  className="input-field"
                  required
                />
              </div>

              {/* Availability indicator */}
              {recommendation && !checking && (
                <div className={`rounded-xl p-3.5 text-sm border ${
                  recommendation.available
                    ? 'bg-teal-50 border-teal-200 text-teal-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{recommendation.available ? '✅' : '⚠️'}</span>
                    <div className="flex-1">
                      <p className="font-medium">{recommendation.available ? 'Waktu tersedia!' : 'Waktu tidak tersedia'}</p>
                      {!recommendation.available && recommendation.suggested_time && (
                        <div className="mt-1.5">
                          <p className="text-xs opacity-80">Saran waktu berikutnya:</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs bg-white rounded px-2 py-1 border border-amber-200">
                              {format(new Date(recommendation.suggested_time), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                            </span>
                            <button
                              type="button"
                              onClick={useSuggestedTime}
                              className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded font-medium transition-colors"
                            >
                              Gunakan →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan (opsional)</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Keluhan atau informasi tambahan..."
                />
              </div>

              {/* Emergency toggle */}
              <div className={`rounded-xl p-4 border cursor-pointer transition-all ${
                form.is_emergency
                  ? 'bg-red-50 border-coral-400'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`} onClick={() => setForm(f => ({ ...f, is_emergency: !f.is_emergency }))}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_emergency"
                    checked={form.is_emergency}
                    onChange={handleChange}
                    className="w-4 h-4 accent-red-500"
                    onClick={e => e.stopPropagation()}
                  />
                  <div>
                    <p className={`text-sm font-semibold ${form.is_emergency ? 'text-coral-600' : 'text-gray-700'}`}>
                      🚨 Kasus Darurat
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Prioritas tinggi — dapat menggeser booking biasa
                    </p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  form.is_emergency
                    ? 'bg-coral-500 hover:bg-coral-600 text-white'
                    : 'btn-primary'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting && <span className="spinner" />}
                {submitting ? 'Memproses...' : form.is_emergency ? '🚨 Booking Darurat' : 'Buat Booking'}
              </button>
            </form>
          </div>
        </div>

        {/* Booking history */}
        <div className="lg:col-span-3">
          <h2 className="font-semibold text-teal-900 mb-4">Riwayat Booking Saya</h2>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="spinner text-teal-500 w-8 h-8 border-2" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="card p-10 text-center text-gray-400">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-medium">Belum ada booking</p>
              <p className="text-sm mt-1">Buat booking pertama Anda di sebelah kiri</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Tambahkan props onCancel ke komponen BookingCard */}
              {bookings.map(b => <BookingCard key={b.booking_id} booking={b} onCancel={handleCancel} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}