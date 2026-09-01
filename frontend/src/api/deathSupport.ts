import type {
  CreatedDeathSupport,
  DeathSupportStatus,
} from '../types'
import { API_BASE } from '../config'

export async function createDeathSupport(
  memberId: number,
  beneficiaryName: string,
  amount: number,
  supportDate: string,
  reference: string,
  token: string,
): Promise<CreatedDeathSupport> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/death-support`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        beneficiary_name: beneficiaryName.trim(),
        amount,
        support_date: supportDate,
        reference: reference.trim() || null,
      }),
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.detail ?? 'Unable to record death support',
    )
  }

  return response.json()
}

export async function getDeathSupportStatus(
  memberId: number,
  token: string,
): Promise<DeathSupportStatus> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/death-support/status`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.detail ?? 'Unable to load death support status',
    )
  }

  return response.json()
}
