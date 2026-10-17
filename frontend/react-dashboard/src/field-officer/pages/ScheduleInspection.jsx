import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FieldOfficerPageShell from '../components/FieldOfficerPageShell';
import { dateInputValue } from '../components/fieldOfficerUtils';
import { useFieldOfficerData } from '../components/useFieldOfficerData';
import '../styles/ScheduleInspection.css';

function formatSchedule(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export default function ScheduleInspection() {
  const d = useFieldOfficerData();
  const [form, setForm] = useState({
    applicationId: sessionStorage.getItem('selectedApp') || '',
    date: '',
    time: '',
  });
  const [recovering, setRecovering] = useState(false);
  const app = d.applications.find((row) => String(row.application_id) === String(form.applicationId));
  const assignment = d.assignments.find((row) =>
    Number(row.application_id) === Number(form.applicationId) &&
    Number(row.field_officer_id) === Number(d.officerId),
  );
  const canRecover = Boolean(
    app &&
    !assignment &&
    Number(app.assignedOfficerId) === Number(d.officerId),
  );
  const savedInspection = useMemo(() => {
    if (!assignment) return null;
    return d.inspections
      .filter((row) => Number(row.assignment_id) === Number(assignment.assignment_id))
      .sort((left, right) => new Date(right.scheduled_date || 0) - new Date(left.scheduled_date || 0))[0] || null;
  }, [assignment, d.inspections]);

  async function recoverAssignment() {
    if (!app) return;
    setRecovering(true);
    d.setError('');
    d.setMessage('');
    try {
      const recovered = await d.request(
        `/field-officer-assignments/application/${encodeURIComponent(app.application_id)}/recover`,
        { method: 'POST' },
      );
      d.setAssignments((rows) => [
        ...rows.filter((row) => Number(row.assignment_id) !== Number(recovered.assignment_id)),
        recovered,
      ]);
      d.setMessage('The saved application assignment was recovered. You can now schedule the inspection.');
    } catch (error) {
      d.setError(error.message || 'Unable to recover the saved application assignment.');
    } finally {
      setRecovering(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    d.setSaving(true);
    d.setError('');
    d.setMessage('');
    try {
      if (!form.applicationId || !form.date || !form.time) {
        throw new Error('Select an assigned application, inspection date and time.');
      }
      if (!assignment?.assignment_id) {
        throw new Error(canRecover
          ? 'Restore the saved Field Officer assignment before scheduling this inspection.'
          : 'This application has no assignment to your Field Officer account. Ask the Commissioner to assign it first.');
      }
      const picked = new Date(`${form.date}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (picked < today) throw new Error('Please select a future date for inspection.');

      const scheduledDate = new Date(`${form.date}T${form.time}`).toISOString();
      const created = await d.request('/inspections', {
        method: 'POST',
        body: JSON.stringify({
          assignment_id: Number(assignment.assignment_id),
          field_officer_id: Number(d.officerId),
          scheduled_date: scheduledDate,
          status: 'SCHEDULED',
        }),
      });
      const persistedRows = await d.request(
        `/inspections/assignment/${encodeURIComponent(assignment.assignment_id)}`,
      );
      const persisted = Array.isArray(persistedRows)
        ? persistedRows.find((row) => Number(row.inspection_id) === Number(created.inspection_id))
        : null;
      if (!persisted || new Date(persisted.scheduled_date).getTime() !== new Date(scheduledDate).getTime()) {
        throw new Error('The schedule request was accepted, but the saved date and time could not be confirmed. Refresh before trying again.');
      }

      d.setInspections((rows) => [
        ...rows.filter((row) => Number(row.inspection_id) !== Number(persisted.inspection_id)),
        persisted,
      ]);
      sessionStorage.setItem('selectedInspection', String(persisted.inspection_id));
      d.setMessage(`Inspection scheduled and verified for ${formatSchedule(persisted.scheduled_date)}.`);
    } catch (error) {
      d.setError(error.message || 'Unable to schedule inspection.');
    } finally {
      d.setSaving(false);
    }
  }

  return (
    <FieldOfficerPageShell activeSection="scheduleinspection" title="Schedule Inspection" {...d}>
      <div className="fo-schedule-page">
        <div className="fo-schedule-success">
          <strong>Schedule Inspection</strong>
          <p>Choose a date and time for an assigned application. Scheduling is saved to the backend.</p>
        </div>
        <section className="fo-react-card">
          <h2>▣ Application Details</h2>
          {app ? (
            <div className="fo-react-details-grid">
              {[
                ['Application ID', app.application_ref || `#${app.application_id}`],
                ['Business Name', app.business_name],
                ['Business Address', [app.shop_address, app.city, app.state].filter(Boolean).join(', ')],
                ['Applicant Name', app.full_name],
                ['Trade Category', app.trade_category || app.business_type],
                [
                  'Assigned Field Officer',
                  assignment
                    ? `${d.profile?.full_name || 'Field Officer'} (${d.profile?.employee_id || 'Employee ID unavailable'})`
                    : app.assignedOfficerId
                      ? `${d.profile?.full_name || 'Field Officer'} (${d.profile?.employee_id || 'Employee ID unavailable'}; saved application assignment)`
                      : 'Not assigned',
                ],
              ].map(([key, value]) => (
                <div key={key}><strong>{key}</strong><span>{value || '—'}</span></div>
              ))}
            </div>
          ) : (
            <p className="fo-react-muted">Select an assigned application in the schedule form to show its details.</p>
          )}
          {canRecover && (
            <div className="fo-react-message" role="status">
              The application is assigned to your account, but its assignment record is missing. Restore that saved assignment to continue.
              <button className="fo-react-button" type="button" onClick={recoverAssignment} disabled={recovering}>
                {recovering ? 'Restoring…' : 'Restore Saved Assignment'}
              </button>
            </div>
          )}
          {app && !assignment && !canRecover && (
            <p className="fo-react-message" role="status">
              No assignment to this Field Officer account exists. Ask the Commissioner to assign this application before scheduling.
            </p>
          )}
          {savedInspection && (
            <p className="fo-react-message" role="status">
              Saved inspection: {formatSchedule(savedInspection.scheduled_date)} ({savedInspection.status}).
            </p>
          )}
        </section>
        <section className="fo-react-card">
          <h2>▣ Schedule Inspection Date &amp; Time</h2>
          <p className="fo-react-message">Inspection should be completed within the deadline recorded for its assignment.</p>
          <form onSubmit={submit}>
            <div className="fo-react-form-grid">
              <label className="fo-react-field">
                Application
                <select
                  required
                  value={form.applicationId}
                  onChange={(event) => {
                    setForm({ ...form, applicationId: event.target.value });
                    sessionStorage.setItem('selectedApp', event.target.value);
                    d.setError('');
                    d.setMessage('');
                  }}
                >
                  <option value="">Select an assigned application</option>
                  {d.applications.map((row) => (
                    <option key={row.application_id} value={row.application_id}>
                      {row.application_ref || `#${row.application_id}`} — {row.business_name || 'Business'}
                    </option>
                  ))}
                </select>
              </label>
              <label className="fo-react-field">
                Inspection Date
                <input
                  required
                  type="date"
                  min={dateInputValue(new Date())}
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                />
                <small>Select a date today or later.</small>
              </label>
              <label className="fo-react-field">
                Inspection Time
                <input
                  required
                  type="time"
                  value={form.time}
                  onChange={(event) => setForm({ ...form, time: event.target.value })}
                />
                <small>Select preferred time.</small>
              </label>
            </div>
            <div className="fo-react-actions">
              <button className="fo-react-button" disabled={d.saving || recovering}>
                {d.saving ? 'Scheduling…' : '✓ Schedule Inspection'}
              </button>
              <Link className="fo-react-button secondary" to={`/officer/${d.officerId}/verification`}>Cancel</Link>
            </div>
          </form>
        </section>
      </div>
    </FieldOfficerPageShell>
  );
}
