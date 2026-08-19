import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_BASE = 'http://127.0.0.1:8000'

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

type CreatedMember = {
  id?: number
  committee_id?: number
  name?: string
  joined_on?: string
  is_active?: boolean
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

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem('death_committee_token') ?? '',
  )
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [committeeId, setCommitteeId] = useState('1')
  const [summary, setSummary] = useState<CommitteeSummary | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activePage, setActivePage] = useState('Dashboard')
  const [committeeName, setCommitteeName] = useState('')
  const [createdCommittee, setCreatedCommittee] =
    useState<Record<string, any> | null>(null)

  const [assetCommitteeId, setAssetCommitteeId] = useState('')
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

  const [rateCommitteeId, setRateCommitteeId] = useState('9')
  const [contributionAmount, setContributionAmount] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [createdContributionRate, setCreatedContributionRate] =
    useState<CreatedContributionRate | null>(null)

  const [contributionMemberId, setContributionMemberId] =
    useState('20')
  const [contributionDate, setContributionDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [contributionReference, setContributionReference] =
    useState('')
  const [createdContribution, setCreatedContribution] =
    useState<CreatedContribution | null>(null)

  const [memberCommitteeId, setMemberCommitteeId] = useState('9')
  const [memberName, setMemberName] = useState('')
  const [memberJoinedOn, setMemberJoinedOn] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [createdMember, setCreatedMember] =
    useState<CreatedMember | null>(null)

  const [financialMemberId, setFinancialMemberId] = useState('20')
  const [memberFinancialSummary, setMemberFinancialSummary] =
    useState<MemberFinancialSummary | null>(null)

  const [memberStatement, setMemberStatement] =
    useState<MemberStatementRow[]>([])

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await login(username, password)

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

    const committeeId = Number(assetCommitteeId)
    const purchaseValue = Number(assetPurchaseValue)

    if (!Number.isInteger(committeeId) || committeeId <= 0) {
      setError('Enter a valid committee ID')
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
        committeeId,
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

    const committeeId = Number(rateCommitteeId)
    const amount = Number(contributionAmount)

    if (!Number.isInteger(committeeId) || committeeId <= 0) {
      setError('Enter a valid committee ID')
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
        committeeId,
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

  async function handleCreateMember(event: FormEvent) {
    event.preventDefault()

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const committeeId = Number(memberCommitteeId)
    const name = memberName.trim()

    if (!Number.isInteger(committeeId) || committeeId <= 0) {
      setError('Enter a valid committee ID')
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
        committeeId,
        name,
        memberJoinedOn,
        token,
      )

      setCreatedMember(data)
      setMemberName('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create member',
      )
    } finally {
      setLoading(false)
    }
  }

  function logout() {
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
            'Users',
          ].map((page) => (
            <button
              key={page}
              className={`nav-item ${activePage === page ? 'active' : ''}`}
              onClick={() => setActivePage(page)}
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
            Authenticated
          </div>
        </header>

        <section className="content">
          {activePage === 'Committees' ? (
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
                      Committee ID
                      <input
                        type="number"
                        min="1"
                        value={memberCommitteeId}
                        onChange={(event) =>
                          setMemberCommitteeId(event.target.value)
                        }
                        required
                      />
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
                      {createdMember.committee_id ??
                        memberCommitteeId}
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
                    Member ID
                    <input
                      type="number"
                      min="1"
                      value={financialMemberId}
                      onChange={(event) =>
                        setFinancialMemberId(event.target.value)
                      }
                      required
                    />
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
                      <span>Outstanding dues</span>
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
                      Member ID
                      <input
                        type="number"
                        min="1"
                        value={contributionMemberId}
                        onChange={(event) =>
                          setContributionMemberId(event.target.value)
                        }
                        required
                      />
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
                      Committee ID
                      <input
                        type="number"
                        min="1"
                        value={rateCommitteeId}
                        onChange={(event) =>
                          setRateCommitteeId(event.target.value)
                        }
                        required
                      />
                    </label>

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
                        rateCommitteeId}
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

              <section className="information-card">
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
                      Committee ID
                      <input
                        type="number"
                        min="1"
                        value={assetCommitteeId}
                        onChange={(event) =>
                          setAssetCommitteeId(event.target.value)
                        }
                        required
                      />
                    </label>

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
                        assetCommitteeId}
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

              <section className="information-card">
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

              <section className="information-card">
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

              <section className="information-card">
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

              <section className="information-card">
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

              <section className="information-card">
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

              <section className="information-card">
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

              <section className="information-card">
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

              <section className="information-card">
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
                      Member ID
                      <input
                        type="number"
                        min="1"
                        value={dueMemberId}
                        onChange={(event) => setDueMemberId(event.target.value)}
                        required
                      />
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

              <section className="information-card">
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
                    Member ID
                    <input
                      type="number"
                      min="1"
                      value={duesListMemberId}
                      onChange={(event) =>
                        setDuesListMemberId(event.target.value)
                      }
                      required
                    />
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

              <section className="information-card">
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
                    Member ID
                    <input
                      type="number"
                      min="1"
                      value={outstandingDuesMemberId}
                      onChange={(event) =>
                        setOutstandingDuesMemberId(event.target.value)
                      }
                      required
                    />
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

              <section className="information-card">
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
              <h1>Committee Financial Overview</h1>
              <p>
                Load a committee to view its current financial position.
              </p>
            </div>

            <div className="committee-loader">
              <label htmlFor="committee-id">Committee ID</label>
              <div>
                <input
                  id="committee-id"
                  type="number"
                  min="1"
                  value={committeeId}
                  onChange={(event) => setCommitteeId(event.target.value)}
                />
                <button onClick={handleLoadCommittee} disabled={loading}>
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
                  <p className="eyebrow">COMMITTEE</p>
                  <h3>{summary.committee_name}</h3>
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
