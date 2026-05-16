import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

function formatTime(ts) {
  if (!ts?.toDate) return '—'
  return ts.toDate().toLocaleString()
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const map = {
    missing: 'bg-red-100 text-[#DC2626]',
    assisted: 'bg-amber-100 text-amber-800',
    found: 'bg-emerald-100 text-emerald-800',
  }
  const cls = map[s] || 'bg-gray-100 text-gray-700'
  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown'
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>
      {label}
    </span>
  )
}

export default function AuthorityDashboard() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    if (!user || !db) return undefined
    const unsub = onSnapshot(
      collection(db, 'alerts'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => {
          const ta = a.timestamp?.toMillis?.() ?? 0
          const tb = b.timestamp?.toMillis?.() ?? 0
          return tb - ta
        })
        setRows(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        toast.error('Could not load cases')
        setLoading(false)
      },
    )
    return () => unsub()
  }, [user])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    const ev = eventFilter.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter !== 'all' && (r.status || '').toLowerCase() !== statusFilter) {
        return false
      }
      if (ev && !(r.eventName || '').toLowerCase().includes(ev)) {
        return false
      }
      if (!s) return true
      const hay = [
        r.personName,
        r.description,
        r.reportedByName,
        r.emergencyContact,
        r.eventName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(s)
    })
  }, [rows, search, eventFilter, statusFilter])

  const exportCsv = () => {
    toast.success('Export started (demo UI only)')
  }

  const setStatus = async (id, status) => {
    if (!db) return
    setUpdatingId(id)
    try {
      await updateDoc(doc(db, 'alerts', id), { status })
      toast.success('Status updated')
    } catch (err) {
      console.error(err)
      toast.error('Could not update')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading all cases…" />
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-50 pb-16">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900">
              Authority operations
            </h1>
            <p className="mt-1 text-gray-600">
              Full case visibility across events with emergency contacts.
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-full border-2 border-[#DC2626] bg-white px-6 py-2.5 text-sm font-bold text-[#DC2626] hover:bg-red-50"
          >
            Export CSV
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-gray-100 md:flex-row md:flex-wrap md:items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500">Search</label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Name, description, contact…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <label className="text-xs font-semibold text-gray-500">Event</label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Filter"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            />
          </div>
          <div className="w-full md:w-40">
            <label className="text-xs font-semibold text-gray-500">Status</label>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="missing">Missing</option>
              <option value="assisted">Assisted</option>
              <option value="found">Found</option>
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-lg ring-1 ring-gray-100">
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Reported By</th>
                <th className="px-4 py-3">Emergency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Set status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No cases match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {r.personName || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.age ?? '—'}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-gray-700">
                      <span className="line-clamp-2">{r.description}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.reportedByName || r.reportedBy || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.emergencyContact || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {formatTime(r.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold"
                        value={(r.status || 'missing').toLowerCase()}
                        disabled={updatingId === r.id}
                        onChange={(e) => setStatus(r.id, e.target.value)}
                      >
                        <option value="missing">Missing</option>
                        <option value="assisted">Assisted</option>
                        <option value="found">Found</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
