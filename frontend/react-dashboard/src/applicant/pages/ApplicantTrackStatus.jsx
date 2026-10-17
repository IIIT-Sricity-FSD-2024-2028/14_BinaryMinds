import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import '../styles/ApplicantTrackStatus.css';

const apiUrl = 'http://localhost:3000/api/applications/mine';
const steps = ['Submitted', 'Documents Verified', 'Inspection Scheduled', 'Review Done', 'Approved'];

function readUser() {
  try { return JSON.parse(sessionStorage.getItem('loggedInUser') || '{}') || {}; } catch { return {}; }
}

function dateLabel(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function currentStep(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'verified' || value === 'documents_uploaded') return 1;
  if (value === 'inspection_scheduled') return 2;
  if (value === 'inspection_completed' || value === 'department_review') return 3;
  if (value === 'approved' || value === 'rejected') return 4;
  return 0;
}

function statusLabel(status) {
  const labels = {
    submitted: 'Submitted', assigned: 'Assigned', verified: 'Documents Verified',
    documents_uploaded: 'Documents Uploaded', inspection_scheduled: 'Inspection Scheduled',
    inspection_completed: 'Inspection Completed', department_review: 'Under Review',
    approved: 'Approved', rejected: 'Rejected',
  };
  return labels[String(status || '').toLowerCase()] || 'Status unavailable';
}

function Navigation({ onLogout }) {
  return (
    <>
      <ApplicantNavigation onLogout={onLogout} />
    </>
  );
}

export default function ApplicantTrackStatus() {
  const navigate = useNavigate();
  const [user] = useState(readUser);
  const [application, setApplication] = useState(null);
  const [licenseIssueDate, setLicenseIssueDate] = useState('');
  const [licenseIssueDateError, setLicenseIssueDateError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem('accessToken');
    if (!token || user.role !== 'applicant') {
      navigate('/login', { replace: true });
      return () => { active = false; };
    }

    async function loadApplications() {
      try {
        const response = await fetch(apiUrl, { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message = Array.isArray(result.message) ? result.message.join(', ') : result.message;
          throw new Error(message || 'Could not load your application. Please try again.');
        }
        if (!Array.isArray(result.data)) throw new Error('The server returned an invalid application list.');
        const newest = result.data.slice().sort((first, second) => new Date(second.submitted_at || 0) - new Date(first.submitted_at || 0))[0] || null;
        if (!active) return;
        setApplication(newest);
        if (String(newest?.application_status || '').toLowerCase() === 'approved') {
          try {
            const licenseResponse = await fetch(`http://localhost:3000/api/licenses/application/${encodeURIComponent(newest.application_id)}`, {
              headers: { Authorization: 'Bearer ' + token },
            });
            const licensePayload = await licenseResponse.json().catch(() => ({}));
            if (licenseResponse.ok) {
              if (active) setLicenseIssueDate(licensePayload.data?.issued_date || licensePayload.issued_date || '');
            } else if (licenseResponse.status !== 404) {
              const message = Array.isArray(licensePayload.message) ? licensePayload.message.join(', ') : licensePayload.message;
              if (active) setLicenseIssueDateError(message || 'Could not load the license issue date.');
            }
          } catch {
            if (active) setLicenseIssueDateError('Could not load the license issue date. Please refresh to try again.');
          }
        }
      } catch (requestError) {
        if (active) setError(requestError.message || 'Please check your connection and try again.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadApplications();
    return () => { active = false; };
  }, [navigate, user.role]);

  function handleLogout(event) {
    event.preventDefault();
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  const status = statusLabel(application?.application_status);
  const stepIndex = currentStep(application?.application_status);
  const isRejected = application?.application_status === 'rejected';
  const paymentStatus = typeof application?.paymentDone === 'boolean' ? (application.paymentDone ? 'Paid' : 'Not paid') : 'Unavailable';
  const approvedIssueLabel = licenseIssueDate
    ? `Issue date: ${dateLabel(licenseIssueDate)}`
    : licenseIssueDateError ? '' : 'Issue date pending';

  return (
    <div className="applicant-track-status-page">
      <Navigation onLogout={handleLogout} />
      <main className="track-main">
        <div className="track-content">
          <div className="track-left">
            <h1>Track Application Status</h1>
            <p className="track-sub">Monitor the current status of your trade license application.</p>
            {isLoading ? <div className="track-state">Loading your application...</div> : error ? (
              <div className="track-state track-error" role="alert"><h3>Unable to Load Application</h3><p>{error}</p><button type="button" onClick={() => window.location.reload()}>Try Again</button></div>
            ) : !application ? (
              <div className="track-state track-empty"><h3>No Application Found</h3><p>You have not submitted a trade license application yet.</p><Link className="track-action" to="/apply-license">Apply Now</Link></div>
            ) : (
              <section className="app-card">
                <div className="app-info">
                  <div><small>APPLICATION ID</small><strong>{application.application_ref || application.application_id || 'Unavailable'}</strong></div>
                  <div><small>APPLICATION DATE</small><strong>{dateLabel(application.submitted_at)}</strong></div>
                  <div><small>APPLICANT NAME</small><strong>{application.full_name || user.full_name || user.name || 'Unavailable'}</strong></div>
                  <div><small>BUSINESS NAME</small><strong>{application.business_name || 'Unavailable'}</strong></div>
                  <div><small>PAYMENT STATUS</small><strong>{paymentStatus}</strong></div>
                </div>
                <div className="stepper" aria-label="Application progress">
                  {steps.map((step, index) => (
                    <ReactStep key={step} title={isRejected && index === 4 ? 'Approved / Rejected' : step} index={index} currentIndex={stepIndex} isRejected={isRejected} date={index === 0 ? dateLabel(application.submitted_at) : index === 4 && !isRejected ? approvedIssueLabel : ''} dateError={index === 4 && !isRejected ? licenseIssueDateError : ''} isLast={index === steps.length - 1} />
                  ))}
                </div>
                <section className="detail-row" aria-label="Detailed application status">
                  <div className="detail-left">
                    <p className="detail-title"><span aria-hidden="true">ⓘ</span> Detailed Status</p>
                    <div className="detail-status-grid">
                      <div><small>CURRENT STATUS</small><p className={`track-status-value ${isRejected ? 'rejected' : application.application_status === 'approved' ? 'approved' : ''}`}>{status}</p></div>
                      <div><small>EXPECTED UPDATE</small><p><strong>{application.application_status === 'approved' ? 'A license record is available if issued.' : application.application_status === 'rejected' ? 'Please contact support for details.' : 'No further update is available yet.'}</strong></p></div>
                    </div>
                  </div>
                </section>
                {application.application_status === 'approved' && <div className="view-btn-row"><Link className="track-button btn-view" to="/download-license">View License</Link></div>}
              </section>
            )}
            <Link className="track-button btn-cancel" to="/dashboard">← Back to Dashboard</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReactStep({ title, index, currentIndex, isRejected, date, dateError, isLast }) {
  const done = index < currentIndex || (index === currentIndex && !isRejected);
  const current = index === currentIndex;
  return <>
    <div className={`step ${current ? 'current' : ''}`}><div className={`circle ${done ? 'done' : current ? 'current' : 'pending'} ${isRejected && current ? 'rejected' : ''}`}>{done ? '✓' : isRejected && current ? '×' : index + 1}</div><span>{title}</span>{(date || dateError) && <small className={dateError ? 'step-error' : ''}>{dateError || date}</small>}</div>
    {!isLast && <div className={`line ${index < currentIndex && !isRejected ? 'line-done' : ''}`} />}
  </>;
}
