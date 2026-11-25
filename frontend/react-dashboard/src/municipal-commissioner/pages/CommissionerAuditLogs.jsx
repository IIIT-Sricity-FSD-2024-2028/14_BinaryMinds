import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CommissionerPageFrame from '../components/CommissionerPageFrame';
import {
  fetchAuditLogs,
  selectAuditLogs,
  selectAuditLogsError,
  selectAuditLogsRequest,
} from '../../features/auditLogs/auditLogsSlice.js';
import '../styles/CommissionerAuditLogs.css';

export default function CommissionerAuditLogs() {
  const dispatch = useDispatch();
  const logs = useSelector(selectAuditLogs);
  const requestStatus = useSelector(selectAuditLogsRequest);
  const requestError = useSelector(selectAuditLogsError);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    dispatch(fetchAuditLogs());
  }, [dispatch]);

  const loading = requestStatus === undefined || requestStatus === 'pending';
  const error = requestStatus === 'rejected' ? requestError || 'Unable to load audit logs.' : '';
  const filtered = useMemo(() => logs.filter((log) => {
    const text = `${log.user_name} ${log.description} ${log.module} ${log.action} ${log.ip_address} ${log.role}`.toLowerCase();
    return text.includes(query.toLowerCase())
      && (!role || String(log.role || '').toLowerCase().replace(/[\s_-]+/g, '') === role.toLowerCase().replace(/[\s_-]+/g, ''));
  }), [logs, query, role]);

  const exportCsv = () => {
    const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Timestamp', 'User Name', 'Role', 'Action', 'Module', 'Description'],
      ...filtered.map((log) => [log.timestamp, log.user_name, log.role, log.action, log.module, log.description]),
    ].map((row) => row.map(quote).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'audit_logs.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <CommissionerPageFrame title="Audit Logs" subtitle="Complete system activity and change history">
    <div className="page-top-bar"><span/>{!loading && !error && <button className="btn-outline" onClick={exportCsv}>⇩ Export CSV</button>}</div>
    {error && <div className="alert-banner red-banner" role="alert">{error}</div>}
    <section className="card"><div className="filter-bar"><input className="search-input" placeholder="Search by user, description, module..." value={query} onChange={(event) => setQuery(event.target.value)}/><select className="filter-select" value={role} onChange={(event) => setRole(event.target.value)}><option value="">All Roles</option><option value="applicant">Applicant</option><option value="field_officer">Field Officer</option><option value="department_officer">Department Officer</option><option value="municipal_commissioner">Municipal Commissioner</option></select></div>
      <table className="data-table"><thead><tr><th>Timestamp</th><th>User Name</th><th>Role</th><th>Action</th><th>Module</th><th>Description</th></tr></thead><tbody>{filtered.map((log, index) => <tr key={log.audit_id || `${log.timestamp}-${index}`}><td>{log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : '—'}</td><td>{log.user_name || '—'}</td><td>{log.role || '—'}</td><td><span className="action-badge">{log.action || '—'}</span></td><td>{log.module || '—'}</td><td>{log.description || '—'}</td></tr>)}{!filtered.length && <tr><td colSpan="6" className="empty-row">{loading ? 'Loading audit records…' : error ? 'Audit data is unavailable; no local records are substituted.' : 'No audit logs found.'}</td></tr>}</tbody></table>
    </section>
  </CommissionerPageFrame>;
}
