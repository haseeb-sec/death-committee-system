type MyDuesPageProps = {
  appT: any
  members: any[]
  myDuesLoading: boolean
  myDuesError: string
  myOutstandingDues: any
  myDues: any[]
  formatPKR: (value: number) => string
}

export default function MyDuesPage({
  appT,
  members,
  myDuesLoading,
  myDuesError,
  myOutstandingDues,
  myDues,
  formatPKR,
}: MyDuesPageProps) {
  return (
            <section className="module-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">{appT.yourAccount}</p>
                  <h1>{appT.navigation["My Dues"]}</h1>
                  <p className="page-subtitle">
                    {appT.myDuesDescription}
                  </p>
                </div>
              </div>

              {myDuesLoading && (
                <p className="form-help">{appT.loadingYourDues}</p>
              )}

              {myDuesError && (
                <p className="form-error">{myDuesError}</p>
              )}

              {!myDuesLoading &&
                !myDuesError &&
                members.length === 0 && (
                  <p className="form-help">
                    No member record was found for you in this committee.
                  </p>
                )}

              {myOutstandingDues && (
                <div
                  className="dashboard-hero"
                >
                  <p className="dashboard-hero-label">
                    {myOutstandingDues.outstanding_dues > 0
                      ? appT.currentlyOwe
                      : appT.ui.allCaughtUp}
                  </p>

                  <p className="dashboard-hero-amount">
                    {formatPKR(myOutstandingDues.outstanding_dues)}
                  </p>

                  <p className="dashboard-hero-note">
                    {myOutstandingDues.outstanding_dues > 0
                      ? appT.outstandingDuesDescription
                      : appT.noOutstandingDues}
                  </p>
                </div>
              )}

              <div className="finpos-section">
                <p className="finpos-section-title">{appT.dueHistory}</p>

                {!myDuesLoading &&
                !myDuesError &&
                myDues.length === 0 ? (
                  <p className="finpos-empty">
                    {appT.noDuesRecorded}
                  </p>
                ) : (
                  <div>
                    {myDues.map((due) => {
                      const status =
                        due.paid_amount >= due.amount
                          ? 'paid'
                          : due.paid_amount > 0
                            ? 'partial'
                            : 'unpaid'

                      const statusLabel =
                        status === 'paid'
                          ? appT.paid
                          : status === 'partial'
                            ? appT.partial
                            : appT.unpaid

                      return (
                        <div className="mydues-due-row" key={due.id}>
                          <div className="mydues-due-info">
                            <strong>{due.description}</strong>
                            <small>
                              {due.due_date}
                              {due.reference ? ` · ${due.reference}` : ''}
                            </small>
                          </div>

                          <div className="mydues-due-amounts">
                            <span
                              className={`mydues-status-badge mydues-status-badge--${status}`}
                            >
                              {statusLabel}
                            </span>
                            <span className="mydues-due-total">
                              {formatPKR(due.amount)}
                            </span>
                            {due.outstanding_amount > 0 && (
                              <small>
                                {formatPKR(due.outstanding_amount)} {appT.owed}
                              </small>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
  )
}
