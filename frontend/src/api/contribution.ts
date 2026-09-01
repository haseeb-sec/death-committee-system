import type {
  CreatedContributionRate,
  CreatedContribution,
  ContributionHistoryEntry,
  ContributionTotalResponse,
} from '../types'
import { API_BASE } from '../config'

export async function createContributionRate(
  committeeId: number,
  amount: number,
  effectiveFrom: string,
  token: string,
): Promise<CreatedContributionRate> {
  const response = await fetch(
    `${API_BASE}/committees/${committeeId}/contribution-rates`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        effective_from: effectiveFrom,
      }),
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.detail ?? 'Unable to create contribution rate',
    )
  }

  return response.json()
}

export async function createContribution(
  memberId: number,
  contributionDate: string,
  reference: string,
  token: string,
): Promise<CreatedContribution> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/contributions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contribution_date: contributionDate,
        reference: reference.trim() || null,
      }),
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.detail ?? 'Unable to record contribution',
    )
  }

  return response.json()
}

export async function getMemberContributions(
  memberId: number,
  token: string,
): Promise<ContributionHistoryEntry[]> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/contributions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.detail ?? 'Unable to load contribution history',
    )
  }

  return response.json()
}

export async function getMemberContributionTotal(
  memberId: number,
  token: string,
): Promise<ContributionTotalResponse> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/contributions/total`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.detail ?? 'Unable to load contribution total',
    )
  }

  return response.json()
}
