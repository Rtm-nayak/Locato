export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-gray-600"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-12 w-12 rounded-full border-4 border-[#DC2626]/20 border-t-[#DC2626] animate-spin"
        aria-hidden
      />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
