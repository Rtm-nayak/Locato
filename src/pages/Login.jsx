import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

function destinationForRole(role) {
  if (role === 'family') return '/family'
  if (role === 'volunteer') return '/volunteer'
  if (role === 'authority') return '/authority'
  return null
}

export default function Login() {
  const [searchParams] = useSearchParams()
  const intent = (searchParams.get('intent') || '').toLowerCase()
  const navigate = useNavigate()
  const { user, role, loading, signIn, isFirebaseConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isFirebaseConfigured || loading) return
    if (!user) return
    const dest = destinationForRole(role)
    if (dest) navigate(dest, { replace: true })
  }, [user, role, loading, navigate, isFirebaseConfigured])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isFirebaseConfigured) {
      toast.error('Firebase is not configured')
      return
    }
    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
      toast.success('Signed in')
    } catch (err) {
      const message =
        err?.code === 'auth/invalid-credential'
          ? 'Invalid email or password'
          : err?.message || 'Login failed'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-gray-800">
        <h1 className="text-2xl font-bold">Configure Firebase</h1>
        <p className="mt-2 text-gray-600">
          Add keys to <code className="rounded bg-gray-100 px-1">.env.local</code>
        </p>
      </div>
    )
  }

  if (loading || user) {
    return <LoadingSpinner label="Finishing sign-in…" />
  }

  const intentLabel =
    intent === 'family' || intent === 'volunteer' || intent === 'authority'
      ? intent
      : null

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
          <h1 className="text-2xl font-black text-gray-900">
            Safe<span className="text-[#DC2626]">Track</span>{' '}
            <span className="font-semibold text-gray-600">Login</span>
          </h1>
          {intentLabel ? (
            <p className="mt-2 text-sm text-gray-600">
              Entering as <span className="font-semibold capitalize">{intentLabel}</span>.
              Your role still comes from Firebase (custom claims or{' '}
              <code className="rounded bg-gray-100 px-1">users</code> docs).
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              Sign in with the account provisioned for your role.
            </p>
          )}
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                Email
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none ring-[#DC2626]/0 transition focus:ring-4 focus:ring-[#DC2626]/20"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                Password
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none ring-[#DC2626]/0 transition focus:ring-4 focus:ring-[#DC2626]/20"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-[#DC2626] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700 disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
