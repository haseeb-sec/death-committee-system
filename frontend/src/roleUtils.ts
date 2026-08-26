export type SystemRole =
  | 'super_admin'
  | 'committee_admin'
  | 'member'

export function isSuperAdmin(
  role: string | null | undefined,
): boolean {
  return role === 'super_admin'
}

export function isCommitteeAdmin(
  role: string | null | undefined,
  committeeIsAdmin: boolean | undefined,
): boolean {
  return (
    role === 'committee_admin' &&
    committeeIsAdmin === true
  )
}

export function isMember(
  role: string | null | undefined,
): boolean {
  return role === 'member'
}

export function canManageCommittee(
  role: string | null | undefined,
  committeeIsAdmin: boolean | undefined,
): boolean {
  return (
    isSuperAdmin(role) ||
    isCommitteeAdmin(role, committeeIsAdmin)
  )
}

export function canManageSystem(
  role: string | null | undefined,
): boolean {
  return isSuperAdmin(role)
}

export function canManageSystemUsers(
  role: string | null | undefined,
): boolean {
  return isSuperAdmin(role)
}

export function canManageMembers(
  role: string | null | undefined,
  committeeIsAdmin: boolean | undefined,
): boolean {
  return canManageCommittee(
    role,
    committeeIsAdmin,
  )
}

export function canWriteCommittee(
  role: string | null | undefined,
  committeeIsAdmin: boolean | undefined,
): boolean {
  return canManageCommittee(
    role,
    committeeIsAdmin,
  )
}

export function canViewCommitteeMembers(
  role: string | null | undefined,
  committeeIsAdmin: boolean | undefined,
): boolean {
  return canManageCommittee(
    role,
    committeeIsAdmin,
  )
}

export function canViewOwnMemberData(
  role: string | null | undefined,
): boolean {
  return (
    isSuperAdmin(role) ||
    isCommitteeAdmin(role, true) ||
    isMember(role)
  )
}
