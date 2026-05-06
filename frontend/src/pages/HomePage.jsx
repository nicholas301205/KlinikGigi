import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  {
    icon: '🕐',
    title: 'Smart Scheduling',
    desc: 'Sistem otomatis menyarankan waktu terbaik jika jadwal Anda bentrok',
  },
  {
    icon: '🚨',
    title: 'Prioritas Darurat',
    desc: 'Kasus darurat mendapat penanganan segera dengan prioritas tinggi',
  },
  {
    icon: '🦷',
    title: 'Dokter Spesialis',
    desc: 'Tim dokter gigi berpengalaman dengan berbagai spesialisasi',
  },
  {
    icon: '💳',
    title: 'Harga Transparan',
    desc: 'Lihat harga semua layanan sebelum melakukan booking',
  },
]

export default function HomePage() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="animate-page">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-950 via-teal-900 to-teal-800 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-700 rounded-full opacity-20 blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500 rounded-full opacity-10 blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-teal-800/60 backdrop-blur border border-teal-700/50 rounded-full px-4 py-1.5 text-sm text-teal-300 mb-6">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Sistem booking online aktif
            </div>
            <h1 className="text-5xl sm:text-6xl font-display font-bold leading-tight mb-6">
              Senyum Sehat,
              <br />
              <span className="text-teal-300">Booking Mudah</span>
            </h1>
            <p className="text-teal-200 text-lg mb-8 leading-relaxed">
              Klinik gigi modern dengan sistem penjadwalan cerdas. 
              Booking dokter pilihan Anda kapan saja, tanpa antri panjang.
            </p>
            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link to="/bookings" className="inline-flex items-center gap-2 bg-teal-400 text-teal-950 font-semibold px-6 py-3 rounded-xl hover:bg-teal-300 transition-colors">
                  Buat Booking Sekarang →
                </Link>
              ) : (
                <>
                  <Link to="/register" className="inline-flex items-center gap-2 bg-teal-400 text-teal-950 font-semibold px-6 py-3 rounded-xl hover:bg-teal-300 transition-colors">
                    Mulai Sekarang →
                  </Link>
                  <Link to="/login" className="inline-flex items-center gap-2 border border-teal-600 text-teal-300 px-6 py-3 rounded-xl hover:bg-teal-800/50 transition-colors">
                    Sudah punya akun
                  </Link>
                </>
              )}
              <Link to="/doctors" className="inline-flex items-center gap-2 border border-teal-600 text-teal-300 px-6 py-3 rounded-xl hover:bg-teal-800/50 transition-colors">
                Lihat Dokter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-teal-900 mb-3">Kenapa Pilih Kami?</h2>
          <p className="text-gray-500">Teknologi terkini untuk kenyamanan perawatan gigi Anda</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div key={i} className="card p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1 text-center">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-teal-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="bg-teal-50 border-y border-teal-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
            <h2 className="text-3xl font-display font-bold text-teal-900 mb-4">
              Siap Merawat Kesehatan Gigi Anda?
            </h2>
            <p className="text-gray-500 mb-8">
              Daftar sekarang dan dapatkan akses ke sistem booking cerdas kami
            </p>
            <Link to="/register" className="btn-primary text-base px-8 py-3 inline-flex">
              Daftar Gratis →
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
