import type {
  CreatedAsset,
  AssetValuation,
  AssetParticipation,
} from '../types'
import { API_BASE } from '../config'

export async function createCommitteeAsset(
  committeeId: number,
  name: string,
  purchaseDate: string,
  purchaseValue: number,
  description: string,
  token: string,
): Promise<CreatedAsset> {
  const response = await fetch(
    `${API_BASE}/committees/${committeeId}/assets`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        purchase_date: purchaseDate,
        purchase_value: purchaseValue,
        description: description.trim() || null,
      }),
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Unable to create committee asset')
  }

  return response.json()
}

export async function getAssetValuations(
  assetId: number,
  token: string,
): Promise<AssetValuation[]> {
  const response = await fetch(
    `${API_BASE}/committees/assets/${assetId}/valuations`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Unable to load asset valuations')
  }

  return response.json()
}

export async function getAssetParticipation(
  assetId: number,
  token: string,
): Promise<AssetParticipation[]> {
  const response = await fetch(
    `${API_BASE}/committees/assets/${assetId}/participation`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.detail ?? 'Unable to load asset participation',
    )
  }

  return response.json()
}

export async function updateCommitteeAssetValue(
  assetId: number,
  valuationDate: string,
  newValue: number,
  token: string,
): Promise<unknown> {
  const response = await fetch(
    `${API_BASE}/committees/assets/${assetId}/value`,
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
      data?.detail ?? 'Unable to update asset value',
    )
  }

  return response.json()
}
