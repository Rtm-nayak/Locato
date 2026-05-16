import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children, roles }) {
  const { user, role, loading, isFirebaseConfigured } = useAuth()
  const location = useLocation()

  if (!isFirebaseConfigured) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900">
          Firebase not configured
        </h1>
        <p className="mt-2 text-gray-600">
          Copy <code className="rounded bg-gray-100 px-1">.env.example</code> to{' '}
          <code className="rounded bg-gray-100 px-1">.env.local</code> and add your
          Firebase keys.
        </p>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && roles.length && !roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  if (roles && roles.length && !role) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900">Account setup needed</h1>
        <p className="mt-2 text-gray-600">
          Your user is signed in, but no role was found. Add a Firestore document
          at <code className="rounded bg-gray-100 px-1">users/&lt;uid&gt;</code>{' '}
          with field <code className="rounded bg-gray-100 px-1">role</code>, or set a
          custom claim <code className="rounded bg-gray-100 px-1">role</code> in
          Firebase Auth.
        </p>
      </div>
    )
  }

  return children
}
