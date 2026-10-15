import { useState } from 'react';
import { Link } from 'react-router-dom';
import FieldOfficerPageShell from '../components/FieldOfficerPageShell';
import { dateInputValue } from '../components/fieldOfficerUtils';
import { useFieldOfficerData } from '../components/useFieldOfficerData';
import '../styles/ScheduleInspection.css';

export default function ScheduleInspection() {
  const d = useFieldOfficerData();
  const [form, setForm] = useState({ applicationId: sessionStorage.getItem('selectedApp') || '', date: '', time: '' });
  const app = d.applications.find((a) => String(a.application_id) === String(form.applicationId));
  async function submit(e) {
    e.preventDefault(); d.setSaving(true); d.setError(''); d.setMessage('');
    try {
      if (!form.applicationId || !form.date || !form.time) throw new Error('Select an assigned application, inspection date and time.');
      const picked = new Date(`${form.date}T00:00:00`); const today = new Date(); today.setHours(0, 0, 0, 0);
      if (picked < today) throw new Error('Please select a future date for inspection.');
      let assignment = d.assignments.find((x) => Number(x.application_id) === Number(form.applicationId) && Number(x.field_officer_id) === Number(d.officerId));
      if (!assignment) { const rows = await d.request(`/field-officer-assignments/application/${encodeURIComponent(form.applicationId)}`); assignment = Array.isArray(rows) ? rows.find((x) => Number(x.field_officer_id) === Number(d.officerId)) : null; }
      if (!assignment?.assignment_id) throw new Error('No Field Officer assignment was found for this application.');
      const result = await d.request('/inspections', { method: 'POST', body: JSON.stringify({ assignment_id: Number(assignment.assignment_id), field_officer_id: Number(d.officerId), scheduled_date: new Date(`${form.date}T${form.time}`).toISOString(), status: 'SCHEDULED' }) });
      d.setInspections((rows) => [result, ...rows]); sessionStorage.setItem('selectedInspection', String(result.inspection_id)); d.setMessage('Inspection schedule saved to the backend.'); d.navigate(`/officer/${d.officerId}/recordinspection`);
    } catch (err) { d.setError(err.message || 'Unable to schedule inspection.'); } finally { d.setSaving(false); }
  }
  return <FieldOfficerPageShell activeSection="scheduleinspection" title="Schedule Inspection" {...d}><div className="fo-schedule-page"><div className="fo-schedule-success"><strong>Schedule Inspection</strong><p>Choose a date and time for an assigned application. Scheduling will be saved to the backend.</p></div><section className="fo-react-card"><h2>▣ Application Details</h2>{app ? <div className="fo-react-details-grid">{[['Application ID', app.application_ref || `#${app.application_id}`], ['Business Name', app.business_name], ['Business Address', [app.shop_address, app.city, app.state].filter(Boolean).join(', ')], ['Applicant Name', app.full_name], ['Trade Category', app.trade_category || app.business_type]].map(([k,v]) => <div key={k}><strong>{k}</strong><span>{v || '—'}</span></div>)}</div> : <p className="fo-react-muted">Select an assigned application in the schedule form to show its details.</p>}</section><section className="fo-react-card"><h2>▣ Schedule Inspection Date &amp; Time</h2><p className="fo-react-message">Inspection should be completed within the deadline recorded for its assignment.</p><form onSubmit={submit}><div className="fo-react-form-grid"><label className="fo-react-field">Application<select required value={form.applicationId} onChange={(e) => { setForm({ ...form, applicationId: e.target.value }); sessionStorage.setItem('selectedApp', e.target.value); }}><option value="">Select an assigned application</option>{d.applications.map((row) => <option key={row.application_id} value={row.application_id}>{row.application_ref || `#${row.application_id}`} — {row.business_name || 'Business'}</option>)}</select></label><label className="fo-react-field">Inspection Date<input required type="date" min={dateInputValue(new Date())} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /><small>Select a date today or later.</small></label><label className="fo-react-field">Inspection Time<input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /><small>Select preferred time.</small></label></div><div className="fo-react-actions"><button className="fo-react-button" disabled={d.saving}>{d.saving ? 'Scheduling…' : '✓ Schedule Inspection'}</button><Link className="fo-react-button secondary" to={`/officer/${d.officerId}/verification`}>Cancel</Link></div></form></section></div></FieldOfficerPageShell>;
}
