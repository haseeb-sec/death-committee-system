import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import type {
  CommitteeSummary,
  CreatedCommittee,
  CreatedContributionRate,
  CreatedContribution,
  CreatedDeathSupport,
  DeathSupportStatus,
  CreatedMember,
  Member,
  CreatedAsset,
  AssetValuation,
  AssetParticipation,
  MemberStatementRow,
  ContributionHistoryEntry,
  ContributionTotalResponse,
  MemberDueRecord,
  MemberOutstandingDuesResponse,
  MemberGoodRecord,
  MemberGoodsTotalResponse,
  SettlementPreview,
  AuthenticatedUser,
  MemberFinancialSummary,
} from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? `http://${window.location.hostname}:8000`

function getTimeGreeting() {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Good night'
}

function formatPKR(amount: number) {
  return `Rs. ${amount.toLocaleString('en-PK')}`
}

async function login(username: string, password: string) {
  const body = new URLSearchParams()
  body.set('username', username)
  body.set('password', password)

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    throw new Error('Invalid username or password')
  }

  return response.json()
}

async function resetPassword(token: string, newPassword: string) {
  const response = await fetch(`${API_BASE}/users/password-reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      new_password: newPassword,
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail ?? 'Unable to reset password')
  }

  return data
}


async function issuePasswordReset(
  token: string,
  userId: number,
) {
  const response = await fetch(
    `${API_BASE}/users/${userId}/password-reset`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail ?? 'Unable to issue recovery token')
  }

  return data
}


async function getCommittees(token: string): Promise<CreatedCommittee[]> {
  const response = await fetch(`${API_BASE}/committees`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Unable to load committees')
  }

  return response.json()
}


async function getMembers(
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


async function closeCommittee(
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
    throw new Error(data?.detail ?? 'Unable to close committee')
  }

  return data ?? {}
}

async function createCommittee(
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
    throw new Error(data?.detail ?? 'Unable to create committee')
  }

  return response.json()
}

async function createContributionRate(
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


async function createContribution(
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

async function createDeathSupport(
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

async function getDeathSupportStatus(
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

async function createMember(
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

async function createCommitteeAsset(
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

async function getAssetValuations(
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

async function getAssetParticipation(
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

async function updateCommitteeAssetValue(
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


async function createMemberGood(
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
      data?.detail ?? 'Unable to create member good',
    )
  }

  return response.json()
}

async function getMemberGoods(
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
      data?.detail ?? 'Unable to load member goods',
    )
  }

  return response.json()
}

async function getMemberGoodsTotal(
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
      data?.detail ?? 'Unable to load member goods total',
    )
  }

  return response.json()
}

async function updateMemberGoodValue(
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
      data?.detail ?? 'Unable to update member good value',
    )
  }

  return response.json()
}

async function getMemberFinancialSummary(
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
      data?.detail ?? 'Unable to load member financial summary',
    )
  }

  return response.json()
}

async function getMemberStatement(
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
      data?.detail ?? 'Unable to load member statement',
    )
  }

  return response.json()
}

async function getMemberContributions(
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

async function getMemberContributionTotal(
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

async function getMyMemberDues(
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

async function getMyOutstandingDues(
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

async function getMyMemberGoods(
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
      data?.detail ?? 'Unable to load goods',
    )
  }

  return response.json()
}

async function getMyGoodsTotal(
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
      data?.detail ?? 'Unable to load goods total',
    )
  }

  return response.json()
}

async function getMySettlementPreview(
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

async function getCommitteeSummary(
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
    throw new Error(data?.detail ?? 'Unable to load committee')
  }

  return response.json()
}

async function createMemberDue(
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

async function getMemberDues(
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

async function getOutstandingDues(
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

async function payMemberDue(
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

async function changeMyPassword(
  currentPassword: string,
  newPassword: string,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(`${API_BASE}/users/me/password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Unable to change password')
  }

  return response.json()
}


async function getMyCommitteeAccess(
  token: string,
): Promise<Array<Record<string, any>>> {
  const response = await fetch(`${API_BASE}/users/me/committees/access`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      data?.detail ?? 'Unable to load committee permissions',
    )
  }

  return response.json()
}


async function getUsers(token: string): Promise<Array<Record<string, any>>> {
  const response = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Unable to load users')
  }

  return response.json()
}

async function grantUserCommitteeAccess(
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
    throw new Error(data?.detail ?? 'Unable to grant committee access')
  }

  return response.json()
}

async function getCommitteeAdministrators(
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
      data?.detail ?? 'Unable to load committee administrators',
    )
  }

  return response.json()
}

async function getUserCommitteeAssignments(
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
      data?.detail ?? 'Unable to load committee assignments',
    )
  }

  return response.json()
}

async function getUserCommitteeAccess(
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
    throw new Error(data?.detail ?? 'Unable to load committee access')
  }

  return response.json()
}

async function deactivateUserCommitteeAccess(
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
    throw new Error(data?.detail ?? 'Unable to revoke committee access')
  }

  return response.json()
}

async function createUser(
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
    throw new Error(data?.detail ?? 'Unable to create user')
  }

  return response.json()
}

async function deactivateUser(
  userId: number,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(`${API_BASE}/users/${userId}/deactivate`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Unable to deactivate user')
  }

  return response.json()
}

