/** Profile or analytics name field */
export const workerNameFromItem = (item) => {
  return String(item?.worker_full_name ?? item?.worker_name ?? '').trim()
}

export const workerEmailFromItem = (item) => {
  return String(item?.worker_email ?? '').trim()
}

/** Main heading: prefer name, then email — never a raw UUID. */
export const workerPrimaryLabel = (item) => {
  const name = workerNameFromItem(item)
  if (name) return name
  const email = workerEmailFromItem(item)
  if (email) return email
  return 'Worker account'
}

/** Second line when we already showed a name (e.g. show email under name). */
export const workerSubtitle = (item) => {
  const name = workerNameFromItem(item)
  const email = workerEmailFromItem(item)
  if (name && email) return email
  return null
}
