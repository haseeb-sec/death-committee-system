type MyDeathSupportPageProps = {
  appT: any
  members: any[]
  myDeathSupportLoading: boolean
  myDeathSupportError: string
  myDeathSupportInfo: any
  formatPKR: (value: number) => string
}

export default function MyDeathSupportPage({
  appT,
  members,
  myDeathSupportLoading,
  myDeathSupportError,
  myDeathSupportInfo,
  formatPKR,
}: MyDeathSupportPageProps) {
  return (

            <section className="module-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">{appT.yourAccount}</p>
                  <h1>{appT.navigation["My Death Support"]}</h1>
                  <p className="page-subtitle">
                    {appT.myDeathSupportDescription}
                  </p>
                </div>
              </div>

              {myDeathSupportLoading && (
                <p className="form-help">
                  {appT.loadingDeathSupportRecord}
                </p>
              )}

              {myDeathSupportError && (
                <p className="form-error">{myDeathSupportError}</p>
              )}

              {!myDeathSupportLoading &&
                !myDeathSupportError &&
                members.length === 0 && (
                  <p className="form-help">
                    No member record was found for you in this committee.
                  </p>
                )}

              {!myDeathSupportLoading &&
                !myDeathSupportError &&
                myDeathSupportInfo &&
                !myDeathSupportInfo.death_support && (
                  <div className="finpos-empty">
                    <p>
                      {appT.noDeathSupportRecorded}
                    </p>
                  </div>
                )}

              {myDeathSupportInfo?.death_support && (
                <div className="finpos-section">
                  <p className="finpos-section-title">{appT.deathSupport}</p>

                  <div className="finpos-history-row">
                    <div>
                      <strong>{appT.beneficiary}</strong>
                    </div>
                    <span className="finpos-history-amount">
                      {myDeathSupportInfo.death_support.beneficiary_name}
                    </span>
                  </div>

                  <div className="finpos-history-row">
                    <div>
                      <strong>{appT.amount}</strong>
                    </div>
                    <span className="finpos-history-amount">
                      {formatPKR(myDeathSupportInfo.death_support.amount)}
                    </span>
                  </div>

                  <div className="finpos-history-row">
                    <div>
                      <strong>{appT.supportDate}</strong>
                    </div>
                    <span className="finpos-history-amount">
                      {myDeathSupportInfo.death_support.support_date}
                    </span>
                  </div>

                  {myDeathSupportInfo.death_support.reference && (
                    <div className="finpos-history-row">
                      <div>
                        <strong>{appT.reference}</strong>
                      </div>
                      <span className="finpos-history-amount">
                        {myDeathSupportInfo.death_support.reference}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </section>
  )
}
