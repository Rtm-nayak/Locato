import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import * as api from '../api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const emptyForm = {
  name: '',
  age: '',
  gender: '',
  description: '',
  emergencyContact: '',
  eventName: '',
}

export default function FamilyDashboard() {
  const { user, profile } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [photoFile, setPhotoFile] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [submittingReg, setSubmittingReg] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [alertSubmitting, setAlertSubmitting] = useState(false)
  const [alertEvent, setAlertEvent] = useState('')
  const [alertMode, setAlertMode] = useState('member')
  const [selectedRegId, setSelectedRegId] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [manualEmergency, setManualEmergency] = useState('')

  useEffect(() => {
    if (!user || !db) return undefined
    const q = query(collection(db, 'registrations'), where('uid', '==', user.uid))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        rows.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0
          const tb = b.createdAt?.toMillis?.() ?? 0
          return tb - ta
        })
        setRegistrations(rows)
        setLoadingList(false)
      },
      (err) => {
        console.error(err)
        if (err.code === 'failed-precondition') {
          toast.error('Firestore index required for registrations query')
        } else {
          toast.error('Could not load registrations')
        }
        setLoadingList(false)
      },
    )
    return () => unsub()
  }, [user])

  const selectedRegistration = useMemo(
    () => registrations.find((r) => r.id === selectedRegId),
    [registrations, selectedRegId],
  )

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!user || !db) return
    setSubmittingReg(true)
    try {
        let photoURL = ''
        if (photoFile && storage) {
          const objectRef = ref(
            storage,
            `registrations/${user.uid}/${Date.now()}-${photoFile.name}`,
          )
          await uploadBytes(objectRef, photoFile)
          photoURL = await getDownloadURL(objectRef)
        }

        if (import.meta.env.VITE_API_BASE) {
          await api.addRegistration({
            uid: user.uid,
            name: form.name.trim(),
            age: form.age ? Number(form.age) : null,
            gender: form.gender.trim(),
            description: form.description.trim(),
            photoURL,
            emergencyContact: form.emergencyContact.trim(),
            eventName: form.eventName.trim(),
          })
          toast.success('Family member registered (via API)')
        } else {
          await addDoc(collection(db, 'registrations'), {
            uid: user.uid,
            name: form.name.trim(),
            age: form.age ? Number(form.age) : null,
            gender: form.gender.trim(),
            description: form.description.trim(),
            photoURL,
            emergencyContact: form.emergencyContact.trim(),
            eventName: form.eventName.trim(),
            createdAt: serverTimestamp(),
          })
          toast.success('Family member registered')
        }
      setForm(emptyForm)
      setPhotoFile(null)
    } catch (err) {
      console.error(err)
      toast.error(err?.message || 'Could not save registration')
    } finally {
      setSubmittingReg(false)
    }
  }

  const openModal = () => {
    setModalOpen(true)
    setAlertEvent('')
    setAlertMode('member')
    setSelectedRegId(registrations[0]?.id || '')
    setManualName('')
    setManualDescription('')
    setManualEmergency('')
  }

  const submitAlert = async (e) => {
    e.preventDefault()
    if (!user || !db) return
    if (!alertEvent.trim()) {
      toast.error('Event name is required')
      return
    }
    setAlertSubmitting(true)
    try {
      const base = {
        eventName: alertEvent.trim(),
        reportedBy: user.uid,
        reportedByName: profile?.name || user.email || 'Family',
        status: 'missing',
      }

      if (alertMode === 'member') {
        if (!selectedRegistration) {
          toast.error('Select a registered member')
          setAlertSubmitting(false)
          return
        }
        const payload = {
          ...base,
          registrationId: selectedRegistration.id,
          description:
            selectedRegistration.description || `Missing: ${selectedRegistration.name}`,
          personName: selectedRegistration.name,
          age: selectedRegistration.age ?? null,
          gender: selectedRegistration.gender || '',
          emergencyContact: selectedRegistration.emergencyContact || '',
          photoURL: selectedRegistration.photoURL || '',
        }
        if (import.meta.env.VITE_API_BASE) {
          await api.reportAlert(payload)
        } else {
          await addDoc(collection(db, 'alerts'), { ...payload, timestamp: serverTimestamp() })
        }
      } else {
        if (!manualName.trim() || !manualDescription.trim()) {
          toast.error('Name and description are required for a manual alert')
          setAlertSubmitting(false)
          return
        }
        const payload = {
          ...base,
          registrationId: null,
          description: manualDescription.trim(),
          personName: manualName.trim(),
          age: null,
          gender: '',
          emergencyContact: manualEmergency.trim() || profile?.phone || '',
          photoURL: '',
        }
        if (import.meta.env.VITE_API_BASE) {
          await api.reportAlert(payload)
        } else {
          await addDoc(collection(db, 'alerts'), { ...payload, timestamp: serverTimestamp() })
        }
      }

      toast.success('Missing alert submitted')
      setModalOpen(false)
    } catch (err) {
      console.error(err)
      toast.error(err?.message || 'Could not submit alert')
    } finally {
      setAlertSubmitting(false)
    }
  }

  if (loadingList) {
    return <LoadingSpinner label="Loading your registrations…" />
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-50 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900">
              Family dashboard
            </h1>
            <p className="mt-1 text-gray-600">
              Register attendees before the event and file an alert if someone
              is missing.
            </p>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="rounded-full bg-[#DC2626] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/25 hover:bg-red-700"
          >
            Report Missing
          </button>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              Register family member
            </h2>
            <form className="mt-6 space-y-4" onSubmit={handleRegister}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-800">
                    Name
                  </label>
                  <input
                    required
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                    value={form.name}
                    onChange={(e) =>
      setForm((f) => ({ ...f, name: e.target.value }))
    }
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-800">
                    Age
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                    value={form.age}
                    onChange={(e) =>
      setForm((f) => ({ ...f, age: e.target.value }))
    }
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-800">
                    Gender
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                    value={form.gender}
                    onChange={(e) =>
      setForm((f) => ({ ...f, gender: e.target.value }))
    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-800">
                    Description (clothing, height, identifying marks)
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                    value={form.description}
                    onChange={(e) =>
      setForm((f) => ({ ...f, description: e.target.value }))
    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-800">
                    Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 w-full text-sm"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-800">
                    Emergency contact
                  </label>
                  <input
                    required
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                    value={form.emergencyContact}
                    onChange={(e) =>
      setForm((f) => ({ ...f, emergencyContact: e.target.value }))
    }
                    placeholder="Name · Phone"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-800">
                    Event name (optional on registration)
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                    value={form.eventName}
                    onChange={(e) =>
      setForm((f) => ({ ...f, eventName: e.target.value }))
    }
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submittingReg}
                className="w-full rounded-full bg-[#111827] py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-60"
              >
                {submittingReg ? 'Saving…' : 'Save registration'}
              </button>
            </form>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">
              Your registrations
            </h2>
            <div className="mt-4 space-y-4">
              {registrations.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-gray-600 shadow-lg ring-1 ring-gray-100">
                  No members yet. Add a registration to pre-load details for
                  faster alerting.
                </p>
              ) : (
                registrations.map((r) => (
                  <article
                    key={r.id}
                    className="flex gap-4 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-gray-100"
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      {r.photoURL ? (
                        <img
                          src={r.photoURL}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-bold text-gray-900">
                        {r.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {[r.age, r.gender].filter(Boolean).join(' · ')}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-gray-700">
                        {r.description}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-[#DC2626]">
                        Emergency: {r.emergencyContact}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-title"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="alert-title" className="text-xl font-bold text-gray-900">
                Report missing person
              </h2>
              <button
                type="button"
                className="rounded-full px-2 py-1 text-sm font-semibold text-gray-500 hover:bg-gray-100"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={submitAlert}>
              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Event name
                </label>
                <input
                  required
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                  value={alertEvent}
                  onChange={(e) => setAlertEvent(e.target.value)}
                  placeholder="e.g. Riverfront Music Festival"
                />
              </div>
              <div className="flex gap-2 rounded-full bg-gray-100 p-1">
                <button
                  type="button"
                  className={`flex-1 rounded-full py-2 text-sm font-bold ${
                    alertMode === 'member'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setAlertMode('member')}
                >
                  Registered member
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-full py-2 text-sm font-bold ${
                    alertMode === 'manual'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setAlertMode('manual')}
                >
                  Manual description
                </button>
              </div>

              {alertMode === 'member' ? (
                <div>
                  <label className="text-sm font-semibold text-gray-800">
                    Select member
                  </label>
                  <select
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                    value={selectedRegId}
                    onChange={(e) => setSelectedRegId(e.target.value)}
                    required
                  >
                    {registrations.length === 0 ? (
                      <option value="">No registrations yet</option>
                    ) : (
                      registrations.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-semibold text-gray-800">
                      Name
                    </label>
                    <input
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      required={alertMode === 'manual'}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-800">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      required={alertMode === 'manual'}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-800">
                      Emergency contact (optional)
                    </label>
                    <input
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      value={manualEmergency}
                      onChange={(e) => setManualEmergency(e.target.value)}
                      placeholder="Name · Phone"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={alertSubmitting}
                className="w-full rounded-full bg-[#DC2626] py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {alertSubmitting ? 'Submitting…' : 'Submit alert'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
