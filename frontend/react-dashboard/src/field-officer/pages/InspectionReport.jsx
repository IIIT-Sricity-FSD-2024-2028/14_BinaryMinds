import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FieldOfficerPageShell from '../components/FieldOfficerPageShell';
import { dateLabel } from '../components/fieldOfficerUtils';
import { useFieldOfficerData } from '../components/useFieldOfficerData';
import '../styles/InspectionReport.css';

const API = 'http://localhost:3000/api';

export default function InspectionReport() {
  const d = useFieldOfficerData(); const inspection = d.inspections.find((x) => String(x.inspection_id) === String(d.recordId || sessionStorage.getItem('selectedInspection'))); const asn = inspection && d.assignments.find((x) => Number(x.assignment_id) === Number(inspection.assignment_id)); const app = asn && d.applications.find((x) => Number(x.application_id) === Number(asn.application_id));
  const [evidence, setEvidence] = useState([]);
  useEffect(() => {
    let active = true;
    const rows = inspection?.evidence_files || [];
    if (!inspection || !rows.length) { setEvidence([]); return undefined; }
    setEvidence(rows.map((file) => ({ file, url: '', error: false })));
    const objectUrls = [];
    Promise.all(rows.map(async (file) => {
      try {
        const response = await fetch(`${API}/inspections/${encodeURIComponent(inspection.inspection_id)}/evidence/${encodeURIComponent(file.filename)}`, { headers: { Authorization: `Bearer ${d.token}` } });
        if (!response.ok) throw new Error('Evidence is unavailable.');
        const url = URL.createObjectURL(await response.blob()); objectUrls.push(url); return { file, url, error: false };
      } catch { return { file, url: '', error: true }; }
    })).then((items) => { if (active) setEvidence(items); });
    return () => { active = false; objectUrls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [inspection, d.token]);
  return <FieldOfficerPageShell activeSection="inspection_report" title="Inspection Report" {...d}>{inspection ? <div className="fo-react-grid fo-report-grid fo-inspection-report-page"><section className="fo-react-card"><h2>Business Info</h2><p><strong>App ID:</strong> {app?.application_ref || (app ? `#${app.application_id}` : '—')}</p><p><strong>Business:</strong> {app?.business_name || '—'}</p><p><strong>Applicant:</strong> {app?.full_name || '—'}</p><p><strong>Trade Category:</strong> {app?.trade_category || app?.business_type || '—'}</p><p><strong>Address:</strong> {[app?.shop_address, app?.city, app?.state].filter(Boolean).join(', ') || '—'}</p></section><section className="fo-react-card"><h2>Report Details</h2><label className="fo-readonly-field">Inspection Date<span>{dateLabel(inspection.completed_date || inspection.scheduled_date)}</span></label><label className="fo-readonly-field">Result<span className="bold">{inspection.status === 'COMPLETED' ? 'Approved' : inspection.status === 'FAILED' ? 'Rejected' : inspection.status}</span></label><label className="fo-readonly-field">Inspection Notes<span className="notes">{inspection.notes || 'No notes provided.'}</span></label><div className="fo-readonly-field"><strong>Inspection Evidence</strong>{!inspection.evidence_files?.length ? <span>No inspection evidence uploaded</span> : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>{evidence.map(({ file, url, error }) => <div key={file.filename}>{error ? <span>Evidence unavailable: {file.original_filename}</span> : !url ? <span>Loading {file.original_filename}…</span> : file.mime_type?.startsWith('image/') ? <a href={url} target="_blank" rel="noreferrer" aria-label={`Open ${file.original_filename}`}><img src={url} alt={file.original_filename} style={{ maxWidth: 180, maxHeight: 140, objectFit: 'contain', borderRadius: 4 }} onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement.insertAdjacentText('beforeend', ` Evidence unavailable: ${file.original_filename}`); }} /></a> : <a href={url} target="_blank" rel="noreferrer">Open {file.original_filename}</a>}</div>)}</div>}</div><Link className="fo-react-button" to={`/officer/${d.officerId}/inspectionhistory`}>Back to History</Link></section></div> : <section className="fo-react-card"><p>Inspection report was not found in backend records.</p><Link className="fo-react-button secondary" to={`/officer/${d.officerId}/inspectionhistory`}>Back to History</Link></section>}</FieldOfficerPageShell>;
}
