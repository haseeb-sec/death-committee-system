type GoodsPageProps = {
  appT: any
  canWrite: any
  loading: any
  goodsMemberId: any
  setGoodsMemberId: any
  goodName: any
  setGoodName: any
  goodPurchaseDate: any
  setGoodPurchaseDate: any
  goodPurchasePrice: any
  setGoodPurchasePrice: any
  goodDescription: any
  setGoodDescription: any
  createdMemberGood: any
  goodsListMemberId: any
  setGoodsListMemberId: any
  memberGoods: Array<Record<string, any>>
  goodsTotalMemberId: any
  setGoodsTotalMemberId: any
  memberGoodsTotal: any
  goodValueId: any
  setGoodValueId: any
  goodValuationDate: any
  setGoodValuationDate: any
  goodNewValue: any
  setGoodNewValue: any
  updatedMemberGoodValue: any
  handleCreateMemberGood: any
  handleLoadMemberGoods: any
  handleLoadMemberGoodsTotal: any
  handleUpdateMemberGoodValue: any
  formatPKR: any
}

export default function GoodsPage(props: GoodsPageProps) {
  const {
    appT,
    canWrite,
    loading,
    goodsMemberId,
    setGoodsMemberId,
    goodName,
    setGoodName,
    goodPurchaseDate,
    setGoodPurchaseDate,
    goodPurchasePrice,
    setGoodPurchasePrice,
    goodDescription,
    setGoodDescription,
    createdMemberGood,
    goodsListMemberId,
    setGoodsListMemberId,
    memberGoods,
    goodsTotalMemberId,
    setGoodsTotalMemberId,
    memberGoodsTotal,
    goodValueId,
    setGoodValueId,
    goodValuationDate,
    setGoodValuationDate,
    goodNewValue,
    setGoodNewValue,
    updatedMemberGoodValue,
    handleCreateMemberGood,
    handleLoadMemberGoods,
    handleLoadMemberGoodsTotal,
    handleUpdateMemberGoodValue,
    formatPKR,
  } = props

  return (

            <section className="module-content">

              <div className="page-heading">
                <div>
                  <p className="eyebrow">{appT.goodsEyebrow}</p>
                  <h1>{appT.goodsPageTitle}</h1>
                  <p>{appT.goodsDescription}</p>
                </div>
              </div>

              {canWrite && (
              <section className="information-card goods-create-card">
                <div>
                  <p className="eyebrow">{appT.newGood}</p>
                  <h3>{appT.addMemberGood}</h3>
                  <p className="form-help">{appT.addMemberGoodDescription}</p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleCreateMemberGood}
                >
                  <div className="rate-form-grid">
                    <label>
                      {appT.memberId}
                      <input
                        type="number"
                        min="1"
                        value={goodsMemberId}
                        onChange={(event) =>
                          setGoodsMemberId(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      {appT.goodName}
                      <input
                        type="text"
                        value={goodName}
                        onChange={(event) =>
                          setGoodName(event.target.value)
                        }
                        placeholder={appT.goodNamePlaceholder}
                        required
                      />
                    </label>

                    <label>
                      {appT.purchaseDate}
                      <input
                        type="date"
                        value={goodPurchaseDate}
                        onChange={(event) =>
                          setGoodPurchaseDate(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      {appT.purchasePrice}
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={goodPurchasePrice}
                        onChange={(event) =>
                          setGoodPurchasePrice(event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>

                  <label>
                    {appT.description}
                    <textarea
                      value={goodDescription}
                      onChange={(event) =>
                        setGoodDescription(event.target.value)
                      }
                      placeholder={appT.optionalDescription}
                      rows={3}
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? appT.recording : appT.recordGood}
                  </button>
                </form>
              </section>              )}


              {createdMemberGood && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">{appT.recorded}</p>
                    <h3>
                      {createdMemberGood.name ?? appT.memberGoodCreated}
                    </h3>

                    <p className="created-id">
                      {appT.goodId}: {createdMemberGood.id}
                      {' · '}
                      {appT.memberId}: {createdMemberGood.member_id ??
                        goodsMemberId}
                    </p>

                    <p className="created-id">
                      `${appT.purchasePrice}:`{' '}
                      {formatPKR(
                        createdMemberGood.purchase_price ??
                          Number(goodPurchasePrice),
                      )}
                    </p>
                  </div>

                  <span className="active-badge">{appT.recorded}</span>
                </section>
              )}

              <section className="information-card goods-list-card">
                <div>
                  <p className="eyebrow">{appT.goods}</p>
                  <h3>{appT.viewMemberGoods}</h3>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadMemberGoods()
                  }}
                >
                  <label>
                    Member ID
                    <input
                      type="number"
                      min="1"
                      value={goodsListMemberId}
                      onChange={(event) =>
                        setGoodsListMemberId(event.target.value)
                      }
                      required
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? appT.loadingMembers : appT.loadGoods}
                  </button>
                </form>
              </section>

              {memberGoods.length > 0 && (
                <section className="information-card">
                  <p className="eyebrow">MEMBER GOODS</p>
                  <h3>{appT.recordedGoods}</h3>

                  {memberGoods.map((good) => (
                    <div
                      className="position-row"
                      key={good.id}
                    >
                      <div>
                        <strong>
                          {good.name ?? appT.unnamedGood}
                        </strong>
                        <small>
                          {appT.goodId}: {good.id}
                          {' · '}
                          {appT.purchaseDate}: {good.purchase_date}
                        </small>
                      </div>

                      <strong>
                        {formatPKR(
                          good.current_value ??
                            good.value ??
                            good.purchase_price ??
                            0,
                        )}
                      </strong>
                    </div>
                  ))}
                </section>
              )}

              <section className="information-card goods-total-card">
                <div>
                  <p className="eyebrow">{appT.totalValue}</p>
                  <h3>{appT.memberGoodsTotal}</h3>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadMemberGoodsTotal()
                  }}
                >
                  <label>
                    Member ID
                    <input
                      type="number"
                      min="1"
                      value={goodsTotalMemberId}
                      onChange={(event) =>
                        setGoodsTotalMemberId(event.target.value)
                      }
                      required
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? appT.loadingMembers : appT.loadTotal}
                  </button>
                </form>
              </section>

              {memberGoodsTotal && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">{appT.total}</p>
                    <h3>
                      {formatPKR(
                        memberGoodsTotal.total_value ??
                          memberGoodsTotal.total ??
                          memberGoodsTotal.value ??
                          0,
                      )}
                    </h3>

                    <p className="created-id">
                      {appT.memberId}:{' '}
                      {memberGoodsTotal.member_id ??
                        goodsTotalMemberId}
                    </p>
                  </div>

                  <span className="active-badge">{appT.calculated}</span>
                </section>
              )}

              {canWrite && (
              <section className="information-card goods-valuation-card">
                <div>
                  <p className="eyebrow">{appT.currentValue}</p>
                  <h3>{appT.updateGoodValuation}</h3>
                  <p className="form-help">{appT.updateGoodValuationDescription}</p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleUpdateMemberGoodValue}
                >
                  <div className="rate-form-grid">
                    <label>
                      {appT.goodId}
                      <input
                        type="number"
                        min="1"
                        value={goodValueId}
                        onChange={(event) =>
                          setGoodValueId(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      {appT.valuationDate}
                      <input
                        type="date"
                        value={goodValuationDate}
                        onChange={(event) =>
                          setGoodValuationDate(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      {appT.newValue}
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={goodNewValue}
                        onChange={(event) =>
                          setGoodNewValue(event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>

                  <button type="submit" disabled={loading}>
                    {loading ? appT.updating : appT.updateGoodValue}
                  </button>
                </form>
              </section>              )}


              {updatedMemberGoodValue && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">{appT.valuationUpdated}</p>
                    <h3>{appT.goodValueUpdated}</h3>

                    <p className="created-id">
                      {appT.goodId}:{' '}
                      {updatedMemberGoodValue.good_id ??
                        updatedMemberGoodValue.id ??
                        goodValueId}
                      {' · '}
                      {appT.valuationDate}:{' '}
                      {updatedMemberGoodValue.valuation_date ??
                        goodValuationDate}
                    </p>

                    <p className="created-id">
                      {appT.currentValue}:{' '}
                      {formatPKR(
                        updatedMemberGoodValue.value ??
                          updatedMemberGoodValue.new_value ??
                          Number(goodNewValue),
                      )}
                    </p>
                  </div>

                  <span className="active-badge">{appT.valuationUpdated}</span>
                </section>
              )}

            </section>
          
  )
}
