type UsersPageProps = {
  username: any,
  setUsername: any,
  issuedResetToken: any,
  issuedResetExpiry: any,
  appT: any
  error: any
  passwordChangeMessage: any
  canWrite: any
  handleChangePassword: any
  currentPassword: any
  setCurrentPassword: any
  newPassword: any
  setNewPassword: any
  confirmNewPassword: any
  setConfirmNewPassword: any
  users: Array<Record<string, any>>
  usersLoading: any
  userPassword: any
  setUserPassword: any
  userCreateRole: any
  setUserCreateRole: any
  createdUser: any
  handleCreateUser: any
  handleLoadUsers: any
  handleDeactivateUser: any
  handleIssuePasswordReset: any
  assignmentUserId: any
  setAssignmentUserId: any
  assignmentCommitteeId: any
  setAssignmentCommitteeId: any
  assignmentIsAdmin: any
  setAssignmentIsAdmin: any
  handleAssignUserToCommittee: any
  committees: Array<Record<string, any>>
  committeeAdministrators: Record<string, Array<Record<string, any>>>
  userCommitteeAssignments: Record<string, Array<Record<string, any>>>
  assignmentOverviewLoading: any
  handleLoadUserCommitteeAssignments: any
  committeeId: any
  selectedAccessUserId: any
  committeeAccessLoading: any
  handleLoadCommitteeAccess: any
  handleGrantCommitteeAccess: any
  handleDeactivateCommitteeAccess: any
  committeeAccessStatus: Record<string, any>
  loading: any
}

