import type {
  MemberDueRecord,
  MemberOutstandingDuesResponse,
} from '../types'
import { API_BASE } from '../config'

export async function getMyMemberDues(
  memberId: number,
  token: string,
): Promise<MemberDueRecord[]> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/dues`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.detail ?? 'Unable to load dues',
    )
  }

  return response.json()
}

export async function getMyOutstandingDues(
  memberId: number,
  token: string,
): Promise<MemberOutstandingDuesResponse> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/dues/outstanding`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.detail ?? 'Unable to load outstanding dues',
    )
  }

  return response.json()
}

export async function createMemberDue(
  memberId: number,
  amount: number,
  dueDate: string,
  description: string,
  reference: string,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(`${API_BASE}/members/${memberId}/dues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      due_date: dueDate,
      description,
      reference: reference.trim() || null,
    }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Unable to create member due')
  }

  return response.json()
}

export async function getMemberDues(
  memberId: number,
  token: string,
): Promise<Array<Record<string, any>>> {
  const response = await fetch(`${API_BASE}/members/${memberId}/dues`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Unable to load member dues')
  }

  return response.json()
}

export async function getOutstandingDues(
  memberId: number,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/dues/outstanding`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Unable to load outstanding dues')
  }

  return response.json()
}

export async function payMemberDue(
  dueId: number,
  amount: number,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(`${API_BASE}/members/dues/${dueId}/pay`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Unable to pay member due')
  }

  return response.json()
}
