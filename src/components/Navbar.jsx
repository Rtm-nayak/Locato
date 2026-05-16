import { Link, NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

function navClass({ isActive }) {
  return [
    'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-[#DC2626] text-white'
      : 'text-gray-300 hover:bg-white/10 hover:text-white',
  ].join(' ')
}

export default function Navbar() {
  const { user, role, signOut, isFirebaseConfigured } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out')
      navigate('/')
    } catch {
      toast.error('Could not sign out')
    }
  }

  const roleLinks = () => {
    if (!user || !role) {
      return (
        <>
          <NavLink to="/match" className={navClass}>
            Match
          </NavLink>
          <NavLink to="/map" className={navClass}>
            Map
          </NavLink>
          <NavLink to="/login" className={navClass}>
            Login
          </NavLink>
        </>
      )
    }

    if (role === 'family') {
      return (
        <>
          <NavLink to="/family" className={navClass}>
            Family
          </NavLink>
          <NavLink to="/match" className={navClass}>
            Match
          </NavLink>
          <NavLink to="/map" className={navClass}>
            Map
          </NavLink>
        </>
      )
    }
    if (role === 'volunteer') {
      return (
        <>
          <NavLink to="/volunteer" className={navClass}>
            Volunteer
          </NavLink>
          <NavLink to="/map" className={navClass}>
            Map
          </NavLink>
        </>
      )
    }
    if (role === 'authority') {
      return (
        <>
          <NavLink to="/authority" className={navClass}>
            Authority
          </NavLink>
          <NavLink to="/map" className={navClass}>
            Map
          </NavLink>
        </>
      )
    }
    return null
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#111827]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          to="/"
          className="text-lg font-black tracking-tight text-white"
        >
          Safe<span className="text-[#DC2626]">Track</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          <NavLink end to="/" className={navClass}>
            Home
          </NavLink>
          {isFirebaseConfigured ? roleLinks() : null}
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Sign out
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
