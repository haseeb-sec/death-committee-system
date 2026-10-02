import { API_BASE } from '../config'
import { formatApiError } from '../errors'

export type AuditLog = {
  id: number
  user_id: number | null
  committee_id: number | null
  action: string
  entity_type: string
  entity_id: number | null
  description: string | null
  created_at: string
}

export type AuditLogFilters = {
  action?: string
  committeeId?: number
  entityType?: string
  entityId?: number
  userId?: number
  startDate?: string
  endDate?: string
}

export async function getAuditLogs(
  token: string,
  filters: AuditLogFilters = {},
): Promise<AuditLog[]> {
  const params = new URLSearchParams()

  if (filters.action) params.set('action', filters.action)
  if (filters.committeeId !== undefined) params.set('committee_id', String(filters.committeeId))
  if (filters.entityType) params.set('entity_type', filters.entityType)
  if (filters.entityId !== undefined) params.set('entity_id', String(filters.entityId))
  if (filters.userId !== undefined) params.set('user_id', String(filters.userId))
  if (filters.startDate) params.set('start_date', filters.startDate + 'T00:00:00')
  if (filters.endDate) params.set('end_date', filters.endDate + 'T23:59:59')
  params.set('limit', '100')

  const query = params.toString()
  const response = await fetch(API_BASE + '/audit-logs' + (query ? '?' + query : ''), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.ok === false) {
    const data = await response.json().catch(() => null)
    throw new Error(formatApiError(data?.detail, 'Unable to load audit logs'))
  }

  return response.json()
}
