type MySettlementPageProps = {
  appT: any
  members: any[]
  mySettlementLoading: boolean
  mySettlementError: string
  mySettlementPreview: any
  formatPKR: (value: number) => string
}

export default function MySettlementPage({
  appT,
  members,
  mySettlementLoading,
  mySettlementError,
  mySettlementPreview,
  formatPKR,
}: MySettlementPageProps) {
  return (

            <section className="module-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">{appT.yourAccount}</p>
                  <h1>{appT.navigation["My Settlement"]}</h1>
                  <p className="page-subtitle">
                    {appT.mySettlementDescription}
                  </p>
                </div>
              </div>

              {mySettlementLoading && (
                <p className="form-help">
                  {appT.calculatingSettlementPreview}
                </p>
              )}

              {mySettlementError && (
                <p className="form-error">{mySettlementError}</p>
              )}

              {!mySettlementLoading &&
                !mySettlementError &&
                members.length === 0 && (
                  <p className="form-help">
                    No member record was found for you in this committee.
                  </p>
                )}

              {mySettlementPreview && (
                <>
                  <div className="dashboard-hero">
                    <p className="dashboard-hero-label">
                      {appT.ifSettledToday}
                    </p>
                    <p className="dashboard-hero-amount">
                      {formatPKR(mySettlementPreview.final_amount)}
                    </p>
                    <p className="dashboard-hero-note">
                      {appT.settlementPreviewNote}{' '}
                      {appT.grossValueBeforeDues}:{' '}
                      {formatPKR(mySettlementPreview.gross_amount)}.
                    </p>
                  </div>

                  <div className="finpos-grid">
                    <div className="finpos-stat-card finpos-stat-card--positive">
                      <p className="finpos-stat-label">
                        {appT.contributionBalance}
                      </p>
                      <p className="finpos-stat-amount">
                        {formatPKR(mySettlementPreview.contribution_balance)}
                      </p>
                    </div>

                    <div className="finpos-stat-card finpos-stat-card--neutral">
                      <p className="finpos-stat-label">
                        {appT.committeeAssetShare}
                      </p>
                      <p className="finpos-stat-amount">
                        {formatPKR(mySettlementPreview.asset_share)}
                      </p>
                    </div>

                    <div className="finpos-stat-card finpos-stat-card--neutral">
                      <p className="finpos-stat-label">Goods value</p>
                      <p className="finpos-stat-amount">
                        {formatPKR(mySettlementPreview.goods_value)}
                      </p>
                    </div>

                    <div className="finpos-stat-card finpos-stat-card--warning">
                      <p className="finpos-stat-label">Outstanding dues</p>
                      <p className="finpos-stat-amount">
                        {formatPKR(mySettlementPreview.outstanding_dues)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </section>
  )
}
