import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#111827] text-white">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(220,38,38,0.35),transparent_50%),radial-gradient(circle_at_80%_10%,rgba(220,38,38,0.2),transparent_45%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center md:py-24">
          <div className="flex-1 space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-red-200">
              Missing person alerts for crowded events
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Safe<span className="text-[#DC2626]">Track</span>
            </h1>
            <p className="max-w-xl text-lg text-gray-300">
              Coordinate families, volunteers, and authorities in real time when
              someone goes missing at a festival, stadium, or public gathering.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/login?intent=family"
                className="inline-flex items-center justify-center rounded-full bg-[#DC2626] px-8 py-3 text-center text-sm font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700"
              >
                Login as Family
              </Link>
              <Link
                to="/login?intent=volunteer"
                className="inline-flex items-center justify-center rounded-full border-2 border-white/20 bg-white/5 px-8 py-3 text-center text-sm font-bold text-white backdrop-blur transition hover:border-white/40"
              >
                Login as Volunteer
              </Link>
              <Link
                to="/login?intent=authority"
                className="inline-flex items-center justify-center rounded-full border-2 border-[#DC2626] bg-transparent px-8 py-3 text-center text-sm font-bold text-white transition hover:bg-[#DC2626]/10"
              >
                Login as Authority
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 pt-4 text-sm text-gray-400">
              <Link to="/match" className="font-semibold text-white hover:underline">
                Found someone?
              </Link>
              <span className="text-gray-600">|</span>
              <Link to="/map" className="font-semibold text-white hover:underline">
                Help centers map
              </Link>
            </div>
          </div>
          <div className="flex-1">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1f2937] to-[#111827] p-8 shadow-2xl shadow-red-900/20">
              <h2 className="text-lg font-bold text-white">Live coordination</h2>
              <ul className="mt-6 space-y-4 text-sm text-gray-300">
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#DC2626]" />
                  Families pre-register attendees and open alerts with one tap.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#DC2626]" />
                  Volunteers see active cases instantly and mark assistance.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#DC2626]" />
                  Authorities get the full operational picture with contacts.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
