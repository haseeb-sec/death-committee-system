import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE ?? `http://${window.location.hostname}:8000`

type CommitteeSummary = {
  committee_id: number
  committee_name: string
  is_active: boolean
  total_contributions: number
  total_death_support: number
  cash_balance: number
}

type CreatedCommittee = {
  id?: number
  name?: string
  committee_name?: string
}

type CreatedContributionRate = {
  id?: number
  committee_id?: number
  amount?: number
  effective_from?: string
}

type CreatedContribution = {
  journal_entry_id?: number
  member_id?: number
  contribution_date?: string
  reference?: string | null
  description?: string
}

type CreatedDeathSupport = {
  id?: number
  committee_id?: number
  member_id?: number
  beneficiary_name?: string
  amount?: number
  member_funded_amount?: number
  qarz_e_hasana_amount?: number
  support_date?: string
  reference?: string | null
}

type DeathSupportStatus = {
  member_id: number
  death_support_recorded: boolean
  support_id: number | null
  amount: number
  support_date: string | null
}

type CreatedMember = {
  id?: number
  committee_id?: number
  name?: string
  joined_on?: string
  is_active?: boolean
}

type Member = {
  id: number
  committee_id: number
  name: string
  joined_on: string
  left_on: string | null
  is_active: boolean
}

type CreatedAsset = {
  id?: number
  committee_id?: number
  name?: string
  purchase_date?: string
  purchase_value?: number
  description?: string | null
}

type AssetValuation = {
  id: number
  asset_id: number
  valuation_date: string
  value: number
}

type AssetParticipation = {
  id: number
  ownership_units: number
  asset_id: number
  member_id: number
  total_units: number
}

type MemberStatementRow = {
  date: string
  description: string
  reference: string | null
  amount: number
}

