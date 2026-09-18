import { useEffect, useState } from 'react'

export type Language = 'en' | 'ur'

export const LANGUAGE_STORAGE_KEY = 'death_committee_language'

export const RTL_LANGUAGES: Language[] = ['ur']

export function isRtlLanguage(language: Language): boolean {
  return RTL_LANGUAGES.includes(language)
}

/**
 * Manages the selected UI language, persisted to localStorage.
 * Also keeps the document direction and language in sync.
 */
export function useLanguage(): [Language, (language: Language) => void] {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)

    if (stored === 'en' || stored === 'ur') {
      return stored
    }

    return 'en'
  })

  useEffect(() => {
    document.documentElement.dir = isRtlLanguage(language) ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  function setLanguage(next: Language) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
    setLanguageState(next)
  }

  return [language, setLanguage]
}

export type LoginTranslation = {
  appName: string
  tagline: string
  signInTitle: string
  signInSubtitle: string
  resetTitle: string
  resetSubtitle: string
  username: string
  usernamePlaceholder: string
  password: string
  passwordPlaceholder: string
  signInButton: string
  signingIn: string
  forgotPassword: string
  backToSignIn: string
  recoveryToken: string
  recoveryTokenPlaceholder: string
  newPassword: string
  newPasswordPlaceholder: string
  confirmNewPassword: string
  confirmNewPasswordPlaceholder: string
  resetButton: string
  resetting: string
  languageLabel: string
}

export const loginTranslations: Record<Language, LoginTranslation> = {
  en: {
    appName: 'Death Committee System',
    tagline: 'Manage contributions, support, and dues in one place.',
    signInTitle: 'Sign in',
    signInSubtitle: 'Enter your username and password to continue.',
    resetTitle: 'Reset your password',
    resetSubtitle: 'Use the recovery token given to you by your admin.',
    username: 'Username',
    usernamePlaceholder: 'Enter your username',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    signInButton: 'Sign in',
    signingIn: 'Signing in...',
    forgotPassword: 'Forgot password?',
    backToSignIn: 'Back to sign in',
    recoveryToken: 'Recovery token',
    recoveryTokenPlaceholder: 'Enter your recovery token',
    newPassword: 'New password',
    newPasswordPlaceholder: 'Enter your new password',
    confirmNewPassword: 'Confirm new password',
    confirmNewPasswordPlaceholder: 'Confirm your new password',
    resetButton: 'Reset password',
    resetting: 'Resetting...',
    languageLabel: 'Language',
  },
  ur: {
    appName: 'ڈیتھ کمیٹی سسٹم',
    tagline: 'چندہ، امداد اور واجبات ایک ہی جگہ پر سنبھالیں۔',
    signInTitle: 'سائن ان کریں',
    signInSubtitle: 'جاری رکھنے کے لیے اپنا یوزر نیم اور پاسورڈ درج کریں۔',
    resetTitle: 'پاسورڈ دوبارہ ترتیب دیں',
    resetSubtitle: 'اپنے ایڈمن کی طرف سے دیا گیا ریکوری ٹوکن استعمال کریں۔',
    username: 'یوزر نیم',
    usernamePlaceholder: 'اپنا یوزر نیم درج کریں',
    password: 'پاسورڈ',
    passwordPlaceholder: 'اپنا پاسورڈ درج کریں',
    signInButton: 'سائن ان کریں',
    signingIn: 'سائن ان ہو رہا ہے...',
    forgotPassword: 'پاسورڈ بھول گئے؟',
    backToSignIn: 'واپس سائن ان پر جائیں',
    recoveryToken: 'ریکوری ٹوکن',
    recoveryTokenPlaceholder: 'اپنا ریکوری ٹوکن درج کریں',
    newPassword: 'نیا پاسورڈ',
    newPasswordPlaceholder: 'اپنا نیا پاسورڈ درج کریں',
    confirmNewPassword: 'نئے پاسورڈ کی تصدیق کریں',
    confirmNewPasswordPlaceholder: 'اپنے نئے پاسورڈ کی تصدیق کریں',
    resetButton: 'پاسورڈ ری سیٹ کریں',
    resetting: 'ری سیٹ ہو رہا ہے...',
    languageLabel: 'زبان',
  },
}

