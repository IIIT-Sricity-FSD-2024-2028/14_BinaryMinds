import { Link } from 'react-router-dom';
import FieldOfficerPageShell from '../components/FieldOfficerPageShell.jsx';
import { dateInputValue, dateLabel } from '../components/fieldOfficerUtils.js';
import { useFieldOfficerData } from '../components/useFieldOfficerData.js';
import { useFieldOfficerState } from '../hooks/useFieldOfficerState.js';
import { submitInspectionReport } from '../../features/inspections/inspectionsSlice.js';
import '../styles/StartInspection.css';

export default function StartInspection() {
  const d = useFieldOfficerData();
  const [form, setForm] = useFieldOfficerState({ inspectionId: d.recordId || '', date: '', result: '', notes: '' });
  const [files, setFiles] = useFieldOfficerState([]);
  const chosen = d.inspections.find((row) => String(row.inspection_id) === String(d.recordId || form.inspectionId));
  const assignment = chosen && d.assignments.find((row) => Number(row.assignment_id) === Number(chosen.assignment_id));
  const app = assignment && d.applications.find((row) => Number(row.application_id) === Number(assignment.application_id));

  async function submit(event) {
    event.preventDefault();
    d.setSaving(true);
    d.setError('');
    d.setMessage('');
    try {
      if (!form.inspectionId || !chosen?.scheduled_date || !form.result || form.notes.trim().length < 10) {
        throw new Error('Choose an inspection and result, and enter at least 10 characters of notes.');
      }
      const status = form.result === 'Approved' ? 'COMPLETED' : 'FAILED';
      await d.dispatch(submitInspectionReport({ id: form.inspectionId, notes: form.notes.trim(), status, evidence: files })).unwrap();
      d.setMessage('Inspection report and evidence saved to the backend.');
      d.navigate(`/officer/${d.officerId}/inspectionhistory`);
    } catch (error) {
      d.setError(error.message || 'Unable to submit inspection report.');
    } finally {
      d.setSaving(false);
    }
  }

  const field = (key, value) => <p key={key}><strong>{key}</strong><span>{value || '—'}</span></p>;
  return <FieldOfficerPageShell activeSection="start-inspection" title="Start Inspection" {...d}>
    <div className="fo-react-grid fo-start-inspection-page fo-inspection-form-grid">
      <section className="fo-react-card"><h2>Business Info</h2>
        {field('Application ID', app?.application_ref || (app ? `#${app.application_id}` : '—'))}
        {field('Business Name', app?.business_name)}{field('Owner Name', app?.full_name)}
        {field('Trade Category', app?.trade_category || app?.business_type)}
        {field('Address', [app?.shop_address, app?.city, app?.state].filter(Boolean).join(', '))}
      </section>
      <section className="fo-react-card"><h2>Inspection Form</h2><form onSubmit={submit}>
        <label className="fo-react-field">Inspection<select required value={form.inspectionId || d.recordId || ''} onChange={(event) => setForm({ ...form, inspectionId: event.target.value })}>
          <option value="">Select inspection</option>{d.inspections.map((row) => <option key={row.inspection_id} value={row.inspection_id}>#{row.inspection_id} — {row.status} — {dateLabel(row.scheduled_date)}</option>)}
        </select></label>
        <label className="fo-react-field">Inspection Date<input required type="date" value={form.date || dateInputValue(chosen?.scheduled_date)} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
        <label className="fo-react-field">Inspection Result<select required value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value })}><option value="">Select Result</option><option>Approved</option><option>Rejected</option></select></label>
        <label className="fo-react-field">Inspection Notes<textarea required minLength={10} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Enter detailed inspection observations..." /></label>
        <label className="fo-react-field">Inspection Evidence Photos<input type="file" accept=".jpg,.jpeg,.png" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} /><small>{files.length ? `${files.length} file(s) selected: ${files.map((file) => file.name).join(', ')}` : 'Choose JPG or PNG files (Max 5MB each). Evidence uploads with the report.'}</small></label>
        <div className="fo-react-actions"><button className="fo-react-button" disabled={d.saving}>{d.saving ? 'Submitting…' : 'Submit Inspection Report'}</button><Link className="fo-react-button secondary" to={`/officer/${d.officerId}/recordinspection`}>Cancel</Link></div>
      </form></section>
    </div>
  </FieldOfficerPageShell>;
}
