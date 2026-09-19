import type { FormEvent } from 'react'
type DuesPageProps = {
  appT: any
  members: any[]
  membersLoading: boolean
  error: string
  canWrite: boolean
  loading: boolean

  dueMemberId: string
  setDueMemberId: (value: string) => void
  dueAmount: string
  setDueAmount: (value: string) => void
  dueDate: string
  setDueDate: (value: string) => void
  dueDescription: string
  setDueDescription: (value: string) => void
  dueReference: string
  setDueReference: (value: string) => void
  createdMemberDue: Record<string, any> | null

  duesListMemberId: string
  setDuesListMemberId: (value: string) => void
  memberDues: Array<Record<string, any>>

  outstandingDuesMemberId: string
  setOutstandingDuesMemberId: (value: string) => void
  memberOutstandingDues: Record<string, any> | null

  duePaymentId: string
  setDuePaymentId: (value: string) => void
  duePaymentAmount: string
  setDuePaymentAmount: (value: string) => void
  paidMemberDue: Record<string, any> | null

  handleCreateMemberDue: (event: FormEvent) => void | Promise<void>
  handleLoadMemberDues: () => void | Promise<void>
  handleLoadOutstandingDues: () => void | Promise<void>
  handlePayMemberDue: (event: FormEvent) => void | Promise<void>
  formatPKR: (value: number) => string
}