export type AppTranslation = {
  appName: string
  systemName: string
  navigation: Record<string, string>
  roles: {
    superAdmin: string
    committeeAdmin: string
    member: string
  }
  signOut: string
  languageLabel: string
  languageEnglish: string
  languageUrdu: string
  committeeWorkspace: string
  chooseCommittee: string
  currentCommittee: string
  noCommitteeAvailable: string
  noCommitteeWorkspaceLoaded: string
  chooseCommitteeToOpen: string
  committeeScopeNote: string
  financialPosition: string
  committeeFinances: string
  currentCashBalance: string
  totalMemberContributions: string
  totalDeathSupportPaid: string
  dashboard: string
  dashboardSuperAdminDescription: string
  dashboardCommitteeAdminDescription: string
  dashboardCommitteeAdminNoWorkspace: string
  dashboardMemberDescription: string
  chooseCommitteeWorkspace: string
  committeeAvailableToYou: string
  chooseCommitteeWorkspaceDescription: string
  financialPositionDescription: string
  currentCommitteeCashBalance: string
  currentCashNote: string

  committeesManagement: string
  committeesDescription: string
  newCommittee: string
  createCommitteeHeading: string
  createCommitteeDescription: string
  committeeName: string
  committeeNamePlaceholder: string
  creating: string
  createCommittee: string
  committeeManagement: string
  committeeAdministrators: string
  committeeAdministratorsDescription: string
  committeeId: string
  closed: string
  active: string
  closing: string
  closeCommittee: string
  noActiveCommitteeAdministrator: string
  viewAdministrators: string
  manageAccess: string
  committeeCreated: string

  membersManagement: string
  membersDescription: string
  newMember: string
  addMember: string
  memberCreateDescription: string
  committee: string
  fullName: string
  fullNamePlaceholder: string
  username: string
  usernamePlaceholder: string
  password: string
  passwordPlaceholder: string
  joiningDate: string
  createMember: string
  memberCreated: string
  contributionsEyebrow: string
  currentContributionAmounts: string
  contributionsDescription: string
  recordContribution: string
  recordMemberContribution: string
  contributionRateAutoSelected: string
  member: string
  loadingMembers: string
  noMembersAvailable: string
  selectMember: string
  paymentDate: string
  reference: string
  referencePlaceholder: string
  recording: string
  recordContributionButton: string
  recorded: string
  contributionRecorded: string
  date: string
  journalEntryId: string
  newRate: string
  createContributionRateHeading: string
  createContributionRateDescription: string
  contributionAmount: string
  contributionAmountPlaceholder: string
  effectiveFrom: string
  createCurrentContributionAmount: string
  currentContributionAmountCreated: string
  rateId: string
  deathSupportEyebrow: string
  deathSupportPageTitle: string
  deathSupportDescription: string
  recordSupport: string
  recordDeathSupportHeading: string
  recordDeathSupportDescription: string
  beneficiaryName: string
  beneficiaryNamePlaceholder: string
  supportAmount: string
  supportAmountPlaceholder: string
  supportDate: string
  optionalReference: string
  optionalReferencePlaceholder: string
  recordDeathSupportButton: string
  deathSupportRecorded: string
  memberFunded: string
  qarzEHasana: string
  supportStatus: string
  checkMemberSupportStatus: string
  checkMemberSupportStatusDescription: string
  checking: string
  checkSupportStatus: string
  status: string
  noDeathSupportRecorded: string
  supportId: string
  notRecorded: string
  committeeMembers: string
  membersRegisteredDescription: string
  noMembersRegistered: string
  joined: string
  inactive: string
  leave: string
  financialSummary: string
  memberFinancialPosition: string
  loadMemberFinancialPosition: string
  loadSummary: string
  currentPosition: string
  totalContributions: string
  contributionBalance: string
  committeeAssetShare: string
  goodsValue: string
  ordinaryDues: string
  totalOutstandingDues: string
  grossCurrentValue: string
  finalCurrentValue: string
  accountHistory: string
  memberStatement: string
  noFinancialTransactions: string
  leftOn: string
  deathSupport: string
  supportRecord: string
  beneficiary: string
  amount: string
  settlement: string
  settlementRecord: string
  settlementDate: string
  settlementReview: string
  selectMemberForSettlement: string
  selectMemberForSettlementDescription: string
  previewSettlement: string
  settlementCalculation: string
  createSettlement: string
  settlementCreated: string
  recordSettlementPayment: string
  paySettlement: string
  settlementPaid: string
  processing: string
  grossAmount: string
  outstandingAmounts: string
  usersAccessManagement: string
  usersDescription: string
  usersAccountCountUser: string
  usersAccountCountUsers: string
  usersAccountSecurity: string
  usersChangePassword: string
  usersChangePasswordDescription: string
  usersCurrentPassword: string
  usersNewPassword: string
  usersConfirmNewPassword: string
  usersChanging: string
  usersChangePasswordButton: string
  usersAddUser: string
  usersCreateUserAccount: string
  usersCreateUserDescription: string
  usersUsername: string
  usersUsernamePlaceholder: string
  usersPassword: string
  usersPasswordPlaceholder: string
  usersPlatformRole: string
  usersCommitteeMember: string
  usersCommitteeAdmin: string
  usersSuperAdmin: string
  usersCreating: string
  usersCreateUserButton: string
  usersPasswordRecovery: string
  usersRecoveryTokenIssued: string
  usersRecoveryTokenDescription: string
  usersCopyToken: string
  usersUserUpdated: string
  usersUserAccount: string
  usersUserId: string
  usersRole: string
  usersCommitteeAccess: string
  usersAssignUserToCommittee: string
  usersAssignUserDescription: string
  usersSelectUser: string
  usersSelectCommittee: string
  usersSelectCommitteeDescription: string
  usersChooseCommitteeRole: string
  usersChooseCommitteeRoleDescription: string
  usersAssignment: string
  usersNoUserSelected: string
  usersNoCommitteeSelected: string
  usersCommitteeAdministrator: string
  usersMemberPermissions: string
  usersManageAssignedCommittee: string
  usersAssigning: string
  usersAssignToCommittee: string
  usersAccounts: string
  usersAccountsAndAccess: string
  usersAccountsDescription: string
  usersLoading: string
  usersRefreshList: string
  usersSuperAdministrator: string
  usersUnknownUser: string
  usersInactive: string
  usersActive: string
  usersIssueRecoveryToken: string
  usersDeactivate: string
  usersGlobalPlatformAuthority: string
  usersAssignedCommittees: string
  usersViewAccess: string
  usersSystemAdministrator: string
  usersNoOrdinaryAssignment: string
  usersNoCommitteeAssignments: string
  usersNotAssignedYet: string
  usersAccessNotLoaded: string
  usersSelectViewAccess: string
  usersCurrentSelectedCommittee: string
  usersNoCommitteeSelectedShort: string
  usersAccessActive: string
  usersAccessInactive: string
  usersNotChecked: string
  usersChecking: string
  usersCheckAccess: string
  usersGrantAccess: string
  usersRevokeAccess: string
  usersRevoked: string
  usersNoUsersLoaded: string
  usersRefreshToRetrieve: string
  assetsEyebrow: string
  assetsPageTitle: string
  assetsDescription: string
  newAsset: string
  createCommitteeAsset: string
  createCommitteeAssetDescription: string
  assetName: string
  assetNamePlaceholder: string
  purchaseDate: string
  purchaseValue: string
  purchaseValuePlaceholder: string
  description: string
  optionalDescription: string
  createAsset: string
  created: string
  assetCreated: string
  assetId: string
  currentValue: string
  updateAssetValuation: string
  updateAssetValuationDescription: string
  valuationDate: string
  newValue: string
  updating: string
  updateValue: string
  valuationUpdated: string
  currentAssetValueUpdated: string
  currentValueLabel: string
  assetHistory: string
  viewAssetValuations: string
  loadValuations: string
  valuations: string
  valuationHistory: string
  valuationId: string
  participation: string
  viewAssetParticipation: string
  loadParticipation: string
  ownership: string
  memberParticipation: string
  memberId: string
  ownershipUnits: string
  totalUnits: string
  goodsEyebrow: string
  goodsPageTitle: string
  goodsDescription: string
  newGood: string
  addMemberGood: string
  addMemberGoodDescription: string
  goodName: string
  goodNamePlaceholder: string
  purchasePrice: string
  purchasePricePlaceholder: string
  recordGood: string
  memberGoodCreated: string
  goodId: string
  goods: string
  viewMemberGoods: string
  loadGoods: string
  recordedGoods: string
  unnamedGood: string
  totalValue: string
  memberGoodsTotal: string
  loadTotal: string
  total: string
  calculated: string
  updateGoodValuation: string
  updateGoodValuationDescription: string
  updateGoodValue: string
  goodValueUpdated: string
  duesEyebrow: string
  duesDescription: string
  recordObligation: string
  createMemberDue: string
  createMemberDueDescription: string
  newDue: string
  amountPlaceholder: string
  dueDate: string
  dueDescriptionPlaceholder: string
  recordDue: string
  dueRecorded: string
  memberDueRecordedSuccessfully: string
  dueId: string
  outstanding: string
  dueHistory: string
  reviewMemberDues: string
  reviewMemberDuesDescription: string
  loadDueHistory: string
  memberObligation: string
  dueNumber: string
  paid: string
  noDuesFound: string
  noRecordedDues: string
  outstandingBalance: string
  checkWhatMemberOwes: string
  checkOutstandingDescription: string
  checkOutstanding: string
  payment: string
  applyDuePayment: string
  applyDuePaymentDescription: string
  paymentAmount: string
  applyPayment: string
  paymentRecorded: string
  duePaymentApplied: string
  updated: string
  finalAmount: string
  loadingMembersEllipsis: string
  noMembersAvailableShort: string
  selectMemberShort: string
  contributionBalanceLabel: string
  assetShareLabel: string
  goodsValueLabel: string
  outstandingDuesLabel: string
  finalPaymentLabel: string
  settlementCompleted: string
  yourAccount: string
  runningTotal: string
  contributionRecords: string
  loadingFinancialPosition: string
  myFinancialPositionDescription: string
  noMemberRecordFound: string
  whatYouWouldReceiveToday: string
  totalValueAfterDues: string
  grossValueBeforeDues: string
  totalContributionsPaid: string
  ordinaryDuesYouOwe: string
  qarzEHasanaYouOwe: string
  totalYouCurrentlyOwe: string
  deathSupportRecord: string
  myContributionsDescription: string
  loadingContributionHistory: string
  totalRecordedContributions: string
  noContributionsRecorded: string
  myDuesDescription: string
  noDuesRecorded: string
  owed: string
  myGoodsDescription: string
  totalValueOfYourGoods: string
  currentValueOfPurchasedGoods: string
  noGoodsRecorded: string
  purchasedOn: string
  purchasedAt: string
  sincePurchase: string
  myDeathSupportDescription: string
  loadingDeathSupportRecord: string
  mySettlementDescription: string
  calculatingSettlementPreview: string
  ifSettledToday: string
  settlementPreviewNote: string
  outstandingDues: string
  loadingYourDues: string
  ui: {
    accessRestricted: string
    onlySuperAdminManageUsers: string
    onlySuperAdminCreateAdmins: string
    viewAdministrators: string
    changing: string
    changePasswordAction: string
    userAccount: string
    selectedUser: string
    noUserSelected: string
    selectedCommittee: string
    noCommitteeSelected: string
    committeeAdministrator: string
    committeeMember: string
    assigning: string
    assignToCommittee: string
    refreshUserList: string
    superAdministrator: string
    unknownUser: string
    viewAccess: string
    accessRevoked: string
    notChecked: string
    allCaughtUp: string
  }
    invalidWholeNumber: string
    onlySuperAdminCloseCommittees: string
    onlySuperAdminAssignUsers: string
    onlySuperAdminManageAccess: string
  errors: {
    loadAccessibleCommittees: string
    loadCommitteeMembers: string
    loadCommitteeSummary: string
    loadFinancialPosition: string
    loadContributionHistory: string
    loadDues: string
    loadGoods: string
    loadDeathSupport: string
    loadSettlementPreview: string
    issueRecoveryToken: string
    passwordChanged: string
    changePassword: string
    recoveryTokenRequired: string
    passwordReset: string
    resetPassword: string
    loginFailed: string
    createCommitteeAsset: string
    updateCommitteeAssetValue: string
    loadAssetValuations: string
    loadAssetParticipation: string
    createMemberGood: string
    loadMemberGoods: string
    loadMemberGoodsTotal: string
    updateMemberGoodValue: string
    createMemberDue: string
    loadMemberDues: string
    loadOutstandingDues: string
    payMemberDue: string
    loadMemberSettlementPreview: string
    createMemberSettlement: string
    payMemberSettlement: string
    alreadyClosed: string
    closing: string
    closed: string
    closeCommittee: string
    createCommittee: string
    createContributionRate: string
    recordContribution: string
    loadMemberFinancialSummary: string
    recordDeathSupport: string
    loadDeathSupportStatus: string
    leaveMember: string
    createMember: string
    loadCommitteePermissions: string
    loadUsers: string
    assignUserToCommittee: string
    loadCommitteeAdministrators: string
    loadCommitteeAssignments: string
    loadCommitteeAccess: string
    grantCommitteeAccess: string
    revokeCommitteeAccess: string
    createUser: string
    deactivateUser: string
  }

  loadingYourGoods: string
  currentlyOwe: string
  outstandingDuesDescription: string
  noOutstandingDues: string
  partial: string
  unpaid: string
}

