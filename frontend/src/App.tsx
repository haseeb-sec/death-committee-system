import { useEffect, useState } from 'react'
import UsersPage from './components/UsersPage'
import DuesPage from './components/DuesPage'
import MySettlementPage from './components/MySettlementPage'
import MyDeathSupportPage from './components/MyDeathSupportPage'
import MyGoodsPage from './components/MyGoodsPage'
import MyDuesPage from './components/MyDuesPage'
import MyContributionsPage from './components/MyContributionsPage'
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

import { login, logout as logoutApi, resetPassword, issuePasswordReset, changeMyPassword } from './api/auth'
import {
  getCommittees,
  closeCommittee,
  createCommittee,
  getCommitteeSummary,
  getMyCommitteeAccess,
} from './api/committee'
import { getMembers, createMember, leaveMember } from './api/member'
import {
  createContributionRate,
  createContribution,
  getMemberContributions,
  getMemberContributionTotal,
} from './api/contribution'
import { createDeathSupport, getDeathSupportStatus } from './api/deathSupport'
import {
  createCommitteeAsset,
  getAssetValuations,
  getAssetParticipation,
  updateCommitteeAssetValue,
} from './api/asset'
import {
  createMemberGood,
  getMemberGoods,
  getMemberGoodsTotal,
  updateMemberGoodValue,
  getMyMemberGoods,
  getMyGoodsTotal,
} from './api/good'
import { getMemberFinancialSummary, getMemberStatement } from './api/financial'
import {
  getMyMemberDues,
  getMyOutstandingDues,
  createMemberDue,
  getMemberDues,
  getOutstandingDues,
  payMemberDue,
} from './api/due'
import {
  getMySettlementPreview,
  getMemberSettlement,
  createMemberSettlement,
  payMemberSettlement,
} from './api/settlement'
import {
  getUsers,
  grantUserCommitteeAccess,
  getCommitteeAdministrators,
  getUserCommitteeAssignments,
  getUserCommitteeAccess,
  deactivateUserCommitteeAccess,
  createUser,
  deactivateUser,
} from './api/user'

import { decodeJwtPayload, getTimeGreeting, formatPKR } from './utils'
import { useLanguage, loginTranslations, appTranslations } from './i18n'
import AppShell from './components/AppShell'
import ContributionsPage from './components/ContributionsPage'
import DeathSupportPage from './components/DeathSupportPage'
import AssetsPage from './components/AssetsPage'
import GoodsPage from './components/GoodsPage'
import SettlementsPage from './components/SettlementsPage'
import MyFinancialPositionPage from './components/MyFinancialPositionPage'


function App() {

  const [language, setLanguage] = useLanguage()
  const t = loginTranslations[language]
  const appT = appTranslations[language]

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
      const storedUsername = localStorage.getItem('death_committee_username')

      if (!storedToken) return null

      const payload = decodeJwtPayload(storedToken)

      if (!payload) {
        localStorage.removeItem('death_committee_token')
        localStorage.removeItem('death_committee_username')
        return null
      }

      if (
        typeof payload.exp === 'number' &&
        payload.exp * 1000 < Date.now()
      ) {
        localStorage.removeItem('death_committee_token')
        localStorage.removeItem('death_committee_username')
        return null
      }

      return {
        userId: Number(payload.sub),
        username: storedUsername ?? '',
        systemRole: payload.role ?? '',
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
  const [memberUsername, setMemberUsername] = useState('')
  const [memberPassword, setMemberPassword] = useState('')
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

        setCommitteeId((currentId) => {
          const currentStillAccessible = data.some(
            (committee) => String(committee.id ?? '') === currentId,
          )

          if (currentStillAccessible) {
            return currentId
          }

          return data.length > 0 ? String(data[0].id ?? '') : ''
        })

        if (data.length === 0) {
          setSummary(null)
        }
      } catch (err) {
        if (cancelled) return

        setCommittees([])
        setError(
          err instanceof Error
            ? err.message
            : appT.errors.loadAccessibleCommittees,
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
            : appT.errors.loadCommitteeMembers,
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
            : appT.errors.loadCommitteeSummary,
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
            : appT.errors.loadFinancialPosition,
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
            : appT.errors.loadContributionHistory,
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
            : appT.errors.loadDues,
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
            : appT.errors.loadGoods,
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
            : appT.errors.loadDeathSupport,
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
            : appT.errors.loadSettlementPreview,
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
          : appT.errors.issueRecoveryToken,
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
        data.message ?? appT.errors.passwordChanged,
      )
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : appT.errors.changePassword,
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
      setError(appT.errors.recoveryTokenRequired)
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
        data.message ?? appT.errors.passwordReset,
      )
      setRecoveryToken('')
      setRecoveryNewPassword('')
      setRecoveryConfirmPassword('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : appT.errors.resetPassword,
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
      localStorage.setItem('death_committee_username', username)

      setAuthenticatedUser({
        userId: Number(data.user_id),
        username,
        systemRole: data.role ?? '',
        token: data.access_token,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : appT.errors.loginFailed)
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
          : appT.errors.createCommitteeAsset,
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
        appT.invalidWholeNumber,
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
          : appT.errors.updateCommitteeAssetValue,
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
          : appT.errors.loadAssetValuations,
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
          : appT.errors.loadAssetParticipation,
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
          : appT.errors.createMemberGood,
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
          : appT.errors.loadMemberGoods,
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
          : appT.errors.loadMemberGoodsTotal,
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
        appT.invalidWholeNumber,
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
          : appT.errors.updateMemberGoodValue,
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
        err instanceof Error ? err.message : appT.errors.createMemberDue,
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
        err instanceof Error ? err.message : appT.errors.loadMemberDues,
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
          : appT.errors.loadOutstandingDues,
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
        err instanceof Error ? err.message : appT.errors.payMemberDue,
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
          : appT.errors.loadMemberSettlementPreview,
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
          : appT.errors.createMemberSettlement,
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
          : appT.errors.payMemberSettlement,
      )
    } finally {
      setLoading(false)
    }
  }