async function getMemberSettlement(
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

async function createMemberSettlement(
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

async function payMemberSettlement(
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

function getNavigationLabel(page: string): string {
  const labels: Record<string, string> = {
    Dashboard: 'Overview',
    'Death Support': 'Death Assistance',
    Dues: 'Outstanding Dues',
    Goods: 'Member Purchases',
    Assets: 'Committee Assets',
    Settlements: 'Member Settlements',
    'My Death Support': 'My Death Assistance',
    'My Dues': 'My Outstanding Dues',
    'My Goods': 'My Purchases',
    'My Financial Position': 'My Financial Summary',
    'My Settlement': 'My Settlement',
  }

  return labels[page] ?? page
}


function App() {

  // ----------------------------------------------------------
  // FINAL RBAC SYSTEM-USER PERMISSION
  //
  // Only Super Admin manages system-level users.
  // Committee Admin manages operations inside assigned
  // committees but does NOT manage system users.
  // Members have no system-management authority.
  // ----------------------------------------------------------


  const [authenticatedUser, setAuthenticatedUser] =
    useState<AuthenticatedUser | null>(() => {
      const storedToken = localStorage.getItem('death_committee_token')

      if (!storedToken) return null

      return {
        username: '',
        systemRole: '',
        token: storedToken,
      }
    })

  const token = authenticatedUser?.token ?? ''
  const userRole = authenticatedUser?.systemRole ?? ''

  // System-user management is restricted to Super Admin.
  const canManageSystemUsers = userRole === 'super_admin'


  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [issuedResetToken, setIssuedResetToken] = useState('')
  const [issuedResetExpiry, setIssuedResetExpiry] = useState<number | null>(null)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [recoveryToken, setRecoveryToken] = useState('')
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('')
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('')
  const [recoveryMessage, setRecoveryMessage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('')
  const [committeeId, setCommitteeId] = useState('')
  const [summary, setSummary] = useState<CommitteeSummary | null>(null)
  const [committees, setCommittees] = useState<CreatedCommittee[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  const [users, setUsers] = useState<Array<Record<string, any>>>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userUsername, setUserUsername] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [userCreateRole, setUserCreateRole] = useState('member')
  const [createdUser, setCreatedUser] =
    useState<Record<string, any> | null>(null)
  const [selectedAccessUserId, setSelectedAccessUserId] = useState<number | null>(null)
  const [committeeAccessLoading, setCommitteeAccessLoading] = useState(false)
  const [assignmentUserId, setAssignmentUserId] = useState('')
  const [assignmentCommitteeId, setAssignmentCommitteeId] = useState('')
  const [assignmentIsAdmin, setAssignmentIsAdmin] = useState(false)
  const [userCommitteeAssignments, setUserCommitteeAssignments] =
    useState<Record<string, Array<Record<string, any>>>>({})
  const [assignmentOverviewLoading, setAssignmentOverviewLoading] =
    useState<number | null>(null)

  const [committeeAdministrators, setCommitteeAdministrators] =
    useState<Record<string, Array<Record<string, any>>>>({})
  const [committeeAdministratorsLoading, setCommitteeAdministratorsLoading] =
    useState<string | null>(null)

  const [committeeAccessStatus, setCommitteeAccessStatus] =
    useState<Record<string, any>>({})

  const [myCommitteeAccess, setMyCommitteeAccess] =
    useState<Array<Record<string, any>>>([])

  const selectedCommitteeAccess = myCommitteeAccess.find(
    (access) =>
      Number(access.committee_id) === Number(committeeId) &&
      access.is_active === true,
  )

  const isSuperAdmin = userRole === 'super_admin'
  const isSelectedCommitteeAdmin =
    isSuperAdmin || selectedCommitteeAccess?.is_admin === true

  const canWrite = isSelectedCommitteeAdmin

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activePage, setActivePage] = useState('Dashboard')
  const [committeeName, setCommitteeName] = useState('')
  const [createdCommittee, setCreatedCommittee] =
    useState<Record<string, any> | null>(null)
  const [committeeLifecycleStatus, setCommitteeLifecycleStatus] =
    useState<Record<string, string>>({})

  const [assetName, setAssetName] = useState('')
  const [assetPurchaseDate, setAssetPurchaseDate] = useState('')
  const [assetPurchaseValue, setAssetPurchaseValue] = useState('')
  const [assetDescription, setAssetDescription] = useState('')
  const [createdCommitteeAsset, setCreatedCommitteeAsset] =
    useState<Record<string, any> | null>(null)

  const [assetValueAssetId, setAssetValueAssetId] = useState('')
  const [assetValuationDate, setAssetValuationDate] = useState('')
  const [assetNewValue, setAssetNewValue] = useState('')
  const [updatedCommitteeAssetValue, setUpdatedCommitteeAssetValue] =
    useState<Record<string, any> | null>(null)

  const [valuationAssetId, setValuationAssetId] = useState('')
  const [assetValuations, setAssetValuations] =
    useState<Array<Record<string, any>>>([])

  const [participationAssetId, setParticipationAssetId] = useState('')
  const [assetParticipation, setAssetParticipation] =
    useState<Array<Record<string, any>>>([])

  const [goodsMemberId, setGoodsMemberId] = useState('')
  const [goodName, setGoodName] = useState('')
  const [goodPurchaseDate, setGoodPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [goodPurchasePrice, setGoodPurchasePrice] = useState('')
  const [goodDescription, setGoodDescription] = useState('')
  const [createdMemberGood, setCreatedMemberGood] =
    useState<Record<string, any> | null>(null)

  const [goodsListMemberId, setGoodsListMemberId] = useState('')
  const [memberGoods, setMemberGoods] =
    useState<Array<Record<string, any>>>([])

  const [goodsTotalMemberId, setGoodsTotalMemberId] = useState('')
  const [memberGoodsTotal, setMemberGoodsTotal] =
    useState<Record<string, any> | null>(null)

  const [goodValueId, setGoodValueId] = useState('')
  const [goodValuationDate, setGoodValuationDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [goodNewValue, setGoodNewValue] = useState('')
  const [updatedMemberGoodValue, setUpdatedMemberGoodValue] =
    useState<Record<string, any> | null>(null)

    const [dueMemberId, setDueMemberId] = useState('' )
    const [dueAmount, setDueAmount] = useState('' )
    const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10))
    const [dueDescription, setDueDescription] = useState('' )
    const [dueReference, setDueReference] = useState('' )
    const [createdMemberDue, setCreatedMemberDue] = useState<Record<string, any> | null>(null)
    const [duesListMemberId, setDuesListMemberId] = useState('' )
    const [memberDues, setMemberDues] = useState<Array<Record<string, any>>>([])
    const [outstandingDuesMemberId, setOutstandingDuesMemberId] = useState('' )
    const [memberOutstandingDues, setMemberOutstandingDues] = useState<Record<string, any> | null>(null)
    const [duePaymentId, setDuePaymentId] = useState('' )
    const [duePaymentAmount, setDuePaymentAmount] = useState('' )
    const [paidMemberDue, setPaidMemberDue] = useState<Record<string, any> | null>(null)

  const [contributionAmount, setContributionAmount] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [createdContributionRate, setCreatedContributionRate] =
    useState<CreatedContributionRate | null>(null)

  const [deathSupportMemberId, setDeathSupportMemberId] = useState('')
  const [deathSupportBeneficiaryName, setDeathSupportBeneficiaryName] =
    useState('')
  const [deathSupportAmount, setDeathSupportAmount] = useState('')
  const [deathSupportDate, setDeathSupportDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [deathSupportReference, setDeathSupportReference] = useState('')
  const [createdDeathSupport, setCreatedDeathSupport] =
    useState<CreatedDeathSupport | null>(null)

  const [deathSupportStatusMemberId, setDeathSupportStatusMemberId] =
    useState('')
  const [deathSupportStatus, setDeathSupportStatus] =
    useState<DeathSupportStatus | null>(null)

  const [contributionMemberId, setContributionMemberId] =
    useState('')
  const [contributionDate, setContributionDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [contributionReference, setContributionReference] =
    useState('')
  const [createdContribution, setCreatedContribution] =
    useState<CreatedContribution | null>(null)

  const [memberName, setMemberName] = useState('')
  const [memberJoinedOn, setMemberJoinedOn] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [createdMember, setCreatedMember] =
    useState<CreatedMember | null>(null)

  const [financialMemberId, setFinancialMemberId] = useState('')
  const [memberFinancialSummary, setMemberFinancialSummary] =
    useState<MemberFinancialSummary | null>(null)

  const [memberStatement, setMemberStatement] =
    useState<MemberStatementRow[]>([])

  const [myFinancialSummary, setMyFinancialSummary] =
    useState<MemberFinancialSummary | null>(null)

  const [myStatement, setMyStatement] =
    useState<MemberStatementRow[]>([])

  const [myFinancialSummaryLoading, setMyFinancialSummaryLoading] =
    useState(false)

  const [myFinancialSummaryError, setMyFinancialSummaryError] =
    useState('')

  const [myContributions, setMyContributions] =
    useState<ContributionHistoryEntry[]>([])

  const [myContributionTotal, setMyContributionTotal] =
    useState<ContributionTotalResponse | null>(null)

  const [myContributionsLoading, setMyContributionsLoading] =
    useState(false)

  const [myContributionsError, setMyContributionsError] =
    useState('')

  const [myDues, setMyDues] = useState<MemberDueRecord[]>([])

  const [myOutstandingDues, setMyOutstandingDues] =
    useState<MemberOutstandingDuesResponse | null>(null)

  const [myDuesLoading, setMyDuesLoading] = useState(false)

  const [myDuesError, setMyDuesError] = useState('')

  const [myGoods, setMyGoods] = useState<MemberGoodRecord[]>([])

  const [myGoodsTotal, setMyGoodsTotal] =
    useState<MemberGoodsTotalResponse | null>(null)

  const [myGoodsLoading, setMyGoodsLoading] = useState(false)

  const [myGoodsError, setMyGoodsError] = useState('')

  const [myDeathSupportInfo, setMyDeathSupportInfo] =
    useState<MemberFinancialSummary | null>(null)

  const [myDeathSupportLoading, setMyDeathSupportLoading] =
    useState(false)

  const [myDeathSupportError, setMyDeathSupportError] = useState('')

  const [mySettlementPreview, setMySettlementPreview] =
    useState<SettlementPreview | null>(null)

  const [mySettlementLoading, setMySettlementLoading] = useState(false)

  const [mySettlementError, setMySettlementError] = useState('')

  const [settlementMemberId, setSettlementMemberId] = useState('')
  const [settlementPreview, setSettlementPreview] =
    useState<Record<string, any> | null>(null)
  const [createdMemberSettlement, setCreatedMemberSettlement] =
    useState<Record<string, any> | null>(null)
  const [paidMemberSettlement, setPaidMemberSettlement] =
    useState<Record<string, any> | null>(null)
  const [settlementDate, setSettlementDate] = useState(
    new Date().toISOString().slice(0, 10),
  )

  useEffect(() => {
    if (!token) {
      setCommittees([])
      return
    }

    let cancelled = false

    async function loadAccessibleCommittees() {
      try {
        const data = await getCommittees(token)

        if (cancelled) return

        setCommittees(data)

        if (data.length > 0) {
          setCommitteeId(String(data[0].id ?? ''))
        } else {
          setCommitteeId('')
          setSummary(null)
        }
      } catch (err) {
        if (cancelled) return

        setCommittees([])
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load accessible committees',
        )
      }
    }

    loadAccessibleCommittees()

    return () => {
      cancelled = true
    }
  }, [token, activePage])

  useEffect(() => {
    if (!token || !committeeId) {
      setMembers([])
      return
    }

    const selectedCommitteeId = Number(committeeId)

    if (!Number.isInteger(selectedCommitteeId) || selectedCommitteeId <= 0) {
      setMembers([])
      return
    }

    let cancelled = false

    async function loadCommitteeMembers() {
      setMembersLoading(true)

      try {
        const data = await getMembers(selectedCommitteeId, token)

        if (cancelled) return

        const committeeMembers = data.filter(
          (member) => member.committee_id === selectedCommitteeId,
        )

        setMembers(committeeMembers)

        const firstMemberId =
          committeeMembers.length > 0
            ? String(committeeMembers[0].id)
            : ''

        setFinancialMemberId(firstMemberId)
        setContributionMemberId(firstMemberId)
      } catch (err) {
        if (cancelled) return

        setMembers([])
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load committee members',
        )
      } finally {
        if (!cancelled) {
          setMembersLoading(false)
        }
      }
    }

    async function loadCommitteeSummary() {
      try {
        const data = await getCommitteeSummary(selectedCommitteeId, token)

        if (cancelled) return

        setSummary(data)
      } catch (err) {
        if (cancelled) return

        setSummary(null)
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load committee summary",
        )
      }
    }

    // A committee switch starts a completely isolated committee context.
    // Clear all committee/member-specific selections, drafts, and results
    // so data from the previous committee can never remain visible.
    setMembers([])
    setSummary(null)
    setFinancialMemberId("")
    setContributionMemberId("")
    setMemberFinancialSummary(null)
    setMemberStatement([])
    setMyFinancialSummary(null)
    setMyStatement([])
    setMyContributions([])
    setMyContributionTotal(null)
    setMyDues([])
    setMyOutstandingDues(null)
    setMyGoods([])
    setMyGoodsTotal(null)
    setMyDeathSupportInfo(null)
    setMySettlementPreview(null)

    // Committee access state
    setSelectedAccessUserId(null)
    setCommitteeAccessStatus({})
    setCommitteeAccessLoading(false)

    // Contributions
    setContributionAmount("")
    setContributionReference("")
    setCreatedContribution(null)
    setCreatedContributionRate(null)
    setCreatedMember(null)

    // Member form
    setMemberName("")

    // Date-specific committee records
    // Reset to fresh defaults rather than carrying the previous committee date.
    const freshCommitteeDate = new Date().toISOString().slice(0, 10)
    setDeathSupportDate(freshCommitteeDate)
    setGoodPurchaseDate(freshCommitteeDate)
    setGoodValuationDate(freshCommitteeDate)
    setDueDate(freshCommitteeDate)
    setSettlementDate(freshCommitteeDate)
    setContributionDate(freshCommitteeDate)
    setEffectiveFrom(freshCommitteeDate)
    setMemberJoinedOn(freshCommitteeDate)

    // Death Support
    setDeathSupportMemberId("")
    setDeathSupportBeneficiaryName("")
    setDeathSupportAmount("")
    setDeathSupportReference("")
    setDeathSupportStatusMemberId("")
    setDeathSupportStatus(null)
    setCreatedDeathSupport(null)

    // Assets
    setAssetName("")
    setAssetPurchaseDate("")
    setAssetPurchaseValue("")
    setAssetDescription("")
    setCreatedCommitteeAsset(null)
    setAssetValueAssetId("")
    setAssetValuationDate("")
    setAssetNewValue("")
    setUpdatedCommitteeAssetValue(null)
    setValuationAssetId("")
    setAssetValuations([])
    setParticipationAssetId("")
    setAssetParticipation([])

    // Goods
    setGoodsMemberId("")
    setGoodName("")
    setGoodPurchasePrice("")
    setGoodDescription("")
    setCreatedMemberGood(null)
    setGoodsListMemberId("")
    setMemberGoods([])
    setGoodsTotalMemberId("")
    setMemberGoodsTotal(null)
    setGoodValueId("")
    setGoodNewValue("")
    setUpdatedMemberGoodValue(null)

    // Dues
    setDueMemberId("")
    setDueAmount("")
    setDueDescription("")
    setDueReference("")
    setCreatedMemberDue(null)
    setDuesListMemberId("")
    setMemberDues([])
    setOutstandingDuesMemberId("")
    setMemberOutstandingDues(null)
    setDuePaymentId("")
    setDuePaymentAmount("")
    setPaidMemberDue(null)

    // Settlement
    setSettlementMemberId("")
    setSettlementPreview(null)
    setCreatedMemberSettlement(null)
    setPaidMemberSettlement(null)

    void loadCommitteeMembers()
    void loadCommitteeSummary()

    return () => {
      cancelled = true
    }
  }, [committeeId, token])

  useEffect(() => {
    if (activePage !== 'My Financial Position') return
    if (!token || members.length === 0) return

    const ownMemberId = members[0].id

    let cancelled = false

    async function loadMyFinancialPosition() {
      setMyFinancialSummaryLoading(true)
      setMyFinancialSummaryError('')

      try {
        const summaryData = await getMemberFinancialSummary(
          ownMemberId,
          token,
        )

        if (cancelled) return

        setMyFinancialSummary(summaryData)

        const statementData = await getMemberStatement(
          ownMemberId,
          token,
        )

        if (cancelled) return

        setMyStatement(statementData)
      } catch (err) {
        if (cancelled) return

        setMyFinancialSummaryError(
          err instanceof Error
            ? err.message
            : 'Unable to load your financial position',
        )
      } finally {
        if (!cancelled) {
          setMyFinancialSummaryLoading(false)
        }
      }
    }

    loadMyFinancialPosition()

    return () => {
      cancelled = true
    }
  }, [activePage, token, members])

  useEffect(() => {
    if (activePage !== 'My Contributions') return
    if (!token || members.length === 0) return

    const ownMemberId = members[0].id

    let cancelled = false

    async function loadMyContributions() {
      setMyContributionsLoading(true)
      setMyContributionsError('')

      try {
        const historyData = await getMemberContributions(
          ownMemberId,
          token,
        )

        if (cancelled) return

        setMyContributions(historyData)

        const totalData = await getMemberContributionTotal(
          ownMemberId,
          token,
        )

        if (cancelled) return

        setMyContributionTotal(totalData)
      } catch (err) {
        if (cancelled) return

        setMyContributionsError(
          err instanceof Error
            ? err.message
            : 'Unable to load your contribution history',
        )
      } finally {
        if (!cancelled) {
          setMyContributionsLoading(false)
        }
      }
    }

    loadMyContributions()

    return () => {
      cancelled = true
    }
  }, [activePage, token, members])

  useEffect(() => {
    if (activePage !== 'My Dues') return
    if (!token || members.length === 0) return

    const ownMemberId = members[0].id

    let cancelled = false

    async function loadMyDues() {
      setMyDuesLoading(true)
      setMyDuesError('')

      try {
        const duesData = await getMyMemberDues(
          ownMemberId,
          token,
        )

        if (cancelled) return

        setMyDues(duesData)

        const outstandingData = await getMyOutstandingDues(
          ownMemberId,
          token,
        )

        if (cancelled) return

        setMyOutstandingDues(outstandingData)
      } catch (err) {
        if (cancelled) return

        setMyDuesError(
          err instanceof Error
            ? err.message
            : 'Unable to load your dues',
        )
      } finally {
        if (!cancelled) {
          setMyDuesLoading(false)
        }
      }
    }

    loadMyDues()

    return () => {
      cancelled = true
    }
  }, [activePage, token, members])

  useEffect(() => {
    if (activePage !== 'My Goods') return
    if (!token || members.length === 0) return

    const ownMemberId = members[0].id

    let cancelled = false

    async function loadMyGoods() {
      setMyGoodsLoading(true)
      setMyGoodsError('')

      try {
        const goodsData = await getMyMemberGoods(
          ownMemberId,
          token,
        )

        if (cancelled) return

        setMyGoods(goodsData)

        const totalData = await getMyGoodsTotal(
          ownMemberId,
          token,
        )

        if (cancelled) return

        setMyGoodsTotal(totalData)
      } catch (err) {
        if (cancelled) return

        setMyGoodsError(
          err instanceof Error
            ? err.message
            : 'Unable to load your goods',
        )
      } finally {
        if (!cancelled) {
          setMyGoodsLoading(false)
        }
      }
    }

    loadMyGoods()

    return () => {
      cancelled = true
    }
  }, [activePage, token, members])

  useEffect(() => {
    if (activePage !== 'My Death Support') return
    if (!token || members.length === 0) return

    const ownMemberId = members[0].id

    let cancelled = false

    async function loadMyDeathSupport() {
      setMyDeathSupportLoading(true)
      setMyDeathSupportError('')

      try {
        const summaryData = await getMemberFinancialSummary(
          ownMemberId,
          token,
        )

        if (cancelled) return

        setMyDeathSupportInfo(summaryData)
      } catch (err) {
        if (cancelled) return

        setMyDeathSupportError(
          err instanceof Error
            ? err.message
            : 'Unable to load your death support record',
        )
      } finally {
        if (!cancelled) {
          setMyDeathSupportLoading(false)
        }
      }
    }

    loadMyDeathSupport()

    return () => {
      cancelled = true
    }
  }, [activePage, token, members])

  useEffect(() => {
    if (activePage !== 'My Settlement') return
    if (!token || members.length === 0) return

    const ownMemberId = members[0].id

    let cancelled = false

    async function loadMySettlementPreview() {
      setMySettlementLoading(true)
      setMySettlementError('')

      try {
        const previewData = await getMySettlementPreview(
          ownMemberId,
          token,
        )

        if (cancelled) return

        setMySettlementPreview(previewData)
      } catch (err) {
        if (cancelled) return

        setMySettlementError(
          err instanceof Error
            ? err.message
            : 'Unable to load your settlement preview',
        )
      } finally {
        if (!cancelled) {
          setMySettlementLoading(false)
        }
      }
    }

    loadMySettlementPreview()

    return () => {
      cancelled = true
    }
  }, [activePage, token, members])


  async function handleIssuePasswordReset(userId: number) {
    if (!canWrite) {
      setError('You do not have permission to perform this action')
      return
    }

    setError('')
    setIssuedResetToken('')
    setIssuedResetExpiry(null)

    if (!token) {
      setError('You are not authenticated')
      return
    }

    setLoading(true)

    try {
      const data = await issuePasswordReset(token, userId)

      setIssuedResetToken(data.token ?? '')
      setIssuedResetExpiry(data.expires_in_minutes ?? null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to issue recovery token',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault()

    if (!canWrite) {
      setError('You do not have permission to perform this action')
      return
    }

    setError('')
    setPasswordChangeMessage('')

    if (!token) {
      setError('You are not authenticated')
      return
    }

    if (!currentPassword) {
      setError('Current password is required')
      return
    }

    if (!newPassword) {
      setError('New password is required')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match')
      return
    }

    setLoading(true)

    try {
      const data = await changeMyPassword(
        currentPassword,
        newPassword,
        token,
      )

      setPasswordChangeMessage(
        data.message ?? 'Password changed successfully',
      )
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to change password',
      )
    } finally {
      setLoading(false)
    }
  }


  async function handlePasswordRecovery(event: FormEvent) {
    event.preventDefault()
    setError('')
    setRecoveryMessage('')

    if (!recoveryToken.trim()) {
      setError('Recovery token is required')
      return
    }

    if (!recoveryNewPassword) {
      setError('New password is required')
      return
    }

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setError('New passwords do not match')
      return
    }

    setLoading(true)

    try {
      const data = await resetPassword(
        recoveryToken.trim(),
        recoveryNewPassword,
      )

      setRecoveryMessage(
        data.message ?? 'Password reset successfully',
      )
      setRecoveryToken('')
      setRecoveryNewPassword('')
      setRecoveryConfirmPassword('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reset password',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await login(username, password)

      localStorage.setItem('death_committee_token', data.access_token)

      setAuthenticatedUser({
        username,
        systemRole: data.role ?? '',
        token: data.access_token,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadCommittee() {
    if (!token) return

    const id = Number(committeeId)

    if (!Number.isInteger(id) || id <= 0) {
      setError('Enter a valid committee ID')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await getCommitteeSummary(id, token)
      setSummary(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load committee',
      )
    } finally {
      setLoading(false)
    }
  }


  async function handleCreateCommitteeAsset(event: FormEvent) {
    event.preventDefault()

    if (!canWrite) {
      setError('You do not have permission to perform write actions')
      return
    }

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const selectedCommitteeId = Number(committeeId)
    const purchaseValue = Number(assetPurchaseValue)

    if (!Number.isInteger(selectedCommitteeId) || selectedCommitteeId <= 0) {
      setError('Select a valid committee')
      return
    }

    if (!assetName.trim()) {
      setError('Asset name is required')
      return
    }

    if (!assetPurchaseDate) {
      setError('Purchase date is required')
      return
    }

    if (!Number.isInteger(purchaseValue) || purchaseValue <= 0) {
      setError('Purchase value must be a positive whole number')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await createCommitteeAsset(
        selectedCommitteeId,
        assetName.trim(),
        assetPurchaseDate,
        purchaseValue,
        assetDescription.trim(),
        token,
      )

      setCreatedCommitteeAsset(data)
      setAssetName('')
      setAssetPurchaseValue('')
      setAssetDescription('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create committee asset',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateCommitteeAssetValue(event: FormEvent) {
    event.preventDefault()

    if (!canWrite) {
      setError('You do not have permission to perform write actions')
      return
    }

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const assetId = Number(assetValueAssetId)
    const newValue = Number(assetNewValue)

    if (!Number.isInteger(assetId) || assetId <= 0) {
      setError('Enter a valid asset ID')
      return
    }

    if (!assetValuationDate) {
      setError('Valuation date is required')
      return
    }

    if (!Number.isInteger(newValue) || newValue < 0) {
      setError(
        'New value must be a whole number greater than or equal to 0',
      )
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await updateCommitteeAssetValue(
        assetId,
        assetValuationDate,
        newValue,
        token,
      )

      setUpdatedCommitteeAssetValue(
        data as Record<string, any>,
      )
      setAssetNewValue('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update committee asset value',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadAssetValuations() {
    if (!token) {
      setError('You are not authenticated')
      return
    }

    const assetId = Number(valuationAssetId)

    if (!Number.isInteger(assetId) || assetId <= 0) {
      setError('Enter a valid asset ID')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await getAssetValuations(assetId, token)
      setAssetValuations(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load asset valuations',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadAssetParticipation() {
    if (!token) {
      setError('You are not authenticated')
      return
    }

    const assetId = Number(participationAssetId)

    if (!Number.isInteger(assetId) || assetId <= 0) {
      setError('Enter a valid asset ID')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await getAssetParticipation(assetId, token)
      setAssetParticipation(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load asset participation',
      )
    } finally {
      setLoading(false)
    }
  }


  async function handleCreateMemberGood(event: FormEvent) {
    event.preventDefault()

    if (!canWrite) {
      setError('You do not have permission to perform write actions')
      return
    }

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const memberId = Number(goodsMemberId)
    const purchasePrice = Number(goodPurchasePrice)

    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError('Select a valid member')
      return
    }

    if (!goodName.trim()) {
      setError('Good name is required')
      return
    }

    if (!goodPurchaseDate) {
      setError('Purchase date is required')
      return
    }

    if (!Number.isInteger(purchasePrice) || purchasePrice <= 0) {
      setError('Purchase price must be a positive whole number')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await createMemberGood(
        memberId,
        goodName.trim(),
        goodPurchaseDate,
        purchasePrice,
        goodDescription.trim(),
        token,
      )

      setCreatedMemberGood(data)
      setGoodName('')
      setGoodPurchasePrice('')
      setGoodDescription('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create member good',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadMemberGoods() {
    if (!token) {
      setError('You are not authenticated')
      return
    }

    const memberId = Number(goodsListMemberId)

    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError('Enter a valid member ID')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await getMemberGoods(memberId, token)
      setMemberGoods(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load member goods',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadMemberGoodsTotal() {
    if (!token) {
      setError('You are not authenticated')
      return
    }

    const memberId = Number(goodsTotalMemberId)

    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError('Enter a valid member ID')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await getMemberGoodsTotal(memberId, token)
      setMemberGoodsTotal(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load member goods total',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateMemberGoodValue(event: FormEvent) {
    event.preventDefault()

    if (!canWrite) {
      setError('You do not have permission to perform write actions')
      return
    }

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const goodId = Number(goodValueId)
    const newValue = Number(goodNewValue)

    if (!Number.isInteger(goodId) || goodId <= 0) {
      setError('Enter a valid good ID')
      return
    }

    if (!goodValuationDate) {
      setError('Valuation date is required')
      return
    }

    if (!Number.isInteger(newValue) || newValue < 0) {
      setError(
        'New value must be a whole number greater than or equal to 0',
      )
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await updateMemberGoodValue(
        goodId,
        goodValuationDate,
        newValue,
        token,
      )

      setUpdatedMemberGoodValue(data)
      setGoodNewValue('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update member good value',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateMemberDue(event: FormEvent) {
    event.preventDefault()

    if (!canWrite) {
      setError('You do not have permission to modify committee records')
      return
    }

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const memberId = Number(dueMemberId)
    const amount = Number(dueAmount)

    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError('Enter a valid member ID')
      return
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      setError('Amount due must be a positive whole number')
      return
    }

    if (!dueDate) {
      setError('Due date is required')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await createMemberDue(
        memberId,
        amount,
        dueDate,
        dueDescription.trim(),
        dueReference.trim(),
        token,
      )

      setCreatedMemberDue(data)
      setDueAmount('')
      setDueDescription('')
      setDueReference('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create member due',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadMemberDues() {
    if (!token) {
      setError('You are not authenticated')
      return
    }

    const memberId = Number(duesListMemberId)

    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError('Enter a valid member ID')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await getMemberDues(memberId, token)
      setMemberDues(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load member dues',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadOutstandingDues() {
    if (!token) {
      setError('You are not authenticated')
      return
    }

    const memberId = Number(outstandingDuesMemberId)

    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError('Enter a valid member ID')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await getOutstandingDues(memberId, token)
      setMemberOutstandingDues(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load outstanding dues',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handlePayMemberDue(event: FormEvent) {
    event.preventDefault()

    if (!canWrite) {
      setError('You do not have permission to modify committee records')
      return
    }

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const dueId = Number(duePaymentId)
    const amount = Number(duePaymentAmount)

    if (!Number.isInteger(dueId) || dueId <= 0) {
      setError('Enter a valid due ID')
      return
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      setError('Payment amount must be a positive whole number')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await payMemberDue(dueId, amount, token)
      setPaidMemberDue(data)
      setDuePaymentAmount('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to pay member due',
      )
    } finally {
      setLoading(false)
    }
  }



  async function handleLoadMemberSettlement() {
    if (!token) {
      setError('You are not authenticated')
      return
    }

    const memberId = Number(settlementMemberId)

    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError('Select a valid member')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await getMemberSettlement(memberId, token)
      setSettlementPreview(data)
      setCreatedMemberSettlement(null)
      setPaidMemberSettlement(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load member settlement preview',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateMemberSettlement(event: FormEvent) {
    event.preventDefault()

    if (!canWrite) {
      setError('You do not have permission to perform write actions')
      return
    }

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const memberId = Number(settlementMemberId)

    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError('Select a valid member')
      return
    }

    if (!settlementDate) {
      setError('Settlement date is required')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await createMemberSettlement(
        memberId,
        settlementDate,
        token,
      )

      setCreatedMemberSettlement(data)
      setSettlementPreview(data)
      setPaidMemberSettlement(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create member settlement',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handlePayMemberSettlement() {
    if (!canWrite) {
      setError('You do not have permission to perform write actions')
      return
    }
    if (!token) {
      setError('You are not authenticated')
      return
    }

    const settlementId = Number(
      createdMemberSettlement?.id ?? settlementPreview?.id,
    )

    if (!Number.isInteger(settlementId) || settlementId <= 0) {
      setError('Create a settlement before paying it')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await payMemberSettlement(settlementId, token)
      setPaidMemberSettlement(data)
      setCreatedMemberSettlement(data)
      setSettlementPreview(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to pay member settlement',
      )
    } finally {
      setLoading(false)
    }
  }

async function handleCloseCommittee(committeeId: number) {
    if (userRole !== 'super_admin') {
      setError('Only Super Administrators can close committees')
      return
    }

    if (!Number.isInteger(committeeId) || committeeId <= 0) {
      setError('Invalid committee')
      return
    }

    const committee = committees.find(
      (item) => Number(item.id) === committeeId,
    )

    if (!committee) {
      setError('Committee not found')
      return
    }

    if (committee.is_active === false) {
      setCommitteeLifecycleStatus((current) => ({
        ...current,
        [String(committeeId)]: 'Already closed',
      }))
      return
    }

    const confirmed = window.confirm(
      'Close this committee? Closing a committee prevents further committee activity while preserving its historical records.',
    )

    if (!confirmed) {
      return
    }

    setError('')

    setCommitteeLifecycleStatus((current) => ({
      ...current,
      [String(committeeId)]: 'Closing...',
    }))

    try {
      await closeCommittee(committeeId, token)

      setCommittees((current) =>
        current.map((item) =>
          Number(item.id) === committeeId
            ? { ...item, is_active: false }
            : item,
        ),
      )

      setCommitteeLifecycleStatus((current) => ({
        ...current,
        [String(committeeId)]: 'Closed',
      }))

      if (Number(committeeId) === Number(committeeId)) {
        setSummary((current) => current)
      }
    } catch (err) {
      setCommitteeLifecycleStatus((current) => ({
        ...current,
        [String(committeeId)]: '',
      }))

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to close committee',
      )
    }
  }

async function handleCreateCommittee(event: FormEvent) {
    event.preventDefault()

    const name = committeeName.trim()

    if (!name) {
      setError('Committee name is required')
      return
    }

    if (!token) {
      setError('You are not authenticated')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await createCommittee(name, token)
      setCreatedCommittee(data)
      setCommitteeName('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create committee',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateContributionRate(event: FormEvent) {
    if (!canWrite) {
      setError('You do not have permission to modify committee records')
      return
    }
    event.preventDefault()

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const selectedCommitteeId = Number(committeeId)
    const amount = Number(contributionAmount)

    if (!Number.isInteger(selectedCommitteeId) || selectedCommitteeId <= 0) {
      setError('Select a valid committee')
      return
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      setError('Contribution amount must be a positive whole number')
      return
    }

    if (!effectiveFrom) {
      setError('Effective date is required')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await createContributionRate(
        selectedCommitteeId,
        amount,
        effectiveFrom,
        token,
      )

      setCreatedContributionRate(data)
      setContributionAmount('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create contribution rate',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateContribution(event: FormEvent) {
    if (!canWrite) {
      setError('You do not have permission to modify committee records')
      return
    }
    event.preventDefault()

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const memberId = Number(contributionMemberId)

    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError('Enter a valid member ID')
      return
    }

    if (!contributionDate) {
      setError('Payment date is required')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await createContribution(
        memberId,
        contributionDate,
        contributionReference,
        token,
      )

      setCreatedContribution(data)
      setContributionReference('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to record contribution',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadMemberFinancialSummary(
    memberIdOverride?: number,
  ) {
    if (!token) {
      setError('You are not authenticated')
      return
    }

    const memberId = memberIdOverride ?? Number(financialMemberId)

    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError('Enter a valid member ID')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await getMemberFinancialSummary(memberId, token)
      setMemberFinancialSummary(data)

      const statement = await getMemberStatement(memberId, token)
      setMemberStatement(statement)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load member financial summary',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateDeathSupport(event: FormEvent) {
    if (!canWrite) {
      setError('You do not have permission to modify committee records')
      return
    }
    event.preventDefault()

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const memberId = Number(deathSupportMemberId)
    const amount = Number(deathSupportAmount)

    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError('Select a valid member')
      return
    }

    if (!deathSupportBeneficiaryName.trim()) {
      setError('Beneficiary name is required')
      return
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      setError('Support amount must be a positive whole number')
      return
    }

    if (!deathSupportDate) {
      setError('Support date is required')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await createDeathSupport(
        memberId,
        deathSupportBeneficiaryName,
        amount,
        deathSupportDate,
        deathSupportReference,
        token,
      )

      setCreatedDeathSupport(data)
      setDeathSupportBeneficiaryName('')
      setDeathSupportAmount('')
      setDeathSupportReference('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to record death support',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadDeathSupportStatus() {
    if (!token) {
      setError('You are not authenticated')
      return
    }

    const memberId = Number(deathSupportStatusMemberId)

    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError('Select a valid member')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await getDeathSupportStatus(memberId, token)
      setDeathSupportStatus(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load death support status',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateMember(event: FormEvent) {
    event.preventDefault()

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const selectedCommitteeId = Number(committeeId)
    const name = memberName.trim()

    if (!Number.isInteger(selectedCommitteeId) || selectedCommitteeId <= 0) {
      setError('Select a valid committee')
      return
    }

    if (!name) {
      setError('Full name is required')
      return
    }

    if (!memberJoinedOn) {
      setError('Joined date is required')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await createMember(
        selectedCommitteeId,
        name,
        memberJoinedOn,
        token,
      )

      setCreatedMember(data)
      setMemberName('')

      const refreshedMembers = await getMembers(
        selectedCommitteeId,
        token,
      )

      setMembers(
        refreshedMembers.filter(
          (member) => member.committee_id === selectedCommitteeId,
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create member',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadMyCommitteeAccess() {
    if (!token) {
      setMyCommitteeAccess([])
      return
    }

    try {
      const data = await getMyCommitteeAccess(token)
      setMyCommitteeAccess(data)
    } catch (err) {
      setMyCommitteeAccess([])
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load committee permissions',
      )
    }
  }


  useEffect(() => {
    if (!token) {
      setMyCommitteeAccess([])
      return
    }

    void handleLoadMyCommitteeAccess()
  }, [token, committeeId])


  async function handleLoadUsers() {
    if (!token) {
      setError('You are not authenticated')
      return
    }

    setError('')
    setUsersLoading(true)

    try {
      const data = await getUsers(token)
      setUsers(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load users',
      )
    } finally {
      setUsersLoading(false)
    }
  }

  async function handleAssignUserToCommittee(event: FormEvent) {
    event.preventDefault()

    if (userRole !== 'super_admin') {
      setError('Only Super Administrators can assign users to committees')
      return
    }

    const userId = Number(assignmentUserId)
    const selectedCommitteeId = Number(assignmentCommitteeId)

    if (!Number.isInteger(userId) || userId <= 0) {
      setError('Select a user to assign')
      return
    }

    if (!Number.isInteger(selectedCommitteeId) || selectedCommitteeId <= 0) {
      setError('Select a committee to assign')
      return
    }

    setError('')
    setLoading(true)

    try {
      await grantUserCommitteeAccess(
        userId,
        selectedCommitteeId,
        token,
        assignmentIsAdmin,
      )

      setAssignmentUserId('')
      setAssignmentCommitteeId('')
      setAssignmentIsAdmin(false)

      // Refresh the visible access state for the newly assigned committee.
      setCommitteeAccessStatus((current) => ({
        ...current,
        [userId]: {
          ...(current[userId] ?? {}),
          is_active: true,
          is_admin: assignmentIsAdmin,
        },
      }))
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to assign user to committee',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLoadCommitteeAdministrators = async (
    committeeId: number,
  ) => {
    setCommitteeAdministratorsLoading(String(committeeId))
    setError('')

    try {
      const assignments = await getCommitteeAdministrators(
        committeeId,
        token,
      )

      setCommitteeAdministrators((current) => ({
        ...current,
        [String(committeeId)]: assignments,
      }))
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load committee administrators',
      )
    } finally {
      setCommitteeAdministratorsLoading(null)
    }
  }

  async function handleLoadUserCommitteeAssignments(
    userId: number,
  ) {
    if (!token) {
      setError('You are not authenticated')
      return
    }

    setError('')
    setAssignmentOverviewLoading(userId)

    try {
      const assignments = await getUserCommitteeAssignments(
        userId,
        token,
      )

      setUserCommitteeAssignments((current) => ({
        ...current,
        [String(userId)]: assignments,
      }))
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load committee assignments',
      )
    } finally {
      setAssignmentOverviewLoading(null)
    }
  }

  async function handleLoadCommitteeAccess(userId: number) {
    if (!token) {
      setError('You are not authenticated')
      return
    }

    const selectedCommitteeId = Number(committeeId)

    if (!Number.isInteger(selectedCommitteeId) || selectedCommitteeId <= 0) {
      setError('Select a valid committee')
      return
    }

    setError('')
    setCommitteeAccessLoading(true)
    setSelectedAccessUserId(userId)

    try {
      const data = await getUserCommitteeAccess(
        userId,
        selectedCommitteeId,
        token,
      )
      setCommitteeAccessStatus(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load committee access',
      )
      setCommitteeAccessStatus({})
    } finally {
      setCommitteeAccessLoading(false)
    }
  }

  async function handleGrantCommitteeAccess(userId: number) {
    if (userRole !== 'super_admin') {
      setError('Only Super Administrators can manage committee access')
      return
    }

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const selectedCommitteeId = Number(committeeId)

    if (!Number.isInteger(selectedCommitteeId) || selectedCommitteeId <= 0) {
      setError('Select a valid committee')
      return
    }

    setError('')
    setCommitteeAccessLoading(true)
    setSelectedAccessUserId(userId)

    try {
      const data = await grantUserCommitteeAccess(
        userId,
        selectedCommitteeId,
        token,
      )
      setCommitteeAccessStatus(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to grant committee access',
      )
    } finally {
      setCommitteeAccessLoading(false)
    }
  }

  async function handleDeactivateCommitteeAccess(userId: number) {
    if (userRole !== 'super_admin') {
      setError('Only Super Administrators can manage committee access')
      return
    }

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const selectedCommitteeId = Number(committeeId)

    if (!Number.isInteger(selectedCommitteeId) || selectedCommitteeId <= 0) {
      setError('Select a valid committee')
      return
    }

    setError('')
    setCommitteeAccessLoading(true)
    setSelectedAccessUserId(userId)

    try {
      const data = await deactivateUserCommitteeAccess(
        userId,
        selectedCommitteeId,
        token,
      )
      setCommitteeAccessStatus(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to revoke committee access',
      )
    } finally {
      setCommitteeAccessLoading(false)
    }
  }

  async function handleCreateUser(event: FormEvent) {
    if (!canManageSystemUsers) {
      setError(
        'Only Super Administrators can manage system user accounts.',
      )
      return
    }

    event.preventDefault()

    if (!canWrite) {
      setError('You do not have permission to perform this action')
      return
    }

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const usernameValue = userUsername.trim()
    const passwordValue = userPassword

    if (!usernameValue) {
      setError('Username is required')
      return
    }

    if (!passwordValue) {
      setError('Password is required')
      return
    }

    if (!canManageSystemUsers && userCreateRole !== 'member') {
      setError(
        'Only Super Administrators can create system-level administrator accounts.',
      )
      return
    }

    if (!['super_admin', 'committee_admin', 'member'].includes(userCreateRole)) {
      setError('Select a valid user role')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await createUser(
        usernameValue,
        passwordValue,
        userCreateRole,
        token,
      )

      setCreatedUser(data)
      setUserUsername('')
      setUserPassword('')
      await handleLoadUsers()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create user',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivateUser(userId: number) {
    if (!canWrite) {
      setError('You do not have permission to perform this action')
      return
    }

    if (!token) {
      setError('You are not authenticated')
      return
    }

    setError('')
    setUsersLoading(true)

    try {
      const data = await deactivateUser(userId, token)
      setCreatedUser(data)
      await handleLoadUsers()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to deactivate user',
      )
    } finally {
      setUsersLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('death_committee_token')
    setAuthenticatedUser(null)
    setSummary(null)
    setUsername('')
    setPassword('')
  }

  if (!token) {
    return (
      <main className="login-page">
        <section className="login-layout">
          <div className="login-intro">
            <div className="login-intro-glow" />

            <div className="login-brand">
              <div className="brand-mark">DC</div>
              <span>Death Committee System</span>
            </div>

            <div className="login-intro-content">
              <p className="eyebrow">MUTUAL SUPPORT MANAGEMENT</p>

              <h1>Manage your committee with clarity.</h1>

              <p className="login-intro-description">
                Keep members, contributions, support, dues, assets, and
                settlements organized in one place.
              </p>

              <div className="login-benefits">
                <div className="login-benefit">
                  <span className="login-benefit-icon">01</span>
                  <div>
                    <strong>Member records</strong>
                    <p>Keep member balances and activity organized.</p>
                  </div>
                </div>

                <div className="login-benefit">
                  <span className="login-benefit-icon">02</span>
                  <div>
                    <strong>Financial tracking</strong>
                    <p>Record Contributions, support, dues, and assets.</p>
                  </div>
                </div>

                <div className="login-benefit">
                  <span className="login-benefit-icon">03</span>
                  <div>
                    <strong>Clear settlements</strong>
                    <p>Review each member's financial position clearly.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="login-intro-footer">
              <span className="login-footer-dot" />
              <span>Simple records. Clear financial oversight.</span>
            </div>
          </div>

          <div className="login-panel">
            <div className="login-panel-header">
              <span className="login-panel-label">ADMINISTRATOR</span>
              <h2>{recoveryMode ? 'Reset your password' : 'Sign in'}</h2>
              <p>
                {recoveryMode
                  ? 'Ask a Super Admin to issue a recovery token, then use it below to create a new password.'
                  : 'Access your committee records and financial information.'}
              </p>
            </div>
            {recoveryMode ? (
              <form
                onSubmit={handlePasswordRecovery}
                className="login-form"
              >
                <label>
                  <span>Recovery token</span>
                  <input
                    value={recoveryToken}
                    onChange={(event) =>
                      setRecoveryToken(event.target.value)
                    }
                    autoComplete="off"
                    placeholder="Enter your recovery token"
                    required
                  />
                </label>

                <label>
                  <span>New password</span>
                  <input
                    type="password"
                    value={recoveryNewPassword}
                    onChange={(event) =>
                      setRecoveryNewPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    placeholder="Enter your new password"
                    required
                  />
                </label>

                <label>
                  <span>Confirm new password</span>
                  <input
                    type="password"
                    value={recoveryConfirmPassword}
                    onChange={(event) =>
                      setRecoveryConfirmPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                    required
                  />
                </label>

                {error && <div className="error">{error}</div>}

                {recoveryMessage && (
                  <div className="success">
                    {recoveryMessage}
                  </div>
                )}

                <button type="submit" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>

                <button
                  type="button"
                  className="forgot-password-button"
                  onClick={() => {
                    setRecoveryMode(false)
                    setError('')
                    setRecoveryMessage('')
                  }}
                >
                  Back to sign in
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="login-form">
                <label>
                  <span>Username</span>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    placeholder="Enter your username"
                    required
                  />
                </label>

                <label>
                  <span>Password</span>
                  <div className="password-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                          />
                          <circle cx="12" cy="12" r="2.8" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 3l18 18" />
                          <path
                            d="M10.6 6.2A10.5 10.5 0 0 1 12 6c6 0 9.5 6 9.5 6a18.7 18.7 0 0 1-3.1 3.9M6.2 6.8C3.8 8.4 2.5 12 2.5 12s3.5 6 9.5 6c1.4 0 2.7-.3 3.8-.8"
                          />
                          <path d="M9.9 9.9a2.8 2.8 0 0 0 4.2 4.2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>

                {error && <div className="error">{error}</div>}

                <button type="submit" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>

                <button
                  type="button"
                  className="forgot-password-button"
                  onClick={() => {
                    setRecoveryMode(true)
                    setError('')
                    setRecoveryMessage('')
                  }}
                >
                  Forgot password?
                </button>
              </form>
            )}

            <div className="login-security-note">
              <span className="security-icon">✓</span>
              <div>
                <strong>Secure administrator access</strong>
                <p>Your committee records are available after sign in.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">DC</div>
          <div>
            <strong>Death Committee</strong>
            <span>System</span>
          </div>
        </div>

        <nav>
          {(isSuperAdmin
              ? [
                  'Dashboard',
                  'Committees',
                  'Users',
                  'Members',
                  'Contributions',
                  'Death Support',
                  'Dues',
                  'Goods',
                  'Assets',
                  'Settlements',
                ]
              : isSelectedCommitteeAdmin
                ? [
                    'Dashboard',
                    'Members',
                    'Contributions',
                    'Death Support',
                    'Dues',
                    'Goods',
                    'Assets',
                    'Settlements',
                  ]
                : [
                    'Dashboard',
                    'My Contributions',
                    'My Death Support',
                    'My Dues',
                    'My Goods',
                    'My Financial Position',
                    'My Settlement',
                  ]
            ).map((page) => (
            <button
              key={page}
              className={`nav-item ${activePage === page ? 'active' : ''}`}
              onClick={() => {
                if (page === 'Users' && userRole !== 'super_admin') return
                setActivePage(page)
              }}
            >
              {getNavigationLabel(page)}
            </button>
          ))}
        </nav>

        <button className="logout-button" onClick={logout}>
          Sign out
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">DEATH COMMITTEE SYSTEM</p>
            <h2>{activePage}</h2>
          </div>

          <div className="status-pill">
            <span />
            {userRole || 'Authenticated'}
          </div>
        </header>

        <section className="content">
          {activePage === 'Users' && userRole !== 'super_admin' ? (
            <section className="module-placeholder">
              <div className="module-placeholder-icon">DC</div>
              <p className="eyebrow">ACCESS</p>
              <h1>Access restricted</h1>
              <p>
                User management is available only to Super Administrators.
              </p>
            </section>
          ) : activePage === 'Committees' ? (
            <section className="committee-module">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">MANAGEMENT</p>
                  <h1>Committees</h1>
                  <p>
                    Create and manage mutual support committees.
                  </p>
                </div>
              </div>

              {error && <div className="error page-error">{error}</div>}

              {canWrite && (
                <section className="information-card">
                  <div>
                    <p className="eyebrow">NEW COMMITTEE</p>
                    <h3>Create a committee</h3>
                  <p className="form-help">
                    Enter the name of the committee you want to register.
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleCreateCommittee}
                >
                  <label>
                    Committee name
                    <input
                      value={committeeName}
                      onChange={(event) =>
                        setCommitteeName(event.target.value)
                      }
                      placeholder="e.g. Swabi Mutual Support Committee"
                      required
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Committee'}
                  </button>
                </form>
                </section>
              )}

              {committees.length > 0 && (
                <section className="information-card">
                  <div>
                    <p className="eyebrow">COMMITTEE MANAGEMENT</p>
                    <h3>Committee administrators</h3>
                    <p className="form-help">
                      Review which users administer each committee. Committee
                      administration is granted through committee access and
                      does not change the user's system-level role.
                    </p>
                  </div>

                  <div className="committee-list">
                    {committees.map((committee) => {
                      const committeeKey = String(committee.id)
                      const administrators =
                        committeeAdministrators[committeeKey] ?? []

                      return (
                        <div
                          className="committee-list-item"
                          key={committee.id}
                        >
                          <div>
                            <strong>
                              {committee.name ??
                                committee.committee_name ??
                                `Committee ${committee.id}`}
                            </strong>

                            <span>
                              Committee ID: {committee.id}
                            </span>
                            <div className="committee-access-actions">
                              <strong>
                                {committee.is_active === false
                                  ? 'Closed'
                                  : 'Active'}
                              </strong>

                              {committeeLifecycleStatus[String(committee.id)] && (
                                <span>
                                  {committeeLifecycleStatus[String(committee.id)]}
                                </span>
                              )}

                              {userRole === 'super_admin' &&
                                committee.is_active !== false && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleCloseCommittee(
                                        Number(committee.id),
                                      )
                                    }
                                    disabled={
                                      committeeLifecycleStatus[
                                        String(committee.id)
                                      ] === 'Closing...'
                                    }
                                  >
                                    {committeeLifecycleStatus[
                                      String(committee.id)
                                    ] === 'Closing...'
                                      ? 'Closing...'
                                      : 'Close Committee'}
                                  </button>
                                )}
                            </div>

                            <div className="form-help">
                              <strong>Committee Administrators</strong>

                              {administrators.length === 0 ? (
                                <span>
                                  No active Committee Administrator is
                                  assigned.
                                </span>
                              ) : (
                                administrators.map(
                                  (admin: Record<string, any>) => (
                                    <span key={admin.user_id}>
                                      • {admin.username} ·{' '}
                                      {admin.role === 'committee_admin'
                                        ? 'Committee Administrator'
                                        : admin.role} ·{' '}
                                      {admin.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  ),
                                )
                              )}
                            </div>
                          </div>

                          <div className="committee-access-actions">
                            <button
                              type="button"
                              className="management-action management-action-secondary"
                              disabled={
                                committeeAdministratorsLoading ===
                                committeeKey
                              }
                              onClick={() =>
                                void handleLoadCommitteeAdministrators(
                                  Number(committee.id),
                                )
                              }
                            >
                              {committeeAdministratorsLoading ===
                              committeeKey
                                ? 'Loading...'
                                : 'View Administrators'}
                            </button>

                            {canWrite && (
                              <button
                                type="button"
                                className="management-action management-action-primary"
                                onClick={() => {
                                  setCommitteeId(String(committee.id))
                                  setActivePage('Users')
                                }}
                              >
                                Manage Access
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {createdCommittee && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">CREATED</p>
                    <h3>
                      {createdCommittee.name ??
                        createdCommittee.committee_name ??
                        'Committee created'}
                    </h3>

                    {createdCommittee.id && (
                      <p className="created-id">
                        Committee ID: {createdCommittee.id}
                      </p>
                    )}
                  </div>

                  <span className="active-badge">Created</span>
                </section>
              )}
            </section>
          ) : activePage === 'Members' ? (
            <>
              <section className="page-heading">
                <div>
                  <p className="eyebrow">MEMBERS</p>
                  <h1>Members</h1>
                  <p>
                    Register members and associate them with a committee.
                  </p>
                </div>
              </section>

              {error && <div className="error page-error">{error}</div>}

              {canWrite && (
                <section className="information-card">
                  <div>
                    <p className="eyebrow">NEW MEMBER</p>
                    <h3>Add Member</h3>
                  <p className="form-help">
                    Enter the committee, member name, and joining date.
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleCreateMember}
                >
                  <div className="rate-form-grid">
                    <label>
                      Committee
                      <select value={committeeId} disabled>
                        {committees
                          .filter(
                            (committee) =>
                              String(committee.id) === committeeId,
                          )
                          .map((committee) => (
                            <option
                              key={committee.id}
                              value={committee.id}
                            >
                              {committee.name ??
                                committee.committee_name ??
                                `Committee ${committee.id}`}
                            </option>
                          ))}
                      </select>
                    </label>

                    <label>
                      Full name
                      <input
                        value={memberName}
                        onChange={(event) =>
                          setMemberName(event.target.value)
                        }
                        placeholder="e.g. Muhammad Ahmad"
                        required
                      />
                    </label>

                    <label>
                      Joining date
                      <input
                        type="date"
                        value={memberJoinedOn}
                        onChange={(event) =>
                          setMemberJoinedOn(event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Member'}
                  </button>
                </form>
                </section>
              )}

              {createdMember && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">CREATED</p>
                    <h3>
                      {createdMember.name ?? 'Member created'}
                    </h3>

                    <p className="created-id">
                      Committee ID:{' '}
                      {createdMember.committee_id ?? committeeId}
                      {' · '}
                      Joining date:{' '}
                      {createdMember.joined_on ?? memberJoinedOn}
                    </p>

                    {createdMember.id !== undefined && (
                      <p className="created-id">
                        Member ID: {createdMember.id}
                      </p>
                    )}
                  </div>

                  <span className="active-badge">Created</span>
                </section>
              )}

              <section className="information-card">
                <div>
                  <p className="eyebrow">COMMITTEE MEMBERS</p>
                  <h3>
                    {committees.find(
                      (committee) =>
                        String(committee.id) === committeeId,
                    )?.name ??
                      committees.find(
                        (committee) =>
                          String(committee.id) === committeeId,
                      )?.committee_name ??
                      'Selected committee'}
                  </h3>
                  <p className="form-help">
                    Members currently registered in this committee.
                  </p>
                </div>

                {membersLoading ? (
                  <p className="form-help">Loading members...</p>
                ) : members.length === 0 ? (
                  <p className="form-help">
                    No members are currently registered in this committee.
                  </p>
                ) : (
                  <div className="committee-list">
                    {members.map((member) => (
                      <div
                        className="committee-list-item"
                        key={member.id}
                      >
                        <div>
                          <strong>{member.name}</strong>
                          <span>
                            Member ID: {member.id} · Joined:{' '}
                            {member.joined_on}
                          </span>
                        </div>

                        <span
                          className={
                            member.is_active
                              ? 'active-badge'
                              : 'status-badge'
                          }
                        >
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="information-card">
                <div>
                  <p className="eyebrow">FINANCIAL SUMMARY</p>
                  <h3>Member financial position</h3>
                  <p className="form-help">
                    Load the current financial position of a member.
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadMemberFinancialSummary()
                  }}
                >
                  <label>
                    Member
                    <select
                      value={financialMemberId}
                      onChange={(event) => {
                        setFinancialMemberId(event.target.value)
                        setMemberFinancialSummary(null)
                        setMemberStatement([])
                      }}
                      disabled={membersLoading || members.length === 0}
                      required
                    >
                      <option value="">
                        {membersLoading
                          ? 'Loading members...'
                          : members.length === 0
                            ? 'No members available'
                            : 'Select a member'}
                      </option>

                      {members.map((member) => (
                        <option
                          key={member.id}
                          value={member.id}
                        >
                          {member.name} · Member #{member.id}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Load Summary'}
                  </button>
                </form>
              </section>

              {memberFinancialSummary && (
                <>
                  <section className="committee-banner">
                    <div>
                      <p className="eyebrow">MEMBER</p>
                      <h3>{memberFinancialSummary.member_name}</h3>

                      <p className="created-id">
                        Member ID: {memberFinancialSummary.member_id}
                        {' · '}
                        Joining date: {memberFinancialSummary.joined_on}
                      </p>

                      {memberFinancialSummary.left_on && (
                        <p className="created-id">
                          Left on: {memberFinancialSummary.left_on}
                        </p>
                      )}
                    </div>

                    <span
                      className={
                        memberFinancialSummary.is_active
                          ? 'active-badge'
                          : 'inactive-badge'
                      }
                    >
                      {memberFinancialSummary.is_active
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </section>

                  <section className="information-card">
                    <p className="eyebrow">CURRENT POSITION</p>
                    <h3>Financial breakdown</h3>

                    <div className="position-row">
                      <span>Total contributions</span>
                      <strong>
                        {formatPKR(
                          memberFinancialSummary.total_contributions,
                        )}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Contribution balance</span>
                      <strong>
                        {formatPKR(
                          memberFinancialSummary.contribution_balance,
                        )}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Committee asset share</span>
                      <strong>
                        {formatPKR(memberFinancialSummary.asset_share)}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Goods value</span>
                      <strong>
                        {formatPKR(memberFinancialSummary.goods_value)}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Ordinary dues</span>
                      <strong>
                        {formatPKR(
                          memberFinancialSummary.ordinary_dues,
                        )}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Qarz-e-Hasana</span>
                      <strong>
                        {formatPKR(
                          memberFinancialSummary.qarz_e_hasana_dues,
                        )}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Total outstanding dues</span>
                      <strong>
                        {formatPKR(
                          memberFinancialSummary.outstanding_dues,
                        )}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Gross current value</span>
                      <strong>
                        {formatPKR(
                          memberFinancialSummary.current_gross_value,
                        )}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Final current value</span>
                      <strong>
                        {formatPKR(
                          memberFinancialSummary.current_final_value,
                        )}
                      </strong>
                    </div>
                  </section>

                  <section className="information-card">
                    <p className="eyebrow">ACCOUNT HISTORY</p>
                    <h3>Member statement</h3>

                    {memberStatement.length === 0 ? (
                      <p className="form-help">
                        No financial transactions recorded yet.
                      </p>
                    ) : (
                      <div>
                        {memberStatement.map((row, index) => (
                          <div
                            className="position-row"
                            key={`${row.date}-${index}`}
                          >
                            <div>
                              <strong>{row.description}</strong>
                              <small>
                                {row.date}
                                {row.reference
                                  ? ` · ${row.reference}`
                                  : ''}
                              </small>
                            </div>

                            <strong>
                              {formatPKR(row.amount)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {memberFinancialSummary.death_support && (
                    <section className="information-card">
                      <p className="eyebrow">DEATH SUPPORT</p>
                      <h3>Support record</h3>

                      <div className="position-row">
                        <span>Beneficiary</span>
                        <strong>
                          {memberFinancialSummary.death_support
                            .beneficiary_name}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>Amount</span>
                        <strong>
                          {formatPKR(
                            memberFinancialSummary.death_support.amount,
                          )}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>Support date</span>
                        <strong>
                          {memberFinancialSummary.death_support
                            .support_date}
                        </strong>
                      </div>
                    </section>
                  )}

                  {memberFinancialSummary.settlement && (
                    <section className="information-card">
                      <p className="eyebrow">SETTLEMENT</p>
                      <h3>Settlement record</h3>

                      <div className="position-row">
                        <span>Settlement date</span>
                        <strong>
                          {memberFinancialSummary.settlement
                            .settlement_date}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>Gross amount</span>
                        <strong>
                          {formatPKR(
                            memberFinancialSummary.settlement
                              .gross_amount,
                          )}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>Outstanding amounts</span>
                        <strong>
                          {formatPKR(
                            memberFinancialSummary.settlement
                              .outstanding_dues,
                          )}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>Final amount</span>
                        <strong>
                          {formatPKR(
                            memberFinancialSummary.settlement
                              .final_amount,
                          )}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>Status</span>
                        <strong>
                          {memberFinancialSummary.settlement.status}
                        </strong>
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          ) : activePage === 'Contributions' ? (
            <>
              <section className="page-heading">
                <div>
                  <p className="eyebrow">CONTRIBUTIONS</p>
                  <h1>Current contribution amounts</h1>
                  <p>
                    Define the amount members are required to contribute
                    from a specific effective date.
                  </p>
                </div>
              </section>

              {error && <div className="error page-error">{error}</div>}

              {canWrite && (
                <section className="information-card">
                  <div>
                    <p className="eyebrow">RECORD CONTRIBUTION</p>
                    <h3>Record member contribution</h3>
                  <p className="form-help">
                    The applicable contribution rate is selected automatically
                    from the contribution date.
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleCreateContribution}
                >
                  <div className="rate-form-grid">
                    <label>
                      Member
                      <select
                        value={contributionMemberId}
                        onChange={(event) =>
                          setContributionMemberId(event.target.value)
                        }
                        disabled={membersLoading || members.length === 0}
                        required
                      >
                        <option value="">
                          {membersLoading
                            ? 'Loading members...'
                            : members.length === 0
                              ? 'No members available'
                              : 'Select a member'}
                        </option>

                        {members.map((member) => (
                          <option
                            key={member.id}
                            value={member.id}
                          >
                            {member.name} · Member #{member.id}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Payment date
                      <input
                        type="date"
                        value={contributionDate}
                        onChange={(event) =>
                          setContributionDate(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Reference
                      <input
                        value={contributionReference}
                        onChange={(event) =>
                          setContributionReference(event.target.value)
                        }
                        placeholder="e.g. August contribution"
                      />
                    </label>
                  </div>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Recording...' : 'Record Contribution'}
                  </button>
                </form>
                </section>
              )}

              {createdContribution && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">RECORDED</p>
                    <h3>Contribution recorded</h3>

                    <p className="created-id">
                      Member ID: {createdContribution.member_id}
                      {' · '}
                      Date: {createdContribution.contribution_date}
                    </p>

                    {createdContribution.reference && (
                      <p className="created-id">
                        Reference: {createdContribution.reference}
                      </p>
                    )}

                    {createdContribution.journal_entry_id !== undefined && (
                      <p className="created-id">
                        Journal entry ID:{' '}
                        {createdContribution.journal_entry_id}
                      </p>
                    )}
                  </div>

                  <span className="active-badge">Recorded</span>
                </section>
              )}

              {canWrite && (
                <section className="information-card contribution-rate-card">
                  <div>
                    <p className="eyebrow">NEW RATE</p>
                    <h3>Create contribution rate</h3>
                  <p className="form-help">
                    Set the contribution amount and the date from which
                    this rate becomes effective.
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleCreateContributionRate}
                >
                  <div className="rate-form-grid">
                    <label>
                      Contribution amount
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={contributionAmount}
                        onChange={(event) =>
                          setContributionAmount(event.target.value)
                        }
                        placeholder="e.g. 500"
                        required
                      />
                    </label>

                    <label>
                      Effective from
                      <input
                        type="date"
                        value={effectiveFrom}
                        onChange={(event) =>
                          setEffectiveFrom(event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>

                  <button type="submit" disabled={loading}>
                    {loading
                      ? 'Creating...'
                      : 'Create Current contribution amount'}
                  </button>
                </form>
                </section>
              )}

              {createdContributionRate && (
                <section className="committee-banner contribution-rate-result">
                  <div>
                    <p className="eyebrow">CREATED</p>
                    <h3>
                      {createdContributionRate.amount !== undefined
                        ? `Rs. ${createdContributionRate.amount.toLocaleString(
                            'en-PK',
                          )}`
                        : 'Current contribution amount created'}
                    </h3>

                    <p className="created-id">
                      Committee ID:{' '}
                      {createdContributionRate.committee_id ??
                        committeeId}
                      {' · '}
                      Effective from:{' '}
                      {createdContributionRate.effective_from ??
                        effectiveFrom}
                    </p>

                    {createdContributionRate.id !== undefined && (
                      <p className="created-id">
                        Rate ID: {createdContributionRate.id}
                      </p>
                    )}
                  </div>

                  <span className="active-badge">Created</span>
                </section>
              )}
            </>
          ) : activePage === 'Death Support' ? (
            <section className="death-support-module">
              <section className="page-heading">
                <div>
                  <p className="eyebrow">DEATH SUPPORT</p>
                  <h1>Death Support</h1>
                  <p>
                    Record death-support payments for members and preserve
                    the member-funded and Qarz-e-Hasana portions separately.
                  </p>
                </div>
              </section>

              {error && <div className="error page-error">{error}</div>}

              {canWrite && (
                <section className="information-card death-support-record-card">
                  <div>
                    <p className="eyebrow">RECORD SUPPORT</p>
                    <h3>Record Death Support</h3>
                  <p className="form-help">
                    Select the affected member, enter the beneficiary and
                    support amount, and record the payment date.
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleCreateDeathSupport}
                >
                  <div className="rate-form-grid">
                    <label>
                      Member
                      <select
                        value={deathSupportMemberId}
                        onChange={(event) =>
                          setDeathSupportMemberId(event.target.value)
                        }
                        required
                      >
                        <option value="">Select a member</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} · ID {member.id}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Beneficiary name
                      <input
                        value={deathSupportBeneficiaryName}
                        onChange={(event) =>
                          setDeathSupportBeneficiaryName(event.target.value)
                        }
                        placeholder="e.g. Muhammad Ali"
                        required
                      />
                    </label>

                    <label>
                      Support amount
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={deathSupportAmount}
                        onChange={(event) =>
                          setDeathSupportAmount(event.target.value)
                        }
                        placeholder="e.g. 50000"
                        required
                      />
                    </label>

                    <label>
                      Support date
                      <input
                        type="date"
                        value={deathSupportDate}
                        onChange={(event) =>
                          setDeathSupportDate(event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>

                  <label>
                    Reference
                    <input
                      value={deathSupportReference}
                      onChange={(event) =>
                        setDeathSupportReference(event.target.value)
                      }
                      placeholder="Optional reference"
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Recording...' : 'Record Death Support'}
                  </button>
                </form>
                </section>
              )}

              {createdDeathSupport && (
                <section className="committee-banner contribution-rate-result">
                  <div>
                    <p className="eyebrow">RECORDED</p>
                    <h3>
                      {createdDeathSupport.amount !== undefined
                        ? `Rs. ${createdDeathSupport.amount.toLocaleString(
                            'en-PK',
                          )}`
                        : 'Death support recorded'}
                    </h3>

                    <p className="created-id">
                      Member ID:{' '}
                      {createdDeathSupport.member_id ??
                        deathSupportMemberId}
                      {' · '}
                      Beneficiary:{' '}
                      {createdDeathSupport.beneficiary_name ??
                        deathSupportBeneficiaryName}
                    </p>

                    <p className="created-id">
                      Member funded:{' '}
                      {formatPKR(
                        createdDeathSupport.member_funded_amount ?? 0,
                      )}
                      {' · '}
                      Qarz-e-Hasana:{' '}
                      {formatPKR(
                        createdDeathSupport.qarz_e_hasana_amount ?? 0,
                      )}
                    </p>

                    <p className="created-id">
                      Support date:{' '}
                      {createdDeathSupport.support_date ??
                        deathSupportDate}
                    </p>

                    {createdDeathSupport.reference && (
                      <p className="created-id">
                        Reference: {createdDeathSupport.reference}
                      </p>
                    )}
                  </div>

                  <span className="active-badge">Recorded</span>
                </section>
              )}

              <section className="information-card death-support-status-card">
                <div>
                  <p className="eyebrow">SUPPORT STATUS</p>
                  <h3>Check member support status</h3>
                  <p className="form-help">
                    Review whether death support has already been recorded
                    for a member in this committee.
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadDeathSupportStatus()
                  }}
                >
                  <label>
                    Member
                    <select
                      value={deathSupportStatusMemberId}
                      onChange={(event) => {
                        setDeathSupportStatusMemberId(event.target.value)
                        setDeathSupportStatus(null)
                      }}
                      required
                    >
                      <option value="">Select a member</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} · ID {member.id}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Checking...' : 'Check Support Status'}
                  </button>
                </form>
              </section>

              {deathSupportStatus && (
                <section className="committee-banner contribution-rate-result">
                  <div>
                    <p className="eyebrow">STATUS</p>
                    <h3>
                      {deathSupportStatus.death_support_recorded
                        ? 'Death support recorded'
                        : 'No death support recorded'}
                    </h3>

                    <p className="created-id">
                      Member ID: {deathSupportStatus.member_id}
                    </p>

                    {deathSupportStatus.death_support_recorded && (
                      <>
                        <p className="created-id">
                          Support ID: {deathSupportStatus.support_id ?? '—'}
                          {' · '}
                          Amount: {formatPKR(deathSupportStatus.amount)}
                        </p>

                        <p className="created-id">
                          Support date:{' '}
                          {deathSupportStatus.support_date ?? '—'}
                        </p>
                      </>
                    )}
                  </div>

                  <span className="active-badge">
                    {deathSupportStatus.death_support_recorded
                      ? 'Recorded'
                      : 'Not Recorded'}
                  </span>
                </section>
              )}
            </section>
          ) : activePage === 'Users' ? (
              <section className="module-page">
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">ACCESS MANAGEMENT</p>
                    <h1>Users</h1>
                    <p className="page-subtitle">
                      Manage platform accounts, committee access, and account security from one place.
                    </p>
                  </div>
                  <div className="page-heading-meta">
                    <span className="active-badge">
                      {users.length} {users.length === 1 ? 'User' : 'Users'}
                    </span>
                  </div>
                </div>

                {error && <div className="error page-error">{error}</div>}

                {passwordChangeMessage && (
                  <div className="success page-error">
                    {passwordChangeMessage}
                  </div>
                )}

                <section className="information-card users-access-panel">
                  <div className="section-heading-row">
                    <div>
                      <p className="eyebrow">ACCOUNT SECURITY</p>
                      <h3>Change your password</h3>
                      <p className="form-help">
                        Update the password for the currently signed-in administrator account.
                      </p>
                    </div>
                  </div>

                  <form
                    className="committee-create-form"
                    onSubmit={
                      canWrite
                        ? handleChangePassword
                        : (event) => event.preventDefault()
                    }
                  >
                    <div className="rate-form-grid">
                      <label>
                        Current password
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(event) =>
                            setCurrentPassword(event.target.value)
                          }
                          autoComplete="current-password"
                          required
                        />
                      </label>

                      <label>
                        New password
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(event) =>
                            setNewPassword(event.target.value)
                          }
                          autoComplete="new-password"
                          required
                        />
                      </label>

                      <label>
                        Confirm new password
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(event) =>
                            setConfirmNewPassword(event.target.value)
                          }
                          autoComplete="new-password"
                          required
                        />
                      </label>
                    </div>

                    <button type="submit" disabled={loading}>
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                </section>

                <section className="information-card users-access-panel">
                  <div className="section-heading-row">
                    <div>
                      <p className="eyebrow">ADD USER</p>
                      <h3>Create a user account</h3>
                      <p className="form-help">
                        Create the login account first. Committee membership and administrator access can then be assigned separately.
                      </p>
                    </div>
                  </div>

                  <form
                    className="committee-create-form"
                    onSubmit={
                      canWrite
                        ? handleCreateUser
                        : (event) => event.preventDefault()
                    }
                  >
                    <div className="rate-form-grid">
                      <label>
                        Username
                        <input
                          type="text"
                          value={userUsername}
                          onChange={(event) =>
                            setUserUsername(event.target.value)
                          }
                          placeholder="e.g. committee-admin"
                          required
                        />
                      </label>

                      <label>
                        Password
                        <input
                          type="password"
                          value={userPassword}
                          onChange={(event) =>
                            setUserPassword(event.target.value)
                          }
                          placeholder="Enter a secure password"
                          required
                        />
                      </label>

                      <label>
                        Platform role
                        <select
                          value={userCreateRole}
                          onChange={(event) =>
                            setUserCreateRole(event.target.value)
                          }
                        >
                          <option value="member">Committee Member</option>
                          <option value="committee_admin">
                            Committee Admin
                          </option>
                          <option value="super_admin">
                            Super Admin
                          </option>
                        </select>
                      </label>
                    </div>

                    <button type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Create User'}
                    </button>
                  </form>
                </section>

                {issuedResetToken && (
                  <section className="committee-banner">
                    <div>
                      <p className="eyebrow">PASSWORD RECOVERY</p>
                      <h3>Recovery token issued</h3>
                      <p className="created-id">
                        Provide this token securely to the user. It expires in{' '}
                        {issuedResetExpiry ?? 15} minutes.
                      </p>

                      <div className="recovery-token-display">
                        <code>{issuedResetToken}</code>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="management-action management-action-secondary"
                      onClick={() =>
                        void navigator.clipboard?.writeText(
                          issuedResetToken,
                        )
                      }
                    >
                      Copy Token
                    </button>
                  </section>
                )}

                {createdUser && (
                  <section className="committee-banner">
                    <div>
                      <p className="eyebrow">USER UPDATED</p>
                      <h3>{createdUser.username ?? 'User account'}</h3>
                      <p className="created-id">
                        User ID: {createdUser.id ?? '—'}
                        {' · '}
                        Role: {createdUser.role ?? '—'}
                      </p>
                    </div>

                    <span className="active-badge">
                      {createdUser.is_active === false
                        ? 'Inactive'
                        : 'Active'}
                    </span>
                  </section>
                )}

                <section className="information-card users-access-panel">
                  <div className="section-heading-row">
                    <div>
                      <p className="eyebrow">COMMITTEE ACCESS</p>
                      <h3>Assign a user to a committee</h3>
                      <p className="form-help">
                        Choose the application user, committee, and committee-level role.
                      </p>
                    </div>
                  </div>

                  <form
                    className="users-access-form"
                    onSubmit={handleAssignUserToCommittee}
                  >
                    <div className="users-access-step">
                      <div className="users-access-step-number">1</div>

                      <div className="users-access-step-content">
                        <div className="users-access-step-title">
                          Select user
                        </div>

                        <div className="users-access-step-help">
                          Select the account that should receive committee access.
                        </div>

                        <select
                          className="users-access-select"
                          value={assignmentUserId}
                          onChange={(event) =>
                            setAssignmentUserId(event.target.value)
                          }
                          required
                        >
                          <option value="">Select a user</option>

                          {users
                            .filter((user) => user.role !== 'super_admin')
                            .map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.username} · {user.role}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="users-access-step">
                      <div className="users-access-step-number">2</div>

                      <div className="users-access-step-content">
                        <div className="users-access-step-title">
                          Select committee
                        </div>

                        <div className="users-access-step-help">
                          Access is isolated per committee.
                        </div>

                        <select
                          className="users-access-select"
                          value={assignmentCommitteeId}
                          onChange={(event) =>
                            setAssignmentCommitteeId(event.target.value)
                          }
                          required
                        >
                          <option value="">Select a committee</option>

                          {committees.map((committee) => (
                            <option
                              key={committee.id}
                              value={committee.id}
                            >
                              {committee.name ??
                                committee.committee_name ??
                                `Committee #${committee.id}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="users-access-step">
                      <div className="users-access-step-number">3</div>

                      <div className="users-access-step-content">
                        <div className="users-access-step-title">
                          Choose committee role
                        </div>

                        <div className="users-access-step-help">
                          Administrator access applies only to the selected committee.
                        </div>

                        <div className="access-level-options">
                          <label
                            className={`access-level-card ${
                              !assignmentIsAdmin ? 'selected' : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="assignment-role"
                              checked={!assignmentIsAdmin}
                              onChange={() =>
                                setAssignmentIsAdmin(false)
                              }
                            />

                            <span>
                              <strong>Committee Member</strong>
                              <small>
                                Member-level permissions
                              </small>
                            </span>
                          </label>

                          <label
                            className={`access-level-card ${
                              assignmentIsAdmin ? 'selected' : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="assignment-role"
                              checked={assignmentIsAdmin}
                              onChange={() =>
                                setAssignmentIsAdmin(true)
                              }
                            />

                            <span>
                              <strong>
                                Committee Administrator
                              </strong>
                              <small>
                                Manage the assigned committee
                              </small>
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="users-access-confirmation">
                      <div>
                        <span className="users-access-confirmation-label">
                          ASSIGNMENT
                        </span>

                        <strong>
                          {assignmentUserId
                            ? users.find(
                                (user) =>
                                  Number(user.id) ===
                                  Number(assignmentUserId),
                              )?.username ?? 'Selected user'
                            : 'No user selected'}
                        </strong>

                        <span>
                          {assignmentCommitteeId
                            ? committees.find(
                                (committee) =>
                                  Number(committee.id) ===
                                  Number(assignmentCommitteeId),
                              )?.name ?? 'Selected committee'
                            : 'No committee selected'}
                          {' · '}
                          {assignmentIsAdmin
                            ? 'Committee Administrator'
                            : 'Committee Member'}
                        </span>
                      </div>

                      <button
                        type="submit"
                        className="users-access-grant-button"
                        disabled={
                          loading ||
                          !assignmentUserId ||
                          !assignmentCommitteeId
                        }
                      >
                        {loading
                          ? 'Assigning...'
                          : 'Assign to Committee'}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="information-card users-accounts-panel">
                  <div className="section-heading-row users-accounts-heading">
                    <div>
                      <p className="eyebrow">USER ACCOUNTS</p>
                      <h3>Accounts & committee access</h3>
                      <p className="form-help">
                        Review account status, recovery controls, and committee assignments.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="management-action management-action-secondary"
                      disabled={usersLoading}
                      onClick={() => void handleLoadUsers()}
                    >
                      {usersLoading
                        ? 'Loading...'
                        : 'Refresh User List'}
                    </button>
                  </div>

                  {users.length > 0 ? (
                    <div className="users-table">
                      {users.map((user) => {
                        const isSuperAdmin =
                          user.role === 'super_admin'

                        const isCurrentAccessUser =
                          selectedAccessUserId === Number(user.id)

                        const accessActive =
                          isCurrentAccessUser &&
                          committeeAccessStatus.is_active === true

                        const accessInactive =
                          isCurrentAccessUser &&
                          committeeAccessStatus.is_active === false

                        const assignments =
                          userCommitteeAssignments[String(user.id)]

                        const roleLabel = isSuperAdmin
                          ? 'Super Administrator'
                          : user.role === 'committee_admin'
                            ? 'Committee Administrator'
                            : 'Committee Member'

                        const roleClass = isSuperAdmin
                          ? 'system'
                          : user.role === 'committee_admin'
                            ? 'administrator'
                            : 'member'

                        const initial = (
                          user.username ?? 'U'
                        )
                          .slice(0, 1)
                          .toUpperCase()

                        return (
                          <article
                            className="user-account-card"
                            key={user.id}
                          >
                            <div className="user-account-main">
                              <div className="user-avatar">
                                {initial}
                              </div>

                              <div className="user-account-identity">
                                <div className="user-account-name-row">
                                  <strong>
                                    {user.username ??
                                      'Unknown user'}
                                  </strong>

                                  <span
                                    className={`user-role-badge ${roleClass}`}
                                  >
                                    {roleLabel}
                                  </span>

                                  <span
                                    className={`assignment-status ${
                                      user.is_active === false
                                        ? 'revoked'
                                        : 'active'
                                    }`}
                                  >
                                    {user.is_active === false
                                      ? 'Inactive'
                                      : 'Active'}
                                  </span>
                                </div>

                                <small>
                                  User ID: {user.id ?? '—'}
                                </small>
                              </div>

                              <div className="user-account-actions">
                                {user.is_active !== false && (
                                  <>
                                    <button
                                      type="button"
                                      className="management-action management-action-secondary"
                                      disabled={loading}
                                      onClick={
                                        canWrite
                                          ? () =>
                                              void handleIssuePasswordReset(
                                                Number(user.id),
                                              )
                                          : undefined
                                      }
                                    >
                                      Issue Recovery Token
                                    </button>

                                    <button
                                      type="button"
                                      className="management-action management-action-danger"
                                      disabled={usersLoading}
                                      onClick={
                                        canWrite
                                          ? () =>
                                              void handleDeactivateUser(
                                                Number(user.id),
                                              )
                                          : undefined
                                      }
                                    >
                                      Deactivate
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="user-account-access">
                              <div className="user-account-access-header">
                                <div>
                                  <p className="eyebrow">
                                    COMMITTEE ACCESS
                                  </p>

                                  <strong>
                                    {isSuperAdmin
                                      ? 'Global platform authority'
                                      : 'Assigned committees'}
                                  </strong>
                                </div>

                                {!isSuperAdmin && (
                                  <button
                                    type="button"
                                    className="management-action management-action-secondary"
                                    disabled={
                                      assignmentOverviewLoading ===
                                      Number(user.id)
                                    }
                                    onClick={() =>
                                      void handleLoadUserCommitteeAssignments(
                                        Number(user.id),
                                      )
                                    }
                                  >
                                    {assignmentOverviewLoading ===
                                    Number(user.id)
                                      ? 'Loading...'
                                      : 'View Access'}
                                  </button>
                                )}
                              </div>

                              {isSuperAdmin ? (
                                <div className="user-access-global-note">
                                  <strong>
                                    System administrator
                                  </strong>
                                  <span>
                                    No ordinary committee assignment is required.
                                  </span>
                                </div>
                              ) : assignments ? (
                                assignments.length > 0 ? (
                                  <div className="user-assignment-list">
                                    {assignments.map(
                                      (assignment) => (
                                        <div
                                          className="user-assignment-row"
                                          key={assignment.id}
                                        >
                                          <div>
                                            <strong>
                                              {
                                                assignment.committee_name
                                              }
                                            </strong>

                                            <span>
                                              {assignment.is_admin
                                                ? 'Committee Administrator'
                                                : 'Committee Member'}
                                            </span>
                                          </div>

                                          <span
                                            className={`assignment-status ${
                                              assignment.is_active
                                                ? 'active'
                                                : 'revoked'
                                            }`}
                                          >
                                            {assignment.is_active
                                              ? 'Active'
                                              : 'Revoked'}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                ) : (
                                  <div className="user-access-empty">
                                    <strong>
                                      No committee assignments
                                    </strong>
                                    <span>
                                      This account has not been assigned to a committee yet.
                                    </span>
                                  </div>
                                )
                              ) : (
                                <div className="user-access-empty">
                                  <strong>
                                    Access not loaded
                                  </strong>
                                  <span>
                                    Select View Access to load this user's committee assignments.
                                  </span>
                                </div>
                              )}

                              {!isSuperAdmin && (
                                <div className="user-account-current-access">
                                  <span>
                                    Current selected committee:{' '}
                                    {committees.find(
                                      (committee) =>
                                        Number(committee.id) ===
                                        Number(committeeId),
                                    )?.name ??
                                      'No committee selected'}
                                    {' · '}
                                    {accessActive
                                      ? 'Access active'
                                      : accessInactive
                                        ? 'Access inactive'
                                        : 'Not checked'}
                                  </span>

                                  <div>
                                    <button
                                      type="button"
                                      className="management-action management-action-secondary"
                                      disabled={
                                        committeeAccessLoading &&
                                        isCurrentAccessUser
                                      }
                                      onClick={() =>
                                        void handleLoadCommitteeAccess(
                                          Number(user.id),
                                        )
                                      }
                                    >
                                      {committeeAccessLoading &&
                                      isCurrentAccessUser
                                        ? 'Checking...'
                                        : 'Check Access'}
                                    </button>

                                    <button
                                      type="button"
                                      className="management-action management-action-primary"
                                      disabled={
                                        committeeAccessLoading ||
                                        user.is_active === false
                                      }
                                      onClick={
                                        canWrite
                                          ? () =>
                                              void handleGrantCommitteeAccess(
                                                Number(user.id),
                                              )
                                          : undefined
                                      }
                                    >
                                      Grant Access
                                    </button>

                                    {accessActive && (
                                      <button
                                        type="button"
                                        className="management-action management-action-danger"
                                        disabled={
                                          committeeAccessLoading
                                        }
                                        onClick={
                                          canWrite
                                            ? () =>
                                                void handleDeactivateCommitteeAccess(
                                                  Number(user.id),
                                                )
                                            : undefined
                                        }
                                      >
                                        Revoke Access
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="user-access-empty">
                      <strong>No users loaded</strong>
                      <span>
                        Select Refresh User List to retrieve the current accounts.
                      </span>
                    </div>
                  )}
                </section>
              </section>
) : activePage === 'Assets' ? (
            <section className="assets-module">
              <section className="page-heading">
                <div>
                  <p className="eyebrow">ASSETS</p>
                  <h1>Committee Assets</h1>
                  <p>
                    Register committee-owned assets and track their current
                    valuations.
                  </p>
                </div>
              </section>

              {error && <div className="error page-error">{error}</div>}

              {canWrite && (
              <section className="information-card asset-create-card">
                <div>
                  <p className="eyebrow">NEW ASSET</p>
                  <h3>Create committee asset</h3>
                  <p className="form-help">
                    Enter the committee, asset details, purchase date, and
                    purchase value.
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleCreateCommitteeAsset}
                >
                  <div className="rate-form-grid">
                    <label>
                      Asset name
                      <input
                        value={assetName}
                        onChange={(event) =>
                          setAssetName(event.target.value)
                        }
                        placeholder="e.g. Committee Refrigerator"
                        required
                      />
                    </label>

                    <label>
                      Purchase date
                      <input
                        type="date"
                        value={assetPurchaseDate}
                        onChange={(event) =>
                          setAssetPurchaseDate(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Purchase value
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={assetPurchaseValue}
                        onChange={(event) =>
                          setAssetPurchaseValue(event.target.value)
                        }
                        placeholder="e.g. 50000"
                        required
                      />
                    </label>
                  </div>

                  <label>
                    Description
                    <input
                      value={assetDescription}
                      onChange={(event) =>
                        setAssetDescription(event.target.value)
                      }
                      placeholder="Optional description"
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Asset'}
                  </button>
                </form>
              </section>              )}


              {createdCommitteeAsset && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">CREATED</p>
                    <h3>
                      {createdCommitteeAsset.name ?? 'Asset created'}
                    </h3>

                    <p className="created-id">
                      Asset ID: {createdCommitteeAsset.id}
                      {' · '}
                      Committee ID:{' '}
                      {createdCommitteeAsset.committee_id ??
                        committeeId}
                    </p>

                    <p className="created-id">
                      Purchase date:{' '}
                      {createdCommitteeAsset.purchase_date ??
                        assetPurchaseDate}
                      {' · '}
                      Purchase value:{' '}
                      {formatPKR(
                        createdCommitteeAsset.purchase_value ??
                          Number(assetPurchaseValue),
                      )}
                    </p>
                  </div>

                  <span className="active-badge">Created</span>
                </section>
              )}

              {canWrite && (
              <section className="information-card asset-valuation-card">
                <div>
                  <p className="eyebrow">CURRENT VALUE</p>
                  <h3>Update asset valuation</h3>
                  <p className="form-help">
                    Record a new valuation. Previous valuations remain
                    available as historical records.
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleUpdateCommitteeAssetValue}
                >
                  <div className="rate-form-grid">
                    <label>
                      Asset ID
                      <input
                        type="number"
                        min="1"
                        value={assetValueAssetId}
                        onChange={(event) =>
                          setAssetValueAssetId(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Valuation date
                      <input
                        type="date"
                        value={assetValuationDate}
                        onChange={(event) =>
                          setAssetValuationDate(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      New value
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={assetNewValue}
                        onChange={(event) =>
                          setAssetNewValue(event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Value'}
                  </button>
                </form>
              </section>              )}


              {updatedCommitteeAssetValue && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">VALUATION UPDATED</p>
                    <h3>Current asset value updated</h3>

                    <p className="created-id">
                      Asset ID:{' '}
                      {updatedCommitteeAssetValue.asset_id ??
                        assetValueAssetId}
                      {' · '}
                      Valuation date:{' '}
                      {updatedCommitteeAssetValue.valuation_date ??
                        assetValuationDate}
                    </p>

                    <p className="created-id">
                      Current value:{' '}
                      {formatPKR(
                        updatedCommitteeAssetValue.value ??
                          updatedCommitteeAssetValue.new_value ??
                          Number(assetNewValue),
                      )}
                    </p>
                  </div>

                  <span className="active-badge">Updated</span>
                </section>
              )}

              <section className="information-card asset-history-card">
                <div>
                  <p className="eyebrow">ASSET HISTORY</p>
                  <h3>View asset valuations</h3>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadAssetValuations()
                  }}
                >
                  <label>
                    Asset ID
                    <input
                      type="number"
                      min="1"
                      value={valuationAssetId}
                      onChange={(event) =>
                        setValuationAssetId(event.target.value)
                      }
                      required
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Load Valuations'}
                  </button>
                </form>
              </section>

              {assetValuations.length > 0 && (
                <section className="information-card">
                  <p className="eyebrow">VALUATIONS</p>
                  <h3>Valuation history</h3>

                  {assetValuations.map((valuation) => (
                    <div
                      className="position-row"
                      key={valuation.id}
                    >
                      <div>
                        <strong>
                          {valuation.valuation_date}
                        </strong>
                        <small>
                          Valuation ID: {valuation.id}
                        </small>
                      </div>

                      <strong>
                        {formatPKR(valuation.value)}
                      </strong>
                    </div>
                  ))}
                </section>
              )}

              <section className="information-card asset-participation-card">
                <div>
                  <p className="eyebrow">PARTICIPATION</p>
                  <h3>View asset participation</h3>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadAssetParticipation()
                  }}
                >
                  <label>
                    Asset ID
                    <input
                      type="number"
                      min="1"
                      value={participationAssetId}
                      onChange={(event) =>
                        setParticipationAssetId(event.target.value)
                      }
                      required
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Load Participation'}
                  </button>
                </form>
              </section>

              {assetParticipation.length > 0 && (
                <section className="information-card">
                  <p className="eyebrow">OWNERSHIP</p>
                  <h3>Member participation</h3>

                  {assetParticipation.map((row) => (
                    <div
                      className="position-row"
                      key={row.id}
                    >
                      <div>
                        <strong>
                          Member ID: {row.member_id}
                        </strong>
                        <small>
                          Ownership units: {row.ownership_units}
                          {' · '}
                          Total units: {row.total_units}
                        </small>
                      </div>

                      <strong>
                        {row.total_units
                          ? `${(
                              (row.ownership_units /
                                row.total_units) *
                              100
                            ).toFixed(2)}%`
                          : '0%'}
                      </strong>
                    </div>
                  ))}
                </section>
              )}
            </section>

          ) : activePage === 'Goods' ? (
            <section className="module-content">

              <div className="page-heading">
                <div>
                  <p className="eyebrow">MEMBER GOODS</p>
                  <h1>Member Goods</h1>
                  <p>
                    Record goods purchased using a member's accumulated
                    committee value and track their current refundable value.
                  </p>
                </div>
              </div>

              {canWrite && (
              <section className="information-card goods-create-card">
                <div>
                  <p className="eyebrow">NEW GOOD</p>
                  <h3>Add Member good</h3>
                  <p className="form-help">
                    Record a good against a member account.
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleCreateMemberGood}
                >
                  <div className="rate-form-grid">
                    <label>
                      Member ID
                      <input
                        type="number"
                        min="1"
                        value={goodsMemberId}
                        onChange={(event) =>
                          setGoodsMemberId(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Good name
                      <input
                        type="text"
                        value={goodName}
                        onChange={(event) =>
                          setGoodName(event.target.value)
                        }
                        placeholder="e.g. Refrigerator"
                        required
                      />
                    </label>

                    <label>
                      Purchase date
                      <input
                        type="date"
                        value={goodPurchaseDate}
                        onChange={(event) =>
                          setGoodPurchaseDate(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Purchase price
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={goodPurchasePrice}
                        onChange={(event) =>
                          setGoodPurchasePrice(event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>

                  <label>
                    Description
                    <textarea
                      value={goodDescription}
                      onChange={(event) =>
                        setGoodDescription(event.target.value)
                      }
                      placeholder="Optional description"
                      rows={3}
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Recording...' : 'Record Good'}
                  </button>
                </form>
              </section>              )}


              {createdMemberGood && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">RECORDED</p>
                    <h3>
                      {createdMemberGood.name ?? 'Member good created'}
                    </h3>

                    <p className="created-id">
                      Good ID: {createdMemberGood.id}
                      {' · '}
                      Member ID: {createdMemberGood.member_id ??
                        goodsMemberId}
                    </p>

                    <p className="created-id">
                      Purchase price:{' '}
                      {formatPKR(
                        createdMemberGood.purchase_price ??
                          Number(goodPurchasePrice),
                      )}
                    </p>
                  </div>

                  <span className="active-badge">Recorded</span>
                </section>
              )}

              <section className="information-card goods-list-card">
                <div>
                  <p className="eyebrow">GOODS</p>
                  <h3>View member goods</h3>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadMemberGoods()
                  }}
                >
                  <label>
                    Member ID
                    <input
                      type="number"
                      min="1"
                      value={goodsListMemberId}
                      onChange={(event) =>
                        setGoodsListMemberId(event.target.value)
                      }
                      required
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Load Goods'}
                  </button>
                </form>
              </section>

              {memberGoods.length > 0 && (
                <section className="information-card">
                  <p className="eyebrow">MEMBER GOODS</p>
                  <h3>Recorded goods</h3>

                  {memberGoods.map((good) => (
                    <div
                      className="position-row"
                      key={good.id}
                    >
                      <div>
                        <strong>
                          {good.name ?? 'Unnamed good'}
                        </strong>
                        <small>
                          Good ID: {good.id}
                          {' · '}
                          Purchase date: {good.purchase_date}
                        </small>
                      </div>

                      <strong>
                        {formatPKR(
                          good.current_value ??
                            good.value ??
                            good.purchase_price ??
                            0,
                        )}
                      </strong>
                    </div>
                  ))}
                </section>
              )}

              <section className="information-card goods-total-card">
                <div>
                  <p className="eyebrow">TOTAL VALUE</p>
                  <h3>Member goods total</h3>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadMemberGoodsTotal()
                  }}
                >
                  <label>
                    Member ID
                    <input
                      type="number"
                      min="1"
                      value={goodsTotalMemberId}
                      onChange={(event) =>
                        setGoodsTotalMemberId(event.target.value)
                      }
                      required
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Load Total'}
                  </button>
                </form>
              </section>

              {memberGoodsTotal && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">TOTAL</p>
                    <h3>
                      {formatPKR(
                        memberGoodsTotal.total_value ??
                          memberGoodsTotal.total ??
                          memberGoodsTotal.value ??
                          0,
                      )}
                    </h3>

                    <p className="created-id">
                      Member ID:{' '}
                      {memberGoodsTotal.member_id ??
                        goodsTotalMemberId}
                    </p>
                  </div>

                  <span className="active-badge">Calculated</span>
                </section>
              )}

              {canWrite && (
              <section className="information-card goods-valuation-card">
                <div>
                  <p className="eyebrow">CURRENT VALUE</p>
                  <h3>Update good valuation</h3>
                  <p className="form-help">
                    Record a new value while preserving the valuation history.
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleUpdateMemberGoodValue}
                >
                  <div className="rate-form-grid">
                    <label>
                      Good ID
                      <input
                        type="number"
                        min="1"
                        value={goodValueId}
                        onChange={(event) =>
                          setGoodValueId(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Valuation date
                      <input
                        type="date"
                        value={goodValuationDate}
                        onChange={(event) =>
                          setGoodValuationDate(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      New value
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={goodNewValue}
                        onChange={(event) =>
                          setGoodNewValue(event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Good Value'}
                  </button>
                </form>
              </section>              )}


              {updatedMemberGoodValue && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">VALUATION UPDATED</p>
                    <h3>Good value updated</h3>

                    <p className="created-id">
                      Good ID:{' '}
                      {updatedMemberGoodValue.good_id ??
                        updatedMemberGoodValue.id ??
                        goodValueId}
                      {' · '}
                      Valuation date:{' '}
                      {updatedMemberGoodValue.valuation_date ??
                        goodValuationDate}
                    </p>

                    <p className="created-id">
                      Current value:{' '}
                      {formatPKR(
                        updatedMemberGoodValue.value ??
                          updatedMemberGoodValue.new_value ??
                          Number(goodNewValue),
                      )}
                    </p>
                  </div>

                  <span className="active-badge">Updated</span>
                </section>
              )}

            </section>
          ) : activePage === 'Dues' ? (
            <section className="module-page dues-module">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">FINANCIAL MANAGEMENT</p>
                  <h1>Outstanding Dues</h1>
                  <p className="page-subtitle">
                    Record member obligations, review outstanding balances,
                    and apply payments with a clear financial trail.
                  </p>
                </div>

                <div className="page-heading-meta">
                  <span className="active-badge">
                    {members.length} {members.length === 1 ? 'Member' : 'Members'}
                  </span>
                </div>
              </div>

              {error && <div className="error page-error">{error}</div>}

              {canWrite && (
                <section className="information-card dues-create-card">
                  <div className="section-heading-row">
                    <div>
                      <p className="eyebrow">RECORD OBLIGATION</p>
                      <h3>Create a member due</h3>
                      <p className="form-help">
                        Record an amount owed by a committee member with its
                        due date and supporting reference.
                      </p>
                    </div>
                    <span className="active-badge">New Due</span>
                  </div>

                  <form
                    className="committee-create-form"
                    onSubmit={handleCreateMemberDue}
                  >
                    <div className="rate-form-grid">
                      <label>
                        Member
                        <select
                          value={dueMemberId}
                          onChange={(event) =>
                            setDueMemberId(event.target.value)
                          }
                          required
                        >
                          <option value="">
                            {membersLoading
                              ? 'Loading members...'
                              : members.length === 0
                                ? 'No members available'
                                : 'Select a member'}
                          </option>

                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} · ID {member.id}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Amount
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={dueAmount}
                          onChange={(event) =>
                            setDueAmount(event.target.value)
                          }
                          placeholder="e.g. 5000"
                          required
                        />
                      </label>

                      <label>
                        Due date
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(event) =>
                            setDueDate(event.target.value)
                          }
                          required
                        />
                      </label>

                      <label>
                        Reference
                        <input
                          type="text"
                          value={dueReference}
                          onChange={(event) =>
                            setDueReference(event.target.value)
                          }
                          placeholder="Optional reference"
                        />
                      </label>
                    </div>

                    <label>
                      Description
                      <textarea
                        value={dueDescription}
                        onChange={(event) =>
                          setDueDescription(event.target.value)
                        }
                        placeholder="Reason or description for this due"
                        rows={3}
                        required
                      />
                    </label>

                    <div className="form-actions">
                      <button type="submit" disabled={loading}>
                        {loading ? 'Recording...' : 'Record Due'}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {createdMemberDue && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">DUE RECORDED</p>
                    <h3>Member due recorded successfully</h3>
                    <p className="created-id">
                      Due ID: {createdMemberDue.id}
                      {' · '}
                      Member ID: {createdMemberDue.member_id ?? dueMemberId}
                    </p>
                    <p className="created-id">
                      Amount:{' '}
                      {formatPKR(
                        createdMemberDue.amount ?? Number(dueAmount),
                      )}
                      {' · '}
                      Outstanding:{' '}
                      {formatPKR(
                        createdMemberDue.outstanding_amount ??
                          createdMemberDue.amount ??
                          Number(dueAmount),
                      )}
                    </p>
                  </div>

                  <span className="active-badge">Recorded</span>
                </section>
              )}

              <section className="information-card dues-lookup-card">
                <div className="section-heading-row">
                  <div>
                    <p className="eyebrow">DUE HISTORY</p>
                    <h3>Review member dues</h3>
                    <p className="form-help">
                      Select a member to inspect their recorded dues and
                      payment status.
                    </p>
                  </div>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadMemberDues()
                  }}
                >
                  <div className="rate-form-grid">
                    <label>
                      Member
                      <select
                        value={duesListMemberId}
                        onChange={(event) =>
                          setDuesListMemberId(event.target.value)
                        }
                        required
                      >
                        <option value="">Select a member</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} · ID {member.id}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="form-actions form-actions-end">
                      <button type="submit" disabled={loading}>
                        {loading ? 'Loading...' : 'Load Due History'}
                      </button>
                    </div>
                  </div>
                </form>

                {memberDues.length > 0 ? (
                  <div className="dues-record-list">
                    {memberDues.map((due, index) => (
                      <div
                        className="due-record-card"
                        key={due.id ?? `${due.member_id}-${index}`}
                      >
                        <div className="due-record-main">
                          <div>
                            <p className="eyebrow">DUE #{due.id ?? '—'}</p>
                            <strong>
                              {due.description ?? 'Member obligation'}
                            </strong>
                            <span>
                              Due date: {due.due_date ?? '—'}
                              {due.reference
                                ? ` · Ref: ${due.reference}`
                                : ''}
                            </span>
                          </div>

                          <div className="due-record-amounts">
                            <div>
                              <small>Total</small>
                              <strong>
                                {formatPKR(Number(due.amount ?? 0))}
                              </strong>
                            </div>

                            <div>
                              <small>Outstanding</small>
                              <strong>
                                {formatPKR(
                                  Number(
                                    due.outstanding_amount ??
                                      due.remaining_amount ??
                                      due.amount ??
                                      0,
                                  ),
                                )}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="due-record-footer">
                          <span
                            className={
                              Number(
                                due.outstanding_amount ??
                                  due.remaining_amount ??
                                  due.amount ??
                                  0,
                              ) > 0
                                ? 'due-status due-status-open'
                                : 'due-status due-status-paid'
                            }
                          >
                            {Number(
                              due.outstanding_amount ??
                                due.remaining_amount ??
                                due.amount ??
                                0,
                            ) > 0
                              ? 'Outstanding'
                              : 'Paid'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : duesListMemberId ? (
                  <div className="information-empty-state">
                    <strong>No dues found</strong>
                    <span>
                      This member currently has no recorded dues in the loaded
                      history.
                    </span>
                  </div>
                ) : null}
              </section>

              <section className="information-card dues-outstanding-card">
                <div className="section-heading-row">
                  <div>
                    <p className="eyebrow">OUTSTANDING BALANCE</p>
                    <h3>Check what a member currently owes</h3>
                    <p className="form-help">
                      View the current outstanding amount before recording a
                      payment.
                    </p>
                  </div>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadOutstandingDues()
                  }}
                >
                  <div className="rate-form-grid">
                    <label>
                      Member
                      <select
                        value={outstandingDuesMemberId}
                        onChange={(event) =>
                          setOutstandingDuesMemberId(event.target.value)
                        }
                        required
                      >
                        <option value="">Select a member</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} · ID {member.id}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="form-actions form-actions-end">
                      <button type="submit" disabled={loading}>
                        {loading ? 'Checking...' : 'Check Outstanding'}
                      </button>
                    </div>
                  </div>
                </form>

                {memberOutstandingDues && (
                  <div className="dues-balance-panel">
                    <div>
                      <span>Member</span>
                      <strong>
                        {memberOutstandingDues.member_name ??
                          memberOutstandingDues.member_id ??
                          outstandingDuesMemberId}
                      </strong>
                    </div>

                    <div>
                      <span>Outstanding</span>
                      <strong className="dues-balance-value">
                        {formatPKR(
                          Number(
                            memberOutstandingDues.outstanding_dues ?? 0,
                          ),
                        )}
                      </strong>
                    </div>
                  </div>
                )}
              </section>

              {canWrite && (
                <section className="information-card dues-payment-card">
                  <div className="section-heading-row">
                    <div>
                      <p className="eyebrow">PAYMENT</p>
                      <h3>Apply a due payment</h3>
                      <p className="form-help">
                        Apply a payment against an existing due. Payments are
                        recorded against the selected due rather than changing
                        the original obligation.
                      </p>
                    </div>
                  </div>

                  <form
                    className="committee-create-form"
                    onSubmit={handlePayMemberDue}
                  >
                    <div className="rate-form-grid">
                      <label>
                        Due ID
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={duePaymentId}
                          onChange={(event) =>
                            setDuePaymentId(event.target.value)
                          }
                          placeholder="e.g. 12"
                          required
                        />
                      </label>

                      <label>
                        Payment amount
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={duePaymentAmount}
                          onChange={(event) =>
                            setDuePaymentAmount(event.target.value)
                          }
                          placeholder="e.g. 2000"
                          required
                        />
                      </label>
                    </div>

                    <div className="form-actions">
                      <button type="submit" disabled={loading}>
                        {loading ? 'Applying...' : 'Apply Payment'}
                      </button>
                    </div>
                  </form>

                  {paidMemberDue && (
                    <div className="committee-banner dues-payment-result">
                      <div>
                        <p className="eyebrow">PAYMENT RECORDED</p>
                        <h3>Due payment applied</h3>
                        <p className="created-id">
                          Due ID: {paidMemberDue.id ?? duePaymentId}
                        </p>
                        <p className="created-id">
                          Outstanding:{' '}
                          {formatPKR(
                            Number(
                              paidMemberDue.outstanding_amount ??
                                paidMemberDue.remaining_amount ??
                                0,
                            ),
                          )}
                        </p>
                      </div>

                      <span className="active-badge">Updated</span>
                    </div>
                  )}
                </section>
              )}
            </section>
) : activePage === 'Settlements' ? (
            <section className="module-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">MEMBER FINANCIAL CLOSURE</p>
                  <h1>Settlements</h1>
                  <p className="page-subtitle">
                    Review a member's complete refundable position, create the
                    settlement, and record the final payment.
                  </p>
                </div>

                <div className="page-heading-meta">
                  <span className="active-badge">
                    {summary?.committee_name ??
                      committees.find(
                        (committee) =>
                          String(committee.id) === String(committeeId),
                      )?.name ??
                      'Current Committee'}
                  </span>
                </div>
              </div>

              <section className="information-card">
                <div>
                  <p className="eyebrow">SETTLEMENT REVIEW</p>
                  <h3>Select member</h3>
                  <p className="form-help">
                    The settlement is calculated from this member's financial
                    position within the currently selected committee.
                  </p>
                </div>

                <div className="committee-create-form">
                  <div className="rate-form-grid">
                    <label>
                      Member
                      <select
                        value={settlementMemberId}
                        onChange={(event) => {
                          setSettlementMemberId(event.target.value)
                          setSettlementPreview(null)
                          setCreatedMemberSettlement(null)
                          setPaidMemberSettlement(null)
                        }}
                        disabled={membersLoading || members.length === 0}
                      >
                        <option value="">
                          {membersLoading
                            ? 'Loading members...'
                            : members.length === 0
                              ? 'No members available'
                              : 'Select a member'}
                        </option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} · ID {member.id}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Settlement date
                      <input
                        type="date"
                        value={settlementDate}
                        onChange={(event) =>
                          setSettlementDate(event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={
                      loading ||
                      membersLoading ||
                      !settlementMemberId
                    }
                    onClick={() => void handleLoadMemberSettlement()}
                  >
                    {loading ? 'Loading...' : 'Preview Settlement'}
                  </button>
                </div>
              </section>

              {settlementPreview && (
                <section className="settlement-summary-grid">
                  <section className="information-card settlement-summary-card">
                    <div>
                      <p className="eyebrow">CONTRIBUTION BALANCE</p>
                      <h3>
                        {formatPKR(
                          settlementPreview.contribution_balance ?? 0,
                        )}
                      </h3>
                      <p className="form-help">
                        Remaining contribution-based balance.
                      </p>
                    </div>
                  </section>

                  <section className="information-card settlement-summary-card">
                    <div>
                      <p className="eyebrow">ASSET SHARE</p>
                      <h3>
                        {formatPKR(settlementPreview.asset_share ?? 0)}
                      </h3>
                      <p className="form-help">
                        Current refundable share of committee assets.
                      </p>
                    </div>
                  </section>

                  <section className="information-card settlement-summary-card">
                    <div>
                      <p className="eyebrow">GOODS VALUE</p>
                      <h3>
                        {formatPKR(settlementPreview.goods_value ?? 0)}
                      </h3>
                      <p className="form-help">
                        Refundable value associated with member goods.
                      </p>
                    </div>
                  </section>

                  <section className="information-card settlement-summary-card settlement-dues-card">
                    <div>
                      <p className="eyebrow">OUTSTANDING DUES</p>
                      <h3>
                        {formatPKR(
                          settlementPreview.outstanding_dues ?? 0,
                        )}
                      </h3>
                      <p className="form-help">
                        Amount deducted before final settlement.
                      </p>
                    </div>
                  </section>
                </section>
              )}

              {settlementPreview && (
                <section className="information-card settlement-final-card">
                  <div>
                    <p className="eyebrow">SETTLEMENT CALCULATION</p>
                    <h3>
                      {formatPKR(settlementPreview.final_amount ?? 0)}
                    </h3>
                    <p className="form-help">
                      Gross amount:{' '}
                      {formatPKR(settlementPreview.gross_amount ?? 0)}
                      {' · '}
                      Final refundable amount after outstanding dues.
                    </p>
                  </div>

                  {canWrite && (
                    <form
                      className="committee-create-form"
                      onSubmit={handleCreateMemberSettlement}
                    >
                      <button type="submit" disabled={loading}>
                        {loading
                          ? 'Creating...'
                          : 'Create Settlement'}
                      </button>
                    </form>
                  )}
                </section>
              )}

              {createdMemberSettlement && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">SETTLEMENT CREATED</p>
                    <h3>
                      Settlement #
                      {createdMemberSettlement.id ?? '—'}
                    </h3>
                    <p className="created-id">
                      Member ID:{' '}
                      {createdMemberSettlement.member_id ??
                        settlementMemberId}
                      {' · '}
                      Final amount:{' '}
                      {formatPKR(
                        createdMemberSettlement.final_amount ?? 0,
                      )}
                    </p>
                  </div>
                  <span className="active-badge">
                    {createdMemberSettlement.status ?? 'Created'}
                  </span>
                </section>
              )}

              {createdMemberSettlement &&
                createdMemberSettlement.status !== 'paid' && (
                  <section className="information-card">
                    <div>
                      <p className="eyebrow">FINAL PAYMENT</p>
                      <h3>Record Settlement Payment</h3>
                      <p className="form-help">
                        This records the final settlement payment and closes
                        the member's settlement.
                      </p>
                    </div>

                    {canWrite && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void handlePayMemberSettlement()}
                      >
                        {loading ? 'Processing...' : 'Pay Settlement'}
                      </button>
                    )}
                  </section>
                )}

              {paidMemberSettlement && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">SETTLEMENT PAID</p>
                    <h3>Settlement completed</h3>
                    <p className="created-id">
                      Settlement ID:{' '}
                      {paidMemberSettlement.id ?? '—'}
                      {' · '}
                      Member ID:{' '}
                      {paidMemberSettlement.member_id ??
                        settlementMemberId}
                      {' · '}
                      Paid:{' '}
                      {formatPKR(
                        paidMemberSettlement.final_amount ?? 0,
                      )}
                    </p>
                  </div>
                  <span className="active-badge">Completed</span>
                </section>
              )}
            </section>
          ) : activePage === 'My Financial Position' ? (
            <section className="module-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">YOUR ACCOUNT</p>
                  <h1>My Financial Position</h1>
                  <p className="page-subtitle">
                    Your current contributions, dues, asset share, and
                    account history within this committee.
                  </p>
                </div>
              </div>

              {myFinancialSummaryLoading && (
                <p className="form-help">Loading your financial position...</p>
              )}

              {myFinancialSummaryError && (
                <p className="form-error">{myFinancialSummaryError}</p>
              )}

              {!myFinancialSummaryLoading &&
                !myFinancialSummaryError &&
                members.length === 0 && (
                  <p className="form-help">
                    No member record was found for you in this committee.
                  </p>
                )}

              {myFinancialSummary && (
                <>
                  <section className="committee-banner">
                    <div>
                      <p className="eyebrow">MEMBER</p>
                      <h3>{myFinancialSummary.member_name}</h3>

                      <p className="created-id">
                        Member ID: {myFinancialSummary.member_id}
                        {' · '}
                        Joining date: {myFinancialSummary.joined_on}
                      </p>

                      {myFinancialSummary.left_on && (
                        <p className="created-id">
                          Left on: {myFinancialSummary.left_on}
                        </p>
                      )}
                    </div>

                    <span
                      className={
                        myFinancialSummary.is_active
                          ? 'active-badge'
                          : 'inactive-badge'
                      }
                    >
                      {myFinancialSummary.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </section>

                  <section className="information-card">
                    <p className="eyebrow">CURRENT POSITION</p>
                    <h3>Financial breakdown</h3>

                    <div className="position-row">
                      <span>Total contributions</span>
                      <strong>
                        {formatPKR(myFinancialSummary.total_contributions)}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Contribution balance</span>
                      <strong>
                        {formatPKR(myFinancialSummary.contribution_balance)}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Committee asset share</span>
                      <strong>
                        {formatPKR(myFinancialSummary.asset_share)}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Goods value</span>
                      <strong>
                        {formatPKR(myFinancialSummary.goods_value)}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Ordinary dues</span>
                      <strong>
                        {formatPKR(myFinancialSummary.ordinary_dues)}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Qarz-e-Hasana</span>
                      <strong>
                        {formatPKR(myFinancialSummary.qarz_e_hasana_dues)}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Total outstanding dues</span>
                      <strong>
                        {formatPKR(myFinancialSummary.outstanding_dues)}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Gross current value</span>
                      <strong>
                        {formatPKR(myFinancialSummary.current_gross_value)}
                      </strong>
                    </div>

                    <div className="position-row">
                      <span>Final current value</span>
                      <strong>
                        {formatPKR(myFinancialSummary.current_final_value)}
                      </strong>
                    </div>
                  </section>

                  <section className="information-card">
                    <p className="eyebrow">ACCOUNT HISTORY</p>
                    <h3>Your statement</h3>

                    {myStatement.length === 0 ? (
                      <p className="form-help">
                        No financial transactions recorded yet.
                      </p>
                    ) : (
                      <div>
                        {myStatement.map((row, index) => (
                          <div
                            className="position-row"
                            key={`${row.date}-${index}`}
                          >
                            <div>
                              <strong>{row.description}</strong>
                              <small>
                                {row.date}
                                {row.reference ? ` · ${row.reference}` : ''}
                              </small>
                            </div>

                            <strong>{formatPKR(row.amount)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {myFinancialSummary.death_support && (
                    <section className="information-card">
                      <p className="eyebrow">DEATH SUPPORT</p>
                      <h3>Support record</h3>

                      <div className="position-row">
                        <span>Beneficiary</span>
                        <strong>
                          {myFinancialSummary.death_support.beneficiary_name}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>Amount</span>
                        <strong>
                          {formatPKR(myFinancialSummary.death_support.amount)}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>Support date</span>
                        <strong>
                          {myFinancialSummary.death_support.support_date}
                        </strong>
                      </div>
                    </section>
                  )}

                  {myFinancialSummary.settlement && (
                    <section className="information-card">
                      <p className="eyebrow">SETTLEMENT</p>
                      <h3>Settlement record</h3>

                      <div className="position-row">
                        <span>Settlement date</span>
                        <strong>
                          {myFinancialSummary.settlement.settlement_date}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>Gross amount</span>
                        <strong>
                          {formatPKR(
                            myFinancialSummary.settlement.gross_amount,
                          )}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>Outstanding amounts</span>
                        <strong>
                          {formatPKR(
                            myFinancialSummary.settlement.outstanding_dues,
                          )}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>Final amount</span>
                        <strong>
                          {formatPKR(
                            myFinancialSummary.settlement.final_amount,
                          )}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>Status</span>
                        <strong>{myFinancialSummary.settlement.status}</strong>
                      </div>
                    </section>
                  )}
                </>
              )}
            </section>
          ) : activePage === 'My Contributions' ? (
            <section className="module-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">YOUR ACCOUNT</p>
                  <h1>My Contributions</h1>
                  <p className="page-subtitle">
                    Your recorded contribution history and running total
                    within this committee.
                  </p>
                </div>
              </div>

              {myContributionsLoading && (
                <p className="form-help">
                  Loading your contribution history...
                </p>
              )}

              {myContributionsError && (
                <p className="form-error">{myContributionsError}</p>
              )}

              {!myContributionsLoading &&
                !myContributionsError &&
                members.length === 0 && (
                  <p className="form-help">
                    No member record was found for you in this committee.
                  </p>
                )}

              {myContributionTotal && (
                <section className="information-card">
                  <p className="eyebrow">RUNNING TOTAL</p>
                  <h3>Total contributed</h3>

                  <div className="position-row">
                    <span>All recorded contributions</span>
                    <strong>
                      {formatPKR(myContributionTotal.total_contributed)}
                    </strong>
                  </div>
                </section>
              )}

              <section className="information-card">
                <p className="eyebrow">HISTORY</p>
                <h3>Contribution records</h3>

                {!myContributionsLoading &&
                !myContributionsError &&
                myContributions.length === 0 ? (
                  <p className="form-help">
                    No contributions have been recorded yet.
                  </p>
                ) : (
                  <div>
                    {myContributions.map((entry) => (
                      <div
                        className="position-row"
                        key={entry.journal_entry_id}
                      >
                        <div>
                          <strong>{entry.description}</strong>
                          <small>
                            {entry.contribution_date}
                            {entry.reference
                              ? ` · ${entry.reference}`
                              : ''}
                          </small>
                        </div>

                        <strong>{formatPKR(entry.amount)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </section>
          ) : activePage === 'My Dues' ? (
            <section className="module-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">YOUR ACCOUNT</p>
                  <h1>My Dues</h1>
                  <p className="page-subtitle">
                    Your recorded dues and current outstanding balance
                    within this committee.
                  </p>
                </div>
              </div>

              {myDuesLoading && (
                <p className="form-help">Loading your dues...</p>
              )}

              {myDuesError && (
                <p className="form-error">{myDuesError}</p>
              )}

              {!myDuesLoading &&
                !myDuesError &&
                members.length === 0 && (
                  <p className="form-help">
                    No member record was found for you in this committee.
                  </p>
                )}

              {myOutstandingDues && (
                <section className="information-card">
                  <p className="eyebrow">CURRENT STANDING</p>
                  <h3>Outstanding dues</h3>

                  <div className="position-row">
                    <span>Total outstanding</span>
                    <strong>
                      {formatPKR(myOutstandingDues.outstanding_dues)}
                    </strong>
                  </div>
                </section>
              )}

              <section className="information-card">
                <p className="eyebrow">HISTORY</p>
                <h3>Due records</h3>

                {!myDuesLoading &&
                !myDuesError &&
                myDues.length === 0 ? (
                  <p className="form-help">
                    No dues have been recorded yet.
                  </p>
                ) : (
                  <div>
                    {myDues.map((due) => (
                      <div className="position-row" key={due.id}>
                        <div>
                          <strong>{due.description}</strong>
                          <small>
                            {due.due_date}
                            {due.reference ? ` · ${due.reference}` : ''}
                          </small>
                        </div>

                        <div>
                          <strong>{formatPKR(due.amount)}</strong>
                          <small>
                            {' '}
                            (paid {formatPKR(due.paid_amount)}, owed{' '}
                            {formatPKR(due.outstanding_amount)})
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </section>
          ) : activePage === 'My Goods' ? (
            <section className="module-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">YOUR ACCOUNT</p>
                  <h1>My Goods</h1>
                  <p className="page-subtitle">
                    Your recorded purchases through this committee and
                    their current value.
                  </p>
                </div>
              </div>

              {myGoodsLoading && (
                <p className="form-help">Loading your goods...</p>
              )}

              {myGoodsError && (
                <p className="form-error">{myGoodsError}</p>
              )}

              {!myGoodsLoading &&
                !myGoodsError &&
                members.length === 0 && (
                  <p className="form-help">
                    No member record was found for you in this committee.
                  </p>
                )}

              {myGoodsTotal && (
                <section className="information-card">
                  <p className="eyebrow">CURRENT VALUE</p>
                  <h3>Total goods value</h3>

                  <div className="position-row">
                    <span>All recorded goods</span>
                    <strong>
                      {formatPKR(myGoodsTotal.total_goods_value)}
                    </strong>
                  </div>
                </section>
              )}

              <section className="information-card">
                <p className="eyebrow">HISTORY</p>
                <h3>Goods records</h3>

                {!myGoodsLoading &&
                !myGoodsError &&
                myGoods.length === 0 ? (
                  <p className="form-help">
                    No goods have been recorded yet.
                  </p>
                ) : (
                  <div>
                    {myGoods.map((good) => (
                      <div className="position-row" key={good.id}>
                        <div>
                          <strong>{good.name}</strong>
                          <small>
                            Purchased {good.purchase_date}
                            {good.description
                              ? ` · ${good.description}`
                              : ''}
                            {!good.is_active ? ' · Inactive' : ''}
                          </small>
                        </div>

                        <div>
                          <strong>
                            {formatPKR(good.current_value)}
                          </strong>
                          <small>
                            {' '}
                            (purchased at{' '}
                            {formatPKR(good.purchase_price)})
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </section>
          ) : activePage === 'My Death Support' ? (
            <section className="module-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">YOUR ACCOUNT</p>
                  <h1>My Death Support</h1>
                  <p className="page-subtitle">
                    Your death support record within this committee, if
                    one has been recorded.
                  </p>
                </div>
              </div>

              {myDeathSupportLoading && (
                <p className="form-help">
                  Loading your death support record...
                </p>
              )}

              {myDeathSupportError && (
                <p className="form-error">{myDeathSupportError}</p>
              )}

              {!myDeathSupportLoading &&
                !myDeathSupportError &&
                members.length === 0 && (
                  <p className="form-help">
                    No member record was found for you in this committee.
                  </p>
                )}

              {!myDeathSupportLoading &&
                !myDeathSupportError &&
                myDeathSupportInfo &&
                !myDeathSupportInfo.death_support && (
                  <p className="form-help">
                    No death support has been recorded for you.
                  </p>
                )}

              {myDeathSupportInfo?.death_support && (
                <section className="information-card">
                  <p className="eyebrow">SUPPORT RECORD</p>
                  <h3>Recorded death support</h3>

                  <div className="position-row">
                    <span>Beneficiary</span>
                    <strong>
                      {myDeathSupportInfo.death_support.beneficiary_name}
                    </strong>
                  </div>

                  <div className="position-row">
                    <span>Amount</span>
                    <strong>
                      {formatPKR(myDeathSupportInfo.death_support.amount)}
                    </strong>
                  </div>

                  <div className="position-row">
                    <span>Support date</span>
                    <strong>
                      {myDeathSupportInfo.death_support.support_date}
                    </strong>
                  </div>

                  {myDeathSupportInfo.death_support.reference && (
                    <div className="position-row">
                      <span>Reference</span>
                      <strong>
                        {myDeathSupportInfo.death_support.reference}
                      </strong>
                    </div>
                  )}
                </section>
              )}
            </section>
          ) : activePage === 'My Settlement' ? (
            <section className="module-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">YOUR ACCOUNT</p>
                  <h1>My Settlement</h1>
                  <p className="page-subtitle">
                    A live preview of what your settlement would be if
                    calculated today. This updates as your contributions,
                    dues, asset share, and goods change.
                  </p>
                </div>
              </div>

              {mySettlementLoading && (
                <p className="form-help">
                  Calculating your settlement preview...
                </p>
              )}

              {mySettlementError && (
                <p className="form-error">{mySettlementError}</p>
              )}

              {!mySettlementLoading &&
                !mySettlementError &&
                members.length === 0 && (
                  <p className="form-help">
                    No member record was found for you in this committee.
                  </p>
                )}

              {mySettlementPreview && (
                <section className="information-card">
                  <p className="eyebrow">SETTLEMENT PREVIEW</p>
                  <h3>If settled today</h3>

                  <div className="position-row">
                    <span>Contribution balance</span>
                    <strong>
                      {formatPKR(mySettlementPreview.contribution_balance)}
                    </strong>
                  </div>

                  <div className="position-row">
                    <span>Committee asset share</span>
                    <strong>
                      {formatPKR(mySettlementPreview.asset_share)}
                    </strong>
                  </div>

                  <div className="position-row">
                    <span>Goods value</span>
                    <strong>
                      {formatPKR(mySettlementPreview.goods_value)}
                    </strong>
                  </div>

                  <div className="position-row">
                    <span>Outstanding dues</span>
                    <strong>
                      {formatPKR(mySettlementPreview.outstanding_dues)}
                    </strong>
                  </div>

                  <div className="position-row">
                    <span>Gross amount</span>
                    <strong>
                      {formatPKR(mySettlementPreview.gross_amount)}
                    </strong>
                  </div>

                  <div className="position-row">
                    <span>Final settlement amount</span>
                    <strong>
                      {formatPKR(mySettlementPreview.final_amount)}
                    </strong>
                  </div>
                </section>
              )}
            </section>
          ) : activePage !== 'Dashboard' ? (
            <section className="module-placeholder">
              <div className="module-placeholder-icon">DC</div>
              <p className="eyebrow">MODULE</p>
              <h1>{activePage}</h1>
              <p>
                This module is now connected to the application navigation.
                Its backend functionality will be connected in the next stage.
              </p>
              <div className="module-placeholder-status">
                <span />
                Backend API available
              </div>
            </section>
          ) : (
          <>
          <div className="page-heading">
            <div>
              <p className="eyebrow dashboard-greeting">
                {getTimeGreeting()}, {username}
              </p>
              <h1 className="dashboard-title">
                {summary?.committee_name ??
                  committees.find(
                    (committee) =>
                      String(committee.id) === String(committeeId),
                  )?.name ??
                  committees.find(
                    (committee) =>
                      String(committee.id) === String(committeeId),
                  )?.committee_name ??
                  'Your Committee Workspace'}
              </h1>
              <p>
                {summary
                  ? 'All information and actions shown here belong to the committee you are currently managing.'
                  : 'Select a committee to enter its isolated workspace.'}
              </p>
            </div>

            <div className="committee-loader">
              <label htmlFor="committee-id">Committee workspace</label>

              <div className="committee-context-help">
                {committees.length > 1
                  ? 'Choose the committee you want to work with.'
                  : 'This is the committee currently available to you.'}
              </div>

              <select
                id="committee-id"
                value={committeeId}
                onChange={(event) => {
                  const nextCommitteeId = event.target.value
                  setError('')
                  setSummary(null)
                  setCommitteeId(nextCommitteeId)

                  if (nextCommitteeId) {
                    window.setTimeout(() => {
                      void handleLoadCommittee()
                    }, 0)
                  }
                }}
                disabled={loading || committees.length === 0}
              >
                {committees.length === 0 ? (
                  <option value="">No committee available</option>
                ) : (
                  committees.map((committee) => (
                    <option key={committee.id} value={committee.id}>
                      {committee.name ??
                        committee.committee_name ??
                        `Committee ${committee.id}`}
                    </option>
                  ))
                )}
              </select>

              <p className="committee-context-note">
                All members, contributions, dues, goods, assets, death
                assistance, and settlements shown below belong to this
                committee.
              </p>
            </div>
          </div>

          {error && <div className="error page-error">{error}</div>}

          {!summary && !error && (
            <section className="empty-state">
              <div className="empty-icon">₨</div>
              <h3>No committee workspace loaded</h3>
              <p>
                Choose a committee above to open its workspace. Everything
                you see and manage in this workspace belongs only to that
                committee.
              </p>
            </section>
          )}

          {summary && (
            <>
              <section className="committee-banner">
                <div>
                  <p className="eyebrow">ACTIVE WORKSPACE</p>
                  <h3>{summary.committee_name}</h3>
                  <p className="created-id">
                    This workspace contains only this committee's records.
                  </p>
                </div>

                <span
                  className={
                    summary.is_active
                      ? 'active-badge'
                      : 'inactive-badge'
                  }
                >
                  {summary.is_active ? 'Active' : 'Inactive'}
                </span>
              </section>

              <section className="stats-grid">
                <article className="stat-card">
                  <span>Total Contributions</span>
                  <strong>{formatPKR(summary.total_contributions)}</strong>
                  <small>Member Contributions recorded</small>
                </article>

                <article className="stat-card">
                  <span>Death Support</span>
                  <strong>{formatPKR(summary.total_death_support)}</strong>
                  <small>Support paid by the committee</small>
                </article>

                <article className="stat-card primary">
                  <span>Cash Balance</span>
                  <strong>{formatPKR(summary.cash_balance)}</strong>
                  <small>Current committee cash position</small>
                </article>
              </section>

              <section className="information-card">
                <div>
                  <p className="eyebrow">FINANCIAL POSITION</p>
                  <h3>Current committee position</h3>
                </div>

                <div className="position-row">
                  <span>Committee</span>
                  <strong>{summary.committee_name}</strong>
                </div>

                <div className="position-row">
                  <span>Committee ID</span>
                  <strong>{summary.committee_id}</strong>
                </div>

                <div className="position-row">
                  <span>Cash balance</span>
                  <strong>{formatPKR(summary.cash_balance)}</strong>
                </div>
              </section>
            </>
          )}
          </>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
