import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
  import * as api from '../api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

function formatTime(ts) {
  if (!ts?.toDate) return '—'
  return ts.toDate().toLocaleString()
}

export default function VolunteerDashboard() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [eventFilter, setEventFilter] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (!user || !db) return undefined
    const q = query(collection(db, 'alerts'), where('status', '==', 'missing'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        rows.sort((a, b) => {
          const ta = a.timestamp?.toMillis?.() ?? 0
          const tb = b.timestamp?.toMillis?.() ?? 0
          return tb - ta
        })
        setAlerts(rows)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        toast.error('Could not load alerts')
        setLoading(false)
      },
    )
    return () => unsub()
  }, [user])

  const filteredAlerts = useMemo(() => {
    const q = eventFilter.trim().toLowerCase()
    if (!q) return alerts
    return alerts.filter((a) =>
      (a.eventName || '').toLowerCase().includes(q),
    )
  }, [alerts, eventFilter])

  const markAssisted = async (id) => {
    if (!db) return
    setBusyId(id)
    try {
      if (import.meta.env.VITE_API_BASE) {
        await api.markAlertAssisted(id)
      } else {
        await updateDoc(doc(db, 'alerts', id), { status: 'assisted' })
      }
      toast.success('Marked as assisted')
    } catch (err) {
      console.error(err)
      toast.error('Could not update status')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading active alerts…" />
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#111827] pb-16 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black">Volunteer dashboard</h1>
            <p className="mt-1 text-gray-300">
              Active missing-person alerts update in real time.
            </p>
          </div>
          <div className="w-full md:w-72">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Filter by event
            </label>
            <input
              className="mt-1 w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none ring-[#DC2626]/0 focus:ring-4 focus:ring-[#DC2626]/30"
              placeholder="Event name contains…"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {filteredAlerts.length === 0 ? (
            <p className="rounded-2xl bg-white/5 p-6 text-gray-300 ring-1 ring-white/10">
              No active alerts right now—check the filter or check back soon.
            </p>
          ) : (
            filteredAlerts.map((a) => (
              <article
                key={a.id}
                className="rounded-2xl bg-white p-5 text-gray-900 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">
                      {a.personName || 'Unknown'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">{a.eventName}</p>
                  </div>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase text-[#DC2626]">
                    Missing
                  </span>
                </div>
                <p className="mt-3 line-clamp-4 text-sm text-gray-700">
                  {a.description}
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  Reported {formatTime(a.timestamp)}
                </p>
                <button
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => markAssisted(a.id)}
                  className="mt-4 w-full rounded-full bg-[#111827] py-2.5 text-sm font-bold text-white hover:bg-black disabled:opacity-60"
                >
                  {busyId === a.id ? 'Updating…' : 'Mark as Assisted'}
                </button>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
