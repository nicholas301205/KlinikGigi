import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'

function AuthPage({ mode = 'login' }) {
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        const res = await authAPI.login({ email: form.email, password: form.password })
        const { token, user } = res.data.data
        login(user, token)
        toast.success(`Selamat datang, ${user.name}!`)
        navigate('/')
      } else {
        await authAPI.register({ name: form.name, email: form.email, password: form.password })
        toast.success('Akun berhasil dibuat! Silakan masuk.')
        setIsLogin(true)
        setForm(f => ({ ...f, name: '' }))
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Terjadi kesalahan'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-200 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-page relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-teal-900 mb-2">
            {isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isLogin
              ? 'Masuk ke portal pasien Klinik Gigi'
              : 'Daftar untuk mulai booking perawatan'}
          </p>
        </div>

        <div className="card p-8 shadow-lg">
          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isLogin ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isLogin ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Budi Santoso"
                  required={!isLogin}
                  minLength={2}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="budi@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="input-field"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
            >
              {loading && <span className="spinner" />}
              {loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Buat Akun'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            {isLogin ? 'Daftar sekarang' : 'Masuk'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default AuthPage
