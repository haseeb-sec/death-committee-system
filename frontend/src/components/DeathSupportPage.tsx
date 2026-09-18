import type { FormEvent } from 'react'

type DeathSupportPageProps = {
  appT: any
  members: any[]
  error: string
  canWrite: boolean
  loading: boolean
  formatPKR: (value: number) => string
  setDeathSupportStatus: (
    value:
      | {
          member_id: number
          death_support_recorded: boolean
          support_id: number | null
          amount: number
          support_date: string | null
        }
      | null,
  ) => void
  deathSupportMemberId: string
  setDeathSupportMemberId: (value: string) => void
  deathSupportBeneficiaryName: string
  setDeathSupportBeneficiaryName: (value: string) => void
  deathSupportAmount: string
  setDeathSupportAmount: (value: string) => void
  deathSupportDate: string
  setDeathSupportDate: (value: string) => void
  deathSupportReference: string
  setDeathSupportReference: (value: string) => void
  createdDeathSupport: Record<string, any> | null
  deathSupportStatusMemberId: string
  setDeathSupportStatusMemberId: (value: string) => void
  deathSupportStatus: Record<string, any> | null
  handleCreateDeathSupport: (event: FormEvent<HTMLFormElement>) => void
  handleLoadDeathSupportStatus: () => void
}

export default function DeathSupportPage({
  appT,
  members,
  error,
  canWrite,
  loading,
  formatPKR,
  setDeathSupportStatus,
  deathSupportMemberId,
  setDeathSupportMemberId,
  deathSupportBeneficiaryName,
  setDeathSupportBeneficiaryName,
  deathSupportAmount,
  setDeathSupportAmount,
  deathSupportDate,
  setDeathSupportDate,
  deathSupportReference,
  setDeathSupportReference,
  createdDeathSupport,
  deathSupportStatusMemberId,
  setDeathSupportStatusMemberId,
  deathSupportStatus,
  handleCreateDeathSupport,
  handleLoadDeathSupportStatus,
}: DeathSupportPageProps) {
  return (
            <section className="death-support-module">
              <section className="page-heading">
                <div>
                  <p className="eyebrow">{appT.deathSupportEyebrow}</p>
                  <h1>{appT.deathSupportPageTitle}</h1>
                  <p>
                    {appT.deathSupportDescription}
                  </p>
                </div>
              </section>

              {error && <div className="error page-error">{error}</div>}

              {canWrite && (
                <section className="information-card death-support-record-card">
                  <div>
                    <p className="eyebrow">{appT.recordSupport}</p>
                    <h3>{appT.recordDeathSupportHeading}</h3>
                  <p className="form-help">
                    {appT.recordDeathSupportDescription}
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={handleCreateDeathSupport}
                >
                  <div className="rate-form-grid">
                    <label>
                      {appT.member}
                      <select
                        value={deathSupportMemberId}
                        onChange={(event) =>
                          setDeathSupportMemberId(event.target.value)
                        }
                        required
                      >
                        <option value="">{appT.selectMember}</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} · ID {member.id}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      {appT.beneficiaryName}
                      <input
                        value={deathSupportBeneficiaryName}
                        onChange={(event) =>
                          setDeathSupportBeneficiaryName(event.target.value)
                        }
                        placeholder={appT.beneficiaryNamePlaceholder}
                        required
                      />
                    </label>

                    <label>
                      {appT.supportAmount}
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={deathSupportAmount}
                        onChange={(event) =>
                          setDeathSupportAmount(event.target.value)
                        }
                        placeholder={appT.supportAmountPlaceholder}
                        required
                      />
                    </label>

                    <label>
                      {appT.supportDate}
                      <input
                        type="date"
                        value={deathSupportDate}
                        onChange={(event) =>
                          setDeathSupportDate(event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>

                  <label>
                    {appT.optionalReference}
                    <input
                      value={deathSupportReference}
                      onChange={(event) =>
                        setDeathSupportReference(event.target.value)
                      }
                      placeholder={appT.optionalReferencePlaceholder}
                    />
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? appT.recording : appT.recordDeathSupportButton}
                  </button>
                </form>
                </section>
              )}

              {createdDeathSupport && (
                <section className="committee-banner contribution-rate-result">
                  <div>
                    <p className="eyebrow">{appT.recorded}</p>
                    <h3>
                      {createdDeathSupport.amount !== undefined
                        ? `Rs. ${createdDeathSupport.amount.toLocaleString(
                            'en-PK',
                          )}`
                        : appT.deathSupportRecorded}
                    </h3>

                    <p className="created-id">
                      {appT.member} ID:{' '}
                      {createdDeathSupport.member_id ??
                        deathSupportMemberId}
                      {' · '}
                      {appT.beneficiaryName}:{' '}
                      {createdDeathSupport.beneficiary_name ??
                        deathSupportBeneficiaryName}
                    </p>

                    <p className="created-id">
                      {appT.memberFunded}:{' '}
                      {formatPKR(
                        createdDeathSupport.member_funded_amount ?? 0,
                      )}
                      {' · '}
                      {appT.qarzEHasana}:{' '}
                      {formatPKR(
                        createdDeathSupport.qarz_e_hasana_amount ?? 0,
                      )}
                    </p>

                    <p className="created-id">
                      {appT.supportDate}:{' '}
                      {createdDeathSupport.support_date ??
                        deathSupportDate}
                    </p>

                    {createdDeathSupport.reference && (
                      <p className="created-id">
                        {appT.reference}: {createdDeathSupport.reference}
                      </p>
                    )}
                  </div>

                  <span className="active-badge">{appT.recorded}</span>
                </section>
              )}

              <section className="information-card death-support-status-card">
                <div>
                  <p className="eyebrow">{appT.supportStatus}</p>
                  <h3>{appT.checkMemberSupportStatus}</h3>
                  <p className="form-help">
                    {appT.checkMemberSupportStatusDescription}
                  </p>
                </div>

                <form
                  className="committee-create-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleLoadDeathSupportStatus()
                  }}
                >
                  <label>
                    Member
                    <select
                      value={deathSupportStatusMemberId}
                      onChange={(event) => {
                        setDeathSupportStatusMemberId(event.target.value)
                        setDeathSupportStatus(null)
                      }}
                      required
                    >
                      <option value="">{appT.selectMember}</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} · ID {member.id}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button type="submit" disabled={loading}>
                    {loading ? appT.checking : appT.checkSupportStatus}
                  </button>
                </form>
              </section>

              {deathSupportStatus && (
                <section className="committee-banner contribution-rate-result">
                  <div>
                    <p className="eyebrow">{appT.status}</p>
                    <h3>
                      {deathSupportStatus.death_support_recorded
                        ? appT.deathSupportRecorded
                        : appT.noDeathSupportRecorded}
                    </h3>

                    <p className="created-id">
                      Member ID: {deathSupportStatus.member_id}
                    </p>

                    {deathSupportStatus.death_support_recorded && (
                      <>
                        <p className="created-id">
                          {appT.supportId}: {deathSupportStatus.support_id ?? '—'}
                          {' · '}
                          {appT.supportAmount}: {formatPKR(deathSupportStatus.amount)}
                        </p>

                        <p className="created-id">
                          Support date:{' '}
                          {deathSupportStatus.support_date ?? '—'}
                        </p>
                      </>
                    )}
                  </div>

                  <span className="active-badge">
                    {deathSupportStatus.death_support_recorded
                      ? appT.recorded
                      : appT.notRecorded}
                  </span>
                </section>
              )}
            </section>
  )
}
