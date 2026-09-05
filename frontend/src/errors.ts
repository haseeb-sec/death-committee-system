export function formatApiError(detail: unknown, fallback: string): string {
  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail.map((item) => {
      if (item && typeof item === 'object' && 'msg' in item) {
        const loc = 'loc' in item && Array.isArray((item as any).loc)
          ? (item as any).loc.filter((part: unknown) => typeof part === 'string').join('.')
          : ''

        const msg = String((item as any).msg)

        return loc ? `${loc}: ${msg}` : msg
      }

      return typeof item === 'string' ? item : JSON.stringify(item)
    })

    return messages.join('; ')
  }

  if (detail && typeof detail === 'object') {
    return JSON.stringify(detail)
  }

  return fallback
}
