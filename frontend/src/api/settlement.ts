import type {
  SettlementPreview,
} from '../types'
import { API_BASE } from '../config'

export async function getMySettlementPreview(
  memberId: number,
  token: string,
): Promise<SettlementPreview> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/settlement`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.detail ?? 'Unable to load settlement preview',
    )
  }

  return response.json()
}

export async function getMemberSettlement(
  memberId: number,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/settlement`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.detail ?? "Unable to load member settlement preview",
    )
  }

  return response.json()
}

export async function createMemberSettlement(
  memberId: number,
  settlementDate: string,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/settlement`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        settlement_date: settlementDate,
      }),
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.detail ?? "Unable to create member settlement",
    )
  }

  return response.json()
}

export async function payMemberSettlement(
  settlementId: number,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(
    `${API_BASE}/members/settlement/${settlementId}/pay`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.detail ?? "Unable to pay member settlement",
    )
  }

  return response.json()
}
