import type {
  MemberStatementRow,
  MemberFinancialSummary,
} from '../types'
import { API_BASE } from '../config'
import { formatApiError } from '../errors'

export async function getMemberFinancialSummary(
  memberId: number,
  token: string,
): Promise<MemberFinancialSummary> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/financial-summary`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      formatApiError(data?.detail, 'Unable to load member financial summary'),
    )
  }

  return response.json()
}

export async function getMemberStatement(
  memberId: number,
  token: string,
): Promise<MemberStatementRow[]> {
  const response = await fetch(
    `${API_BASE}/members/${memberId}/statement`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      formatApiError(data?.detail, 'Unable to load member statement'),
    )
  }

  return response.json()
}
