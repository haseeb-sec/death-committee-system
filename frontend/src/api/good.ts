import type {
  MemberGoodRecord,
  MemberGoodsTotalResponse,
} from '../types'
import { API_BASE } from '../config'
import { formatApiError } from '../errors'

export async function createMemberGood(
  memberId: number,
  name: string,
  purchaseDate: string,
  purchasePrice: number,
  description: string,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/goods`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        purchase_date: purchaseDate,
        purchase_price: purchasePrice,
        description: description.trim() || null,
      }),
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      formatApiError(data?.detail, 'Unable to create member good'),
    )
  }

  return response.json()
}

export async function getMemberGoods(
  memberId: number,
  token: string,
): Promise<Array<Record<string, any>>> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/goods`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      formatApiError(data?.detail, 'Unable to load member goods'),
    )
  }

  return response.json()
}

export async function getMemberGoodsTotal(
  memberId: number,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/goods/total`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      formatApiError(data?.detail, 'Unable to load member goods total'),
    )
  }

  return response.json()
}

export async function updateMemberGoodValue(
  goodId: number,
  valuationDate: string,
  newValue: number,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(
    `${API_BASE}/members/goods/${goodId}/value`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valuation_date: valuationDate,
        new_value: newValue,
      }),
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      formatApiError(data?.detail, 'Unable to update member good value'),
    )
  }

  return response.json()
}

export async function getMyMemberGoods(
  memberId: number,
  token: string,
): Promise<MemberGoodRecord[]> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/goods`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      formatApiError(data?.detail, 'Unable to load goods'),
    )
  }

  return response.json()
}

export async function getMyGoodsTotal(
  memberId: number,
  token: string,
): Promise<MemberGoodsTotalResponse> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/goods/total`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      formatApiError(data?.detail, 'Unable to load goods total'),
    )
  }

  return response.json()
}
