import { useMemo } from 'react';
import { useFieldOfficerState } from '../hooks/useFieldOfficerState.js';
import { useFieldOfficerData } from '../components/useFieldOfficerData.js';
import FieldOfficerPageShell from '../components/FieldOfficerPageShell.jsx';
import '../styles/FieldOfficerDashboard.css';

const freshTime = (app) => {
  const value = app.submitted_at || app.updated_at || app.created_at;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
};

export default function FieldOfficerDashboard() {
  const d = useFieldOfficerData();
  const [search, setSearch] = useFieldOfficerState('');
  const apps = useMemo(() => [...d.applications].sort((a, b) => freshTime(b) - freshTime(a)), [d.applications]);
  const verifiedCount = apps.filter((item) => item.application_status === 'verified').length;
  const filteredApps = apps.filter((item) => [item.application_ref, item.application_id, item.business_name, item.city, item.state]
    .some((value) => String(value || '').toLowerCase().includes(search.toLowerCase())));

  return <FieldOfficerPageShell activeSection="" title="Field Officer – Admin Team" {...d}><main className="fo-dashboard-page">
    <section className="fo-dashboard-stats" aria-label="Field Officer work summary">
      <article className="fo-dashboard-stat blue"><div><p>Assigned Applications</p><span aria-hidden="true">▤</span></div><strong>{d.loading ? '…' : apps.length}</strong></article>
      <article className="fo-dashboard-stat orange"><div><p>Verified Applications</p><span aria-hidden="true">✓</span></div><strong>{d.loading ? '…' : verifiedCount}</strong></article>
      <article className="fo-dashboard-stat green"><div><p>Inspection Recorded</p><span aria-hidden="true">▣</span></div><strong>{d.loading ? '…' : d.inspections.length}</strong></article>
    </section>
    <label className="fo-dashboard-search"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by Application ID, Business Name, or Location" aria-label="Search assigned applications" /></label>
    <div className="fo-dashboard-bottom"><section className="fo-dashboard-table-card"><h2>Assigned Applications</h2>
      {d.loading ? <p className="fo-dashboard-empty">Loading assigned applications…</p> : filteredApps.length ? <div className="fo-dashboard-table-wrap"><table><thead><tr><th>Application ID</th><th>Applicant Name</th><th>Business Name</th><th>Current Status</th><th>Submitted Date</th></tr></thead><tbody>{filteredApps.map((app) => <tr key={app.application_id}><td>{app.application_ref || `#${app.application_id}`}</td><td>{app.full_name || '—'}</td><td>{app.business_name || '—'}</td><td><span className={`fo-dashboard-status ${String(app.application_status || '').toLowerCase()}`}>{String(app.application_status || '—').replace(/_/g, ' ')}</span></td><td>{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-IN') : '—'}</td></tr>)}</tbody></table></div> : <p className="fo-dashboard-empty">{search ? 'No applications match your search.' : 'No applications are assigned to this Field Officer account.'}</p>}
    </section><div className="fo-dashboard-illustration" aria-hidden="true"><div className="fo-dashboard-illustration-circle">▤</div><div className="fo-dashboard-illustration-building"><span /><span /><span /></div></div></div>
  </main></FieldOfficerPageShell>;
}
