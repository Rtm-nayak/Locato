import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase'

const AuthContext = createContext(null)

const normalizeRole = (value) => {
  if (!value || typeof value !== 'string') return null
  const r = value.toLowerCase()
  if (r === 'family' || r === 'volunteer' || r === 'authority') return r
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)
      setProfile(null)
      setRole(null)

      if (!nextUser) {
        setLoading(false)
        return
      }

      let nextRole = null
      try {
        const token = await nextUser.getIdTokenResult(true)
        nextRole = normalizeRole(token?.claims?.role)
      } catch {
        /* ignore */
      }

      try {
        const snap = await getDoc(doc(db, 'users', nextUser.uid))
        if (snap.exists()) {
          const data = snap.data()
          setProfile(data)
          if (!nextRole) nextRole = normalizeRole(data.role)
        }
      } catch {
        /* ignore */
      }

      setRole(nextRole)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (!auth) throw new Error('Firebase Auth is not configured')
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signOut = useCallback(async () => {
    if (!auth) return
    await firebaseSignOut(auth)
  }, [])

  const value = useMemo(
    () => ({
      user,
      role,
      profile,
      loading,
      signIn,
      signOut,
      isFirebaseConfigured,
    }),
    [user, role, profile, loading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Context hook is intentionally co-located with the provider in small apps.
// eslint-disable-next-line react-refresh/only-export-components -- useAuth is part of auth module API
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
