import { API_BASE } from '../config'
import { formatApiError } from '../errors'

export async function getUsers(token: string): Promise<Array<Record<string, any>>> {
  const response = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(formatApiError(data?.detail, 'Unable to load users'))
  }

  return response.json()
}

export async function grantUserCommitteeAccess(
  userId: number,
  committeeId: number,
  token: string,
  isAdmin: boolean = false,
): Promise<Record<string, any>> {
  const response = await fetch(
    `${API_BASE}/users/${userId}/committees/${committeeId}/access`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        is_admin: isAdmin,
      }),
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(formatApiError(data?.detail, 'Unable to grant committee access'))
  }

  return response.json()
}

export async function getCommitteeAdministrators(
  committeeId: number,
  token: string,
): Promise<Array<Record<string, any>>> {
  const response = await fetch(
    `${API_BASE}/committees/${committeeId}/administrators`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      formatApiError(data?.detail, 'Unable to load committee administrators'),
    )
  }

  return response.json()
}

export async function getUserCommitteeAssignments(
  userId: number,
  token: string,
): Promise<Array<Record<string, any>>> {
  const response = await fetch(
    `${API_BASE}/users/${userId}/committees/access`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      formatApiError(data?.detail, 'Unable to load committee assignments'),
    )
  }

  return response.json()
}

export async function getUserCommitteeAccess(
  userId: number,
  committeeId: number,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(
    `${API_BASE}/users/${userId}/committees/${committeeId}/access`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    if (response.status === 404) {
      return {
        is_active: false,
        access_status: 'Not granted',
      }
    }
    throw new Error(formatApiError(data?.detail, 'Unable to load committee access'))
  }

  return response.json()
}

export async function deactivateUserCommitteeAccess(
  userId: number,
  committeeId: number,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(
    `${API_BASE}/users/${userId}/committees/${committeeId}/access/deactivate`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(formatApiError(data?.detail, 'Unable to revoke committee access'))
  }

  return response.json()
}

export async function createUser(
  username: string,
  password: string,
  role: string,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password, role }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(formatApiError(data?.detail, 'Unable to create user'))
  }

  return response.json()
}

export async function deactivateUser(
  userId: number,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(`${API_BASE}/users/${userId}/deactivate`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(formatApiError(data?.detail, 'Unable to deactivate user'))
  }

  return response.json()
}
