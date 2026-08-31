export type CommitteeSummary = {
  committee_id: number
  committee_name: string
  is_active: boolean
  total_contributions: number
  total_death_support: number
  cash_balance: number
}

export type CreatedCommittee = {
  is_active?: boolean
  id?: number
  name?: string
  committee_name?: string
}

export type CreatedContributionRate = {
  id?: number
  committee_id?: number
  amount?: number
  effective_from?: string
}

export type CreatedContribution = {
  journal_entry_id?: number
  member_id?: number
  contribution_date?: string
  reference?: string | null
  description?: string
}

export type CreatedDeathSupport = {
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

export type DeathSupportStatus = {
  member_id: number
  death_support_recorded: boolean
  support_id: number | null
  amount: number
  support_date: string | null
}

export type CreatedMember = {
  id?: number
  committee_id?: number
  name?: string
  joined_on?: string
  is_active?: boolean
}

export type Member = {
  id: number
  committee_id: number
  name: string
  joined_on: string
  left_on: string | null
  is_active: boolean
}

export type CreatedAsset = {
  id?: number
  committee_id?: number
  name?: string
  purchase_date?: string
  purchase_value?: number
  description?: string | null
}

export type AssetValuation = {
  id: number
  asset_id: number
  valuation_date: string
  value: number
}

export type AssetParticipation = {
  id: number
  ownership_units: number
  asset_id: number
  member_id: number
  total_units: number
}

export type MemberStatementRow = {
  date: string
  description: string
  reference: string | null
  amount: number
}

export type ContributionHistoryEntry = {
  journal_entry_id: number
  member_id: number
  contribution_date: string
  amount: number
  reference: string | null
  description: string
}

export type ContributionTotalResponse = {
  member_id: number
  total_contributed: number
}

export type MemberDueRecord = {
  id: number
  committee_id: number
  member_id: number
  amount: number
  paid_amount: number
  outstanding_amount: number
  due_date: string
  description: string
  reference: string | null
}

export type MemberOutstandingDuesResponse = {
  member_id: number
  outstanding_dues: number
}

export type MemberGoodRecord = {
  id: number
  member_id: number
  name: string
  purchase_date: string
  purchase_price: number
  current_value: number
  description: string | null
  is_active: boolean
}

export type MemberGoodsTotalResponse = {
  member_id: number
  total_goods_value: number
}

export type SettlementPreview = {
  member_id: number
  contribution_balance: number
  asset_share: number
  goods_value: number
  outstanding_dues: number
  gross_amount: number
  final_amount: number
}

export type AuthenticatedUser = {
  username: string
  systemRole: string
  token: string
}

export type MemberFinancialSummary = {
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
