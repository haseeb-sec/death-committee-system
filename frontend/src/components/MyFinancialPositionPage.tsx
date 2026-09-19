type MyFinancialPositionPageProps = {
  appT: any
  members: any[]
  myFinancialSummaryLoading: boolean
  myFinancialSummaryError: string
  myFinancialSummary: any
  myStatement: any[]
  formatPKR: (value: number) => string
}

export default function MyFinancialPositionPage({
  appT,
  members,
  myFinancialSummaryLoading,
  myFinancialSummaryError,
  myFinancialSummary,
  myStatement,
  formatPKR,
}: MyFinancialPositionPageProps) {
  return (

            <section className="module-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">{appT.yourAccount}</p>
                  <h1>{appT.navigation["My Financial Position"]}</h1>
                  <p className="page-subtitle">
                    {appT.myFinancialPositionDescription}
                  </p>
                </div>
              </div>

              {myFinancialSummaryLoading && (
                <p className="form-help">{appT.loadingFinancialPosition}</p>
              )}

              {myFinancialSummaryError && (
                <p className="form-error">{myFinancialSummaryError}</p>
              )}

              {!myFinancialSummaryLoading &&
                !myFinancialSummaryError &&
                members.length === 0 && (
                  <p className="form-help">
                    {appT.noMemberRecordFound}
                  </p>
                )}

              {myFinancialSummary && (
                <>
                  <div className="finpos-member-banner">
                    <div>
                      <p className="eyebrow">{appT.member}</p>
                      <h3>{myFinancialSummary.member_name}</h3>
                      <p>
                        Member ID {myFinancialSummary.member_id} · Joined{' '}
                        {myFinancialSummary.joined_on}
                        {myFinancialSummary.left_on
                          ? ` · Left ${myFinancialSummary.left_on}`
                          : ''}
                      </p>
                    </div>

                    <span
                      className={
                        myFinancialSummary.is_active
                          ? 'active-badge'
                          : 'inactive-badge'
                      }
                    >
                      {myFinancialSummary.is_active ? appT.active : appT.inactive}
                    </span>
                  </div>

                  <div className="dashboard-hero">
                    <p className="dashboard-hero-label">
                      {appT.whatYouWouldReceiveToday}
                    </p>
                    <p className="dashboard-hero-amount">
                      {formatPKR(myFinancialSummary.current_final_value)}
                    </p>
                    <p className="dashboard-hero-note">
                      {appT.totalValueAfterDues}{' '}
                      {appT.grossValueBeforeDues}:{' '}
                      {formatPKR(myFinancialSummary.current_gross_value)}.
                    </p>
                  </div>

                  <div className="finpos-grid">
                    <div className="finpos-stat-card finpos-stat-card--positive">
                      <p className="finpos-stat-label">
                        {appT.totalContributionsPaid}
                      </p>
                      <p className="finpos-stat-amount">
                        {formatPKR(myFinancialSummary.total_contributions)}
                      </p>
                    </div>

                    <div className="finpos-stat-card finpos-stat-card--positive">
                      <p className="finpos-stat-label">
                        {appT.contributionBalance}
                      </p>
                      <p className="finpos-stat-amount">
                        {formatPKR(myFinancialSummary.contribution_balance)}
                      </p>
                    </div>

                    <div className="finpos-stat-card finpos-stat-card--neutral">
                      <p className="finpos-stat-label">
                        {appT.committeeAssetShare}
                      </p>
                      <p className="finpos-stat-amount">
                        {formatPKR(myFinancialSummary.asset_share)}
                      </p>
                    </div>

                    <div className="finpos-stat-card finpos-stat-card--neutral">
                      <p className="finpos-stat-label">
                        {appT.goodsValue}
                      </p>
                      <p className="finpos-stat-amount">
                        {formatPKR(myFinancialSummary.goods_value)}
                      </p>
                    </div>

                    <div className="finpos-stat-card finpos-stat-card--warning">
                      <p className="finpos-stat-label">
                        {appT.ordinaryDuesYouOwe}
                      </p>
                      <p className="finpos-stat-amount">
                        {formatPKR(myFinancialSummary.ordinary_dues)}
                      </p>
                    </div>

                    <div className="finpos-stat-card finpos-stat-card--warning">
                      <p className="finpos-stat-label">
                        {appT.qarzEHasanaYouOwe}
                      </p>
                      <p className="finpos-stat-amount">
                        {formatPKR(myFinancialSummary.qarz_e_hasana_dues)}
                      </p>
                    </div>
                  </div>

                  <div className="finpos-section">
                    <p className="finpos-section-title">
                      {appT.totalYouCurrentlyOwe}:{' '}
                      {formatPKR(myFinancialSummary.outstanding_dues)}
                    </p>
                  </div>

                  <div className="finpos-section">
                    <p className="finpos-section-title">{appT.accountHistory}</p>

                    {myStatement.length === 0 ? (
                      <p className="finpos-empty">
                        {appT.noFinancialTransactions}
                      </p>
                    ) : (
                      <div>
                        {myStatement.map((row, index) => (
                          <div
                            className="finpos-history-row"
                            key={`${row.date}-${index}`}
                          >
                            <div>
                              <strong>{row.description}</strong>
                              <small>
                                {row.date}
                                {row.reference ? ` · ${row.reference}` : ''}
                              </small>
                            </div>

                            <span className="finpos-history-amount">
                              {formatPKR(row.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {myFinancialSummary.death_support && (
                    <div className="finpos-section">
                      <p className="finpos-section-title">
                        {appT.deathSupportRecord}
                      </p>

                      <div className="finpos-history-row">
                        <div>
                          <strong>{appT.beneficiary}</strong>
                        </div>
                        <span className="finpos-history-amount">
                          {myFinancialSummary.death_support.beneficiary_name}
                        </span>
                      </div>

                      <div className="finpos-history-row">
                        <div>
                          <strong>{appT.amount}</strong>
                        </div>
                        <span className="finpos-history-amount">
                          {formatPKR(myFinancialSummary.death_support.amount)}
                        </span>
                      </div>

                      <div className="finpos-history-row">
                        <div>
                          <strong>{appT.supportDate}</strong>
                        </div>
                        <span className="finpos-history-amount">
                          {myFinancialSummary.death_support.support_date}
                        </span>
                      </div>
                    </div>
                  )}

                  {myFinancialSummary.settlement && (
                    <div className="finpos-section">
                      <p className="finpos-section-title">
                        {appT.settlementRecord}
                      </p>

                      <div className="finpos-history-row">
                        <div>
                          <strong>{appT.settlementDate}</strong>
                        </div>
                        <span className="finpos-history-amount">
                          {myFinancialSummary.settlement.settlement_date}
                        </span>
                      </div>

                      <div className="finpos-history-row">
                        <div>
                          <strong>{appT.grossAmount}</strong>
                        </div>
                        <span className="finpos-history-amount">
                          {formatPKR(
                            myFinancialSummary.settlement.gross_amount,
                          )}
                        </span>
                      </div>

                      <div className="finpos-history-row">
                        <div>
                          <strong>{appT.outstandingAmounts}</strong>
                        </div>
                        <span className="finpos-history-amount">
                          {formatPKR(
                            myFinancialSummary.settlement.outstanding_dues,
                          )}
                        </span>
                      </div>

                      <div className="finpos-history-row">
                        <div>
                          <strong>{appT.finalAmount}</strong>
                        </div>
                        <span className="finpos-history-amount">
                          {formatPKR(
                            myFinancialSummary.settlement.final_amount,
                          )}
                        </span>
                      </div>

                      <div className="finpos-history-row">
                        <div>
                          <strong>{appT.status}</strong>
                        </div>
                        <span className="finpos-history-amount">
                          {myFinancialSummary.settlement.status}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          
  )
}