export default function UsersPage(props: UsersPageProps) {
  const {
    username,
    setUsername,
    issuedResetToken,
    issuedResetExpiry,
    appT,
    error,
    passwordChangeMessage,
    canWrite,
    handleChangePassword,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    users,
    usersLoading,
    userPassword,
    setUserPassword,
    userCreateRole,
    setUserCreateRole,
    createdUser,
    handleCreateUser,
    handleLoadUsers,
    handleDeactivateUser,
    handleIssuePasswordReset,
    assignmentUserId,
    setAssignmentUserId,
    assignmentCommitteeId,
    setAssignmentCommitteeId,
    assignmentIsAdmin,
    setAssignmentIsAdmin,
    handleAssignUserToCommittee,
    committees,
    userCommitteeAssignments,
    assignmentOverviewLoading,
    handleLoadUserCommitteeAssignments,
    committeeId,
    selectedAccessUserId,
    committeeAccessLoading,
    handleLoadCommitteeAccess,
    handleGrantCommitteeAccess,
    handleDeactivateCommitteeAccess,
    committeeAccessStatus,
    loading,
  } = props

  return (
<section className="module-page">
  <div className="page-heading">
    <div>
      <p className="eyebrow">{appT.usersAccessManagement}</p>
      <h1>{appT.usersAccessManagement}</h1>
      <p className="page-subtitle">
        {appT.usersDescription}
      </p>
    </div>
    <div className="page-heading-meta">
      <span className="active-badge">
        {users.length} {users.length === 1 ? appT.usersAccountCountUser : appT.usersAccountCountUsers}
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
        <p className="eyebrow">{appT.usersAccountSecurity}</p>
        <h3>{appT.usersChangePassword}</h3>
        <p className="form-help">
          {appT.usersChangePasswordDescription}
        </p>
      </div>
    </div>

    <form
      className="committee-create-form users-form"
      onSubmit={
        canWrite
          ? handleChangePassword
          : (event) => event.preventDefault()
      }
    >
      <div className="rate-form-grid">
        <label>
          {appT.usersCurrentPassword}
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
          {appT.usersNewPassword}
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
          {appT.usersConfirmNewPassword}
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
        {loading ? appT.ui.changing : appT.ui.changePasswordAction}
      </button>
    </form>
  </section>

  <section className="information-card users-access-panel">
    <div className="section-heading-row">
      <div>
        <p className="eyebrow">{appT.usersAddUser}</p>
        <h3>{appT.usersCreateUserAccount}</h3>
        <p className="form-help">
          {appT.usersCreateUserDescription}
        </p>
      </div>
    </div>

    <form
      className="committee-create-form users-form"
      onSubmit={
        canWrite
          ? handleCreateUser
          : (event) => event.preventDefault()
      }
    >
      <div className="rate-form-grid">
        <label>
          {appT.usersUsername}
          <input
            type="text"
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            placeholder={appT.usersUsernamePlaceholder}
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
            placeholder={appT.usersPasswordPlaceholder}
            required
          />
        </label>

        <label>
          {appT.usersPlatformRole}
          <select
            value={userCreateRole}
            onChange={(event) =>
              setUserCreateRole(event.target.value)
            }
          >
            <option value="member">{appT.usersCommitteeMember}</option>
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
        {loading ? appT.creating : appT.usersCreateUserButton}
      </button>
    </form>
  </section>

  {issuedResetToken && (
    <section className="committee-banner">
      <div>
        <p className="eyebrow">{appT.usersPasswordRecovery}</p>
        <h3>{appT.usersRecoveryTokenIssued}</h3>
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
        <p className="eyebrow">{appT.usersUserUpdated}</p>
        <h3>{createdUser.username ?? appT.ui.userAccount}</h3>
        <p className="created-id">
          {appT.usersUserId}: {createdUser.id ?? '—'}
          {' · '}
          {appT.usersRole}: {createdUser.role ?? '—'}
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
        <p className="eyebrow">{appT.usersCommitteeAccess}</p>
        <h3>{appT.usersAssignUserToCommittee}</h3>
        <p className="form-help">
          {appT.usersAssignUserDescription}
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
            <option value="">{appT.usersSelectUser}</option>

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
            {appT.usersSelectCommitteeDescription}
          </div>

          <select
            className="users-access-select"
            value={assignmentCommitteeId}
            onChange={(event) =>
              setAssignmentCommitteeId(event.target.value)
            }
            required
          >
            <option value="">{appT.usersSelectCommittee}</option>

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
            {appT.usersChooseCommitteeRole}
          </div>

          <div className="users-access-step-help">
            {appT.usersChooseCommitteeRoleDescription}
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
                <strong>{appT.ui.committeeMember}</strong>
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
                  {appT.ui.committeeAdministrator}
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
            {appT.usersAssignment}
          </span>

          <strong>
            {assignmentUserId
              ? users.find(
                  (user) =>
                    Number(user.id) ===
                    Number(assignmentUserId),
                )?.username ?? appT.ui.selectedUser
              : appT.ui.noUserSelected}
          </strong>

          <span>
            {assignmentCommitteeId
              ? committees.find(
                  (committee) =>
                    Number(committee.id) ===
                    Number(assignmentCommitteeId),
                )?.name ?? appT.ui.selectedCommittee
              : appT.ui.noCommitteeSelected}
            {' · '}
            {assignmentIsAdmin
              ? appT.ui.committeeAdministrator
              : appT.ui.committeeMember}
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
            ? appT.ui.assigning
            : appT.ui.assignToCommittee}
        </button>
      </div>
    </form>
  </section>

  <section className="information-card users-accounts-panel">
    <div className="section-heading-row users-accounts-heading">
      <div>
        <p className="eyebrow">{appT.usersAccounts}</p>
        <h3>{appT.usersAccountsAndAccess}</h3>
        <p className="form-help">
          {appT.usersAccountsDescription}
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
          : appT.ui.refreshUserList}
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
            ? appT.ui.superAdministrator
            : user.role === 'committee_admin'
              ? appT.ui.committeeAdministrator
              : appT.ui.committeeMember

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
                        appT.ui.unknownUser}
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
                    {appT.usersUserId}: {user.id ?? '—'}
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
                        {appT.usersIssueRecoveryToken}
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
                      {appT.usersCommitteeAccess}
                    </p>

                    <strong>
                      {isSuperAdmin
                        ? appT.usersGlobalPlatformAuthority
                        : appT.usersAssignedCommittees}
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
                        : appT.ui.viewAccess}
                    </button>
                  )}
                </div>

                {isSuperAdmin ? (
                  <div className="user-access-global-note">
                    <strong>
                      {appT.usersSystemAdministrator}
                    </strong>
                    <span>
                      {appT.usersNoOrdinaryAssignment}
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
                                  ? appT.ui.committeeAdministrator
                                  : appT.ui.committeeMember}
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
                        {appT.usersNoCommitteeAssignments}
                      </strong>
                      <span>
                        {appT.usersNotAssignedYet}
                      </span>
                    </div>
                  )
                ) : (
                  <div className="user-access-empty">
                    <strong>
                      {appT.usersAccessNotLoaded}
                    </strong>
                    <span>
                      {appT.usersSelectViewAccess}
                    </span>
                  </div>
                )}

                {!isSuperAdmin && (
                  <div className="user-account-current-access">
                    <span>
                      {appT.usersCurrentSelectedCommittee}{' '}
                      {committees.find(
                        (committee) =>
                          Number(committee.id) ===
                          Number(committeeId),
                      )?.name ??
                        appT.ui.noCommitteeSelected}
                      {' · '}
                      {accessActive
                        ? 'Access active'
                        : accessInactive
                          ? 'Access inactive'
                          : appT.ui.notChecked}
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
                          : appT.usersCheckAccess}
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
                        {appT.usersGrantAccess}
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
                          {appT.usersRevokeAccess}
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
        <strong>{appT.usersNoUsersLoaded}</strong>
        <span>
          {appT.usersRefreshToRetrieve}
        </span>
      </div>
    )}
  </section>
</section>
  )
}