export const appTranslations: Record<Language, AppTranslation> = {
  en: {
    appName: 'Death Committee',
    systemName: 'System',

    navigation: {
      Dashboard: 'Overview',
      Committees: 'Committees',
      Users: 'Users',
      Members: 'Members',
      Contributions: 'Contributions',
      'Death Support': 'Death Assistance',
      Dues: 'Outstanding Dues',
      Goods: 'Member Purchases',
      Assets: 'Committee Assets',
      Settlements: 'Member Settlements',
      'My Contributions': 'My Contributions',
      'My Death Support': 'My Death Assistance',
      'My Dues': 'My Outstanding Dues',
      'My Goods': 'My Purchases',
      'My Financial Position': 'My Financial Summary',
      'My Settlement': 'My Settlement',
    },

    ui: {
      accessRestricted: 'Access restricted',
      onlySuperAdminManageUsers: 'Only Super Administrators can manage system user accounts.',
      onlySuperAdminCreateAdmins: 'Only Super Administrators can create system-level administrator accounts.',
      viewAdministrators: 'View Administrators',
      changing: 'Changing...',
      changePasswordAction: 'Change Password',
      userAccount: 'User account',
      selectedUser: 'Selected user',
      noUserSelected: 'No user selected',
      selectedCommittee: 'Selected committee',
      noCommitteeSelected: 'No committee selected',
      committeeAdministrator: 'Committee Administrator',
      committeeMember: 'Committee Member',
      assigning: 'Assigning...',
      assignToCommittee: 'Assign to Committee',
      refreshUserList: 'Refresh User List',
      superAdministrator: 'Super Administrator',
      unknownUser: 'Unknown user',
      viewAccess: 'View Access',
      accessRevoked: 'Revoked',
      notChecked: 'Not checked',
      allCaughtUp: "You're all caught up",
      },


    roles: {
      superAdmin: 'System administration',
      committeeAdmin: 'Committee administration',
      member: 'Member',
    },

    signOut: 'Sign out',

    languageLabel: 'Language',
    languageEnglish: 'English',
    languageUrdu: 'اردو',

    committeeWorkspace: 'Committee workspace',
    chooseCommittee: 'Choose the committee you want to work with.',
    currentCommittee: 'This is the committee currently available to you.',
    noCommitteeAvailable: 'No committee available',

    noCommitteeWorkspaceLoaded: 'No committee workspace loaded',
    chooseCommitteeToOpen:
      'Choose a committee above to open its workspace.',
    committeeScopeNote:
      'Everything you see and manage in this workspace belongs only to that committee.',

    financialPosition: 'FINANCIAL POSITION',
    committeeFinances: 'Committee finances',
    currentCashBalance: 'Current committee cash balance',
    totalMemberContributions: 'Total member contributions',
    totalDeathSupportPaid: 'Total death support paid',

    dashboard: 'Dashboard',
    dashboardSuperAdminDescription: 'Manage committees, users, and system-wide operations from one place.',
    dashboardCommitteeAdminDescription: 'Manage members, contributions, dues, goods, assets, support, and settlements for this committee.',
    dashboardCommitteeAdminNoWorkspace: 'Select a committee to enter its isolated workspace.',
    dashboardMemberDescription: 'View your contributions, dues, goods, financial position, support, and settlement information.',
    chooseCommitteeWorkspace: 'Choose the committee you want to work with.',
    committeeAvailableToYou: 'This is the committee currently available to you.',
    chooseCommitteeWorkspaceDescription: 'Choose a committee above to open its workspace. Everything you see and manage in this workspace belongs only to that committee.',
    financialPositionDescription: "A current view of this committee's cash position and recorded financial activity.",
    currentCommitteeCashBalance: 'Current committee cash balance',
    currentCashNote: 'This is the total cash currently held by',

    committeesManagement: 'MANAGEMENT',
    committeesDescription: 'Create and manage mutual support committees.',
    newCommittee: 'NEW COMMITTEE',
    createCommitteeHeading: 'Create a committee',
    createCommitteeDescription: 'Enter the name of the committee you want to register.',
    committeeName: 'Committee name',
    committeeNamePlaceholder: 'e.g. Swabi Mutual Support Committee',
    creating: 'Creating...',
    createCommittee: 'Create Committee',
    committeeManagement: 'COMMITTEE MANAGEMENT',
    committeeAdministrators: 'Committee administrators',
    committeeAdministratorsDescription:
      'Review which users administer each committee. Committee administration is granted through committee access and does not change the user\'s system-level role.',
    committeeId: 'Committee ID',
    closed: 'Closed',
    active: 'Active',
    closing: 'Closing...',
    closeCommittee: 'Close Committee',
    noActiveCommitteeAdministrator:
      'No active Committee Administrator is assigned.',
    viewAdministrators: 'View Administrators',
    manageAccess: 'Manage Access',
    committeeCreated: 'Committee created',

    membersManagement: 'MEMBERS',
    membersDescription: 'Register members and associate them with a committee.',
    newMember: 'NEW MEMBER',
    addMember: 'Add Member',
    memberCreateDescription:
      'Enter the committee, member name, and joining date.',
    committee: 'Committee',
    fullName: 'Full name',
    fullNamePlaceholder: 'e.g. Muhammad Ahmad',
    username: 'Username',
    usernamePlaceholder: 'Login username for this member',
    password: 'Password',
    passwordPlaceholder: 'Initial login password',
    joiningDate: 'Joining date',
    createMember: 'Create Member',
    memberCreated: 'Member created',
    contributionsEyebrow: 'CONTRIBUTIONS',
    currentContributionAmounts: 'Current contribution amounts',
    contributionsDescription:
      'Define the amount members are required to contribute from a specific effective date.',
    recordContribution: 'RECORD CONTRIBUTION',
    recordMemberContribution: 'Record member contribution',
    contributionRateAutoSelected:
      'The applicable contribution rate is selected automatically from the contribution date.',
    member: 'Member',
    loadingMembers: 'Loading members...',
    noMembersAvailable: 'No members available',
    selectMember: 'Select a member',
    paymentDate: 'Payment date',
    reference: 'Reference',
    referencePlaceholder: 'e.g. August contribution',
    recording: 'Recording...',
    recordContributionButton: 'Record Contribution',
    recorded: 'RECORDED',
    contributionRecorded: 'Contribution recorded',
    date: 'Date',
    journalEntryId: 'Journal entry ID',
    newRate: 'NEW RATE',
    createContributionRateHeading: 'Create contribution rate',
    createContributionRateDescription:
      'Set the contribution amount and the date from which this rate becomes effective.',
    contributionAmount: 'Contribution amount',
    contributionAmountPlaceholder: 'e.g. 500',
    effectiveFrom: 'Effective from',
    createCurrentContributionAmount:
      'Create Current contribution amount',
    currentContributionAmountCreated:
      'Current contribution amount created',
    rateId: 'Rate ID',
    deathSupportEyebrow: 'DEATH ASSISTANCE',
    deathSupportPageTitle: 'Death Assistance',
    deathSupportDescription:
      'Record death-assistance payments for members and preserve the member-funded and Qarz-e-Hasana portions separately.',
    recordSupport: 'RECORD SUPPORT',
    recordDeathSupportHeading: 'Record Death Assistance',
    recordDeathSupportDescription:
      'Select the affected member, enter the beneficiary and support amount, and record the payment date.',
    beneficiaryName: 'Beneficiary name',
    beneficiaryNamePlaceholder: 'e.g. Muhammad Ali',
    supportAmount: 'Support amount',
    supportAmountPlaceholder: 'e.g. 50000',
    supportDate: 'Support date',
    optionalReference: 'Reference',
    optionalReferencePlaceholder: 'Optional reference',
    recordDeathSupportButton: 'Record Death Assistance',
    deathSupportRecorded: 'Death assistance recorded',
    memberFunded: 'Member funded',
    qarzEHasana: 'Qarz-e-Hasana',
    supportStatus: 'SUPPORT STATUS',
    checkMemberSupportStatus: 'Check member support status',
    checkMemberSupportStatusDescription:
      'Review whether death assistance has already been recorded for a member in this committee.',
    checking: 'Checking...',
    checkSupportStatus: 'Check Support Status',
    status: 'STATUS',
    noDeathSupportRecorded: 'No death assistance recorded',
    supportId: 'Support ID',
    notRecorded: 'Not Recorded',
    committeeMembers: 'COMMITTEE MEMBERS',
    membersRegisteredDescription:
      'Members currently registered in this committee.',
    noMembersRegistered:
      'No members are currently registered in this committee.',
    joined: 'Joined',
    inactive: 'Inactive',
    leave: 'Leave',
    financialSummary: 'FINANCIAL SUMMARY',
    memberFinancialPosition: 'Member financial position',
    loadMemberFinancialPosition:
      'Load the current financial position of a member.',
    loadSummary: 'Load Summary',
    currentPosition: 'Current position',
    totalContributions: 'Total contributions',
    contributionBalance: 'Contribution balance',
    committeeAssetShare: 'Committee asset share',
    goodsValue: 'Goods value',
    ordinaryDues: 'Ordinary dues',
    totalOutstandingDues: 'Total outstanding dues',
    grossCurrentValue: 'Gross current value',
    finalCurrentValue: 'Final current value',
    accountHistory: 'ACCOUNT HISTORY',
    memberStatement: 'Member statement',
    noFinancialTransactions:
      'No financial transactions recorded yet.',
    leftOn: 'Left on',
    deathSupport: 'DEATH SUPPORT',
    supportRecord: 'Support record',
    beneficiary: 'Beneficiary',
    amount: 'Amount',
    settlement: 'SETTLEMENT',
    settlementRecord: 'Settlement record',
    settlementDate: 'Settlement date',
    grossAmount: 'Gross amount',
    outstandingAmounts: 'Outstanding amounts',
    usersAccessManagement: 'ACCESS MANAGEMENT',
    usersDescription: 'Manage platform accounts, committee access, and account security from one place.',
    usersAccountCountUser: 'User',
    usersAccountCountUsers: 'Users',
    usersAccountSecurity: 'ACCOUNT SECURITY',
    usersChangePassword: 'Change your password',
    usersChangePasswordDescription: 'Update the password for the currently signed-in administrator account.',
    usersCurrentPassword: 'Current password',
    usersNewPassword: 'New password',
    usersConfirmNewPassword: 'Confirm new password',
    usersChanging: 'Changing...',
    usersChangePasswordButton: 'Change Password',
    usersAddUser: 'ADD USER',
    usersCreateUserAccount: 'Create a user account',
    usersCreateUserDescription: 'Create the login account first. Committee membership and administrator access can then be assigned separately.',
    usersUsername: 'Username',
    usersUsernamePlaceholder: 'e.g. committee-admin',
    usersPassword: 'Password',
    usersPasswordPlaceholder: 'Enter a secure password',
    usersPlatformRole: 'Platform role',
    usersCommitteeMember: 'Committee Member',
    usersCommitteeAdmin: 'Committee Admin',
    usersSuperAdmin: 'Super Admin',
    usersCreating: 'Creating...',
    usersCreateUserButton: 'Create User',
    usersPasswordRecovery: 'PASSWORD RECOVERY',
    usersRecoveryTokenIssued: 'Recovery token issued',
    usersRecoveryTokenDescription: 'Provide this token securely to the user. It expires in',
    usersCopyToken: 'Copy Token',
    usersUserUpdated: 'USER UPDATED',
    usersUserAccount: 'User account',
    usersUserId: 'User ID',
    usersRole: 'Role',
    usersCommitteeAccess: 'COMMITTEE ACCESS',
    usersAssignUserToCommittee: 'Assign a user to a committee',
    usersAssignUserDescription: 'Choose the application user, committee, and committee-level role.',
    usersSelectUser: 'Select user',
    usersSelectCommittee: 'Select committee',
    usersSelectCommitteeDescription: 'Access is isolated per committee.',
    usersChooseCommitteeRole: 'Choose committee role',
    usersChooseCommitteeRoleDescription: 'Administrator access applies only to the selected committee.',
    usersAssignment: 'ASSIGNMENT',
    usersNoUserSelected: 'No user selected',
    usersNoCommitteeSelected: 'No committee selected',
    usersCommitteeAdministrator: 'Committee Administrator',
    usersMemberPermissions: 'Member-level permissions',
    usersManageAssignedCommittee: 'Manage the assigned committee',
    usersAssigning: 'Assigning...',
    usersAssignToCommittee: 'Assign to Committee',
    usersAccounts: 'USER ACCOUNTS',
    usersAccountsAndAccess: 'Accounts & committee access',
    usersAccountsDescription: 'Review account status, recovery controls, and committee assignments.',
    usersLoading: 'Loading...',
    usersRefreshList: 'Refresh User List',
    usersSuperAdministrator: 'Super Administrator',
    usersUnknownUser: 'Unknown user',
    usersInactive: 'Inactive',
    usersActive: 'Active',
    usersIssueRecoveryToken: 'Issue Recovery Token',
    usersDeactivate: 'Deactivate',
    usersGlobalPlatformAuthority: 'Global platform authority',
    usersAssignedCommittees: 'Assigned committees',
    usersViewAccess: 'View Access',
    usersSystemAdministrator: 'System administrator',
    usersNoOrdinaryAssignment: 'No ordinary committee assignment is required.',
    usersNoCommitteeAssignments: 'No committee assignments',
    usersNotAssignedYet: 'This account has not been assigned to a committee yet.',
    usersAccessNotLoaded: 'Access not loaded',
    usersSelectViewAccess: "Select View Access to load this user's committee assignments.",
    usersCurrentSelectedCommittee: 'Current selected committee:',
    usersNoCommitteeSelectedShort: 'No committee selected',
    usersAccessActive: 'Access active',
    usersAccessInactive: 'Access inactive',
    usersNotChecked: 'Not checked',
    usersChecking: 'Checking...',
    usersCheckAccess: 'Check Access',
    usersGrantAccess: 'Grant Access',
    usersRevokeAccess: 'Revoke Access',
    usersRevoked: 'Revoked',
    usersNoUsersLoaded: 'No users loaded',
    usersRefreshToRetrieve: 'Select Refresh User List to retrieve the current accounts.',
    assetsEyebrow: 'ASSETS',
    assetsPageTitle: 'Committee Assets',
    assetsDescription: 'Register committee-owned assets and track their current valuations.',
    newAsset: 'NEW ASSET',
    createCommitteeAsset: 'Create committee asset',
    createCommitteeAssetDescription: 'Enter the committee, asset details, purchase date, and purchase value.',
    assetName: 'Asset name',
    assetNamePlaceholder: 'e.g. Committee Refrigerator',
    purchaseDate: 'Purchase date',
    purchaseValue: 'Purchase value',
    purchaseValuePlaceholder: 'e.g. 50000',
    description: 'Description',
    optionalDescription: 'Optional description',
    createAsset: 'Create Asset',
    created: 'Created',
    assetCreated: 'Asset created',
    assetId: 'Asset ID',
    currentValue: 'CURRENT VALUE',
    updateAssetValuation: 'Update asset valuation',
    updateAssetValuationDescription: 'Record a new valuation. Previous valuations remain available as historical records.',
    valuationDate: 'Valuation date',
    newValue: 'New value',
    updating: 'Updating...',
    updateValue: 'Update Value',
    valuationUpdated: 'VALUATION UPDATED',
    currentAssetValueUpdated: 'Current asset value updated',
    currentValueLabel: 'Current value',
    assetHistory: 'ASSET HISTORY',
    viewAssetValuations: 'View asset valuations',
    loadValuations: 'Load Valuations',
    valuations: 'VALUATIONS',
    valuationHistory: 'Valuation history',
    valuationId: 'Valuation ID',
    participation: 'PARTICIPATION',
    viewAssetParticipation: 'View asset participation',
    loadParticipation: 'Load Participation',
    ownership: 'OWNERSHIP',
    memberParticipation: 'Member participation',
    memberId: 'Member ID',
    ownershipUnits: 'Ownership units',
    totalUnits: 'Total units',
    goodsEyebrow: 'MEMBER GOODS',
    goodsPageTitle: 'Member Goods',
    goodsDescription: "Record goods purchased using a member's accumulated committee value and track their current refundable value.",
    newGood: 'NEW GOOD',
    addMemberGood: 'Add Member good',
    addMemberGoodDescription: 'Record a good against a member account.',
    goodName: 'Good name',
    goodNamePlaceholder: 'e.g. Refrigerator',
    purchasePrice: 'Purchase price',
    purchasePricePlaceholder: 'e.g. 50000',
    recordGood: 'Record Good',
    memberGoodCreated: 'Member good created',
    goodId: 'Good ID',
    goods: 'GOODS',
    viewMemberGoods: 'View member goods',
    loadGoods: 'Load Goods',
    recordedGoods: 'Recorded goods',
    unnamedGood: 'Unnamed good',
    totalValue: 'TOTAL VALUE',
    memberGoodsTotal: 'Member goods total',
    loadTotal: 'Load Total',
    total: 'TOTAL',
    calculated: 'Calculated',
    updateGoodValuation: 'Update good valuation',
    updateGoodValuationDescription: 'Record a new value while preserving the valuation history.',
    updateGoodValue: 'Update Good Value',
    goodValueUpdated: 'Good value updated',
    duesEyebrow: 'OUTSTANDING DUES',
    duesDescription: 'Record, review, and settle member obligations.',
    recordObligation: 'RECORD OBLIGATION',
    createMemberDue: 'Create a member due',
    createMemberDueDescription: 'Record an amount owed by a committee member with its due date and supporting reference.',
    newDue: 'New Due',
    amountPlaceholder: 'e.g. 5000',
    dueDate: 'Due date',
    dueDescriptionPlaceholder: 'Reason or description for this due',
    recordDue: 'Record Due',
    dueRecorded: 'DUE RECORDED',
    memberDueRecordedSuccessfully: 'Member due recorded successfully',
    dueId: 'Due ID',
    outstanding: 'Outstanding',
    dueHistory: 'DUE HISTORY',
    reviewMemberDues: 'Review member dues',
    reviewMemberDuesDescription: 'Select a member to inspect their recorded dues and payment status.',
    loadDueHistory: 'Load Due History',
    memberObligation: 'Member obligation',
    dueNumber: 'DUE',
    paid: 'Paid',
    noDuesFound: 'No dues found',
    noRecordedDues: 'This member currently has no recorded dues in the loaded history.',
    outstandingBalance: 'OUTSTANDING BALANCE',
    checkWhatMemberOwes: 'Check what a member currently owes',
    checkOutstandingDescription: 'View the current outstanding amount before recording a payment.',
    checkOutstanding: 'Check Outstanding',
    payment: 'PAYMENT',
    applyDuePayment: 'Apply a due payment',
    applyDuePaymentDescription: 'Apply a payment against an existing due. Payments are recorded against the selected due rather than changing the original obligation.',
    paymentAmount: 'Payment amount',
    applyPayment: 'Apply Payment',
    paymentRecorded: 'PAYMENT RECORDED',
    duePaymentApplied: 'Due payment applied',
    updated: 'Updated',
    finalAmount: 'Final amount',
    loadingMembersEllipsis: 'Loading members...',
    noMembersAvailableShort: 'No members available',
    selectMemberShort: 'Select a member',
    contributionBalanceLabel: 'Contribution balance',
    assetShareLabel: 'Asset share',
    goodsValueLabel: 'Goods value',
    outstandingDuesLabel: 'Outstanding dues',
    finalPaymentLabel: 'Final payment',
    settlementCompleted: 'Settlement completed',
    yourAccount: 'Your account',
    runningTotal: 'Running total',
    contributionRecords: 'Contribution records',
    loadingFinancialPosition: 'Loading your financial position...',
    myFinancialPositionDescription:
      'A simple summary of what you have contributed, what you own a share of, and what you currently owe.',
    noMemberRecordFound:
      'No member record was found for you in this committee.',
    whatYouWouldReceiveToday: 'What you would receive today',
    totalValueAfterDues: 'This is your total value after your dues are subtracted.',
    grossValueBeforeDues: 'Gross value before dues',
    totalContributionsPaid: 'Total contributions paid',
    ordinaryDuesYouOwe: 'Ordinary dues you owe',
    qarzEHasanaYouOwe: 'Qarz-e-Hasana (loan) you owe',
    totalYouCurrentlyOwe: 'Total you currently owe',
    deathSupportRecord: 'Death support record',
    myContributionsDescription:
      'Your recorded contribution history and running total within this committee.',
    loadingContributionHistory: 'Loading your contribution history...',
    totalRecordedContributions:
      'Total recorded contributions within this committee.',
    noContributionsRecorded: 'No contributions have been recorded yet.',
    myDuesDescription: 'What you currently owe, and your full due history.',
    noDuesRecorded: 'No dues have been recorded yet.',
    owed: 'owed',
    myGoodsDescription:
      "Items you've purchased through this committee and their current value.",
    totalValueOfYourGoods: 'Total value of your goods',
    currentValueOfPurchasedGoods:
      "This is the current value of everything you've purchased through this committee.",
    noGoodsRecorded: 'No goods have been recorded yet.',
    purchasedOn: 'Purchased',
    purchasedAt: 'purchased at',
    sincePurchase: 'since purchase',
    myDeathSupportDescription:
      'Your death support record within this committee, if one has been recorded.',
    loadingDeathSupportRecord: 'Loading your death support record...',
    mySettlementDescription:
      'A live preview of what your settlement would be if calculated today. This updates as your contributions, dues, asset share, and goods change.',
    calculatingSettlementPreview: 'Calculating your settlement preview...',
    ifSettledToday:
      'If you were settled today, you would receive',
    settlementPreviewNote:
      'This is a live preview, not a final record. It changes as your contributions, dues, and shares change.',
    outstandingDues: 'Outstanding dues',
    loadingYourDues: 'Loading your dues...',
    invalidWholeNumber: 'New value must be a whole number greater than or equal to 0',
    onlySuperAdminCloseCommittees: 'Only Super Administrators can close committees',
    onlySuperAdminAssignUsers: 'Only Super Administrators can assign users to committees',
    onlySuperAdminManageAccess: 'Only Super Administrators can manage committee access',
    errors: {
      loadAccessibleCommittees: 'Unable to load accessible committees',
      loadCommitteeMembers: 'Unable to load committee members',
      loadCommitteeSummary: 'Unable to load committee summary',
      loadFinancialPosition: 'Unable to load your financial position',
      loadContributionHistory: 'Unable to load your contribution history',
      loadDues: 'Unable to load your dues',
      loadGoods: 'Unable to load your goods',
      loadDeathSupport: 'Unable to load your death support record',
      loadSettlementPreview: 'Unable to load your settlement preview',
      issueRecoveryToken: 'Unable to issue recovery token',
      passwordChanged: 'Password changed successfully',
      changePassword: 'Unable to change password',
      recoveryTokenRequired: 'Recovery token is required',
      passwordReset: 'Password reset successfully',
      resetPassword: 'Unable to reset password',
      loginFailed: 'Login failed',
      createCommitteeAsset: 'Unable to create committee asset',
      updateCommitteeAssetValue: 'Unable to update committee asset value',
      loadAssetValuations: 'Unable to load asset valuations',
      loadAssetParticipation: 'Unable to load asset participation',
      createMemberGood: 'Unable to create member good',
      loadMemberGoods: 'Unable to load member goods',
      loadMemberGoodsTotal: 'Unable to load member goods total',
      updateMemberGoodValue: 'Unable to update member good value',
      createMemberDue: 'Unable to create member due',
      loadMemberDues: 'Unable to load member dues',
      loadOutstandingDues: 'Unable to load outstanding dues',
      payMemberDue: 'Unable to pay member due',
      loadMemberSettlementPreview: 'Unable to load member settlement preview',
      createMemberSettlement: 'Unable to create member settlement',
      payMemberSettlement: 'Unable to pay member settlement',
      alreadyClosed: 'Already closed',
      closing: 'Closing...',
      closed: 'Closed',
      closeCommittee: 'Unable to close committee',
      createCommittee: 'Unable to create committee',
      createContributionRate: 'Unable to create contribution rate',
      recordContribution: 'Unable to record contribution',
      loadMemberFinancialSummary: 'Unable to load member financial summary',
      recordDeathSupport: 'Unable to record death support',
      loadDeathSupportStatus: 'Unable to load death support status',
      leaveMember: 'Unable to leave member',
      createMember: 'Unable to create member',
      loadCommitteePermissions: 'Unable to load committee permissions',
      loadUsers: 'Unable to load users',
      assignUserToCommittee: 'Unable to assign user to committee',
      loadCommitteeAdministrators: 'Unable to load committee administrators',
      loadCommitteeAssignments: 'Unable to load committee assignments',
      loadCommitteeAccess: 'Unable to load committee access',
      grantCommitteeAccess: 'Unable to grant committee access',
      revokeCommitteeAccess: 'Unable to revoke committee access',
      createUser: 'Unable to create user',
      deactivateUser: 'Unable to deactivate user',
    },

    loadingYourGoods: 'Loading your goods...',
    currentlyOwe: 'You currently owe',
    outstandingDuesDescription: 'This is the total across all your unpaid and partially paid dues.',
    noOutstandingDues: 'You have no outstanding dues at this time.',
    partial: 'Partial',
    unpaid: 'Unpaid',
  settlementReview: 'Settlement Review',
  selectMemberForSettlement: 'Select member',
  selectMemberForSettlementDescription: 'Select a member to review their refundable position and settlement.',
  previewSettlement: 'Preview Settlement',
  settlementCalculation: 'Settlement Calculation',
  createSettlement: 'Create Settlement',
  settlementCreated: 'Settlement Created',
  recordSettlementPayment: 'Record Settlement Payment',
  paySettlement: 'Pay Settlement',
  settlementPaid: 'Settlement Paid',
  processing: 'Processing...',
  },

  ur: {
    appName: 'ڈیتھ کمیٹی',
    systemName: 'سسٹم',

    navigation: {
      Dashboard: 'جائزہ',
      Committees: 'کمیٹیاں',
      Users: 'صارفین',
      Members: 'ارکان',
      Contributions: 'چندہ',
      'Death Support': 'وفات کی امداد',
      Dues: 'بقایا واجبات',
      Goods: 'ارکان کی خریداری',
      Assets: 'کمیٹی کے اثاثے',
      Settlements: 'ارکان کے حسابات',
      'My Contributions': 'میرا چندہ',
      'My Death Support': 'میری وفات کی امداد',
      'My Dues': 'میرے بقایا واجبات',
      'My Goods': 'میری خریداری',
      'My Financial Position': 'میرا مالی خلاصہ',
      'My Settlement': 'میرا حتمی حساب',
    },

    ui: {
      accessRestricted: 'رسائی محدود ہے',
      onlySuperAdminManageUsers: 'صرف سپر ایڈمنسٹریٹر سسٹم صارفین کے اکاؤنٹس کا انتظام کر سکتے ہیں۔',
      onlySuperAdminCreateAdmins: 'صرف سپر ایڈمنسٹریٹر سسٹم سطح کے ایڈمن اکاؤنٹس بنا سکتے ہیں۔',
      viewAdministrators: 'منتظمین دیکھیں',
      changing: 'تبدیل کیا جا رہا ہے...',
      changePasswordAction: 'پاس ورڈ تبدیل کریں',
      userAccount: 'صارف کا اکاؤنٹ',
      selectedUser: 'منتخب صارف',
      noUserSelected: 'کوئی صارف منتخب نہیں',
      selectedCommittee: 'منتخب کمیٹی',
      noCommitteeSelected: 'کوئی کمیٹی منتخب نہیں',
      committeeAdministrator: 'کمیٹی ایڈمنسٹریٹر',
      committeeMember: 'کمیٹی رکن',
      assigning: 'شامل کیا جا رہا ہے...',
      assignToCommittee: 'کمیٹی میں شامل کریں',
      refreshUserList: 'صارفین کی فہرست تازہ کریں',
      superAdministrator: 'سپر ایڈمنسٹریٹر',
      unknownUser: 'نامعلوم صارف',
      viewAccess: 'رسائی دیکھیں',
      accessRevoked: 'رسائی منسوخ',
      notChecked: 'جانچ نہیں ہوئی',
      allCaughtUp: 'آپ کے تمام کام مکمل ہیں',
      },


    roles: {
      superAdmin: 'سسٹم انتظامیہ',
      committeeAdmin: 'کمیٹی انتظامیہ',
      member: 'رکن',
    },

    signOut: 'سائن آؤٹ',

    languageLabel: 'زبان',
    languageEnglish: 'English',
    languageUrdu: 'اردو',

    committeeWorkspace: 'کمیٹی ورک اسپیس',
    chooseCommittee: 'جس کمیٹی میں کام کرنا ہے اسے منتخب کریں۔',
    currentCommittee: 'یہ وہ کمیٹی ہے جو اس وقت آپ کے لیے دستیاب ہے۔',
    noCommitteeAvailable: 'کوئی کمیٹی دستیاب نہیں',

    chooseCommitteeToOpen:
      'ورک اسپیس کھولنے کے لیے اوپر سے کمیٹی منتخب کریں۔',

    committeeFinances: 'کمیٹی کی مالی صورتحال',
    currentCashBalance: 'کمیٹی کا موجودہ نقد بیلنس',
    totalMemberContributions: 'ارکان کی کل تعاون کی رقم',

    dashboard: 'جائزہ',
    dashboardSuperAdminDescription: 'ایک ہی جگہ سے کمیٹیوں، صارفین اور پورے نظام کے انتظامات کریں۔',
    dashboardCommitteeAdminDescription: 'اس کمیٹی کے ارکان، تعاون کی رقوم، واجبات، خریداری، اثاثوں، امداد اور تصفیوں کا انتظام کریں۔',
    dashboardCommitteeAdminNoWorkspace: 'کمیٹی کا کام شروع کرنے کے لیے ایک کمیٹی منتخب کریں۔',
    dashboardMemberDescription: 'اپنی تعاون کی رقوم، واجبات، خریداری، مالی صورتحال، امداد اور تصفیے کی معلومات دیکھیں۔',
    chooseCommitteeWorkspace: 'کام کرنے کے لیے کمیٹی منتخب کریں۔',
    committeeAvailableToYou: 'یہ کمیٹی آپ کے لیے دستیاب ہے۔',
    chooseCommitteeWorkspaceDescription: 'کمیٹی کی معلومات اور ریکارڈ دیکھنے کے لیے اوپر سے کمیٹی منتخب کریں۔ یہاں دکھائی جانے والی معلومات صرف اسی کمیٹی سے متعلق ہیں۔',
    noCommitteeWorkspaceLoaded: 'کمیٹی کی معلومات دستیاب نہیں ہیں',
    committeeScopeNote: 'یہاں دکھائے گئے ارکان، تعاون کی رقوم، واجبات، خریداری، اثاثے، وفات کی امداد اور تصفیے اسی کمیٹی سے متعلق ہیں۔',
    financialPosition: 'مالی حیثیت',
    totalDeathSupportPaid: 'وفات کی امداد کی کل ادائی گئی رقم',
    financialPositionDescription: 'اس کمیٹی کی نقد رقم اور ریکارڈ شدہ مالی سرگرمیوں کا موجودہ خلاصہ۔',
    currentCommitteeCashBalance: 'کمیٹی میں موجود نقد رقم',
    currentCashNote: 'یہ کل نقد رقم ہے جو اس وقت موجود ہے:',

    committeesManagement: 'انتظام',
    committeesDescription: 'باہمی تعاون کی کمیٹیاں بنائیں اور ان کا انتظام کریں۔',
    newCommittee: 'نئی کمیٹی',
    createCommitteeHeading: 'کمیٹی بنائیں',
    createCommitteeDescription: 'جس کمیٹی کو رجسٹر کرنا ہے اس کا نام درج کریں۔',
    committeeName: 'کمیٹی کا نام',
    committeeNamePlaceholder: 'مثلاً صوابی باہمی تعاون کمیٹی',
    creating: 'بنائی جا رہی ہے...',
    createCommittee: 'کمیٹی بنائیں',
    committeeManagement: 'کمیٹی کا انتظام',
    committeeAdministrators: 'کمیٹی کے منتظمین',
    committeeAdministratorsDescription:
      'دیکھیں کہ ہر کمیٹی کا انتظام کون سے صارفین کرتے ہیں۔ کمیٹی کا انتظام کمیٹی تک رسائی کے ذریعے دیا جاتا ہے اور صارف کے نظام کی سطح کے کردار کو تبدیل نہیں کرتا۔',
    committeeId: 'کمیٹی آئی ڈی',
    closed: 'بند',
    active: 'فعال',
    closing: 'بند کی جا رہی ہے...',
    closeCommittee: 'کمیٹی بند کریں',
    noActiveCommitteeAdministrator:
      'کوئی فعال کمیٹی منتظم مقرر نہیں ہے۔',
    viewAdministrators: 'منتظمین دیکھیں',
    manageAccess: 'رسائی کا انتظام',
    created: 'بنائی گئی',
    committeeCreated: 'کمیٹی بنائی گئی',

    membersManagement: 'ارکان',
    membersDescription: 'ارکان کو رجسٹر کریں اور انہیں کمیٹی کے ساتھ منسلک کریں۔',
    newMember: 'نیا رکن',
    addMember: 'رکن شامل کریں',
    memberCreateDescription:
      'کمیٹی، رکن کا نام اور شمولیت کی تاریخ درج کریں۔',
    committee: 'کمیٹی',
    fullName: 'پورا نام',
    fullNamePlaceholder: 'مثلاً محمد احمد',
    username: 'صارف نام',
    usernamePlaceholder: 'اس رکن کے لیے لاگ اِن صارف نام',
    password: 'پاس ورڈ',
    passwordPlaceholder: 'ابتدائی لاگ اِن پاس ورڈ',
    joiningDate: 'شمولیت کی تاریخ',
    createMember: 'رکن بنائیں',
    memberCreated: 'رکن بنایا گیا',
    contributionsEyebrow: 'چندہ',
    currentContributionAmounts: 'موجودہ چندے کی رقوم',
    contributionsDescription:
      'مخصوص مؤثر تاریخ سے ارکان کے لیے مقرر کردہ چندے کی رقم طے کریں۔',
    recordContribution: 'چندہ درج کریں',
    recordMemberContribution: 'رکن کا چندہ درج کریں',
    contributionRateAutoSelected:
      'چندے کی تاریخ کے مطابق قابل اطلاق چندے کی شرح خود منتخب ہو جاتی ہے۔',
    member: 'رکن',
    loadingMembers: 'ارکان لوڈ ہو رہے ہیں...',
    noMembersAvailable: 'کوئی رکن دستیاب نہیں',
    selectMember: 'رکن منتخب کریں',
    paymentDate: 'ادائیگی کی تاریخ',
    reference: 'حوالہ',
    referencePlaceholder: 'مثلاً اگست کا چندہ',
    recording: 'درج کیا جا رہا ہے...',
    recordContributionButton: 'چندہ درج کریں',
    recorded: 'درج کیا گیا',
    contributionRecorded: 'چندہ درج کر دیا گیا',
    date: 'تاریخ',
    journalEntryId: 'جرنل اندراج آئی ڈی',
    newRate: 'نئی شرح',
    createContributionRateHeading: 'چندے کی شرح بنائیں',
    createContributionRateDescription:
      'چندے کی رقم اور وہ تاریخ مقرر کریں جس سے یہ شرح مؤثر ہوگی۔',
    contributionAmount: 'چندے کی رقم',
    contributionAmountPlaceholder: 'مثلاً 500',
    effectiveFrom: 'مؤثر تاریخ',
    createCurrentContributionAmount:
      'موجودہ چندے کی رقم بنائیں',
    currentContributionAmountCreated:
      'موجودہ چندے کی رقم بنا دی گئی',
    rateId: 'شرح آئی ڈی',
    deathSupportEyebrow: 'وفات کی امداد',
    deathSupportPageTitle: 'وفات کی امداد',
    deathSupportDescription:
      'ارکان کے لیے وفات کی امداد کی ادائیگیاں درج کریں اور رکن کے چندے اور قرضِ حسنہ کے حصوں کو الگ محفوظ رکھیں۔',
    recordSupport: 'امداد درج کریں',
    recordDeathSupportHeading: 'وفات کی امداد درج کریں',
    recordDeathSupportDescription:
      'متاثرہ رکن منتخب کریں، مستحق کا نام اور امداد کی رقم درج کریں، اور ادائیگی کی تاریخ ریکارڈ کریں۔',
    beneficiaryName: 'مستحق کا نام',
    beneficiaryNamePlaceholder: 'مثلاً محمد علی',
    supportAmount: 'امداد کی رقم',
    supportAmountPlaceholder: 'مثلاً 50000',
    optionalReference: 'حوالہ',
    optionalReferencePlaceholder: 'اختیاری حوالہ',
    recordDeathSupportButton: 'وفات کی امداد درج کریں',
    deathSupportRecorded: 'وفات کی امداد درج کر دی گئی',
    memberFunded: 'رکن کے چندے سے',
    supportStatus: 'امداد کی حیثیت',
    checkMemberSupportStatus: 'رکن کی امداد کی حیثیت چیک کریں',
    checkMemberSupportStatusDescription:
      'دیکھیں کہ اس کمیٹی میں کسی رکن کے لیے وفات کی امداد پہلے سے درج ہے یا نہیں۔',
    checking: 'چیک کیا جا رہا ہے...',
    checkSupportStatus: 'امداد کی حیثیت چیک کریں',
    noDeathSupportRecorded: 'وفات کی امداد درج نہیں',
    supportId: 'امداد آئی ڈی',
    notRecorded: 'درج نہیں',
    committeeMembers: 'کمیٹی کے ارکان',
    membersRegisteredDescription:
      'اس کمیٹی میں اس وقت رجسٹرڈ ارکان۔',
    noMembersRegistered:
      'اس کمیٹی میں اس وقت کوئی رکن رجسٹرڈ نہیں ہے۔',
    joined: 'شامل ہوا',
    inactive: 'غیر فعال',
    leave: 'رکنیت ختم کریں',
    financialSummary: 'مالی خلاصہ',
    memberFinancialPosition: 'رکن کی مالی حیثیت',
    loadMemberFinancialPosition:
      'رکن کی موجودہ مالی حیثیت لوڈ کریں۔',
    loadSummary: 'خلاصہ لوڈ کریں',
    currentPosition: 'موجودہ حیثیت',
    totalContributions: 'کل چندہ',
    contributionBalance: 'چندے کا بیلنس',
    committeeAssetShare: 'کمیٹی کے اثاثوں میں حصہ',
    goodsValue: 'خریداری کی مالیت',
    ordinaryDues: 'عام واجبات',
    totalOutstandingDues: 'کل بقایا واجبات',
    grossCurrentValue: 'موجودہ مجموعی مالیت',
    finalCurrentValue: 'موجودہ حتمی مالیت',
    accountHistory: 'اکاؤنٹ کی تاریخ',
    memberStatement: 'رکن کا مالی بیان',
    noFinancialTransactions:
      'ابھی تک کوئی مالی لین دین ریکارڈ نہیں ہوا۔',
    leftOn: 'رکنیت ختم ہوئی',
    deathSupport: 'وفات کی امداد',
    supportRecord: 'امداد کا ریکارڈ',
    beneficiary: 'مستفید ہونے والا',
    amount: 'رقم',
    settlement: 'حتمی حساب',
    settlementRecord: 'حتمی حساب کا ریکارڈ',
    settlementDate: 'حتمی حساب کی تاریخ',
    grossAmount: 'مجموعی رقم',
    outstandingAmounts: 'بقایا رقوم',
    supportDate: 'امداد کی تاریخ',
    qarzEHasana: 'قرضِ حسنہ',
    status: 'حیثیت',
    usersAccessManagement: 'انتظامِ رسائی',
    usersDescription: 'صارف اکاؤنٹس، کمیٹی تک رسائی اور اکاؤنٹ سیکیورٹی ایک ہی جگہ سے سنبھالیں۔',
    usersAccountCountUser: 'صارف',
    usersAccountCountUsers: 'صارفین',
    usersAccountSecurity: 'اکاؤنٹ سیکیورٹی',
    usersChangePassword: 'اپنا پاس ورڈ تبدیل کریں',
    usersChangePasswordDescription: 'فی الحال سائن اِن کیے گئے منتظم اکاؤنٹ کا پاس ورڈ تبدیل کریں۔',
    usersCurrentPassword: 'موجودہ پاس ورڈ',
    usersNewPassword: 'نیا پاس ورڈ',
    usersConfirmNewPassword: 'نئے پاس ورڈ کی تصدیق',
    usersChanging: 'تبدیل کیا جا رہا ہے...',
    usersChangePasswordButton: 'پاس ورڈ تبدیل کریں',
    usersAddUser: 'صارف شامل کریں',
    usersCreateUserAccount: 'صارف اکاؤنٹ بنائیں',
    usersCreateUserDescription: 'پہلے لاگ اِن اکاؤنٹ بنائیں۔ کمیٹی کی رکنیت اور منتظم کی رسائی الگ سے دی جا سکتی ہے۔',
    usersUsername: 'صارف نام',
    usersUsernamePlaceholder: 'مثلاً committee-admin',
    usersPassword: 'پاس ورڈ',
    usersPasswordPlaceholder: 'محفوظ پاس ورڈ درج کریں',
    usersPlatformRole: 'نظام کا کردار',
    usersCommitteeMember: 'کمیٹی رکن',
    usersCommitteeAdmin: 'کمیٹی منتظم',
    usersSuperAdmin: 'سسٹم منتظم',
    usersCreating: 'بنایا جا رہا ہے...',
    usersCreateUserButton: 'صارف بنائیں',
    usersPasswordRecovery: 'پاس ورڈ کی بازیابی',
    usersRecoveryTokenIssued: 'بازیابی ٹوکن جاری کر دیا گیا',
    usersRecoveryTokenDescription: 'یہ ٹوکن محفوظ طریقے سے صارف کو دیں۔ اس کی میعاد ختم ہونے میں',
    usersCopyToken: 'ٹوکن کاپی کریں',
    usersUserUpdated: 'صارف اپ ڈیٹ کیا گیا',
    usersUserAccount: 'صارف اکاؤنٹ',
    usersUserId: 'صارف آئی ڈی',
    usersRole: 'کردار',
    usersCommitteeAccess: 'کمیٹی تک رسائی',
    usersAssignUserToCommittee: 'صارف کو کمیٹی میں شامل کریں',
    usersAssignUserDescription: 'صارف، کمیٹی اور کمیٹی کی سطح کا کردار منتخب کریں۔',
    usersSelectUser: 'صارف منتخب کریں',
    usersSelectCommittee: 'کمیٹی منتخب کریں',
    usersSelectCommitteeDescription: 'رسائی ہر کمیٹی کے لیے الگ ہے۔',
    usersChooseCommitteeRole: 'کمیٹی کا کردار منتخب کریں',
    usersChooseCommitteeRoleDescription: 'منتظم کی رسائی صرف منتخب کمیٹی پر لاگو ہوتی ہے۔',
    usersAssignment: 'تفویض',
    usersNoUserSelected: 'کوئی صارف منتخب نہیں',
    usersNoCommitteeSelected: 'کوئی کمیٹی منتخب نہیں',
    usersCommitteeAdministrator: 'کمیٹی منتظم',
    usersMemberPermissions: 'رکن کی سطح کی اجازتیں',
    usersManageAssignedCommittee: 'تفویض کردہ کمیٹی کا انتظام کریں',
    usersAssigning: 'تفویض کیا جا رہا ہے...',
    usersAssignToCommittee: 'کمیٹی کو تفویض کریں',
    usersAccounts: 'صارف اکاؤنٹس',
    usersAccountsAndAccess: 'اکاؤنٹس اور کمیٹی تک رسائی',
    usersAccountsDescription: 'اکاؤنٹ کی حیثیت، بازیابی کے اختیارات اور کمیٹی کی تفویضات دیکھیں۔',
    usersLoading: 'لوڈ ہو رہا ہے...',
    usersRefreshList: 'صارفین کی فہرست تازہ کریں',
    usersSuperAdministrator: 'سسٹم سپر منتظم',
    usersUnknownUser: 'نامعلوم صارف',
    usersInactive: 'غیر فعال',
    usersActive: 'فعال',
    usersIssueRecoveryToken: 'بازیابی ٹوکن جاری کریں',
    usersDeactivate: 'غیر فعال کریں',
    usersGlobalPlatformAuthority: 'پورے نظام کا اختیار',
    usersAssignedCommittees: 'تفویض کردہ کمیٹیاں',
    usersViewAccess: 'رسائی دیکھیں',
    usersSystemAdministrator: 'سسٹم منتظم',
    usersNoOrdinaryAssignment: 'عام کمیٹی تفویض کی ضرورت نہیں ہے۔',
    usersNoCommitteeAssignments: 'کوئی کمیٹی تفویض نہیں',
    usersNotAssignedYet: 'اس اکاؤنٹ کو ابھی کسی کمیٹی میں تفویض نہیں کیا گیا۔',
    usersAccessNotLoaded: 'رسائی لوڈ نہیں ہوئی',
    usersSelectViewAccess: 'اس صارف کی کمیٹی تفویضات لوڈ کرنے کے لیے رسائی دیکھیں منتخب کریں۔',
    usersCurrentSelectedCommittee: 'موجودہ منتخب کمیٹی:',
    usersNoCommitteeSelectedShort: 'کوئی کمیٹی منتخب نہیں',
    usersAccessActive: 'رسائی فعال',
    usersAccessInactive: 'رسائی غیر فعال',
    usersNotChecked: 'چیک نہیں کیا گیا',
    usersChecking: 'چیک کیا جا رہا ہے...',
    usersCheckAccess: 'رسائی چیک کریں',
    usersGrantAccess: 'رسائی دیں',
    usersRevokeAccess: 'رسائی منسوخ کریں',
    usersRevoked: 'منسوخ',
    usersNoUsersLoaded: 'کوئی صارف لوڈ نہیں ہوا',
    usersRefreshToRetrieve: 'موجودہ اکاؤنٹس حاصل کرنے کے لیے صارفین کی فہرست تازہ کریں۔',
    assetsEyebrow: 'اثاثے',
    assetsPageTitle: 'کمیٹی کے اثاثے',
    assetsDescription: 'کمیٹی کی ملکیت والے اثاثے درج کریں اور ان کی موجودہ مالیت کا ریکارڈ رکھیں۔',
    newAsset: 'نیا اثاثہ',
    createCommitteeAsset: 'کمیٹی کا اثاثہ بنائیں',
    createCommitteeAssetDescription: 'کمیٹی، اثاثے کی تفصیلات، خریداری کی تاریخ اور خریداری کی مالیت درج کریں۔',
    assetName: 'اثاثے کا نام',
    assetNamePlaceholder: 'مثلاً کمیٹی کا فریج',
    purchaseDate: 'خریداری کی تاریخ',
    purchaseValue: 'خریداری کی مالیت',
    purchaseValuePlaceholder: 'مثلاً 50000',
    description: 'تفصیل',
    optionalDescription: 'اختیاری تفصیل',
    createAsset: 'اثاثہ بنائیں',
    assetCreated: 'اثاثہ بنا دیا گیا',
    assetId: 'اثاثہ آئی ڈی',
    currentValue: 'موجودہ مالیت',
    updateAssetValuation: 'اثاثے کی مالیت اپ ڈیٹ کریں',
    updateAssetValuationDescription: 'نئی مالیت درج کریں۔ سابقہ مالیتیں تاریخی ریکارڈ کے طور پر محفوظ رہیں گی۔',
    valuationDate: 'مالیت کی تاریخ',
    newValue: 'نئی مالیت',
    updating: 'اپ ڈیٹ ہو رہا ہے...',
    updateValue: 'مالیت اپ ڈیٹ کریں',
    valuationUpdated: 'مالیت اپ ڈیٹ ہو گئی',
    currentAssetValueUpdated: 'اثاثے کی موجودہ مالیت اپ ڈیٹ ہو گئی',
    currentValueLabel: 'موجودہ مالیت',
    assetHistory: 'اثاثے کی تاریخ',
    viewAssetValuations: 'اثاثے کی مالیتیں دیکھیں',
    loadValuations: 'مالیتیں لوڈ کریں',
    valuations: 'مالیتیں',
    valuationHistory: 'مالیت کی تاریخ',
    valuationId: 'مالیت آئی ڈی',
    participation: 'شراکت',
    viewAssetParticipation: 'اثاثے میں شراکت دیکھیں',
    loadParticipation: 'شراکت لوڈ کریں',
    ownership: 'ملکیت',
    memberParticipation: 'ارکان کی شراکت',
    memberId: 'رکن آئی ڈی',
    ownershipUnits: 'ملکیتی یونٹس',
    totalUnits: 'کل یونٹس',
    goodsEyebrow: 'ارکان کی اشیاء',
    goodsPageTitle: 'ارکان کی اشیاء',
    goodsDescription: 'رکن کی جمع شدہ کمیٹی مالیت سے خریدی گئی اشیاء درج کریں اور ان کی موجودہ قابل واپسی مالیت کا ریکارڈ رکھیں۔',
    newGood: 'نئی شے',
    addMemberGood: 'رکن کی شے شامل کریں',
    addMemberGoodDescription: 'رکن کے اکاؤنٹ میں شے کا ریکارڈ درج کریں۔',
    goodName: 'شے کا نام',
    goodNamePlaceholder: 'مثلاً فریج',
    purchasePrice: 'خریداری کی قیمت',
    purchasePricePlaceholder: 'مثلاً 50000',
    recordGood: 'شے درج کریں',
    memberGoodCreated: 'رکن کی شے درج ہو گئی',
    goodId: 'شے آئی ڈی',
    goods: 'اشیاء',
    viewMemberGoods: 'رکن کی اشیاء دیکھیں',
    loadGoods: 'اشیاء لوڈ کریں',
    recordedGoods: 'درج شدہ اشیاء',
    unnamedGood: 'بغیر نام کی شے',
    totalValue: 'کل مالیت',
    memberGoodsTotal: 'ارکان کی اشیاء کی کل مالیت',
    loadTotal: 'کل مالیت لوڈ کریں',
    total: 'کل',
    calculated: 'حساب مکمل',
    updateGoodValuation: 'شے کی مالیت اپ ڈیٹ کریں',
    updateGoodValuationDescription: 'مالیت کی تاریخ محفوظ رکھتے ہوئے نئی مالیت درج کریں۔',
    updateGoodValue: 'شے کی مالیت اپ ڈیٹ کریں',
    goodValueUpdated: 'شے کی مالیت اپ ڈیٹ ہو گئی',
    duesEyebrow: 'بقایا واجبات',
    duesDescription: 'ارکان کے واجبات درج کریں، ان کا جائزہ لیں اور انہیں نمٹائیں۔',
    recordObligation: 'واجب درج کریں',
    createMemberDue: 'رکن کا واجب بنائیں',
    createMemberDueDescription: 'کمیٹی کے رکن کی واجب الادا رقم، مقررہ تاریخ اور متعلقہ حوالہ درج کریں۔',
    newDue: 'نیا واجب',
    amountPlaceholder: 'مثلاً 5000',
    dueDate: 'واجب الادا تاریخ',
    dueDescriptionPlaceholder: 'اس واجب کی وجہ یا تفصیل',
    recordDue: 'واجب درج کریں',
    dueRecorded: 'واجب درج ہو گیا',
    memberDueRecordedSuccessfully: 'رکن کا واجب کامیابی سے درج ہو گیا',
    dueId: 'واجب آئی ڈی',
    outstanding: 'بقایا',
    dueHistory: 'واجبات کی تاریخ',
    reviewMemberDues: 'رکن کے واجبات کا جائزہ لیں',
    reviewMemberDuesDescription: 'رکن کے درج شدہ واجبات اور ادائیگی کی حیثیت دیکھنے کے لیے رکن منتخب کریں۔',
    loadDueHistory: 'واجبات کی تاریخ لوڈ کریں',
    memberObligation: 'رکن کا واجب',
    dueNumber: 'واجب',
    paid: 'ادا شدہ',
    noDuesFound: 'کوئی واجبات نہیں ملے',
    noRecordedDues: 'اس رکن کے لیے موجودہ لوڈ شدہ تاریخ میں کوئی واجبات درج نہیں ہیں۔',
    outstandingBalance: 'بقایا بیلنس',
    checkWhatMemberOwes: 'رکن کے موجودہ بقایا واجبات دیکھیں',
    checkOutstandingDescription: 'ادائیگی درج کرنے سے پہلے موجودہ بقایا رقم دیکھیں۔',
    checkOutstanding: 'بقایا چیک کریں',
    payment: 'ادائیگی',
    applyDuePayment: 'واجب کی ادائیگی درج کریں',
    applyDuePaymentDescription: 'موجودہ واجب کے خلاف ادائیگی درج کریں۔ ادائیگی منتخب واجب کے ساتھ ریکارڈ ہوتی ہے اور اصل واجب کو تبدیل نہیں کرتی۔',
    paymentAmount: 'ادائیگی کی رقم',
    applyPayment: 'ادائیگی درج کریں',
    paymentRecorded: 'ادائیگی درج ہو گئی',
    duePaymentApplied: 'واجب کی ادائیگی درج ہو گئی',
    updated: 'اپ ڈیٹ ہو گیا',
    finalAmount: 'حتمی رقم',
    loadingMembersEllipsis: 'ارکان لوڈ ہو رہے ہیں...',
    noMembersAvailableShort: 'کوئی رکن دستیاب نہیں',
    selectMemberShort: 'رکن منتخب کریں',
    contributionBalanceLabel: 'تعاون کا بیلنس',
    assetShareLabel: 'اثاثے میں حصہ',
    goodsValueLabel: 'اشیا کی مالیت',
    outstandingDuesLabel: 'بقایا واجبات',
    finalPaymentLabel: 'حتمی ادائیگی',
    settlementCompleted: 'تصفیہ مکمل ہو گیا',
    yourAccount: 'آپ کا اکاؤنٹ',
    runningTotal: 'مجموعی رقم',
    contributionRecords: 'تعاون کا ریکارڈ',
    loadingFinancialPosition: 'آپ کی مالی پوزیشن لوڈ ہو رہی ہے...',
    myFinancialPositionDescription:
      'آپ کی جمع شدہ رقوم، کمیٹی کے اثاثوں میں آپ کے حصے اور موجودہ واجبات کا سادہ خلاصہ۔',
    noMemberRecordFound:
      'اس کمیٹی میں آپ کا رکن کا ریکارڈ نہیں ملا۔',
    whatYouWouldReceiveToday: 'آج آپ کو ملنے والی رقم',
    totalValueAfterDues:
      'یہ آپ کی کل رقم ہے جس میں سے آپ کے واجبات منہا کر دیے گئے ہیں۔',
    grossValueBeforeDues: 'واجبات سے پہلے کل رقم',
    totalContributionsPaid: 'جمع کرائی گئی کل رقم',
    ordinaryDuesYouOwe: 'آپ کے عام واجبات',
    qarzEHasanaYouOwe: 'آپ کے ذمے قرضِ حسنہ',
    totalYouCurrentlyOwe: 'آپ کے ذمے کل واجبات',
    deathSupportRecord: 'وفات کی امداد کا ریکارڈ',
    myContributionsDescription:
      'اس کمیٹی میں آپ کی جمع شدہ رقوم اور ان کے مجموعی ریکارڈ کی تفصیل۔',
    loadingContributionHistory: 'آپ کی جمع شدہ رقوم کا ریکارڈ لوڈ ہو رہا ہے...',
    totalRecordedContributions:
      'اس کمیٹی میں جمع کرائی گئی کل رقم',
    noContributionsRecorded: 'ابھی تک کوئی رقم ریکارڈ نہیں کی گئی۔',
    myDuesDescription:
      'آپ کے موجودہ واجبات اور واجبات کے مکمل ریکارڈ کی تفصیل۔',
    noDuesRecorded: 'ابھی تک کوئی واجب ریکارڈ نہیں ہوا۔',
    owed: 'واجب الادا',
    myGoodsDescription:
      'اس کمیٹی کے ذریعے خریدی گئی اشیا اور ان کی موجودہ مالیت۔',
    totalValueOfYourGoods: 'آپ کی اشیا کی کل مالیت',
    currentValueOfPurchasedGoods:
      'یہ اس کمیٹی کے ذریعے خریدی گئی آپ کی تمام اشیا کی موجودہ مالیت ہے۔',
    noGoodsRecorded: 'ابھی تک کوئی خریداری ریکارڈ نہیں ہوئی۔',
    purchasedOn: 'خریداری',
    purchasedAt: 'خریدی گئی رقم',
    sincePurchase: 'خریداری کے بعد تبدیلی',
    myDeathSupportDescription:
      'اس کمیٹی میں آپ کی وفات کی امداد کا ریکارڈ، اگر کوئی ریکارڈ موجود ہو۔',
    loadingDeathSupportRecord:
      'آپ کی وفات کی امداد کا ریکارڈ لوڈ ہو رہا ہے...',
    mySettlementDescription:
      'اگر آج تصفیہ کیا جائے تو آپ کو ملنے والی رقم کا موجودہ اندازہ۔ یہ آپ کی جمع شدہ رقوم، واجبات، اثاثوں کے حصے اور خریداری کے ساتھ تبدیل ہوتا رہتا ہے۔',
    calculatingSettlementPreview:
      'آپ کے تصفیے کا اندازہ لگایا جا رہا ہے...',
    ifSettledToday: 'اگر آج تصفیہ کیا جائے تو آپ کو ملیں گے',
    settlementPreviewNote:
      'یہ حتمی ریکارڈ نہیں بلکہ موجودہ اندازہ ہے۔ آپ کی جمع شدہ رقوم، واجبات اور حصوں میں تبدیلی کے ساتھ یہ رقم بھی بدل سکتی ہے۔',
    outstandingDues: 'بقایا واجبات',
    loadingYourDues: 'آپ کے واجبات لوڈ ہو رہے ہیں...',
    invalidWholeNumber: 'نئی رقم صفر یا اس سے زیادہ کی مکمل عدد ہونی چاہیے',
    onlySuperAdminCloseCommittees: 'صرف سپر ایڈمنسٹریٹر ہی کمیٹیاں بند کر سکتے ہیں',
    onlySuperAdminAssignUsers: 'صرف سپر ایڈمنسٹریٹر ہی صارفین کو کمیٹیوں میں شامل کر سکتے ہیں',
    onlySuperAdminManageAccess: 'صرف سپر ایڈمنسٹریٹر ہی کمیٹی کی رسائی کا انتظام کر سکتے ہیں',
    errors: {
      loadAccessibleCommittees: 'قابل رسائی کمیٹیاں لوڈ نہیں ہو سکیں',
      loadCommitteeMembers: 'کمیٹی کے ارکان لوڈ نہیں ہو سکے',
      loadCommitteeSummary: 'کمیٹی کا خلاصہ لوڈ نہیں ہو سکا',
      loadFinancialPosition: 'آپ کی مالی پوزیشن لوڈ نہیں ہو سکی',
      loadContributionHistory: 'آپ کے چندے کا ریکارڈ لوڈ نہیں ہو سکا',
      loadDues: 'آپ کے واجبات لوڈ نہیں ہو سکے',
      loadGoods: 'آپ کی خریداری کی اشیا لوڈ نہیں ہو سکیں',
      loadDeathSupport: 'آپ کی وفات کی امداد کا ریکارڈ لوڈ نہیں ہو سکا',
      loadSettlementPreview: 'آپ کے تصفیے کا پیش نظارہ لوڈ نہیں ہو سکا',
      issueRecoveryToken: 'ریکوری ٹوکن جاری نہیں ہو سکا',
      passwordChanged: 'پاس ورڈ کامیابی سے تبدیل ہو گیا',
      changePassword: 'پاس ورڈ تبدیل نہیں ہو سکا',
      recoveryTokenRequired: 'ریکوری ٹوکن درکار ہے',
      passwordReset: 'پاس ورڈ کامیابی سے ری سیٹ ہو گیا',
      resetPassword: 'پاس ورڈ ری سیٹ نہیں ہو سکا',
      loginFailed: 'لاگ اِن ناکام ہو گیا',
      createCommitteeAsset: 'کمیٹی کا اثاثہ نہیں بنایا جا سکا',
      updateCommitteeAssetValue: 'کمیٹی کے اثاثے کی مالیت اپ ڈیٹ نہیں ہو سکی',
      loadAssetValuations: 'اثاثوں کی مالیت کا ریکارڈ لوڈ نہیں ہو سکا',
      loadAssetParticipation: 'اثاثے میں رکن کی شرکت لوڈ نہیں ہو سکی',
      createMemberGood: 'رکن کی خریداری درج نہیں ہو سکی',
      loadMemberGoods: 'رکن کی خریداری کی اشیا لوڈ نہیں ہو سکیں',
      loadMemberGoodsTotal: 'رکن کی خریداری کی کل مالیت لوڈ نہیں ہو سکی',
      updateMemberGoodValue: 'خریداری کی مالیت اپ ڈیٹ نہیں ہو سکی',
      createMemberDue: 'رکن کا واجب نہیں بنایا جا سکا',
      loadMemberDues: 'رکن کے واجبات لوڈ نہیں ہو سکے',
      loadOutstandingDues: 'بقایا واجبات لوڈ نہیں ہو سکے',
      payMemberDue: 'رکن کے واجب کی ادائیگی درج نہیں ہو سکی',
      loadMemberSettlementPreview: 'رکن کے تصفیے کا پیش نظارہ لوڈ نہیں ہو سکا',
      createMemberSettlement: 'رکن کا تصفیہ نہیں بنایا جا سکا',
      payMemberSettlement: 'رکن کے تصفیے کی ادائیگی درج نہیں ہو سکی',
      alreadyClosed: 'پہلے ہی بند ہے',
      closing: 'بند کیا جا رہا ہے...',
      closed: 'بند ہے',
      closeCommittee: 'کمیٹی بند نہیں کی جا سکی',
      createCommittee: 'کمیٹی نہیں بنائی جا سکی',
      createContributionRate: 'چندے کی شرح نہیں بنائی جا سکی',
      recordContribution: 'چندہ ریکارڈ نہیں ہو سکا',
      loadMemberFinancialSummary: 'رکن کا مالی خلاصہ لوڈ نہیں ہو سکا',
      recordDeathSupport: 'وفات کی امداد ریکارڈ نہیں ہو سکی',
      loadDeathSupportStatus: 'وفات کی امداد کی حیثیت لوڈ نہیں ہو سکی',
      leaveMember: 'رکن کو کمیٹی سے نہیں نکالا جا سکا',
      createMember: 'رکن نہیں بنایا جا سکا',
      loadCommitteePermissions: 'کمیٹی کی اجازتیں لوڈ نہیں ہو سکیں',
      loadUsers: 'صارفین لوڈ نہیں ہو سکے',
      assignUserToCommittee: 'صارف کو کمیٹی میں شامل نہیں کیا جا سکا',
      loadCommitteeAdministrators: 'کمیٹی کے منتظمین لوڈ نہیں ہو سکے',
      loadCommitteeAssignments: 'کمیٹی کی تفویضات لوڈ نہیں ہو سکیں',
      loadCommitteeAccess: 'کمیٹی تک رسائی لوڈ نہیں ہو سکی',
      grantCommitteeAccess: 'کمیٹی تک رسائی نہیں دی جا سکی',
      revokeCommitteeAccess: 'کمیٹی تک رسائی ختم نہیں کی جا سکی',
      createUser: 'صارف نہیں بنایا جا سکا',
      deactivateUser: 'صارف کو غیر فعال نہیں کیا جا سکا',
    },

    loadingYourGoods: 'آپ کی خریداری کی اشیا لوڈ ہو رہی ہیں...',
    currentlyOwe: 'آپ کے ذمے اس وقت',
    outstandingDuesDescription: 'یہ آپ کے تمام غیر ادا شدہ اور جزوی طور پر ادا شدہ واجبات کی کل رقم ہے۔',
    noOutstandingDues: 'اس وقت آپ کے ذمے کوئی بقایا واجب نہیں۔',
    partial: 'جزوی ادا شدہ',
    unpaid: 'غیر ادا شدہ',
  settlementReview: 'مکمل تصفیہ جائزہ',
  selectMemberForSettlement: 'رکن منتخب کریں',
  selectMemberForSettlementDescription: 'تصفیے کے لیے رکن کی قابل واپسی مالی پوزیشن دیکھیں۔',
  previewSettlement: 'تصفیہ دیکھیں',
  settlementCalculation: 'تصفیے کا حساب',
  createSettlement: 'تصفیہ بنائیں',
  settlementCreated: 'تصفیہ بنا دیا گیا',
  recordSettlementPayment: 'تصفیے کی ادائیگی ریکارڈ کریں',
  paySettlement: 'تصفیہ ادا کریں',
  settlementPaid: 'تصفیہ ادا کر دیا گیا',
  processing: 'کارروائی جاری ہے...',
  },
}
