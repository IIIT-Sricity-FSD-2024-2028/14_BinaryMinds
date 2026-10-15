import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FieldOfficerPageShell from '../components/FieldOfficerPageShell';
import { dateLabel } from '../components/fieldOfficerUtils';
import { useFieldOfficerData } from '../components/useFieldOfficerData';
import '../styles/Verification.css';

export default function Verification() {
  const d = useFieldOfficerData(); const navigate = useNavigate(); const [search, setSearch] = useState('');
  const rows = useMemo(() => d.applications.filter((app) => ['assigned', 'submitted'].includes(String(app.application_status).toLowerCase()) && [app.application_ref, app.application_id, app.business_name, app.full_name, app.city, app.state].some((v) => String(v || '').toLowerCase().includes(search.toLowerCase()))), [d.applications, search]);
  function details(app) { sessionStorage.setItem('selectedApp', String(app.application_id)); navigate(`/officer/${d.officerId}/detail/${app.application_id}`); }
  return <FieldOfficerPageShell activeSection="verification" title="Verification" {...d}><section className="fo-react-card fo-verification-page fo-verify-page"><h2>Review and verify submitted trade license applications</h2><label className="fo-react-search-label">Search applications<input className="fo-react-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." /></label><p className="fo-react-count">{rows.length} application(s)</p>{rows.length ? <div className="fo-verify-cards">{rows.map((app) => <article className="fo-verify-card" key={app.application_id}><div className="fo-verify-card-head"><span aria-hidden="true">▤</span><span className="fo-react-status">{app.application_status}</span></div><h3>{app.full_name || 'Applicant'}</h3><p className="fo-verify-id">{app.application_ref || `#${app.application_id}`}</p><p><strong>Business:</strong> {app.business_name || '—'}</p><p><strong>Type:</strong> {app.trade_category || app.business_type || '—'}</p><p><strong>Date:</strong> {dateLabel(app.submitted_at)}</p><button className="fo-react-button" onClick={() => details(app)}>View Details</button></article>)}</div> : <p className="fo-react-empty-card">No pending applications for verification.</p>}</section></FieldOfficerPageShell>;
}
