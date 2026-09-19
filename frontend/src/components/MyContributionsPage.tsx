type MyContributionsPageProps = {
  appT: any
  members: any[]
  myContributionsLoading: boolean
  myContributionsError: string
  myContributions: any[]
  myContributionTotal: any
  formatPKR: (value: number) => string
}

export default function MyContributionsPage({
  appT,
  members,
  myContributionsLoading,
  myContributionsError,
  myContributions,
  myContributionTotal,
  formatPKR,
}: MyContributionsPageProps) {
  return (

            <section className="module-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">{appT.yourAccount}</p>
                  <h1>{appT.navigation["My Contributions"]}</h1>
                  <p className="page-subtitle">
                    {appT.myContributionsDescription}
                  </p>
                </div>
              </div>

              {myContributionsLoading && (
                <p className="form-help">
                  {appT.loadingContributionHistory}
                </p>
              )}

              {myContributionsError && (
                <p className="form-error">{myContributionsError}</p>
              )}

              {!myContributionsLoading &&
                !myContributionsError &&
                members.length === 0 && (
                  <p className="form-help">
                    No member record was found for you in this committee.
                  </p>
                )}

              {myContributionTotal && (
                <div className="dashboard-hero member-contribution-hero">
                  <p className="dashboard-hero-label">{appT.runningTotal}</p>

                  <p className="dashboard-hero-amount">
                    {formatPKR(myContributionTotal.total_contributed)}
                  </p>

                  <p className="dashboard-hero-note">
                    {appT.totalRecordedContributions}
                  </p>
                </div>
              )}

              <div className="finpos-section">
                <p className="finpos-section-title">{appT.contributionRecords}</p>

                {!myContributionsLoading &&
                !myContributionsError &&
                myContributions.length === 0 ? (
                  <p className="finpos-empty">
                    {appT.noContributionsRecorded}
                  </p>
                ) : (
                  <div>
                    {myContributions.map((entry) => (
                      <div
                        className="finpos-history-row"
                        key={entry.journal_entry_id}
                      >
                        <div>
                          <strong>{entry.description}</strong>
                          <small>
                            {entry.contribution_date}
                            {entry.reference
                              ? ` · ${entry.reference}`
                              : ''}
                          </small>
                        </div>

                        <span className="finpos-history-amount">
                          {formatPKR(entry.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          
  )
}
