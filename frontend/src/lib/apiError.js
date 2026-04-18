export const getApiErrorMessage = (error) => {
  const detail = error?.response?.data?.detail

  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const firstMessage = detail
      .map((item) => {
        if (typeof item?.msg === 'string' && item.msg.trim()) {
          return item.msg.trim()
        }

        if (typeof item === 'string' && item.trim()) {
          return item.trim()
        }

        return null
      })
      .find(Boolean)

    if (firstMessage) {
      return firstMessage
    }
  }

  if (detail && typeof detail === 'object') {
    if (typeof detail.message === 'string' && detail.message.trim()) {
      return detail.message.trim()
    }

    if (typeof detail.error === 'string' && detail.error.trim()) {
      return detail.error.trim()
    }
  }

  if (typeof error?.response?.data?.error === 'string' && error.response.data.error.trim()) {
    return error.response.data.error.trim()
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim()
  }

  return 'Request failed. Please try again.'
}
