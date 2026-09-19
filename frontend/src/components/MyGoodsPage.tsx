type MyGoodsPageProps = {
  appT: any
  members: any[]
  myGoodsLoading: boolean
  myGoodsError: string
  myGoods: any[]
  myGoodsTotal: any
  formatPKR: (value: number) => string
}

export default function MyGoodsPage({
  appT,
  members,
  myGoodsLoading,
  myGoodsError,
  myGoods,
  myGoodsTotal,
  formatPKR,
}: MyGoodsPageProps) {
  return (

            <section className="module-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">{appT.yourAccount}</p>
                  <h1>{appT.navigation["My Goods"]}</h1>
                  <p className="page-subtitle">
                    {appT.myGoodsDescription}
                  </p>
                </div>
              </div>

              {myGoodsLoading && (
                <p className="form-help">{appT.loadingYourGoods}</p>
              )}

              {myGoodsError && (
                <p className="form-error">{myGoodsError}</p>
              )}

              {!myGoodsLoading &&
                !myGoodsError &&
                members.length === 0 && (
                  <p className="form-help">
                    No member record was found for you in this committee.
                  </p>
                )}

              {myGoodsTotal && (
                <div className="dashboard-hero">
                  <p className="dashboard-hero-label">
                    {appT.totalValueOfYourGoods}
                  </p>
                  <p className="dashboard-hero-amount">
                    {formatPKR(myGoodsTotal.total_goods_value)}
                  </p>
                  <p className="dashboard-hero-note">
                    {appT.currentValueOfPurchasedGoods}
                  </p>
                </div>
              )}

              <div className="finpos-section">
                <p className="finpos-section-title">{appT.goods}</p>

                {!myGoodsLoading &&
                !myGoodsError &&
                myGoods.length === 0 ? (
                  <p className="finpos-empty">
                    {appT.noGoodsRecorded}
                  </p>
                ) : (
                  <div>
                    {myGoods.map((good) => {
                      const delta = good.current_value - good.purchase_price

                      return (
                        <div className="mygoods-item-row" key={good.id}>
                          <div className="mygoods-item-info">
                            <strong>{good.name}</strong>
                            <small>
                              {appT.purchasedOn} {good.purchase_date}
                              {good.description
                                ? ` · ${good.description}`
                                : ''}
                            </small>
                            {!good.is_active && (
                              <span className="mygoods-inactive-badge">
                                {appT.inactive}
                              </span>
                            )}
                          </div>

                          <div className="mygoods-item-amounts">
                            <span className="mygoods-item-value">
                              {formatPKR(good.current_value)}
                            </span>
                            <small>
                              {appT.purchasedAt} {formatPKR(good.purchase_price)}
                            </small>
                            {delta !== 0 && (
                              <span
                                className={`mygoods-item-delta ${
                                  delta > 0
                                    ? 'mygoods-item-delta--up'
                                    : 'mygoods-item-delta--down'
                                }`}
                              >
                                {delta > 0 ? '+' : ''}
                                {formatPKR(delta)} {appT.sincePurchase}
                              </span>
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
