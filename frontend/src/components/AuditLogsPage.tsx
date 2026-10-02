import { useEffect, useState } from 'react'

import { getAuditLogs, type AuditLog } from '../api/audit'

type AuditLogsPageProps = {
  appT: any
  token: string
  isSuperAdmin: boolean
  committeeId: string
  committees: Array<Record<string, any>>
}

export default function AuditLogsPage({
  appT,
  token,
  isSuperAdmin,
  committeeId,
  committees,
}: AuditLogsPageProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCommitteeId, setSelectedCommitteeId] = useState('')
  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')
  const [userId, setUserId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const activeCommitteeId = isSuperAdmin ? selectedCommitteeId : committeeId

  async function loadLogs() {
    if (!token) return
    if (!isSuperAdmin && !committeeId) {
      setLogs([])
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await getAuditLogs(token, {
        committeeId: activeCommitteeId ? Number(activeCommitteeId) : undefined,
        entityType: entityType.trim() || undefined,
        entityId: entityId ? Number(entityId) : undefined,
        userId: userId ? Number(userId) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : appT.errors.loadAuditLogs)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isSuperAdmin && !committeeId) return
    void loadLogs()
  }, [token, committeeId, isSuperAdmin])

  function clearFilters() {
    setSelectedCommitteeId('')
    setEntityType('')
    setEntityId('')
    setUserId('')
    setStartDate('')
    setEndDate('')
  }

  function committeeName(id: number | null) {
    if (id === null) return '-'
    const committee = committees.find((item) => Number(item.id) === id)
    return committee?.name ?? committee?.committee_name ?? ('#' + id)
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">{appT.auditLogs}</p>
          <h1>{appT.auditLogs}</h1>
          <p>{appT.auditLogsDescription}</p>
        </div>
      </section>

      {error && <div className="error page-error">{error}</div>}

      <section className="information-card">
        <div>
          <p className="eyebrow">{appT.auditLogsFilters}</p>
          <h3>{appT.auditLogsFilters}</h3>
        </div>

        <div className="rate-form-grid">
          <label>
            {appT.auditLogsCommittee}
            {isSuperAdmin ? (
              <select value={selectedCommitteeId} onChange={(event) => setSelectedCommitteeId(event.target.value)}>
                <option value="">{appT.auditLogsAllCommittees}</option>
                {committees.map((committee) => (
                  <option key={committee.id} value={committee.id}>
                    {committee.name ?? committee.committee_name ?? ('#' + committee.id)}
                  </option>
                ))}
              </select>
            ) : (
              <input value={committeeName(Number(committeeId))} readOnly />
            )}
          </label>

          <label>
            {appT.auditLogsEntityType}
            <input value={entityType} onChange={(event) => setEntityType(event.target.value)} />
          </label>

          <label>
            {appT.auditLogsEntityId}
            <input type="number" min="1" value={entityId} onChange={(event) => setEntityId(event.target.value)} />
          </label>

          <label>
            {appT.auditLogsUserId}
            <input type="number" min="1" value={userId} onChange={(event) => setUserId(event.target.value)} />
          </label>

          <label>
            {appT.auditLogsStartDate}
            <input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} />
          </label>

          <label>
            {appT.auditLogsEndDate}
            <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
          </label>
        </div>

        <div className="button-group">
          <button type="button" onClick={() => void loadLogs()} disabled={loading}>
            {loading ? appT.auditLogsLoading : appT.auditLogsApplyFilters}
          </button>
          <button type="button" onClick={clearFilters} disabled={loading}>
            {appT.auditLogsClearFilters}
          </button>
          <button type="button" onClick={() => void loadLogs()} disabled={loading}>
            {appT.auditLogsRefresh}
          </button>
        </div>
      </section>

      <section className="information-card">
        <div>
          <p className="eyebrow">{appT.auditLogsRecentActivity}</p>
          <h3>{appT.auditLogsRecentActivity}</h3>
        </div>
        <p className="form-help">{appT.auditLogsShowingLatest}</p>

        {loading ? (
          <p>{appT.auditLogsLoading}</p>
        ) : logs.length === 0 ? (
          <p>{appT.auditLogsEmpty}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{appT.auditLogsCreatedAt}</th>
                  <th>{appT.auditLogsAction}</th>
                  <th>{appT.auditLogsEntity}</th>
                  <th>{appT.auditLogsEntityIdColumn}</th>
                  <th>{appT.auditLogsUserIdColumn}</th>
                  <th>{appT.auditLogsCommitteeColumn}</th>
                  <th>{appT.auditLogsDescriptionColumn}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.created_at)}</td>
                    <td>{log.action}</td>
                    <td>{log.entity_type}</td>
                    <td>{log.entity_id ?? '-'}</td>
                    <td>{log.user_id ?? '-'}</td>
                    <td>{committeeName(log.committee_id)}</td>
                    <td>{log.description ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
