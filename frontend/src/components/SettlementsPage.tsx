import type { FormEvent } from 'react'

type SettlementsPageProps = {
  appT: any
  members: any[]
  membersLoading: boolean
  settlementLoading: boolean
  createLoading: boolean
  paymentLoading: boolean
  canWrite: boolean
  formatPKR: (value: number) => string

  settlementMemberId: string
  setSettlementMemberId: (value: string) => void
  settlementDate: string
  setSettlementDate: (value: string) => void
  settlementPreview: Record<string, any> | null
  setSettlementPreview: (value: Record<string, any> | null) => void
  createdMemberSettlement: Record<string, any> | null
  setCreatedMemberSettlement: (value: Record<string, any> | null) => void
  paidMemberSettlement: Record<string, any> | null
  setPaidMemberSettlement: (value: Record<string, any> | null) => void

  handleLoadMemberSettlement: () => Promise<void>
  handleCreateMemberSettlement: (event: FormEvent<HTMLFormElement>) => void
  handlePayMemberSettlement: () => Promise<void>
}

export default function SettlementsPage({
  appT,
  members,
  membersLoading,
  settlementLoading,
  createLoading,
  paymentLoading,
  canWrite,
  formatPKR,
  settlementMemberId,
  setSettlementMemberId,
  settlementDate,
  setSettlementDate,
  settlementPreview,
  setSettlementPreview,
  createdMemberSettlement,
  setCreatedMemberSettlement,
  paidMemberSettlement,
  setPaidMemberSettlement,
  handleLoadMemberSettlement,
  handleCreateMemberSettlement,
  handlePayMemberSettlement,
}: SettlementsPageProps) {
  return (

            <section className="module-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">{appT.settlement}</p>
                  <h1>{appT.settlement}</h1>
                  <p className="page-subtitle">
                    Review a member's complete refundable position, create the
                    settlement, and record the final payment.
                  </p>
                </div>

              </div>

              <section className="information-card">
                <div>
                  <p className="eyebrow">{appT.settlementReview}</p>
                  <h3>{appT.selectMemberForSettlement}</h3>
                  <p className="form-help">
                    {appT.selectMemberForSettlementDescription}
                  </p>
                </div>

                <div className="committee-create-form">
                  <div className="rate-form-grid">
                    <label>
                      {appT.member}
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
                            ? appT.loadingMembersEllipsis
                            : members.length === 0
                              ? appT.noMembersAvailableShort
                              : appT.selectMemberShort}
                        </option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} · {appT.member} #{member.id}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      {appT.settlementDate}
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
                      settlementLoading ||
                      membersLoading ||
                      !settlementMemberId
                    }
                    onClick={() => void handleLoadMemberSettlement()}
                  >
                    {settlementLoading ? appT.loadingData : appT.previewSettlement}
                  </button>
                </div>
              </section>

              {settlementPreview && (
                <section className="settlement-summary-grid">
                  <section className="information-card settlement-summary-card">
                    <div>
                      <p className="eyebrow">{appT.contributionBalanceLabel}</p>
                      <h3>
                        {formatPKR(
                          settlementPreview.contribution_balance ?? 0,
                        )}
                      </h3>
                      <p className="form-help">
                        {appT.settlementContributionBalanceDescription}
                      </p>
                    </div>
                  </section>

                  <section className="information-card settlement-summary-card">
                    <div>
                      <p className="eyebrow">{appT.assetShareLabel}</p>
                      <h3>
                        {formatPKR(settlementPreview.asset_share ?? 0)}
                      </h3>
                      <p className="form-help">
                        {appT.settlementAssetShareDescription}
                      </p>
                    </div>
                  </section>

                  <section className="information-card settlement-summary-card">
                    <div>
                      <p className="eyebrow">{appT.goodsValueLabel}</p>
                      <h3>
                        {formatPKR(settlementPreview.goods_value ?? 0)}
                      </h3>
                      <p className="form-help">
                        {appT.settlementGoodsValueDescription}
                      </p>
                    </div>
                  </section>

                  <section className="information-card settlement-summary-card settlement-dues-card">
                    <div>
                      <p className="eyebrow">{appT.outstandingDuesLabel}</p>
                      <h3>
                        {formatPKR(
                          settlementPreview.outstanding_dues ?? 0,
                        )}
                      </h3>
                      <p className="form-help">
                        {appT.settlementOutstandingDuesDescription}
                      </p>
                    </div>
                  </section>
                </section>
              )}

              {settlementPreview && (
                <section className="information-card settlement-final-card">
                  <div>
                    <p className="eyebrow">{appT.settlementCalculation}</p>
                    <h3>
                      {formatPKR(settlementPreview.final_amount ?? 0)}
                    </h3>
                    <p className="form-help">
                      {appT.settlementFinalAmountDescription.replace('{gross}', formatPKR(settlementPreview.gross_amount ?? 0))}
                    </p>
                  </div>

                  {canWrite && (
                    <form
                      className="committee-create-form"
                      onSubmit={handleCreateMemberSettlement}
                    >
                      <button type="submit" disabled={createLoading}>
                        {createLoading
                          ? appT.creating
                          : appT.createSettlement}
                      </button>
                    </form>
                  )}
                </section>
              )}

              {createdMemberSettlement && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">{appT.settlementCreated}</p>
                    <h3>
                      {appT.settlement} #
                      {createdMemberSettlement.id ?? '—'}
                    </h3>
                    <p className="created-id">
                      {appT.memberId}:{' '}
                      {createdMemberSettlement.member_id ??
                        settlementMemberId}
                      {' · '}
                      {appT.finalAmount}:{' '}
                      {formatPKR(
                        createdMemberSettlement.final_amount ?? 0,
                      )}
                    </p>
                  </div>
                  <span className="neutral-badge">
                    {createdMemberSettlement.status ?? appT.created}
                  </span>
                </section>
              )}

              {createdMemberSettlement &&
                createdMemberSettlement.status !== 'paid' && (
                  <section className="information-card">
                    <div>
                      <p className="eyebrow">{appT.finalPaymentLabel}</p>
                      <h3>{appT.recordSettlementPayment}</h3>
                      <p className="form-help">
                        {appT.settlementPaymentDescription}
                      </p>
                    </div>

                    {canWrite && (
                      <button
                        type="button"
                        disabled={paymentLoading}
                        onClick={() => void handlePayMemberSettlement()}
                      >
                        {paymentLoading ? appT.processing : appT.paySettlement}
                      </button>
                    )}
                  </section>
                )}

              {paidMemberSettlement && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">{appT.settlementPaid}</p>
                    <h3>{appT.settlementCompleted}</h3>
                    <p className="created-id">
                      {appT.settlementId}:{' '}
                      {paidMemberSettlement.id ?? '—'}
                      {' · '}
                      {appT.memberId}:{' '}
                      {paidMemberSettlement.member_id ??
                        settlementMemberId}
                      {' · '}
                      {appT.paid}:{' '}
                      {formatPKR(
                        paidMemberSettlement.final_amount ?? 0,
                      )}
                    </p>
                  </div>
                </section>
              )}
            </section>
          
  )
}