type MemberFinancialSummary = {
  member_id: number
  member_name: string
  joined_on: string
  left_on: string | null
  is_active: boolean
  contribution_count: number
  total_contributions: number
  contribution_balance: number
  asset_share: number
  goods_value: number
  ordinary_dues: number
  qarz_e_hasana_dues: number
  outstanding_dues: number
  current_gross_value: number
  current_final_value: number
  death_support: {
    id: number
    beneficiary_name: string
    amount: number
    support_date: string
    reference: string | null
  } | null
  settlement: {
    id: number
    settlement_date: string
    contribution_balance: number
    asset_share: number
    goods_value: number
    gross_amount: number
    outstanding_dues: number
    final_amount: number
    status: string
  } | null
}

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
): Promise<Record<string, any>> {
  const response = await fetch(
    `${API_BASE}/users/${userId}/committees/${committeeId}/access`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Unable to grant committee access')
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

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem('death_committee_token') ?? '',
  )
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [committeeId, setCommitteeId] = useState('')
  const [summary, setSummary] = useState<CommitteeSummary | null>(null)
  const [committees, setCommittees] = useState<CreatedCommittee[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  const [users, setUsers] = useState<Array<Record<string, any>>>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userUsername, setUserUsername] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [userRole, setUserRole] = useState('viewer')
  const [createdUser, setCreatedUser] =
    useState<Record<string, any> | null>(null)
  const [selectedAccessUserId, setSelectedAccessUserId] = useState<number | null>(null)
  const [committeeAccessLoading, setCommitteeAccessLoading] = useState(false)
  const [committeeAccessStatus, setCommitteeAccessStatus] =
    useState<Record<string, any>>({})

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activePage, setActivePage] = useState('Dashboard')
  const [committeeName, setCommitteeName] = useState('')
  const [createdCommittee, setCreatedCommittee] =
    useState<Record<string, any> | null>(null)

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
  }, [token])

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


  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await login(username, password)
      setUserRole(data.role ?? '')

      localStorage.setItem('death_committee_token', data.access_token)
      setToken(data.access_token)
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

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const memberId = Number(goodsMemberId)
    const purchasePrice = Number(goodPurchasePrice)

    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError('Enter a valid member ID')
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
      setError('Due amount must be a positive whole number')
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
      setError('Contribution date is required')
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

  async function handleLoadMemberFinancialSummary() {
    if (!token) {
      setError('You are not authenticated')
      return
    }

    const memberId = Number(financialMemberId)

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
      setError('Death support amount must be a positive whole number')
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
      setError('Member name is required')
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
    event.preventDefault()

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

    if (!['super_admin', 'admin', 'viewer'].includes(userRole)) {
      setError('Select a valid user role')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await createUser(
        usernameValue,
        passwordValue,
        userRole,
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
    setUserRole('')
    localStorage.removeItem('death_committee_token')
    setToken('')
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
                    <p>Record contributions, support, dues, and assets.</p>
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
              <h2>Sign in</h2>
              <p>
                Access your committee records and financial information.
              </p>
            </div>
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
            </form>

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
          {[
            'Dashboard',
            'Committees',
            'Members',
            'Contributions',
            'Death Support',
            'Dues',
            'Goods',
            'Assets',
            'Settlements',
            ...(userRole === 'super_admin' ? ['Users'] : []),
          ].map((page) => (
            <button
              key={page}
              className={`nav-item ${activePage === page ? 'active' : ''}`}
              onClick={() => {
                if (page === 'Users' && userRole !== 'super_admin') return
                setActivePage(page)
              }}
            >
              {page}
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

              <section className="information-card">
                <div>
                  <p className="eyebrow">NEW MEMBER</p>
                  <h3>Create member</h3>
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
                      Member name
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
                      Joined on
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
                      Joined on:{' '}
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
                        Joined on: {memberFinancialSummary.joined_on}
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
                        <span>Outstanding dues</span>
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
                  <h1>Contribution Rates</h1>
                  <p>
                    Define the amount members are required to contribute
                    from a specific effective date.
                  </p>
                </div>
              </section>

              {error && <div className="error page-error">{error}</div>}

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
                      Contribution date
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
                      : 'Create Contribution Rate'}
                  </button>
                </form>
              </section>

              {createdContributionRate && (
                <section className="committee-banner contribution-rate-result">
                  <div>
                    <p className="eyebrow">CREATED</p>
                    <h3>
                      {createdContributionRate.amount !== undefined
                        ? `Rs. ${createdContributionRate.amount.toLocaleString(
                            'en-PK',
                          )}`
                        : 'Contribution rate created'}
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

              <section className="information-card death-support-record-card">
                <div>
                  <p className="eyebrow">RECORD SUPPORT</p>
                  <h3>Record death support</h3>
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
                      Manage application users, roles, and account access.
                    </p>
                  </div>
                  <div className="page-heading-meta">
                    <span className="active-badge">
                      {users.length} {users.length === 1 ? 'User' : 'Users'}
                    </span>
                  </div>
                </div>

                {error && <div className="error page-error">{error}</div>}

                <section className="information-card">
                  <div>
                    <p className="eyebrow">NEW USER</p>
                    <h3>Create application user</h3>
                    <p className="form-help">
                      Create an account and assign its access role.
                    </p>
                  </div>

                  <form
                    className="committee-create-form"
                    onSubmit={handleCreateUser}
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
                        Role
                        <select
                          value={userRole}
                          onChange={(event) => setUserRole(event.target.value)}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </label>
                    </div>

                    <button type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Create User'}
                    </button>
                  </form>
                </section>

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
                      {createdUser.is_active === false ? 'Inactive' : 'Active'}
                    </span>
                  </section>
                )}

                <section className="information-card">
                  <div>
                    <p className="eyebrow">USER ACCOUNTS</p>
                    <h3>Application users</h3>
                    <p className="form-help">
                      Review current accounts and deactivate access when
                      required.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="management-action management-action-secondary"
                    disabled={usersLoading}
                    onClick={() => void handleLoadUsers()}
                  >
                    {usersLoading ? 'Loading...' : 'Refresh Users'}
                  </button>
                </section>

                {users.length > 0 ? (
                  <section className="information-card">
                    <div className="committee-list">
                      {users.map((user) => (
                        <div className="committee-list-item" key={user.id}>
                          <div>
                            <strong>{user.username ?? 'Unknown user'}</strong>
                            <small>
                              User ID: {user.id ?? '—'}
                              {' · '}
                              Role: {user.role ?? '—'}
                            </small>
                          </div>

                          <div>
                            <span className="active-badge">
                              {user.is_active === false ? 'Inactive' : 'Active'}
                            </span>

                            {user.is_active !== false && (
                              <button
                                type="button"
                                className="management-action management-action-danger"
                                disabled={usersLoading}
                                onClick={() =>
                                  void handleDeactivateUser(Number(user.id))
                                }
                              >
                                Deactivate
                              </button>
                            )}

                            <div className="committee-access-actions">
                              <small>
                                Committee access:{' '}
                                {selectedAccessUserId === Number(user.id) &&
                                committeeAccessStatus.is_active === true
                                  ? 'Active'
                                  : selectedAccessUserId === Number(user.id) &&
                                      committeeAccessStatus.is_active === false
                                    ? 'Inactive'
                                    : 'Not checked'}
                              </small>

                              <button
                                type="button"
                                className="management-action management-action-secondary"
                                disabled={
                                  committeeAccessLoading &&
                                  selectedAccessUserId === Number(user.id)
                                }
                                onClick={() =>
                                  void handleLoadCommitteeAccess(
                                    Number(user.id),
                                  )
                                }
                              >
                                {committeeAccessLoading &&
                                selectedAccessUserId === Number(user.id)
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
                                onClick={() =>
                                  void handleGrantCommitteeAccess(
                                    Number(user.id),
                                  )
                                }
                              >
                                Grant Access
                              </button>

                              {selectedAccessUserId === Number(user.id) &&
                                committeeAccessStatus.is_active === true && (
                                  <button
                                    type="button"
                                    className="management-action management-action-danger"
                                    disabled={committeeAccessLoading}
                                    onClick={() =>
                                      void handleDeactivateCommitteeAccess(
                                        Number(user.id),
                                      )
                                    }
                                  >
                                    Revoke Access
                                  </button>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : (
                  <section className="information-card">
                    <p className="form-help">
                      No users loaded yet. Select Refresh Users to retrieve
                      the current accounts.
                    </p>
                  </section>
                )}
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
              </section>

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
              </section>

              {updatedCommitteeAssetValue && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">VALUATION UPDATED</p>
                    <h3>Asset value updated</h3>

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

              <section className="information-card goods-create-card">
                <div>
                  <p className="eyebrow">NEW GOOD</p>
                  <h3>Create member good</h3>
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
              </section>

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
              </section>

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
            <section className="module-content">

              <div className="page-heading">
                <div>
                  <p className="eyebrow">MEMBER DUES</p>
                  <h1>Member Dues</h1>
                  <p>
                    Record member obligations, monitor outstanding balances,
                    and apply payments against individual dues.
                  </p>
                </div>
              </div>

              <section className="information-card dues-create-card">
                <div>
                  <p className="eyebrow">NEW DUE</p>
                  <h3>Create member due</h3>
                  <p className="form-help">
                    Record an amount owed by a member with its due date and supporting details.
                  </p>
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
                          onChange={(event) => setDueMemberId(event.target.value)}
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
                        onChange={(event) => setDueAmount(event.target.value)}
                        placeholder="e.g. 5000"
                        required
                      />
                    </label>

                    <label>
                      Due date
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                        required
                      />
                    </label>

                    <label>
                      Reference
                      <input
                        type="text"
                        value={dueReference}
                        onChange={(event) => setDueReference(event.target.value)}
                        placeholder="Optional reference"
                      />
                    </label>
                  </div>

                  <label>
                    Description
                    <textarea
                      value={dueDescription}
                      onChange={(event) => setDueDescription(event.target.value)}
                      placeholder="Reason or description for this due"
                      rows={3}
                      required
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Recording...' : 'Record Due'}
                  </button>
                </form>
              </section>

              {createdMemberDue && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">DUE RECORDED</p>
                    <h3>Member due recorded</h3>
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

              <section className="information-card dues-history-card">
                <div>
                  <p className="eyebrow">DUE HISTORY</p>
                  <h3>View member dues</h3>
                  <p className="form-help">
                    Load all recorded dues for a member.
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadMemberDues()
                  }}
                >
                                      <label>
                      Member
                      <select
                        value={duesListMemberId}
                        onChange={(event) =>
                          setDuesListMemberId(event.target.value)
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

                  <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Load Dues'}
                  </button>
                </form>
              </section>

              {memberDues.length > 0 && (
                <section className="information-card">
                  <p className="eyebrow">RECORDED DUES</p>
                  <h3>Member due history</h3>

                  {memberDues.map((due) => (
                    <div className="position-row" key={due.id}>
                      <div>
                        <strong>{due.description || 'Member due'}</strong>
                        <small>
                          Due ID: {due.id}
                          {' · '}
                          Due date: {due.due_date}
                          {due.reference
                            ? ` · Reference: ${due.reference}`
                            : ''}
                        </small>
                      </div>

                      <div>
                        <strong>
                          {formatPKR(due.outstanding_amount ?? 0)}
                        </strong>
                        <small>
                          Outstanding
                          {' · '}
                          Paid: {formatPKR(due.paid_amount ?? 0)}
                          {' · '}
                          Total: {formatPKR(due.amount ?? 0)}
                        </small>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              <section className="information-card dues-outstanding-card">
                <div>
                  <p className="eyebrow">OUTSTANDING BALANCE</p>
                  <h3>View outstanding dues</h3>
                  <p className="form-help">
                    Check the total amount currently outstanding for a member.
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadOutstandingDues()
                  }}
                >
                                      <label>
                      Member
                      <select
                        value={outstandingDuesMemberId}
                        onChange={(event) =>
                          setOutstandingDuesMemberId(event.target.value)
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

                  <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Check Outstanding'}
                  </button>
                </form>
              </section>

              {memberOutstandingDues && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">OUTSTANDING DUES</p>
                    <h3>
                      {formatPKR(
                        memberOutstandingDues.outstanding_dues ?? 0,
                      )}
                    </h3>
                    <p className="created-id">
                      Member ID:{' '}
                      {memberOutstandingDues.member_id ??
                        outstandingDuesMemberId}
                    </p>
                  </div>
                  <span className="active-badge">Current</span>
                </section>
              )}

              <section className="information-card dues-payment-card">
                <div>
                  <p className="eyebrow">PAYMENT</p>
                  <h3>Pay member due</h3>
                  <p className="form-help">
                    Apply a full or partial payment to a specific due.
                  </p>
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
                        value={duePaymentId}
                        onChange={(event) =>
                          setDuePaymentId(event.target.value)
                        }
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
                        placeholder="e.g. 2500"
                        required
                      />
                    </label>
                  </div>

                  <button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Record Payment'}
                  </button>
                </form>
              </section>

              {paidMemberDue && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">PAYMENT RECORDED</p>
                    <h3>Due payment recorded</h3>
                    <p className="created-id">
                      Due ID: {paidMemberDue.id ?? duePaymentId}
                      {' · '}
                      Member ID: {paidMemberDue.member_id ?? '—'}
                    </p>
                    <p className="created-id">
                      Paid: {formatPKR(paidMemberDue.paid_amount ?? 0)}
                      {' · '}
                      Remaining:{' '}
                      {formatPKR(paidMemberDue.outstanding_amount ?? 0)}
                    </p>
                  </div>
                  <span className="active-badge">Updated</span>
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
                      <h3>Pay settlement</h3>
                      <p className="form-help">
                        This records the final settlement payment and closes
                        the member's settlement.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void handlePayMemberSettlement()}
                    >
                      {loading ? 'Processing...' : 'Pay Settlement'}
                    </button>
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
                  ? 'Here is the current financial position of your committee.'
                  : 'Select a committee to view its current financial position.'}
              </p>
            </div>

            <div className="committee-loader">
              <label htmlFor="committee-id">Committee</label>
              <div>
                <select
                  id="committee-id"
                  value={committeeId}
                  onChange={(event) => {
                    setCommitteeId(event.target.value)
                    setSummary(null)
                    setError('')
                  }}
                  disabled={loading || committees.length === 0}
                >
                  {committees.length === 0 ? (
                    <option value="">No accessible committees</option>
                  ) : (
                    committees.map((committee) => (
                      <option key={committee.id} value={committee.id}>
                        {committee.name ?? committee.committee_name ?? `Committee ${committee.id}`}
                      </option>
                    ))
                  )}
                </select>

                <button
                  onClick={handleLoadCommittee}
                  disabled={loading || !committeeId}
                >
                  {loading ? 'Loading...' : 'Load'}
                </button>
              </div>
            </div>
          </div>

          {error && <div className="error page-error">{error}</div>}

          {!summary && !error && (
            <section className="empty-state">
              <div className="empty-icon">₨</div>
              <h3>No committee loaded</h3>
              <p>
                Enter a committee ID above and load its real financial data
                from the backend.
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
                    Committee ID: {summary.committee_id}
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
                  <small>Member contributions recorded</small>
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
