type AssetsPageProps = {
  appT: any
  error: any
  canWrite: any
  loading: any

  assetName: any
  setAssetName: any
  assetPurchaseDate: any
  setAssetPurchaseDate: any
  assetPurchaseValue: any
  setAssetPurchaseValue: any
  assetDescription: any
  setAssetDescription: any
  createdCommitteeAsset: any
  assetValueAssetId: any
  setAssetValueAssetId: any
  assetValuationDate: any
  setAssetValuationDate: any
  assetNewValue: any
  setAssetNewValue: any
  updatedCommitteeAssetValue: any
  valuationAssetId: any
  setValuationAssetId: any
  assetValuations: Array<Record<string, any>>
  participationAssetId: any
  setParticipationAssetId: any
  assetParticipation: Array<Record<string, any>>

  handleCreateCommitteeAsset: any
  handleUpdateCommitteeAssetValue: any
  handleLoadAssetValuations: any
  handleLoadAssetParticipation: any
  formatPKR: any
  committeeId: any
}

export default function AssetsPage(props: AssetsPageProps) {
  const {
    appT,
    error,
    canWrite,
    loading,
    assetName,
    setAssetName,
    assetPurchaseDate,
    setAssetPurchaseDate,
    assetPurchaseValue,
    setAssetPurchaseValue,
    assetDescription,
    setAssetDescription,
    createdCommitteeAsset,
    assetValueAssetId,
    setAssetValueAssetId,
    assetValuationDate,
    setAssetValuationDate,
    assetNewValue,
    setAssetNewValue,
    updatedCommitteeAssetValue,
    valuationAssetId,
    setValuationAssetId,
    assetValuations,
    participationAssetId,
    setParticipationAssetId,
    assetParticipation,
    handleCreateCommitteeAsset,
    handleUpdateCommitteeAssetValue,
    handleLoadAssetValuations,
    handleLoadAssetParticipation,
    formatPKR,
    committeeId,
  } = props

  return (

            <section className="assets-module">
              <section className="page-heading">
                <div>
                  <p className="eyebrow">{appT.assetsEyebrow}</p>
                  <h1>{appT.assetsPageTitle}</h1>
                  <p>
                    {appT.assetsDescription}
                  </p>
                </div>
              </section>

              {error && <div className="error page-error">{error}</div>}

              {canWrite && (
              <section className="information-card asset-create-card">
                <div>
                  <p className="eyebrow">{appT.newAsset}</p>
                  <h3>{appT.createCommitteeAsset}</h3>
                  <p className="form-help">
                    {appT.createCommitteeAssetDescription}
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleCreateCommitteeAsset}
                >
                  <div className="rate-form-grid">
                    <label>
                      {appT.assetName}
                      <input
                        value={assetName}
                        onChange={(event) =>
                          setAssetName(event.target.value)
                        }
                        placeholder={appT.assetNamePlaceholder}
                        required
                      />
                    </label>

                    <label>
                      {appT.purchaseDate}
                      <input
                        type="date"
                        value={assetPurchaseDate}
                        onChange={(event) =>
                          setAssetPurchaseDate(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      {appT.purchaseValue}
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={assetPurchaseValue}
                        onChange={(event) =>
                          setAssetPurchaseValue(event.target.value)
                        }
                        placeholder={appT.purchaseValuePlaceholder}
                        required
                      />
                    </label>
                  </div>

                  <label>
                    {appT.description}
                    <input
                      value={assetDescription}
                      onChange={(event) =>
                        setAssetDescription(event.target.value)
                      }
                      placeholder={appT.optionalDescription}
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? appT.creating : appT.createAsset}
                  </button>
                </form>
              </section>              )}


              {createdCommitteeAsset && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">{appT.created}</p>
                    <h3>
                      {createdCommitteeAsset.name ?? appT.assetCreated}
                    </h3>

                    <p className="created-id">
                      {appT.assetId}: {createdCommitteeAsset.id}
                      {' · '}
                      Committee ID:{' '}
                      {createdCommitteeAsset.committee_id ??
                        committeeId}
                    </p>

                    <p className="created-id">
                      {appT.purchaseDate}:{' '}
                      {createdCommitteeAsset.purchase_date ??
                        assetPurchaseDate}
                      {' · '}
                      {appT.purchaseValue}:{' '}
                      {formatPKR(
                        createdCommitteeAsset.purchase_value ??
                          Number(assetPurchaseValue),
                      )}
                    </p>
                  </div>

                  <span className="active-badge">{appT.created}</span>
                </section>
              )}

              {canWrite && (
              <section className="information-card asset-valuation-card">
                <div>
                  <p className="eyebrow">{appT.currentValue}</p>
                  <h3>{appT.updateAssetValuation}</h3>
                  <p className="form-help">
                    {appT.updateAssetValuationDescription}
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleUpdateCommitteeAssetValue}
                >
                  <div className="rate-form-grid">
                    <label>
                      Asset ID
                      <input
                        type="number"
                        min="1"
                        value={assetValueAssetId}
                        onChange={(event) =>
                          setAssetValueAssetId(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      {appT.valuationDate}
                      <input
                        type="date"
                        value={assetValuationDate}
                        onChange={(event) =>
                          setAssetValuationDate(event.target.value)
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
                        value={assetNewValue}
                        onChange={(event) =>
                          setAssetNewValue(event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>

                  <button type="submit" disabled={loading}>
                    {loading ? appT.updating : appT.updateValue}
                  </button>
                </form>
              </section>              )}


              {updatedCommitteeAssetValue && (
                <section className="committee-banner">
                  <div>
                    <p className="eyebrow">{appT.valuationUpdated}</p>
                    <h3>{appT.currentAssetValueUpdated}</h3>

                    <p className="created-id">
                      {appT.assetId}:{' '}
                      {updatedCommitteeAssetValue.asset_id ??
                        assetValueAssetId}
                      {' · '}
                      {appT.valuationDate}:{' '}
                      {updatedCommitteeAssetValue.valuation_date ??
                        assetValuationDate}
                    </p>

                    <p className="created-id">
                      {appT.currentValueLabel}:{' '}
                      {formatPKR(
                        updatedCommitteeAssetValue.value ??
                          updatedCommitteeAssetValue.new_value ??
                          Number(assetNewValue),
                      )}
                    </p>
                  </div>

                  <span className="active-badge">{appT.valuationUpdated}</span>
                </section>
              )}

              <section className="information-card asset-history-card">
                <div>
                  <p className="eyebrow">{appT.assetHistory}</p>
                  <h3>{appT.viewAssetValuations}</h3>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadAssetValuations()
                  }}
                >
                  <label>
                    Asset ID
                    <input
                      type="number"
                      min="1"
                      value={valuationAssetId}
                      onChange={(event) =>
                        setValuationAssetId(event.target.value)
                      }
                      required
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? appT.loadingMembers : appT.loadValuations}
                  </button>
                </form>
              </section>

              {assetValuations.length > 0 && (
                <section className="information-card">
                  <p className="eyebrow">{appT.valuations}</p>
                  <h3>{appT.valuationHistory}</h3>

                  {assetValuations.map((valuation) => (
                    <div
                      className="position-row"
                      key={valuation.id}
                    >
                      <div>
                        <strong>
                          {valuation.valuation_date}
                        </strong>
                        <small>
                          {appT.valuationId}: {valuation.id}
                        </small>
                      </div>

                      <strong>
                        {formatPKR(valuation.value)}
                      </strong>
                    </div>
                  ))}
                </section>
              )}

              <section className="information-card asset-participation-card">
                <div>
                  <p className="eyebrow">{appT.participation}</p>
                  <h3>{appT.viewAssetParticipation}</h3>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadAssetParticipation()
                  }}
                >
                  <label>
                    Asset ID
                    <input
                      type="number"
                      min="1"
                      value={participationAssetId}
                      onChange={(event) =>
                        setParticipationAssetId(event.target.value)
                      }
                      required
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? appT.loadingMembers : appT.loadParticipation}
                  </button>
                </form>
              </section>

              {assetParticipation.length > 0 && (
                <section className="information-card">
                  <p className="eyebrow">{appT.ownership}</p>
                  <h3>{appT.memberParticipation}</h3>

                  {assetParticipation.map((row) => (
                    <div
                      className="position-row"
                      key={row.id}
                    >
                      <div>
                        <strong>
                          {appT.memberId}: {row.member_id}
                        </strong>
                        <small>
                          {appT.ownershipUnits}: {row.ownership_units}
                          {' · '}
                          {appT.totalUnits}: {row.total_units}
                        </small>
                      </div>

                      <strong>
                        {row.total_units
                          ? `${(
                              (row.ownership_units /
                                row.total_units) *
                              100
                            ).toFixed(2)}%`
                          : '0%'}
                      </strong>
                    </div>
                  ))}
                </section>
              )}
            </section>

          
  )
}
