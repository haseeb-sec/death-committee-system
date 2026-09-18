import type { FormEvent } from 'react'

type ContributionsPageProps = {
  appT: any
  members: any[]
  membersLoading: boolean
  error: string
  canWrite: boolean
  loading: boolean
  contributionMemberId: string
  setContributionMemberId: (value: string) => void
  contributionDate: string
  setContributionDate: (value: string) => void
  contributionReference: string
  setContributionReference: (value: string) => void
  createdContribution: Record<string, any> | null
  contributionAmount: string
  setContributionAmount: (value: string) => void
  effectiveFrom: string
  setEffectiveFrom: (value: string) => void
  createdContributionRate: Record<string, any> | null
  committeeId: string
  handleCreateContribution: (event: FormEvent<HTMLFormElement>) => void
  handleCreateContributionRate: (event: FormEvent<HTMLFormElement>) => void
}

export default function ContributionsPage({
  appT,
  members,
  membersLoading,
  error,
  canWrite,
  loading,
  contributionMemberId,
  setContributionMemberId,
  contributionDate,
  setContributionDate,
  contributionReference,
  setContributionReference,
  createdContribution,
  contributionAmount,
  setContributionAmount,
  effectiveFrom,
  setEffectiveFrom,
  createdContributionRate,
  committeeId,
  handleCreateContribution,
  handleCreateContributionRate,
}: ContributionsPageProps) {
  return (
            <>
              <section className="page-heading">
                <div>
                  <p className="eyebrow">{appT.contributionsEyebrow}</p>
                  <h1>{appT.currentContributionAmounts}</h1>
                  <p>
                    {appT.contributionsDescription}
                  </p>
                </div>
              </section>

              {error && <div className="error page-error">{error}</div>}

              {canWrite && (
                <section className="information-card">
                  <div>
                    <p className="eyebrow">{appT.recordContribution}</p>
                    <h3>{appT.recordMemberContribution}</h3>
                  <p className="form-help">
                    {appT.contributionRateAutoSelected}
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleCreateContribution}
                >
                  <div className="rate-form-grid">
                    <label>
                      {appT.member}
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
                            ? appT.loadingMembers
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

                    <label>
                      {appT.paymentDate}
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
                      {appT.reference}
                      <input
                        value={contributionReference}
                        onChange={(event) =>
                          setContributionReference(event.target.value)
                        }
                        placeholder={appT.referencePlaceholder}
                      />
                    </label>
                  </div>

                  <button type="submit" disabled={loading}>
                    {loading ? appT.recording : appT.recordContributionButton}
                  </button>
                </form>
                </section>
              )}

              {createdContribution && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">{appT.recorded}</p>
                    <h3>{appT.contributionRecorded}</h3>

                    <p className="created-id">
                      {appT.member} ID: {createdContribution.member_id}
                      {' · '}
                      {appT.date}: {createdContribution.contribution_date}
                    </p>

                    {createdContribution.reference && (
                      <p className="created-id">
                        {appT.reference}: {createdContribution.reference}
                      </p>
                    )}

                    {createdContribution.journal_entry_id !== undefined && (
                      <p className="created-id">
                        {appT.journalEntryId}:{' '}
                        {createdContribution.journal_entry_id}
                      </p>
                    )}
                  </div>

                  <span className="active-badge">{appT.recorded}</span>
                </section>
              )}

              {canWrite && (
                <section className="information-card contribution-rate-card">
                  <div>
                    <p className="eyebrow">{appT.newRate}</p>
                    <h3>{appT.createContributionRateHeading}</h3>
                  <p className="form-help">
                    {appT.createContributionRateDescription}
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleCreateContributionRate}
                >
                  <div className="rate-form-grid">
                    <label>
                      {appT.contributionAmount}
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={contributionAmount}
                        onChange={(event) =>
                          setContributionAmount(event.target.value)
                        }
                        placeholder={appT.contributionAmountPlaceholder}
                        required
                      />
                    </label>

                    <label>
                      {appT.effectiveFrom}
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
                      ? appT.creating
                      : appT.createCurrentContributionAmount}
                  </button>
                </form>
                </section>
              )}

              {createdContributionRate && (
                <section className="committee-banner contribution-rate-result">
                  <div>
                    <p className="eyebrow">{appT.created}</p>
                    <h3>
                      {createdContributionRate.amount !== undefined
                        ? `Rs. ${createdContributionRate.amount.toLocaleString(
                            'en-PK',
                          )}`
                        : appT.currentContributionAmountCreated}
                    </h3>

                    <p className="created-id">
                      Committee ID:{' '}
                      {createdContributionRate.committee_id ??
                        committeeId}
                      {' · '}
                      {appT.effectiveFrom}:{' '}
                      {createdContributionRate.effective_from ??
                        effectiveFrom}
                    </p>

                    {createdContributionRate.id !== undefined && (
                      <p className="created-id">
                        {appT.rateId}: {createdContributionRate.id}
                      </p>
                    )}
                  </div>

                  <span className="active-badge">{appT.created}</span>
                </section>
              )}
            </>
  )
}