async function handleCloseCommittee(committeeId: number) {
    if (userRole !== 'super_admin') {
      setError(appT.onlySuperAdminCloseCommittees)
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
        [String(committeeId)]: appT.errors.alreadyClosed,
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
      [String(committeeId)]: appT.errors.closing,
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
        [String(committeeId)]: appT.errors.closed,
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
          : appT.errors.closeCommittee,
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
        err instanceof Error ? err.message : appT.errors.createCommittee,
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
          : appT.errors.createContributionRate,
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
          : appT.errors.recordContribution,
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
          : appT.errors.loadMemberFinancialSummary,
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
          : appT.errors.recordDeathSupport,
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
          : appT.errors.loadDeathSupportStatus,
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleLeaveMember(memberId: number) {
    if (!canWrite) {
      setError('You do not have permission to modify committee members')
      return
    }

    if (!token) {
      setError('You are not authenticated')
      return
    }

    const leavingDate = new Date().toISOString().slice(0, 10)

    setError('')
    setLoading(true)

    try {
      await leaveMember(memberId, leavingDate, token)

      const refreshedMembers = await getMembers(Number(committeeId), token)
      setMembers(
        refreshedMembers.filter(
          (member) => member.committee_id === Number(committeeId),
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : appT.errors.leaveMember,
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

    const username = memberUsername.trim()

    if (!username) {
      setError('Username is required')
      return
    }

    if (!memberPassword) {
      setError('Password is required')
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
        username,
        memberPassword,
        memberJoinedOn,
        token,
      )

      setCreatedMember(data)
      setMemberName('')
      setMemberUsername('')
      setMemberPassword('')

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
        err instanceof Error ? err.message : appT.errors.createMember,
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
          : appT.errors.loadCommitteePermissions,
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
        err instanceof Error ? err.message : appT.errors.loadUsers,
      )
    } finally {
      setUsersLoading(false)
    }
  }

  async function handleAssignUserToCommittee(event: FormEvent) {
    event.preventDefault()

    if (userRole !== 'super_admin') {
      setError(appT.onlySuperAdminAssignUsers)
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
          : appT.errors.assignUserToCommittee,
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
          : appT.errors.loadCommitteeAdministrators,
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
          : appT.errors.loadCommitteeAssignments,
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
          : appT.errors.loadCommitteeAccess,
      )
      setCommitteeAccessStatus({})
    } finally {
      setCommitteeAccessLoading(false)
    }
  }

  async function handleGrantCommitteeAccess(userId: number) {
    if (userRole !== 'super_admin') {
      setError(appT.onlySuperAdminManageAccess)
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
          : appT.errors.grantCommitteeAccess,
      )
    } finally {
      setCommitteeAccessLoading(false)
    }
  }

  async function handleDeactivateCommitteeAccess(userId: number) {
    if (userRole !== 'super_admin') {
      setError(appT.onlySuperAdminManageAccess)
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
          : appT.errors.revokeCommitteeAccess,
      )
    } finally {
      setCommitteeAccessLoading(false)
    }
  }

  async function handleCreateUser(event: FormEvent) {
    if (!canManageSystemUsers) {
      setError(
        appT.ui.onlySuperAdminManageUsers,
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
        appT.ui.onlySuperAdminCreateAdmins,
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
        err instanceof Error ? err.message : appT.errors.createUser,
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
        err instanceof Error ? err.message : appT.errors.deactivateUser,
      )
    } finally {
      setUsersLoading(false)
    }
  }

  async function logout() {
    const currentToken = localStorage.getItem('death_committee_token')

    if (currentToken) {
      try {
        await logoutApi(currentToken)
      } catch {
        // Clear the local session even if the server logout request fails.
      }
    }

    localStorage.removeItem('death_committee_token')
    setAuthenticatedUser(null)
    setSummary(null)
    setUsername('')
    setPassword('')
    setActivePage('Dashboard')
  }

  if (!token) {
    return (
      <main className="login-page">
        <div className="login-language-switcher">
          <div className="login-language-options">
            <button
              type="button"
              className={`login-language-option ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              English
            </button>
            <button
              type="button"
              className={`login-language-option ${language === 'ur' ? 'active' : ''}`}
              onClick={() => setLanguage('ur')}
            >
              اردو
            </button>
          </div>
        </div>

        <div className="login-brand-block">
          <div className="product-logo product-logo--login" aria-label="Death Committee System">
                <svg
                  viewBox="0 0 40 40"
                  role="img"
                  aria-hidden="true"
                >
                  <path
                    d="M8 28.5 20 21l12 7.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 21.5 20 14l12 7.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 14.5 20 7l12 7.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="20" cy="7" r="2.2" fill="currentColor" />
                  <circle cx="8" cy="28.5" r="2.2" fill="currentColor" />
                  <circle cx="32" cy="28.5" r="2.2" fill="currentColor" />
                </svg>
              </div>
          <h1 className="login-brand-name">{t.appName}</h1>
          <p className="login-brand-tagline">{t.tagline}</p>
        </div>

        <div className="login-card">
          <h2 className="login-card-title">
            {recoveryMode ? t.resetTitle : t.signInTitle}
          </h2>
          <p className="login-card-subtitle">
            {recoveryMode ? t.resetSubtitle : t.signInSubtitle}
          </p>

          {recoveryMode ? (
            <form onSubmit={handlePasswordRecovery} className="login-form">
              <label>
                <span>{t.recoveryToken}</span>
                <input
                  value={recoveryToken}
                  onChange={(event) => setRecoveryToken(event.target.value)}
                  autoComplete="off"
                  placeholder={t.recoveryTokenPlaceholder}
                  required
                />
              </label>

              <label>
                <span>{t.newPassword}</span>
                <input
                  type="password"
                  value={recoveryNewPassword}
                  onChange={(event) =>
                    setRecoveryNewPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  placeholder={t.newPasswordPlaceholder}
                  required
                />
              </label>

              <label>
                <span>{t.confirmNewPassword}</span>
                <input
                  type="password"
                  value={recoveryConfirmPassword}
                  onChange={(event) =>
                    setRecoveryConfirmPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  placeholder={t.confirmNewPasswordPlaceholder}
                  required
                />
              </label>

              {error && <div className="login-error">{error}</div>}

              {recoveryMessage && (
                <div className="login-success">{recoveryMessage}</div>
              )}

              <button
                type="submit"
                className="login-submit-button"
                disabled={loading}
              >
                {loading ? t.resetting : t.resetButton}
              </button>

              <button
                type="button"
                className="login-forgot-button"
                onClick={() => {
                  setRecoveryMode(false)
                  setError('')
                  setRecoveryMessage('')
                }}
              >
                {t.backToSignIn}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="login-form">
              <label>
                <span>{t.username}</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder={t.usernamePlaceholder}
                  required
                />
              </label>

              <label>
                <span>{t.password}</span>
                <div className="login-password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder={t.passwordPlaceholder}
                    required
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                        <circle cx="12" cy="12" r="2.8" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 3l18 18" />
                        <path d="M10.6 6.2A10.5 10.5 0 0 1 12 6c6 0 9.5 6 9.5 6a18.7 18.7 0 0 1-3.1 3.9M6.2 6.8C3.8 8.4 2.5 12 2.5 12s3.5 6 9.5 6c1.4 0 2.7-.3 3.8-.8" />
                        <path d="M9.9 9.9a2.8 2.8 0 0 0 4.2 4.2" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              {error && <div className="login-error">{error}</div>}

              <button
                type="submit"
                className="login-submit-button"
                disabled={loading}
              >
                {loading ? t.signingIn : t.signInButton}
              </button>

              <button
                type="button"
                className="login-forgot-button"
                onClick={() => {
                  setRecoveryMode(true)
                  setError('')
                  setRecoveryMessage('')
                }}
              >
                {t.forgotPassword}
              </button>
            </form>
          )}
        </div>
      </main>
    )
  }


  return (
    <AppShell
      activePage={activePage}
      setActivePage={setActivePage}
      isSuperAdmin={isSuperAdmin}
      isSelectedCommitteeAdmin={isSelectedCommitteeAdmin}
      userRole={userRole}
      username={username}
      language={language}
      setLanguage={setLanguage}
      logout={logout}
      appT={appT}
    >
          {activePage === 'Users' && userRole !== 'super_admin' ? (
            <section className="module-placeholder">
              <div className="module-placeholder-icon">DC</div>
              <p className="eyebrow">ACCESS</p>
              <h1>{appT.ui.accessRestricted}</h1>
              <p>
                {appT.ui.onlySuperAdminManageUsers}
              </p>
            </section>
          ) : activePage === 'Committees' ? (
            <section className="committee-module">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">{appT.committeesManagement}</p>
                  <h1>{appT.navigation.Committees}</h1>
                  <p>
                    {appT.committeesDescription}
                  </p>
                </div>
              </div>

              {error && <div className="error page-error">{error}</div>}

              {canWrite && (
                <section className="information-card">
                  <div>
                    <p className="eyebrow">{appT.newCommittee}</p>
                    <h3>{appT.createCommitteeHeading}</h3>
                  <p className="form-help">
                    {appT.createCommitteeDescription}
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleCreateCommittee}
                >
                  <label>
                    {appT.committeeName}
                    <input
                      value={committeeName}
                      onChange={(event) =>
                        setCommitteeName(event.target.value)
                      }
                      placeholder={appT.committeeNamePlaceholder}
                      required
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? appT.creating : appT.createCommittee}
                  </button>
                </form>
                </section>
              )}

              {committees.length > 0 && (
                <section className="information-card">
                  <div>
                    <p className="eyebrow">{appT.committeeManagement}</p>
                    <h3>{appT.committeeAdministrators}</h3>
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
                              {appT.committeeId}: {committee.id}
                            </span>
                            <div className="committee-access-actions">
                              <strong>
                                {committee.is_active === false
                                  ? appT.errors.closed
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
                                      ] === appT.closing
                                    }
                                  >
                                    {committeeLifecycleStatus[
                                      String(committee.id)
                                    ] === appT.closing
                                      ? appT.closing
                                      : appT.closeCommittee}
                                  </button>
                                )}
                            </div>

                            <div className="form-help">
                              <strong>{appT.committeeAdministrators}</strong>

                              {administrators.length === 0 ? (
                                <span>
                                  {appT.noActiveCommitteeAdministrator}
                                </span>
                              ) : (
                                administrators.map(
                                  (admin: Record<string, any>) => (
                                    <span key={admin.user_id}>
                                      • {admin.username} ·{' '}
                                      {admin.role === 'committee_admin'
                                        ? appT.roles.committeeAdmin
                                        : admin.role} ·{' '}
                                      {admin.is_active ? appT.active : appT.closed}
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
                                : appT.ui.viewAdministrators}
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
                                {appT.manageAccess}
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
                    <p className="eyebrow">{appT.created}</p>
                    <h3>
                      {createdCommittee.name ??
                        createdCommittee.committee_name ??
                        appT.committeeCreated}
                    </h3>

                    {createdCommittee.id && (
                      <p className="created-id">
                        {appT.committeeId}: {createdCommittee.id}
                      </p>
                    )}
                  </div>

                  <span className="active-badge">{appT.created}</span>
                </section>
              )}
            </section>
          ) : activePage === 'Members' ? (
            <>
              <section className="page-heading">
                <div>
                  <p className="eyebrow">{appT.membersManagement}</p>
                  <h1>{appT.membersManagement}</h1>
                  <p>
                    {appT.membersDescription}
                  </p>
                </div>
              </section>

              {error && <div className="error page-error">{error}</div>}

              {canWrite && (
                <section className="information-card">
                  <div>
                    <p className="eyebrow">{appT.newMember}</p>
                    <h3>{appT.addMember}</h3>
                  <p className="form-help">
                    {appT.memberCreateDescription}
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
                        placeholder={appT.fullNamePlaceholder}
                        required
                      />
                    </label>

                    <label>
                      Username
                      <input
                        value={memberUsername}
                        onChange={(event) =>
                          setMemberUsername(event.target.value)
                        }
                        placeholder={appT.usernamePlaceholder}
                        required
                      />
                    </label>

                    <label>
                      Password
                      <input
                        type="password"
                        value={memberPassword}
                        onChange={(event) =>
                          setMemberPassword(event.target.value)
                        }
                        placeholder={appT.passwordPlaceholder}
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
                    {loading ? appT.creating : appT.createMember}
                  </button>
                </form>
                </section>
              )}

              {createdMember && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">{appT.created}</p>
                    <h3>
                      {createdMember.name ?? appT.memberCreated}
                    </h3>

                    <p className="created-id">
                      {appT.committeeId}:{' '}
                      {createdMember.committee_id ?? committeeId}
                      {' · '}
                      {appT.joiningDate}:{' '}
                      {createdMember.joined_on ?? memberJoinedOn}
                    </p>

                    {createdMember.id !== undefined && (
                      <p className="created-id">
                        {appT.memberId}: {createdMember.id}
                      </p>
                    )}
                  </div>

                  <span className="active-badge">{appT.created}</span>
                </section>
              )}

              <section className="information-card">
                <div>
                  <p className="eyebrow">{appT.committeeMembers}</p>
                  <h3>
                    {committees.find(
                      (committee) =>
                        String(committee.id) === committeeId,
                    )?.name ??
                      committees.find(
                        (committee) =>
                          String(committee.id) === committeeId,
                      )?.committee_name ??
                      appT.ui.selectedCommittee}
                  </h3>
                  <p className="form-help">
                    {appT.membersRegisteredDescription}
                  </p>
                </div>

                {membersLoading ? (
                  <p className="form-help">{appT.loadingMembers}</p>
                ) : members.length === 0 ? (
                  <p className="form-help">
                    {appT.noMembersRegistered}
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
                            {appT.memberId}: {member.id} · {appT.joined}:{' '}
                            {member.joined_on}
                          </span>
                        </div>

                        <div>
                          <span
                            className={
                              member.is_active
                                ? 'active-badge'
                                : 'status-badge'
                            }
                          >
                            {member.is_active ? appT.active : appT.inactive}
                          </span>

                          {canWrite && member.is_active && (
                            <button
                              type="button"
                              onClick={() => void handleLeaveMember(member.id)}
                            >
                              Leave
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="information-card">
                <div>
                  <p className="eyebrow">{appT.financialSummary}</p>
                  <h3>{appT.memberFinancialPosition}</h3>
                  <p className="form-help">
                    {appT.loadMemberFinancialPosition}
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
                          ? '{appT.loadingMembers}'
                          : members.length === 0
                            ? appT.noMembersAvailable
                            : appT.selectMember}
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
                    {loading ? appT.loadingMembers : appT.loadSummary}
                  </button>
                </form>
              </section>

              {memberFinancialSummary && (
                <>
                  <section className="committee-banner">
                    <div>
                      <p className="eyebrow">{appT.roles.member}</p>
                      <h3>{memberFinancialSummary.member_name}</h3>

                      <p className="created-id">
                        {appT.memberId}: {memberFinancialSummary.member_id}
                        {' · '}
                        {appT.joiningDate}: {memberFinancialSummary.joined_on}
                      </p>

                      {memberFinancialSummary.left_on && (
                        <p className="created-id">
                          {appT.leftOn}: {memberFinancialSummary.left_on}
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
                        ? appT.active
                        : appT.inactive}
                    </span>
                  </section>

                  <section className="finpos-section">
                    <p className="finpos-section-title">{appT.currentPosition}</p>

                    <div className="finpos-history-row">
                      <span>{appT.totalContributions}</span>
                      <strong>
                        {formatPKR(
                          memberFinancialSummary.total_contributions,
                        )}
                      </strong>
                    </div>

                    <div className="finpos-history-row">
                      <span>{appT.contributionBalance}</span>
                      <strong>
                        {formatPKR(
                          memberFinancialSummary.contribution_balance,
                        )}
                      </strong>
                    </div>

                    <div className="finpos-history-row">
                      <span>{appT.committeeAssetShare}</span>
                      <strong>
                        {formatPKR(memberFinancialSummary.asset_share)}
                      </strong>
                    </div>

                    <div className="finpos-history-row">
                      <span>{appT.goodsValue}</span>
                      <strong>
                        {formatPKR(memberFinancialSummary.goods_value)}
                      </strong>
                    </div>

                    <div className="finpos-history-row">
                      <span>{appT.ordinaryDues}</span>
                      <strong>
                        {formatPKR(
                          memberFinancialSummary.ordinary_dues,
                        )}
                      </strong>
                    </div>

                    <div className="finpos-history-row">
                      <span>{appT.qarzEHasana}</span>
                      <strong>
                        {formatPKR(
                          memberFinancialSummary.qarz_e_hasana_dues,
                        )}
                      </strong>
                    </div>

                    <div className="finpos-history-row">
                      <span>{appT.totalOutstandingDues}</span>
                      <strong>
                        {formatPKR(
                          memberFinancialSummary.outstanding_dues,
                        )}
                      </strong>
                    </div>

                    <div className="finpos-history-row">
                      <span>{appT.grossCurrentValue}</span>
                      <strong>
                        {formatPKR(
                          memberFinancialSummary.current_gross_value,
                        )}
                      </strong>
                    </div>

                    <div className="finpos-history-row">
                      <span>{appT.finalCurrentValue}</span>
                      <strong>
                        {formatPKR(
                          memberFinancialSummary.current_final_value,
                        )}
                      </strong>
                    </div>
                  </section>

                  <section className="information-card">
                    <p className="eyebrow">{appT.accountHistory}</p>
                    <h3>{appT.memberStatement}</h3>

                    {memberStatement.length === 0 ? (
                      <p className="form-help">
                        {appT.noFinancialTransactions}
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
                      <p className="eyebrow">{appT.deathSupport}</p>
                      <h3>{appT.supportRecord}</h3>

                      <div className="position-row">
                        <span>{appT.beneficiary}</span>
                        <strong>
                          {memberFinancialSummary.death_support
                            .beneficiary_name}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>{appT.amount}</span>
                        <strong>
                          {formatPKR(
                            memberFinancialSummary.death_support.amount,
                          )}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>{appT.supportDate}</span>
                        <strong>
                          {memberFinancialSummary.death_support
                            .support_date}
                        </strong>
                      </div>
                    </section>
                  )}

                  {memberFinancialSummary.settlement && (
                    <section className="information-card">
                      <p className="eyebrow">{appT.settlement}</p>
                      <h3>{appT.settlementRecord}</h3>

                      <div className="position-row">
                        <span>{appT.settlementDate}</span>
                        <strong>
                          {memberFinancialSummary.settlement
                            .settlement_date}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>{appT.grossAmount}</span>
                        <strong>
                          {formatPKR(
                            memberFinancialSummary.settlement
                              .gross_amount,
                          )}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>{appT.outstandingAmounts}</span>
                        <strong>
                          {formatPKR(
                            memberFinancialSummary.settlement
                              .outstanding_dues,
                          )}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>{appT.finalAmount}</span>
                        <strong>
                          {formatPKR(
                            memberFinancialSummary.settlement
                              .final_amount,
                          )}
                        </strong>
                      </div>

                      <div className="position-row">
                        <span>{appT.status}</span>
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
            <ContributionsPage
              appT={appT}
              members={members}
              membersLoading={membersLoading}
              error={error}
              canWrite={canWrite}
              loading={loading}
              contributionMemberId={contributionMemberId}
              setContributionMemberId={setContributionMemberId}
              contributionDate={contributionDate}
              setContributionDate={setContributionDate}
              contributionReference={contributionReference}
              setContributionReference={setContributionReference}
              createdContribution={createdContribution}
              contributionAmount={contributionAmount}
              setContributionAmount={setContributionAmount}
              effectiveFrom={effectiveFrom}
              setEffectiveFrom={setEffectiveFrom}
              createdContributionRate={createdContributionRate}
              committeeId={committeeId}
              handleCreateContribution={handleCreateContribution}
              handleCreateContributionRate={handleCreateContributionRate}
            />
          ) : activePage === 'Death Support' ? (
            <DeathSupportPage
              appT={appT}
              members={members}
              error={error}
              canWrite={canWrite}
              loading={loading}
              formatPKR={formatPKR}
              setDeathSupportStatus={setDeathSupportStatus}
              deathSupportMemberId={deathSupportMemberId}
              setDeathSupportMemberId={setDeathSupportMemberId}
              deathSupportBeneficiaryName={deathSupportBeneficiaryName}
              setDeathSupportBeneficiaryName={setDeathSupportBeneficiaryName}
              deathSupportAmount={deathSupportAmount}
              setDeathSupportAmount={setDeathSupportAmount}
              deathSupportDate={deathSupportDate}
              setDeathSupportDate={setDeathSupportDate}
              deathSupportReference={deathSupportReference}
              setDeathSupportReference={setDeathSupportReference}
              createdDeathSupport={createdDeathSupport}
              deathSupportStatusMemberId={deathSupportStatusMemberId}
              setDeathSupportStatusMemberId={setDeathSupportStatusMemberId}
              deathSupportStatus={deathSupportStatus}
              handleCreateDeathSupport={handleCreateDeathSupport}
              handleLoadDeathSupportStatus={handleLoadDeathSupportStatus}
            />
          ) : activePage === 'Users' ? (
              <UsersPage
              error={error}
              username={username}
              setUsername={setUsername}
              issuedResetToken={issuedResetToken}
              issuedResetExpiry={issuedResetExpiry}
              appT={appT}
                passwordChangeMessage={passwordChangeMessage}
              canWrite={canWrite}
              handleChangePassword={handleChangePassword}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmNewPassword={confirmNewPassword}
              setConfirmNewPassword={setConfirmNewPassword}
              users={users}
              usersLoading={usersLoading}
              userPassword={userPassword}
              setUserPassword={setUserPassword}
              userCreateRole={userCreateRole}
              setUserCreateRole={setUserCreateRole}
              createdUser={createdUser}
              handleCreateUser={handleCreateUser}
              handleLoadUsers={handleLoadUsers}
              handleDeactivateUser={handleDeactivateUser}
              handleIssuePasswordReset={handleIssuePasswordReset}
              assignmentUserId={assignmentUserId}
              setAssignmentUserId={setAssignmentUserId}
              assignmentCommitteeId={assignmentCommitteeId}
              setAssignmentCommitteeId={setAssignmentCommitteeId}
              assignmentIsAdmin={assignmentIsAdmin}
              setAssignmentIsAdmin={setAssignmentIsAdmin}
              handleAssignUserToCommittee={handleAssignUserToCommittee}
              committees={committees}
              committeeAdministrators={committeeAdministrators}
              userCommitteeAssignments={userCommitteeAssignments}
              assignmentOverviewLoading={assignmentOverviewLoading}
              handleLoadUserCommitteeAssignments={handleLoadUserCommitteeAssignments}
              committeeId={committeeId}
              selectedAccessUserId={selectedAccessUserId}
              committeeAccessLoading={committeeAccessLoading}
              handleLoadCommitteeAccess={handleLoadCommitteeAccess}
              handleGrantCommitteeAccess={handleGrantCommitteeAccess}
              handleDeactivateCommitteeAccess={handleDeactivateCommitteeAccess}
              committeeAccessStatus={committeeAccessStatus}
              loading={loading}
              />
) : activePage === 'Assets' ? (
            <AssetsPage
              error={error}
              appT={appT}
                canWrite={canWrite}
              loading={loading}
              assetName={assetName}
              setAssetName={setAssetName}
              assetPurchaseDate={assetPurchaseDate}
              setAssetPurchaseDate={setAssetPurchaseDate}
              assetPurchaseValue={assetPurchaseValue}
              setAssetPurchaseValue={setAssetPurchaseValue}
              assetDescription={assetDescription}
              setAssetDescription={setAssetDescription}
              createdCommitteeAsset={createdCommitteeAsset}
              assetValueAssetId={assetValueAssetId}
              setAssetValueAssetId={setAssetValueAssetId}
              assetValuationDate={assetValuationDate}
              setAssetValuationDate={setAssetValuationDate}
              assetNewValue={assetNewValue}
              setAssetNewValue={setAssetNewValue}
              updatedCommitteeAssetValue={updatedCommitteeAssetValue}
              valuationAssetId={valuationAssetId}
              setValuationAssetId={setValuationAssetId}
              assetValuations={assetValuations}
              participationAssetId={participationAssetId}
              setParticipationAssetId={setParticipationAssetId}
              assetParticipation={assetParticipation}
              handleCreateCommitteeAsset={handleCreateCommitteeAsset}
              handleUpdateCommitteeAssetValue={handleUpdateCommitteeAssetValue}
              handleLoadAssetValuations={handleLoadAssetValuations}
              handleLoadAssetParticipation={handleLoadAssetParticipation}
              formatPKR={formatPKR}
              committeeId={committeeId}
            />
) : activePage === 'Goods' ? (
          <GoodsPage
            appT={appT}
            canWrite={canWrite}
            loading={loading}
            goodsMemberId={goodsMemberId}
            setGoodsMemberId={setGoodsMemberId}
            goodName={goodName}
            setGoodName={setGoodName}
            goodPurchaseDate={goodPurchaseDate}
            setGoodPurchaseDate={setGoodPurchaseDate}
            goodPurchasePrice={goodPurchasePrice}
            setGoodPurchasePrice={setGoodPurchasePrice}
            goodDescription={goodDescription}
            setGoodDescription={setGoodDescription}
            createdMemberGood={createdMemberGood}
            goodsListMemberId={goodsListMemberId}
            setGoodsListMemberId={setGoodsListMemberId}
            memberGoods={memberGoods}
            goodsTotalMemberId={goodsTotalMemberId}
            setGoodsTotalMemberId={setGoodsTotalMemberId}
            memberGoodsTotal={memberGoodsTotal}
            goodValueId={goodValueId}
            setGoodValueId={setGoodValueId}
            goodValuationDate={goodValuationDate}
            setGoodValuationDate={setGoodValuationDate}
            goodNewValue={goodNewValue}
            setGoodNewValue={setGoodNewValue}
            updatedMemberGoodValue={updatedMemberGoodValue}
            handleCreateMemberGood={handleCreateMemberGood}
            handleLoadMemberGoods={handleLoadMemberGoods}
            handleLoadMemberGoodsTotal={handleLoadMemberGoodsTotal}
            handleUpdateMemberGoodValue={handleUpdateMemberGoodValue}
            formatPKR={formatPKR}
          />
) : activePage === 'Dues' ? (
            <DuesPage
              appT={appT}
              members={members}
              membersLoading={membersLoading}
              error={error}
              canWrite={canWrite}
              loading={loading}
              dueMemberId={dueMemberId}
              setDueMemberId={setDueMemberId}
              dueAmount={dueAmount}
              setDueAmount={setDueAmount}
              dueDate={dueDate}
              setDueDate={setDueDate}
              dueDescription={dueDescription}
              setDueDescription={setDueDescription}
              dueReference={dueReference}
              setDueReference={setDueReference}
              createdMemberDue={createdMemberDue}
              duesListMemberId={duesListMemberId}
              setDuesListMemberId={setDuesListMemberId}
              memberDues={memberDues}
              outstandingDuesMemberId={outstandingDuesMemberId}
              setOutstandingDuesMemberId={setOutstandingDuesMemberId}
              memberOutstandingDues={memberOutstandingDues}
              duePaymentId={duePaymentId}
              setDuePaymentId={setDuePaymentId}
              duePaymentAmount={duePaymentAmount}
              setDuePaymentAmount={setDuePaymentAmount}
              paidMemberDue={paidMemberDue}
              handleCreateMemberDue={handleCreateMemberDue}
              handleLoadMemberDues={handleLoadMemberDues}
              handleLoadOutstandingDues={handleLoadOutstandingDues}
              handlePayMemberDue={handlePayMemberDue}
              formatPKR={formatPKR}
            />
) : activePage === 'Settlements' ? (
            <SettlementsPage
              appT={appT}
              summary={summary}
              committees={committees}
              committeeId={committeeId}
              members={members}
              membersLoading={membersLoading}
              loading={loading}
              canWrite={canWrite}
              formatPKR={formatPKR}
              settlementMemberId={settlementMemberId}
              setSettlementMemberId={setSettlementMemberId}
              settlementDate={settlementDate}
              setSettlementDate={setSettlementDate}
              settlementPreview={settlementPreview}
              setSettlementPreview={setSettlementPreview}
              createdMemberSettlement={createdMemberSettlement}
              setCreatedMemberSettlement={setCreatedMemberSettlement}
              paidMemberSettlement={paidMemberSettlement}
              setPaidMemberSettlement={setPaidMemberSettlement}
              handleLoadMemberSettlement={handleLoadMemberSettlement}
              handleCreateMemberSettlement={handleCreateMemberSettlement}
              handlePayMemberSettlement={handlePayMemberSettlement}
            />
          ) : activePage === 'My Financial Position' ? (
            <MyFinancialPositionPage
              appT={appT}
              members={members}
              myFinancialSummaryLoading={myFinancialSummaryLoading}
              myFinancialSummaryError={myFinancialSummaryError}
              myFinancialSummary={myFinancialSummary}
              myStatement={myStatement}
              formatPKR={formatPKR}
            />
          ) : activePage === 'My Contributions' ? (
            <MyContributionsPage
              appT={appT}
              members={members}
              myContributionsLoading={myContributionsLoading}
              myContributionsError={myContributionsError}
              myContributions={myContributions}
              myContributionTotal={myContributionTotal}
              formatPKR={formatPKR}
            />
          ) : activePage === 'My Dues' ? (
            <MyDuesPage
              appT={appT}
              members={members}
              myDuesLoading={myDuesLoading}
              myDuesError={myDuesError}
              myOutstandingDues={myOutstandingDues}
              myDues={myDues}
              formatPKR={formatPKR}
            />
          ) : activePage === 'My Goods' ? (            <MyGoodsPage
              appT={appT}
              members={members}
              myGoodsLoading={myGoodsLoading}
              myGoodsError={myGoodsError}
              myGoods={myGoods}
              myGoodsTotal={myGoodsTotal}
              formatPKR={formatPKR}
            />
          ) : activePage === 'My Death Support' ? (            <MyDeathSupportPage
              appT={appT}
              members={members}
              myDeathSupportLoading={myDeathSupportLoading}
              myDeathSupportError={myDeathSupportError}
              myDeathSupportInfo={myDeathSupportInfo}
              formatPKR={formatPKR}
            />
          ) : activePage === 'My Settlement' ? (            <MySettlementPage
              appT={appT}
              members={members}
              mySettlementLoading={mySettlementLoading}
              mySettlementError={mySettlementError}
              mySettlementPreview={mySettlementPreview}
              formatPKR={formatPKR}
            />
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
                {getTimeGreeting()},{' '}
                {members.find(
                  (member) =>
                    Number(member.user_id) === authenticatedUser?.userId,
                )?.name ?? authenticatedUser?.username ?? username}
              </p>

              <h1 className="dashboard-title">Dashboard</h1>

              <p>
                {userRole === 'super_admin'
                  ? appT.dashboardSuperAdminDescription
                  : userRole === 'committee_admin'
                    ? summary
                      ? appT.dashboardCommitteeAdminDescription
                      : appT.dashboardCommitteeAdminNoWorkspace
                    : appT.dashboardMemberDescription}
              </p>
            </div>

            <div className="committee-loader">
              <label htmlFor="committee-id">Committee workspace</label>

              <div className="committee-context-help">
                {committees.length > 1
                    ? appT.chooseCommitteeWorkspace
                    : appT.committeeAvailableToYou}
              </div>

              <select
                id="committee-id"
                value={committeeId}
                onChange={(event) => {
                  const nextCommitteeId = event.target.value
                  setError('')
                  setSummary(null)
                  setCommitteeId(nextCommitteeId)
                }}
                disabled={loading || committees.length === 0}
              >
                {committees.length === 0 ? (
                  <option value="">{appT.noCommitteeAvailable}</option>
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
                {appT.committeeScopeNote}
              </p>
            </div>
          </div>

          {error && <div className="error page-error">{error}</div>}

          {!summary && !error && (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">₨</div>
              <h3>{appT.noCommitteeWorkspaceLoaded}</h3>
              <p>
                {appT.chooseCommitteeWorkspaceDescription}
              </p>
            </div>
          )}

          {summary && (
            <>
              <section className="dashboard-financial-section">
                <div className="dashboard-section-heading">
                  <div>
                    <p className="eyebrow">{appT.financialPosition}</p>
                    <h2>{appT.committeeFinances}</h2>
                    <p>
                      {appT.financialPositionDescription}
                    </p>
                  </div>
                </div>

                <div className="dashboard-hero">
                <p className="dashboard-hero-label">
                  {appT.currentCommitteeCashBalance}
                </p>
                <p className="dashboard-hero-amount">
                  {formatPKR(summary.cash_balance)}
                </p>
                <p className="dashboard-hero-note">
                  {appT.currentCashNote}{' '}
                  {summary.committee_name}.
                </p>
              </div>

              <div className="finpos-grid">
                <div className="finpos-stat-card finpos-stat-card--positive">
                  <p className="finpos-stat-label">
                    {appT.totalMemberContributions}
                  </p>
                  <p className="finpos-stat-amount">
                    {formatPKR(summary.total_contributions)}
                  </p>
                </div>

                  <div className="finpos-stat-card finpos-stat-card--neutral">
                    <p className="finpos-stat-label">
                      {appT.totalDeathSupportPaid}
                    </p>
                    <p className="finpos-stat-amount">
                      {formatPKR(summary.total_death_support)}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
          </>
          )}
    </AppShell>
  )
}

export default App