export default function DuesPage({
  appT,
  members,
  membersLoading,
  error,
  canWrite,
  loading,
  dueMemberId,
  setDueMemberId,
  dueAmount,
  setDueAmount,
  dueDate,
  setDueDate,
  dueDescription,
  setDueDescription,
  dueReference,
  setDueReference,
  createdMemberDue,
  duesListMemberId,
  setDuesListMemberId,
  memberDues,
  outstandingDuesMemberId,
  setOutstandingDuesMemberId,
  memberOutstandingDues,
  duePaymentId,
  setDuePaymentId,
  duePaymentAmount,
  setDuePaymentAmount,
  paidMemberDue,
  handleCreateMemberDue,
  handleLoadMemberDues,
  handleLoadOutstandingDues,
  handlePayMemberDue,
  formatPKR,
}: DuesPageProps) {
  return (

            <section className="module-page dues-module">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">FINANCIAL MANAGEMENT</p>
                  <h1>{appT.navigation.Dues}</h1>
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
                      <p className="eyebrow">{appT.recordObligation}</p>
                      <h3>{appT.createMemberDue}</h3>
                      <p className="form-help">
                        {appT.createMemberDueDescription}
                      </p>
                    </div>
                    <span className="active-badge">{appT.newDue}</span>
                  </div>

                  <form
                    className="committee-create-form"
                    onSubmit={handleCreateMemberDue}
                  >
                    <div className="rate-form-grid">
                      <label>
                        {appT.member}
                        <select
                          value={dueMemberId}
                          onChange={(event) =>
                            setDueMemberId(event.target.value)
                          }
                          required
                        >
                          <option value="">
                            {membersLoading
                              ? appT.loadingMembers
                              : members.length === 0
                                ? appT.noMembersAvailable
                                : appT.selectMember}
                          </option>

                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} · ID {member.id}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        {appT.amount}
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={dueAmount}
                          onChange={(event) =>
                            setDueAmount(event.target.value)
                          }
                          placeholder={appT.amountPlaceholder}
                          required
                        />
                      </label>

                      <label>
                        {appT.dueDate}
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
                        {appT.reference}
                        <input
                          type="text"
                          value={dueReference}
                          onChange={(event) =>
                            setDueReference(event.target.value)
                          }
                          placeholder={appT.optionalReference}
                        />
                      </label>
                    </div>

                    <label>
                      {appT.description}
                      <textarea
                        value={dueDescription}
                        onChange={(event) =>
                          setDueDescription(event.target.value)
                        }
                        placeholder={appT.dueDescriptionPlaceholder}
                        rows={3}
                        required
                      />
                    </label>

                    <div className="form-actions">
                      <button type="submit" disabled={loading}>
                        {loading ? appT.recording : appT.recordDue}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {createdMemberDue && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">{appT.dueRecorded}</p>
                    <h3>{appT.memberDueRecordedSuccessfully}</h3>
                    <p className="created-id">
                      {appT.dueId}: {createdMemberDue.id}
                      {' · '}
                      {appT.memberId}: {createdMemberDue.member_id ?? dueMemberId}
                    </p>
                    <p className="created-id">
                      {appT.amount}:{' '}
                      {formatPKR(
                        createdMemberDue.amount ?? Number(dueAmount),
                      )}
                      {' · '}
                      {appT.outstanding}:{' '}
                      {formatPKR(
                        createdMemberDue.outstanding_amount ??
                          createdMemberDue.amount ??
                          Number(dueAmount),
                      )}
                    </p>
                  </div>

                  <span className="active-badge">{appT.recorded}</span>
                </section>
              )}

              <section className="information-card dues-history-card">
                <div className="section-heading-row">
                  <div>
                    <p className="eyebrow">{appT.dueHistory}</p>
                    <h3>{appT.reviewMemberDues}</h3>
                    <p className="form-help">
                      {appT.selectMember} to inspect their recorded dues and
                      payment status.
                    </p>
                  </div>
                </div>

                <form
                  className="committee-create-form dues-lookup-form"
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
                        <option value="">{appT.selectMember}</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} · ID {member.id}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="form-actions form-actions-end">
                      <button type="submit" disabled={loading}>
                        {loading ? appT.loadingMembers : appT.loadDueHistory}
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
                            <p className="eyebrow">{appT.dueNumber} #{due.id ?? '—'}</p>
                            <strong>
                              {due.description ?? appT.memberObligation}
                            </strong>
                            <span>
                              {appT.dueDate}: {due.due_date ?? '—'}
                              {due.reference
                                ? ` · Ref: ${due.reference}`
                                : ''}
                            </span>
                          </div>

                          <div className="due-record-amounts">
                            <div>
                              <small>{appT.total}</small>
                              <strong>
                                {formatPKR(Number(due.amount ?? 0))}
                              </strong>
                            </div>

                            <div>
                              <small>{appT.outstanding}</small>
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
                    <strong>{appT.noDuesFound}</strong>
                    <span>
                      {appT.noRecordedDues}
                    </span>
                  </div>
                ) : null}
              </section>

              <section className="information-card dues-outstanding-card">
                <div className="section-heading-row">
                  <div>
                    <p className="eyebrow">{appT.outstandingBalance}</p>
                    <h3>{appT.checkWhatMemberOwes}</h3>
                    <p className="form-help">
                      {appT.checkOutstandingDescription}
                    </p>
                  </div>
                </div>

                <form
                  className="committee-create-form dues-lookup-form"
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
                        <option value="">{appT.selectMember}</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} · ID {member.id}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="form-actions form-actions-end">
                      <button type="submit" disabled={loading}>
                        {loading ? appT.checking : appT.checkOutstanding}
                      </button>
                    </div>
                  </div>
                </form>

                {memberOutstandingDues && (
                  <div className="dues-balance-panel">
                    <div>
                      <span>{appT.member}</span>
                      <strong>
                        {memberOutstandingDues.member_name ??
                          memberOutstandingDues.member_id ??
                          outstandingDuesMemberId}
                      </strong>
                    </div>

                    <div>
                      <span>{appT.outstanding}</span>
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
                      <p className="eyebrow">{appT.payment}</p>
                      <h3>{appT.applyDuePayment}</h3>
                      <p className="form-help">
                        {appT.applyDuePaymentDescription}
                      </p>
                    </div>
                  </div>

                  <form
                    className="committee-create-form"
                    onSubmit={handlePayMemberDue}
                  >
                    <div className="rate-form-grid">
                      <label>
                        {appT.dueId}
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={duePaymentId}
                          onChange={(event) =>
                            setDuePaymentId(event.target.value)
                          }
                          placeholder={appT.dueId}
                          required
                        />
                      </label>

                      <label>
                        {appT.paymentAmount}
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={duePaymentAmount}
                          onChange={(event) =>
                            setDuePaymentAmount(event.target.value)
                          }
                          placeholder={appT.amountPlaceholder}
                          required
                        />
                      </label>
                    </div>

                    <div className="form-actions">
                      <button type="submit" disabled={loading}>
                        {loading ? appT.updating : appT.applyPayment}
                      </button>
                    </div>
                  </form>

                  {paidMemberDue && (
                    <div className="committee-banner dues-payment-result">
                      <div>
                        <p className="eyebrow">{appT.paymentRecorded}</p>
                        <h3>{appT.duePaymentApplied}</h3>
                        <p className="created-id">
                          {appT.dueId}: {paidMemberDue.id ?? duePaymentId}
                        </p>
                        <p className="created-id">
                          {appT.outstanding}:{' '}
                          {formatPKR(
                            Number(
                              paidMemberDue.outstanding_amount ??
                                paidMemberDue.remaining_amount ??
                                0,
                            ),
                          )}
                        </p>
                      </div>

                      <span className="active-badge">{appT.updated}</span>
                    </div>
                  )}
                </section>
              )}
            </section>
  )
}
