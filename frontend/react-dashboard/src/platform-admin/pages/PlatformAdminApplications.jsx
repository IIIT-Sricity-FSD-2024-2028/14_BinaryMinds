import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useParams } from 'react-router-dom';
import { fetchApplications, selectApplications, selectApplicationsState } from '../../features/applications/applicationsSlice.js';
import '../styles/PlatformAdminApplications.css';

const dash = '—';
const statusClass = (status) => { const value = String(status || '').toLowerCase(); return value.includes('reject') ? 'rejected' : ['issue', 'approve', 'verif'].some((part) => value.includes(part)) ? 'approved' : 'pending'; };

export default function PlatformAdminApplications() {
  const dispatch = useDispatch();
  const { municipalityId = '' } = useParams();
  const location = useLocation();
  const municipalityName = location.state?.municipalityName || municipalityId;
  const returnTo = location.state?.returnTo || '/platform-admin/corporations';
  const applications = useSelector(selectApplications);
  const applicationsState = useSelector(selectApplicationsState);

  useEffect(() => {
    dispatch(fetchApplications());
  }, [dispatch]);

  const municipalityApplications = useMemo(() => applications.filter((application) => (
    String(application.municipality_id || '').toLowerCase() === municipalityId.toLowerCase()
  )), [applications, municipalityId]);
  const loading = applicationsState.requests.fetchAll === undefined || applicationsState.requests.fetchAll === 'pending';
  const error = applicationsState.errors.fetchAll;

  return <section className="pa-applications"><header className="pa-applications-header"><div><h1>{municipalityName} — Applications</h1><p>All trade license application details for {municipalityName} ({municipalityId})</p></div><Link className="pa-back-button" to={returnTo}>{returnTo === '/platform-admin' ? '← Back to Dashboard' : '← Back to Municipal Corporations'}</Link></header>
    {loading ? <p className="pa-applications-state" role="status">Loading application records…</p> : error ? <p className="pa-applications-error" role="alert">Failed to load applications: {error}</p> : municipalityApplications.length ? <div className="pa-applications-table-wrap"><table><thead><tr><th>Ref # / ID</th><th>Business Name</th><th>Applicant Name</th><th>Phone</th><th>Category</th><th>Premises Address</th><th>Status</th><th>Submitted On</th></tr></thead><tbody>{municipalityApplications.map((app) => <tr key={app.application_id}><td>{app.application_ref || `APP-${app.application_id}`}</td><td>{app.business_name || dash}</td><td>{app.full_name || dash}</td><td>{app.applicant_phone || dash}</td><td>{app.trade_category || app.business_type || dash}</td><td>{app.shop_address || dash}</td><td><span className={`pa-status-pill ${statusClass(app.application_status)}`}>{app.application_status || dash}</span></td><td>{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-IN') : dash}</td></tr>)}</tbody></table></div> : <div className="pa-applications-empty"><span aria-hidden="true">▤</span><h2>No Applications Found</h2><p>There are currently no trade license applications under {municipalityName}.</p></div>}
  </section>;
}
