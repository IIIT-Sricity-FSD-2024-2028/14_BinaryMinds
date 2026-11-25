import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CommissionerPageFrame from '../components/CommissionerPageFrame';
import {
  fetchApplications,
  selectApplications,
  selectApplicationsState,
} from '../../department-officer/store/applicationsSlice.js';
import {
  fetchDepartmentOfficerUsers,
  selectDepartmentOfficerUsersState,
} from '../../department-officer/store/usersSlice.js';
import { fetchLicenses, selectLicenses, selectLicensesState } from '../../department-officer/store/licensesSlice.js';
import { fetchAuditLogs, selectAuditLogs, selectAuditLogsState } from '../../features/auditLogs/auditLogsSlice.js';
import '../styles/CommissionerDashboard.css';

const pendingApplicationStatuses = new Set([
  'submitted',
  'assigned',
  'verified',
  'documents_uploaded',
  'inspection_scheduled',
  'inspection_completed',
  'department_review',
]);

export default function CommissionerDashboard() {
  const dispatch = useDispatch();
  const userState = useSelector(selectDepartmentOfficerUsersState);
  const applicationState = useSelector(selectApplicationsState);
  const licenseState = useSelector(selectLicensesState);
  const auditState = useSelector(selectAuditLogsState);
  const users = userState.items;
  const apps = useSelector(selectApplications);
  const licenses = useSelector(selectLicenses);
  const auditLogs = useSelector(selectAuditLogs);

  useEffect(() => {
    dispatch(fetchDepartmentOfficerUsers());
    dispatch(fetchApplications());
    dispatch(fetchLicenses());
    dispatch(fetchAuditLogs());
  }, [dispatch]);

  const requests = [
    userState.requests.fetchAll,
    applicationState.requests.fetchAll,
    licenseState.requests.fetchAll,
    auditState.requests.fetchAll,
  ];
  const settled = requests.every((status) => status === 'fulfilled' || status === 'rejected');
  const loading = !settled;
  const failed = requests.filter((status) => status === 'rejected').length;
  const error = settled && failed
    ? `${failed} dashboard data request(s) failed. Counts include only successfully loaded records.`
    : '';

  const pending = apps.filter((app) => {
    const status = String(app.application_status || app.status || '').toLowerCase();
    return pendingApplicationStatuses.has(status);
  }).length;
  const issuedLicenses = licenses.filter((license) => String(license.status || '').toLowerCase() === 'active').length;
  const activity = auditLogs.slice(0, 8);

  return <CommissionerPageFrame className="commissioner-dashboard" title="Municipal Commissioner Dashboard" subtitle="Overview of municipal users, applications, licenses, and recent activity">
    <section className="hierarchy-card" aria-label="Municipal Corporation administration hierarchy">
      <div className="hierarchy-intro">
        <div className="hierarchy-eyebrow">Municipal Corporation</div>
        <h2>Commissioner <span>Administration</span></h2>
      </div>
      <div className="hierarchy-flow">
        <div className="hierarchy-node hierarchy-lead">Municipal Commissioner</div>
        <span className="hierarchy-connector" aria-hidden="true">→</span>
        <div className="hierarchy-team">
          <div className="hierarchy-node"><strong>Field Officers</strong><span>Admin Team</span></div>
          <div className="hierarchy-node"><strong>Department Officers</strong><span>Admin Team</span></div>
        </div>
        <span className="hierarchy-connector" aria-hidden="true">→</span>
        <div className="hierarchy-node hierarchy-applicants">Applicants / Users</div>
      </div>
    </section>
    {error && <div className="alert-banner blue-banner" role="status">{error}</div>}
    <section className="dashboard-stats" aria-label="Municipal overview">
      <Stat label="Total Users" value={loading ? '…' : users.length} icon="♙" />
      <Stat label="Pending Applications" value={loading ? '…' : pending} icon="▣" />
      <Stat label="Issued Licenses" value={loading ? '…' : issuedLicenses} icon="▥" />
    </section>
    <section className="card dashboard-activity">
      <div className="card-title">Recent Activity</div>
      {loading ? <p>Loading backend activity…</p> : activity.length ? <table className="data-table"><thead><tr><th>User</th><th>Action</th><th>Time</th></tr></thead><tbody>{activity.map((log, index) => <tr key={log.audit_id || `${log.timestamp}-${index}`}><td><span className="avatar-circle">{String(log.user_name || 'S')[0]}</span> {log.user_name || 'System'}</td><td>{log.action || '—'}</td><td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</td></tr>)}</tbody></table> : <p className="empty">{auditState.requests.fetchAll === 'rejected' ? 'Audit activity could not be loaded.' : 'No backend activity records were returned.'}</p>}
    </section>
  </CommissionerPageFrame>;
}

function Stat({ label, value, icon }) {
  return <div className="stat-card"><div className="stat-left"><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div><div className="stat-icon" aria-hidden="true">{icon}</div></div>;
}
