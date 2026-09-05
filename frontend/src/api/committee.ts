import type {
  CommitteeSummary,
  CreatedCommittee,
} from '../types'
import { API_BASE } from '../config'
import { formatApiError } from '../errors'

export async function getCommittees(token: string): Promise<CreatedCommittee[]> {
  const response = await fetch(`${API_BASE}/committees`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(formatApiError(data?.detail, 'Unable to load committees'))
  }

  return response.json()
}

export async function closeCommittee(
  committeeId: number,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(
    `${API_BASE}/committees/${committeeId}/close`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(formatApiError(data?.detail, 'Unable to close committee'))
  }

  return data ?? {}
}

export async function createCommittee(
  name: string,
  token: string,
): Promise<CreatedCommittee> {
  const response = await fetch(`${API_BASE}/committees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(formatApiError(data?.detail, 'Unable to create committee'))
  }

  return response.json()
}

export async function getCommitteeSummary(
  committeeId: number,
  token: string,
): Promise<CommitteeSummary> {
  const response = await fetch(
    `${API_BASE}/committees/${committeeId}/summary`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(formatApiError(data?.detail, 'Unable to load committee'))
  }

  return response.json()
}

export async function getMyCommitteeAccess(
  token: string,
): Promise<Array<Record<string, any>>> {
  const response = await fetch(`${API_BASE}/users/me/committees/access`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      formatApiError(data?.detail, 'Unable to load committee permissions'),
    )
  }

  return response.json()
}
