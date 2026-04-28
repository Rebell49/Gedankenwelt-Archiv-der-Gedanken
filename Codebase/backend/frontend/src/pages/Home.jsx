import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { useToast } from '../components/common/Toast'
import { Mail, Lock, User } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const { user, login, register } = useAuthStore()
  const { addToast } = useToast()

  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  })

  /**
   * FIX 1: Redirect must be in useEffect (NO SIDE EFFECT IN RENDER)
   */
  useEffect(() => {
    if (user) {
      navigate('/universe', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    setFormData({
      email: '',
      password: '',
      username: '',
    })
  }, [isLogin])

  /**
   * INPUT HANDLER (STABLE + SAFE)
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  /**
   * FORM SUBMIT (SAFE + CLEAN ERROR FLOW)
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()

    if (loading) return

    setLoading(true)

    try {
      if (isLogin) {
        await login(formData.email, formData.password)
        addToast('Login successful!', 'success')
      } else {
        await register(
          formData.email,
          formData.username,
          formData.password
        )
        addToast('Account created!', 'success')
      }

      navigate('/universe', { replace: true })
    } catch (error) {
      addToast(
        error?.message || 'Authentication failed',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }, [
    isLogin,
    formData,
    login,
    register,
    addToast,
    navigate,
    loading,
  ])

  /**
   * TOGGLE MODE (RESET CLEANLY)
   */
  const toggleMode = useCallback(() => {
    setIsLogin(prev => !prev)

    setFormData({
      email: '',
      password: '',
      username: '',
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Gedankenwelt
          </h1>
          <p className="text-slate-400">
            A 3D philosophical thought space
          </p>
        </div>

        {/* FORM CARD */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-8">

          <h2 className="text-2xl font-bold mb-6 text-center">
            {isLogin ? 'Welcome Back' : 'Join Us'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* USERNAME (REGISTER ONLY) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Username
                </label>

                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />

                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    className="input-base pl-10"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="input-base pl-10"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-base pl-10"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 mt-6"
            >
              {loading
                ? 'Please wait...'
                : isLogin
                  ? 'Login'
                  : 'Create Account'}
            </button>
          </form>

          {/* TOGGLE */}
          <div className="mt-6 pt-6 border-t border-slate-700 text-center">

            <p className="text-slate-400 mb-4">
              {isLogin
                ? "Don't have an account?"
                : 'Already have an account?'}
            </p>

            <button
              onClick={toggleMode}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </div>

        {/* INFO SECTION */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">

          <div>
            <div className="text-2xl font-bold text-blue-400">🌍</div>
            <p className="text-sm text-slate-400 mt-2">
              Explore Planets
            </p>
          </div>

          <div>
            <div className="text-2xl font-bold text-purple-400">💭</div>
            <p className="text-sm text-slate-400 mt-2">
              Share Thoughts
            </p>
          </div>

          <div>
            <div className="text-2xl font-bold text-pink-400">🧩</div>
            <p className="text-sm text-slate-400 mt-2">
              Connect Ideas
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}