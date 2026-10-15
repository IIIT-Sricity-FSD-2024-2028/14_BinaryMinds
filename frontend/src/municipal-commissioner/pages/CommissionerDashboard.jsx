import { useEffect, useState } from 'react';
import CommissionerPageFrame from '../components/CommissionerPageFrame';
import { getCommissionerApplications, getCommissionerAuditLogs, getCommissionerLicenses, getCommissionerUsers } from '../../services/api';
import '../styles/CommissionerDashboard.css';

export default function CommissionerDashboard() {
  const [data, setData] = useState({ users: [], apps: [], licenses: [], activity: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([getCommissionerUsers(), getCommissionerApplications(), getCommissionerLicenses(), getCommissionerAuditLogs()]).then((results) => {
      if (!active) return;
      const list = (result) => result.status === 'fulfilled' ? (Array.isArray(result.value) ? result.value : result.value?.data || []) : [];
      setData({ users: list(results[0]), apps: list(results[1]), licenses: list(results[2]), activity: list(results[3]).slice(0, 8) });
      const failed = results.filter((item) => item.status === 'rejected').length;
      if (failed) setError(`${failed} dashboard data request(s) failed. Counts below include only successfully loaded records.`);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const pending = data.apps.filter((app) => ['pending', 'submitted', 'under review', 'pending review', 'assigned'].includes(String(app.application_status || app.status || '').toLowerCase())).length;

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
      <Stat label="Total Users" value={loading ? '…' : data.users.length} icon="♙" />
      <Stat label="Pending Applications" value={loading ? '…' : pending} icon="▣" />
      <Stat label="Issued Licenses" value={loading ? '…' : data.licenses.length} icon="▥" />
    </section>
    <section className="card dashboard-activity">
      <div className="card-title">Recent Activity</div>
      {loading ? <p>Loading backend activity…</p> : data.activity.length ? <table className="data-table"><thead><tr><th>User</th><th>Action</th><th>Time</th></tr></thead><tbody>{data.activity.map((log, index) => <tr key={log.id || `${log.timestamp}-${index}`}><td><span className="avatar-circle">{String(log.user_name || 'S')[0]}</span> {log.user_name || 'System'}</td><td>{log.action || '—'}</td><td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</td></tr>)}</tbody></table> : <p className="empty">No backend activity records were returned.</p>}
    </section>
  </CommissionerPageFrame>;
}

function Stat({ label, value, icon }) {
  return <div className="stat-card"><div className="stat-left"><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div><div className="stat-icon" aria-hidden="true">{icon}</div></div>;
}
