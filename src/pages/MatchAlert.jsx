import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { collection, getDocs } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import * as api from '../api'

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
}

function scoreRegistration(queryText, reg) {
  const qTokens = new Set(tokenize(queryText))
  if (qTokens.size === 0) return 0
  const body = [reg.name, reg.description, reg.gender, reg.eventName]
    .filter(Boolean)
    .join(' ')
  const docTokens = tokenize(body)
  let hits = 0
  for (const t of docTokens) {
    if (qTokens.has(t)) hits += 1
  }
  if (hits === 0) {
    for (const qt of qTokens) {
      if (body.toLowerCase().includes(qt)) hits += 0.5
    }
  }
  return hits
}

export default function MatchAlert() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  const disabled = useMemo(() => !isFirebaseConfigured || !db, [])

  const runMatch = async (e) => {
    e.preventDefault()
    if (!db) return
    if (!text.trim()) {
      toast.error('Describe the person you found')
      return
    }
    setLoading(true)
    try {
        if (import.meta.env.VITE_API_BASE) {
          const res = await api.matchSearch(text)
          const data = res?.data || []
          setResults(data.map((d) => d.registration))
          if (!data.length) {
            toast('No strong matches yet — try more distinctive keywords', {
              icon: 'ℹ️',
            })
          }
        } else {
          const snap = await getDocs(collection(db, 'registrations'))
          const regs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          const scored = regs
            .map((r) => ({ reg: r, score: scoreRegistration(text, r) }))
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
          setResults(scored.map((x) => x.reg))
          if (scored.length === 0) {
            toast('No strong matches yet — try more distinctive keywords', {
              icon: 'ℹ️',
            })
          }
        }
    } catch (err) {
      console.error(err)
      toast.error('Could not search registrations')
    } finally {
      setLoading(false)
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Match finder unavailable</h1>
        <p className="mt-2 text-gray-600">Configure Firebase to search registrations.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-50 pb-16">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-black text-gray-900">Match a found person</h1>
        <p className="mt-2 text-gray-600">
          Describe who you found. We will keyword-match against family registrations
          for this event.
        </p>

        <form
          className="mt-8 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100"
          onSubmit={runMatch}
        >
          <label className="text-sm font-semibold text-gray-800">
            Describe the person you found
          </label>
          <textarea
            rows={4}
            className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900"
            placeholder="e.g. Teenager, red hoodie, curly hair, glasses…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={loading || disabled}
            className="mt-4 w-full rounded-full bg-[#DC2626] py-3 text-sm font-bold text-white shadow-lg hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? 'Searching…' : 'Find possible matches'}
          </button>
        </form>

        <div className="mt-10 space-y-4">
          {results.map((r) => (
            <article
              key={r.id}
              className="flex gap-4 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-gray-100"
            >
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {r.photoURL ? (
                  <img src={r.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">
                    No photo
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900">{r.name}</h2>
                <p className="text-sm text-gray-600">
                  {[r.age, r.gender].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-2 text-sm text-gray-700">{r.description}</p>
                <p className="mt-2 text-xs font-semibold text-[#DC2626]">
                  Emergency: {r.emergencyContact}
                </p>
                <button
                  type="button"
                  className="mt-3 rounded-full bg-[#111827] px-4 py-2 text-xs font-bold text-white hover:bg-black"
                  onClick={() =>
                    toast.success('Family notification queued (demo)')
                  }
                >
                  Notify Family
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
