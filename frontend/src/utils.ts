export function decodeJwtPayload(
  token: string,
): { sub?: string; role?: string; exp?: number } | null {
  try {
    const [, payloadBase64] = token.split('.')
    if (!payloadBase64) return null

    const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    )

    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export function getTimeGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Good night'
}

export function formatPKR(amount: number) {
  return `Rs. ${amount.toLocaleString('en-PK')}`
}

export function getNavigationLabel(page: string): string {
  const labels: Record<string, string> = {
    Dashboard: 'Overview',
    'Death Support': 'Death Assistance',
    Dues: 'Outstanding Dues',
    Goods: 'Member Purchases',
    Assets: 'Committee Assets',
    Settlements: 'Member Settlements',
    'My Death Support': 'My Death Assistance',
    'My Dues': 'My Outstanding Dues',
    'My Goods': 'My Purchases',
    'My Financial Position': 'My Financial Summary',
    'My Settlement': 'My Settlement',
  }
  return labels[page] ?? page
}
