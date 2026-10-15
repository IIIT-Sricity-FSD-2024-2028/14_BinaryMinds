import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FieldOfficerPageShell from '../components/FieldOfficerPageShell';
import { useFieldOfficerData } from '../components/useFieldOfficerData';
import '../styles/ApplicationDetails.css';

export default function ApplicationDetails() {
  const d = useFieldOfficerData(true); const [saving, setSaving] = useState(false); const [detailedApplication, setDetailedApplication] = useState(null);
  const id = d.recordId || sessionStorage.getItem('selectedApp'); const listApplication = d.applications.find((x) => String(x.application_id) === String(id));
  const app = listApplication ? { ...listApplication, ...(detailedApplication?.id === String(id) ? detailedApplication.record : {}) } : null;
  const documents = d.documents;
  const { request, setError } = d;
  useEffect(() => {
    let active = true;
    if (!listApplication || !id) return undefined;
    request(`/applications/${encodeURIComponent(id)}`)
      .then((record) => { if (active && record && typeof record === 'object') setDetailedApplication({ id: String(id), record }); })
      .catch((e) => { if (active) setError(e.message || 'Unable to load application details.'); });
    return () => { active = false; };
  }, [id, listApplication, request, setError, d.token]);
  async function decide(status) {
    if (status === 'verified' && app?.application_status === 'verified') {
      d.setMessage(`Application ${app.application_ref || `#${app.application_id}`} is already verified. No duplicate request was sent.`);
      return;
    }
    if (!app || !window.confirm(`Are you sure you want to ${status === 'verified' ? 'approve and verify' : 'reject'} application ${app.application_ref || `#${app.application_id}`}?`)) return;
    setSaving(true); d.setError('');
    try {
      await d.request(status === 'verified' ? `/applications/${app.application_id}/verify` : `/applications/${app.application_id}`, status === 'verified' ? { method: 'PATCH' } : { method: 'PATCH', body: JSON.stringify({ application_status: status }) });
      d.setApplications((rows) => rows.map((row) => row.application_id === app.application_id ? { ...row, application_status: status } : row));
      d.setMessage(`Application ${app.application_ref || `#${app.application_id}`} updated to ${status}.`);
    } catch (e) {
      if (status === 'verified' && /not in 'assigned' status \(current: verified\)/i.test(e.message)) {
        d.setApplications((rows) => rows.map((row) => row.application_id === app.application_id ? { ...row, application_status: 'verified' } : row));
        setDetailedApplication((record) => record ? { ...record, application_status: 'verified' } : record);
        d.setMessage(`Application ${app.application_ref || `#${app.application_id}`} is already verified. No duplicate change was made.`);
      } else {
        d.setError(e.message);
      }
    } finally { setSaving(false); }
  }
  const fields = app ? [['Application ID', app.application_ref || app.application_id], ['Business Name', app.business_name], ['Applicant Name', app.full_name], ['Contact Number', app.applicant_phone], ['Email Address', app.email || app.applicant_email], ['Aadhaar Number', app.aadhaar_number ? `XXXX-XXXX-${String(app.aadhaar_number).slice(-4)}` : '—'], ['Gender', app.gender], ["Father's Name", app.father_name], ["Mother's Name", app.mother_name], ['Trade Category', app.trade_category || app.business_type], ['Shop Area (sq.ft)', app.shop_area], ['Full Shop Address', app.shop_address], ['City', app.city], ['District', app.district], ['State', app.state], ['Pincode', app.pincode]] : [];
  const readonly = new URLSearchParams(window.location.search).get('readonly') === 'true';
  return <FieldOfficerPageShell activeSection="detail" title="Application Details" {...d}>{app ? <>
    <section className="fo-react-card"><h2>▣ Business Information</h2><div className="fo-react-details-grid">{fields.map(([label, value]) => <div className="fo-react-detail-field" key={label}><strong>{label}</strong><span>{value || '—'}</span></div>)}</div></section>
    <section className="fo-react-card" id="fo-documents"><h2>▣ Uploaded Documents</h2>{documents.length ? <div className="fo-react-table-wrap"><table className="fo-react-table"><thead><tr><th>Document Type</th><th>File</th><th>Verification Status</th></tr></thead><tbody>{documents.map((doc) => <tr key={doc.document_id}><td>{doc.document_type || '—'}</td><td>{String(doc.file_path || '').split('/').pop() || 'File recorded'}</td><td>{doc.verification_status || 'pending'}</td></tr>)}</tbody></table></div> : <p className="fo-react-muted">No uploaded document records were returned by the backend.</p>}<p className="fo-react-message warning">The API returns document records only; this portal cannot securely preview the file contents.</p><button className="fo-react-button secondary" onClick={() => document.getElementById('fo-documents')?.scrollIntoView({ behavior: 'smooth' })}>View All Documents</button></section>
    {app.application_status === 'verified' && <p className="fo-react-message">This application is already verified. No duplicate verification request is needed.</p>}<section className="fo-react-card"><h2>Application Decision</h2><p>Current status: <span className="fo-react-status">{app.application_status || '—'}</span></p>{!readonly && <div className="fo-react-actions"><button className="fo-react-button" disabled={saving || app.application_status !== 'assigned'} onClick={() => decide('verified')}>Approve Application ✓</button><button className="fo-react-button danger" disabled={saving || !['assigned', 'submitted'].includes(app.application_status)} onClick={() => decide('rejected')}>Reject Application ✕</button></div>}<p className="fo-react-message warning">The backend stores application status only. It does not record a rejection reason here or verify individual documents.</p><div className="fo-react-actions"><Link className="fo-react-link-button secondary" to={`/officer/${d.officerId}/verification`}>Back to Verification</Link>{app.application_status === 'verified' && <Link className="fo-react-link-button" to={`/officer/${d.officerId}/scheduleinspection`} onClick={() => sessionStorage.setItem('selectedApp', String(app.application_id))}>Schedule Inspection</Link>}</div></section>
  </> : <section className="fo-react-card"><p>Application not found in the current Field Officer application list.</p><Link className="fo-react-link-button" to={`/officer/${d.officerId}/verification`}>Back to Verification</Link></section>}</FieldOfficerPageShell>;
}
