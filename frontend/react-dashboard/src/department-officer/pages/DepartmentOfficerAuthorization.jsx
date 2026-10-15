import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DepartmentOfficerPageFrame from '../components/DepartmentOfficerPageFrame';
import { useDepartmentOfficerData } from '../components/useDepartmentOfficerData';
import '../styles/DepartmentOfficerAuthorization.css';

export default function DepartmentOfficerAuthorization() {
  const data = useDepartmentOfficerData(); const [query, setQuery] = useState(''); const [selected, setSelected] = useState(null); const [reason, setReason] = useState(''); const [saving, setSaving] = useState(false); const [notice, setNotice] = useState('');
  const rows = useMemo(() => data.applications.filter((app) => {
    const review = data.reviews.find((x) => Number(x.application_id) === Number(app.application_id));
    const assignmentIds = data.assignments.filter((x) => Number(x.application_id) === Number(app.application_id)).map((x) => Number(x.assignment_id));
    const inspected = data.inspections.some((x) => assignmentIds.includes(Number(x.assignment_id)) && ['COMPLETED', 'FAILED'].includes(String(x.status).toUpperCase()));
    const state = String(review?.status || '').toUpperCase();
    const ready = inspected || ['APPROVED','REJECTED','CLARIFICATION_REQUESTED'].includes(state) || ['approved','rejected','department_review'].includes(app.application_status);
    return ready && [app.application_ref, app.application_id, app.business_name, app.full_name, state].some((v) => String(v || '').toLowerCase().includes(query.toLowerCase()));
  }), [data.applications, data.reviews, data.assignments, data.inspections, query]);
  async function decision(status) { if (!selected) return; if (status === 'REJECTED' && !reason.trim()) { setNotice('Enter a reason before rejecting.'); return; } setSaving(true); setNotice(''); try {
    const review = data.reviews.find((x) => Number(x.application_id) === Number(selected.application_id));
    if (review) await data.request(`/department-reviews/${review.review_id}`, { method: 'PATCH', body: JSON.stringify({ status, comments: reason.trim() }) });
    else await data.request('/department-reviews', { method: 'POST', body: JSON.stringify({ application_id: Number(selected.application_id), reviewer_id: Number(data.user.user_id), status, comments: reason.trim() }) });
    const next = status === 'APPROVED' ? 'approved' : status === 'REJECTED' ? 'rejected' : selected.application_status;
    if (next && next !== selected.application_status) await data.request(`/applications/${selected.application_id}`, { method: 'PATCH', body: JSON.stringify({ application_status: next }) });
    setSelected(null); setReason(''); setNotice(`Decision ${status.toLowerCase()} was recorded in the backend.`); await data.reload();
  } catch (e) { setNotice(`The decision may be partially saved: ${e.message}`); await data.reload(); } finally { setSaving(false); } }
  return <DepartmentOfficerPageFrame pageClass="do-page-authorization" active="/department-officer/authorization" title="Final Authorization & Signing" data={data}>{notice && <p className="do-notice" role="status">{notice}</p>}<label className="search-bar"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by Application ID, Company Name" /></label><div className="do-table-scroll"><table className="table"><thead><tr><th>Application ID</th><th>Applicant Name</th><th>Company Name</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map((app) => { const review = data.reviews.find((x) => Number(x.application_id) === Number(app.application_id)); const license = data.licenses.find((x) => Number(x.application_id) === Number(app.application_id)); const status = license ? 'Licensed' : review?.status || app.application_status || 'Pending'; return <tr key={app.application_id}><td>{app.application_ref || `#${app.application_id}`}</td><td>{app.full_name || '—'}</td><td>{app.business_name || '—'}</td><td>{status}</td><td>{license ? <span>{license.license_number}</span> : String(status).toUpperCase() === 'APPROVED' || app.application_status === 'approved' ? <Link className="do-action-link" to={`/department-officer/authorization/${app.application_id}/sign`}>Authorize &amp; Sign</Link> : <button className="btn-outline" onClick={() => { setSelected(app); setReason(review?.comments || ''); }}>Review Decision</button>}</td></tr>; })}{!rows.length && <tr><td colSpan="5">No inspected or reviewed applications are available.</td></tr>}</tbody></table></div>
    {selected && <div className="modal-overlay active" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}><section className="modal-box" role="dialog" aria-modal="true" aria-labelledby="do-decision-title"><h3 className="modal-title" id="do-decision-title">Final Application Decision</h3><p className="modal-desc">{selected.business_name || 'Application'} · {selected.application_ref || `#${selected.application_id}`}</p><label className="modal-field">Reviewer comments / rejection reason<textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter the reason or decision notes..." /></label><div className="modal-actions"><button className="modal-btn cancel-btn" onClick={() => setSelected(null)}>Cancel</button><button className="modal-btn confirm-approve-btn" disabled={saving} onClick={() => decision('APPROVED')}>Approve</button><button className="modal-btn confirm-reject-btn" disabled={saving} onClick={() => decision('REJECTED')}>Reject</button></div></section></div>}
  </DepartmentOfficerPageFrame>;
}
