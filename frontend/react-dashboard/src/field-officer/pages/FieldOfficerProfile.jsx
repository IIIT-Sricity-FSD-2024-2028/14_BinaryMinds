import { Link, useLocation } from 'react-router-dom';
import FieldOfficerPageShell from '../components/FieldOfficerPageShell';
import { dateLabel } from '../components/fieldOfficerUtils';
import { useFieldOfficerData } from '../components/useFieldOfficerData';
import '../styles/FieldOfficerProfile.css';

export default function FieldOfficerProfile() {
  const data = useFieldOfficerData();
  const location = useLocation();
  const profile = data.profile;
  const completed = data.inspections.filter((inspection) => String(inspection.status).toUpperCase() === 'COMPLETED').length;
  const pending = data.inspections.filter((inspection) =>
    !['COMPLETED', 'FAILED'].includes(String(inspection.status).toUpperCase()),
  ).length;
  const activity = [
    ...data.applications
      .filter((application) => ['verified', 'rejected'].includes(String(application.application_status).toLowerCase()))
      .map((application) => ({
        key: `app-${application.application_id}`,
        date: application.updated_at || application.submitted_at,
        text: `Application ${application.application_ref || `#${application.application_id}`} ${application.application_status}.`,
      })),
    ...data.inspections.map((inspection) => ({
      key: `inspection-${inspection.inspection_id}`,
      date: inspection.completed_date || inspection.scheduled_date,
      text: `Inspection #${inspection.inspection_id} ${String(inspection.status || '').toLowerCase()}.`,
    })),
  ].sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0)).slice(0, 5);
  const name = profile?.full_name || 'Field Officer';
  const role = (profile?.role || 'Field Officer').replace(/_/g, ' ');

  return (
    <FieldOfficerPageShell activeSection="profile" title="Field Officer Profile" {...data}>
      {location.state?.profileUpdated && <p className="fo-react-message" role="status">Profile updated successfully.</p>}
      {data.loading ? <section className="fo-react-card"><p>Loading your profile…</p></section> : profile ? (
        <div className="fo-profile-container fo-profile-page">
          <section className="fo-profile-card">
            <div className="fo-profile-avatar">{name.charAt(0).toUpperCase()}</div>
            <h2>{name}</h2>
            <p>{profile.employee_id || 'Employee ID unavailable'}</p>
            <span className="fo-profile-role">{role}</span>
            <hr />
            <p><strong>Email:</strong> {profile.email || '—'}</p>
            <p><strong>Phone:</strong> {profile.phone || '—'}</p>
            <p><strong>Location:</strong> {profile.municipalityName || profile.municipality_id || '—'}</p>
            <p><strong>Join Date:</strong> {dateLabel(profile.created_at)}</p>
            <Link className="fo-react-button" to={`/officer/${data.officerId}/profile_edit`}>Edit Profile</Link>
          </section>
          <div className="fo-profile-right">
            <div className="fo-profile-stats">
              <article className="blue"><p>Total Inspections</p><strong>{data.inspections.length}</strong></article>
              <article className="green"><p>Completed Inspections</p><strong>{completed}</strong></article>
              <article className="orange"><p>Pending Inspections</p><strong>{pending}</strong></article>
            </div>
            <section className="fo-react-card fo-profile-activity">
              <h2>Recent Activity</h2>
              {activity.length ? activity.map((item) => (
                <div className="fo-profile-activity-item" key={item.key}>
                  <span>{item.text}</span><small>{dateLabel(item.date)}</small>
                </div>
              )) : <p className="fo-react-muted">No recent backend activity found.</p>}
            </section>
            <section className="fo-react-card fo-profile-performance">
              Performance rating is not provided by the backend.
            </section>
          </div>
        </div>
      ) : (
        <section className="fo-react-card"><p role="alert">{data.error || 'Your profile could not be loaded.'}</p></section>
      )}
    </FieldOfficerPageShell>
  );
}
