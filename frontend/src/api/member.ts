import type {
  CreatedMember,
  Member,
} from '../types'
import { API_BASE } from '../config'

export async function getMembers(
  committeeId: number,
  token: string,
): Promise<Member[]> {
  const response = await fetch(
    `${API_BASE}/members?committee_id=${committeeId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Unable to load committee members')
  }

  return response.json()
}

export async function createMember(
  committeeId: number,
  name: string,
  joinedOn: string,
  token: string,
): Promise<CreatedMember> {
  const response = await fetch(`${API_BASE}/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      committee_id: committeeId,
      name,
      joined_on: joinedOn,
    }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Unable to create member')
  }

  return response.json()
}
