export const API_BASE =
  import.meta.env.VITE_API_BASE ??
  `${window.location.protocol}//${window.location.hostname}${window.location.port === '5173' ? ':8000' : ''}`
