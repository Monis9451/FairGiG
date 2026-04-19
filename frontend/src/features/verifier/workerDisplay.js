/** Shorten UUID for secondary display (full id still on row for copy tools). */
export const shortWorkerId = (workerId) => {
  if (!workerId) return ''
  const s = String(workerId)
  if (s.length <= 12) return s
  return `${s.slice(0, 8)}…`
}

/** Primary label: profile full name when present; otherwise a short id hint. */
export const workerPrimaryLabel = (item) => {
  const name = item?.worker_full_name?.trim()
  if (name) return name
  const id = item?.worker_id
  if (id) return `Worker ${shortWorkerId(id)}`
  return 'Worker'
}
