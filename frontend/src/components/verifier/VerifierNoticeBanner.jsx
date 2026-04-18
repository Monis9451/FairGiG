const VerifierNoticeBanner = ({ notice }) => {
  if (!notice) {
    return null
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-medium shadow-sm ${
        notice.type === 'error'
          ? 'border-brand-dark bg-brand-dark text-brand-light'
          : 'border-brand-primary/40 bg-brand-primary/15 text-brand-darkest'
      }`}
    >
      {notice.message}
    </div>
  )
}

export default VerifierNoticeBanner
