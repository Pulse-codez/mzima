import React, { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/shell/DashboardLayout';
import { DataPanel } from '../../components/dashboard/DataPanel';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { ErrorState } from '../../components/dashboard/ErrorState';
import { useAuth } from '../../auth/AuthContext';
import { decideAppointmentRequest, getAppointmentQueue, getAuditEvents, getFlowSummary, getPilotValidation, createFlowSnapshot } from '../../api';
import { listDecisionLogStub } from '../../api/stubs';
import type { AppointmentRequest, ClinicianDecision } from '../../api';

const items = [
  { label: 'Review queue', to: '/review' },
  { label: 'Decision log', to: '/review' },
];

const CHECKS = [
  'I have reviewed the proposed slot',
  'I confirm this is a synthetic-data record',
  'I understand this decision is logged',
];

export default function ShiftLeadDashboard() {
  const { token, user } = useAuth();
  const [queue, setQueue] = useState<AppointmentRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checks, setChecks] = useState<boolean[]>([false, false, false]);
  const [pendingDecision, setPendingDecision] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [decisionResult, setDecisionResult] = useState<ClinicianDecision | null>(null);
  const [decisionError, setDecisionError] = useState('');
  const [log, setLog] = useState<ClinicianDecision[]>([]);
  const [flow, setFlow] = useState<Awaited<ReturnType<typeof getFlowSummary>> | null>(null);
  const [pilot, setPilot] = useState<Record<string, unknown> | null>(null);
  const [auditEvents, setAuditEvents] = useState<Awaited<ReturnType<typeof getAuditEvents>>>([]);
  const [snapshotting, setSnapshotting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError('');
      const data = await getAppointmentQueue(token);
      setQueue(data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
      const decisions = await listDecisionLogStub();
      setLog(decisions);
      const [flowData, pilotData, auditData] = await Promise.all([getFlowSummary(token), getPilotValidation(token), getAuditEvents(token)]);
      setFlow(flowData); setPilot(pilotData); setAuditEvents(auditData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load review queue.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') load(); }, 15000);
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', onVis); };
  }, [load]);

  const selected = queue.find((q) => q.id === selectedId) || null;
  const allChecked = checks.every(Boolean);

  function resetSelection() {
    setChecks([false, false, false]);
    setPendingDecision(null);
    setReason('');
    setReasonError('');
    setDecisionResult(null);
    setDecisionError('');
  }

  async function recordPilotSnapshot() {
    if (!token) return;
    setSnapshotting(true);
    try { await createFlowSnapshot(token); setPilot(await getPilotValidation(token)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to record pilot snapshot.'); }
    finally { setSnapshotting(false); }
  }

  useEffect(() => { resetSelection(); }, [selectedId]);

  async function confirmDecision() {
    if (!selected || !token || !allChecked) return;
    if (pendingDecision === 'REJECT' && !reason.trim()) { setReasonError('A short reason is required for rejection.'); return; }
    if (pendingDecision === 'REJECT' && reason.length > 280) { setReasonError('Reason must be 280 characters or fewer.'); return; }
    setSubmitting(true);
    setDecisionError('');
    try {
      const outcome = await decideAppointmentRequest(selected.id, pendingDecision as 'APPROVE' | 'REJECT', reason.trim(), token);
      setDecisionResult(outcome);
      setQueue((q) => q.filter((item) => item.id !== selected.id));
      setSelectedId(null);
    } catch (e) {
      setDecisionError(e instanceof Error ? e.message : 'Decision failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout role="Shift Lead" items={items}>
      <div className="sc-purpose">Review and sign-off · Every decision is logged</div>
      <div className="sc-grid-2">
        <DataPanel title="Pending appointment proposals">
          {loading && <p className="sc-muted">Loading…</p>}
          {error && <ErrorState message={error} onRetry={load} />}
          {!loading && !error && queue.length === 0 && <EmptyState title="No pending proposals" body="New proposals will appear here for review." />}
          {!loading && !error && queue.length > 0 && (
            <div className="sc-list" role="listbox" aria-label="Pending proposals">
              {queue.map((q) => (
                <button
                  key={q.id}
                  role="option"
                  aria-selected={selectedId === q.id}
                  className={'sc-row' + (selectedId === q.id ? ' selected' : '')}
                  onClick={() => setSelectedId(q.id)}
                >
                  <span className="sc-mono">{q.id}</span>
                  <StatusBadge label="Awaiting review" />
                  <span className="sc-muted">{q.requested_specialty}</span>
                  <span className="sc-mono">{new Date(q.created_at).toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </DataPanel>
        <DataPanel title="Decision panel">
          {!selected && <EmptyState title="Select a proposal" body="Choose a proposal from the queue." />}
          {selected && (
            <div className="sc-form">
              <div className="sc-field"><label>Proposal reference</label><div className="sc-mono">{selected.id}</div></div>
              <div className="sc-field"><label>Patient reference</label><div className="sc-mono">{selected.patient_identifier}</div></div>
              <div className="sc-field"><label>Proposed slot</label><div className="sc-muted">As returned by the API (not available, see propsal stub)</div></div>
              <div className="sc-field"><label>Proposed by</label><div>AI agent</div></div>
              <div className="sc-field"><label>Reason</label><div className="sc-muted">{/* stub */}Review checklist follows below.</div></div>
              <fieldset className="sc-checklist">
                <legend>Review checklist (required)</legend>
                {CHECKS.map((c, i) => (
                  <label key={c} className="sc-check">
                    <input type="checkbox" checked={checks[i]} onChange={() => setChecks((x) => x.map((v, j) => (j === i ? !v : v)))} />
                    <span>{c}</span>
                  </label>
                ))}
              </fieldset>
              {!pendingDecision && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="sc-btn primary" disabled={!allChecked} onClick={() => setPendingDecision('APPROVE')}>Approve</button>
                  <button className="sc-btn danger-outline" disabled={!allChecked} onClick={() => setPendingDecision('REJECT')}>Reject</button>
                </div>
              )}
              {pendingDecision === 'REJECT' && (
                <div className="sc-confirm">
                  <p className="sc-muted">Rejecting requires a short reason (max 280 characters).</p>
                  <textarea value={reason} maxLength={280} onChange={(e) => setReason(e.target.value)} rows={3} />
                  <small className="sc-muted">{reason.length}/280</small>
                  {reasonError && <span className="sc-err">{reasonError}</span>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button className="sc-btn danger" disabled={submitting} onClick={confirmDecision}>{submitting ? 'Rejecting…' : 'Confirm reject'}</button>
                    <button className="sc-btn ghost" onClick={() => setPendingDecision(null)}>Cancel</button>
                  </div>
                </div>
              )}
              {pendingDecision === 'APPROVE' && (
                <div className="sc-confirm">
                  <p className="sc-muted">This will be recorded in the audit log under your name.</p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button className="sc-btn primary" disabled={submitting} onClick={confirmDecision}>{submitting ? 'Approving…' : 'Confirm approve'}</button>
                    <button className="sc-btn ghost" onClick={() => setPendingDecision(null)}>Cancel</button>
                  </div>
                </div>
              )}
              {decisionError && <p role="alert" className="sc-err">{decisionError}</p>}
              {decisionResult && (
                <div className="sc-success-box">
                  Decision recorded. Audit reference: <span className="sc-mono">{decisionResult.id}</span>
                </div>
              )}
            </div>
          )}
        </DataPanel>
      </div>
      <DataPanel title="Decision log">
        <p className="sc-muted">Recent decisions by you. Source: stub adapter (endpoint not yet available).</p>
        {log.length === 0 && <EmptyState title="No decisions yet" body="Recent decisions will be listed here." />}
        {log.length > 0 && (
          <table className="sc-table">
            <thead><tr><th>Time</th><th>Proposal</th><th>Outcome</th><th>Reason</th></tr></thead>
            <tbody>
              {log.map((d) => (
                <tr key={d.id}>
                  <td className="sc-mono">{new Date(d.created_at).toLocaleString()}</td>
                  <td className="sc-mono">{d.request_id}</td>
                  <td><StatusBadge label={d.decision === 'APPROVE' ? 'Approved' : 'Rejected'} /></td>
                  <td>{d.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataPanel>
      <div className="sc-grid-2">
        <DataPanel title="Facility operations">
          {!flow && <p className="sc-muted">Loading current capacity…</p>}
          {flow && <>
            <div className="sc-mini-grid">
              <div><span className="sc-stat-label">Queue</span><strong>{flow.queue_length}</strong></div>
              <div><span className="sc-stat-label">Wait to triage</span><strong>{flow.average_wait_for_triage_minutes} min</strong></div>
              <div><span className="sc-stat-label">Staff available</span><strong>{flow.available_staff}</strong></div>
              <div><span className="sc-stat-label">Capacity / hour</span><strong>{flow.capacity_per_hour}</strong></div>
            </div>
            <p className="sc-note">Capacity gap: {flow.capacity_gap}. Utilisation: {Math.round(flow.utilisation * 100)}%.</p>
            <button className="sc-btn primary" onClick={recordPilotSnapshot} disabled={snapshotting}>{snapshotting ? 'Recording…' : 'Record pilot snapshot'}</button>
          </>}
        </DataPanel>
        <DataPanel title="Pilot validation">
          <p className="sc-muted">Compare recorded baseline and latest operational snapshots. Use after an approved workflow run.</p>
          {pilot?.snapshot_count ? <>
            <div className="sc-success-box">{String(pilot.interpretation)}</div>
            <p className="sc-note">Snapshots recorded: {String(pilot.snapshot_count)}</p>
            {pilot.changes && <pre className="sc-json">{JSON.stringify(pilot.changes, null, 2)}</pre>}
          </> : <p className="sc-muted">No pilot snapshots yet.</p>}
        </DataPanel>
      </div>
      <DataPanel title="Audit trail">
        <p className="sc-muted">Append-only operational events visible to shift leads.</p>
        {auditEvents.length === 0 ? <EmptyState title="No audit events" body="Queue and scheduling actions will appear here." /> : <table className="sc-table"><thead><tr><th>Time</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody>{auditEvents.slice(0, 8).map((event) => <tr key={event.id}><td className="sc-mono">{event.timestamp ? new Date(event.timestamp).toLocaleString() : '—'}</td><td><StatusBadge label={event.action} /></td><td className="sc-mono">{event.entity_type} · {event.entity_id.slice(0, 8)}</td><td>{JSON.stringify(event.payload)}</td></tr>)}</tbody></table>}
      </DataPanel>
    </DashboardLayout>
  );
}
