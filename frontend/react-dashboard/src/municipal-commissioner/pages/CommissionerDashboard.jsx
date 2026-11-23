import CommissionerPageFrame from '../components/CommissionerPageFrame';
import {
  useGetCommissionerApplicationsQuery,
  useGetCommissionerAuditLogsQuery,
  useGetCommissionerLicensesQuery,
  useGetCommissionerUsersQuery,
} from '../commissionerApi';
import '../styles/CommissionerDashboard.css';

export default function CommissionerDashboard() {
  const usersQuery = useGetCommissionerUsersQuery();
  const applicationsQuery = useGetCommissionerApplicationsQuery();
  const licensesQuery = useGetCommissionerLicensesQuery();
  const auditLogsQuery = useGetCommissionerAuditLogsQuery();

  const list = (result) => (Array.isArray(result) ? result : result?.data || []);
  const users = list(usersQuery.data);
  const apps = list(applicationsQuery.data);
  const licenses = list(licensesQuery.data);
  const activity = list(auditLogsQuery.data).slice(0, 8);
  const queries = [usersQuery, applicationsQuery, licensesQuery, auditLogsQuery];
  const loading = queries.some((query) => query.isLoading);
  const settled = queries.every((query) => !query.isLoading);
  const failed = queries.filter((query) => query.isError).length;
  const error = settled && failed
    ? `${failed} dashboard data request(s) failed. Counts below include only successfully loaded records.`
    : '';

  const pending = apps.filter((app) => ['pending', 'submitted', 'under review', 'pending review', 'assigned'].includes(String(app.application_status || app.status || '').toLowerCase())).length;

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
      <Stat label="Issued Licenses" value={loading ? '…' : licenses.length} icon="▥" />
    </section>
    <section className="card dashboard-activity">
      <div className="card-title">Recent Activity</div>
      {loading ? <p>Loading backend activity…</p> : activity.length ? <table className="data-table"><thead><tr><th>User</th><th>Action</th><th>Time</th></tr></thead><tbody>{activity.map((log, index) => <tr key={log.id || `${log.timestamp}-${index}`}><td><span className="avatar-circle">{String(log.user_name || 'S')[0]}</span> {log.user_name || 'System'}</td><td>{log.action || '—'}</td><td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</td></tr>)}</tbody></table> : <p className="empty">No backend activity records were returned.</p>}
    </section>
  </CommissionerPageFrame>;
}

function Stat({ label, value, icon }) {
  return <div className="stat-card"><div className="stat-left"><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div><div className="stat-icon" aria-hidden="true">{icon}</div></div>;
}
