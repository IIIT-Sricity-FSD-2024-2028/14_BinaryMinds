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
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
      <div className="track-top-bar"><img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="India Logo" /><div className="track-brand"><span>Government of India</span><strong>TradeZo</strong></div></div>
      <ApplicantNavigation onLogout={onLogout} />
    </>
  );
}

export default function ApplicantTrackStatus() {
  const navigate = useNavigate();
  const [user] = useState(readUser);
  const [application, setApplication] = useState(null);
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
        if (active) setApplication(newest);
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
                    <ReactStep key={step} title={isRejected && index === 4 ? 'Approved / Rejected' : step} index={index} currentIndex={stepIndex} isRejected={isRejected} submittedDate={index === 0 ? dateLabel(application.submitted_at) : ''} isLast={index === steps.length - 1} />
                  ))}
                </div>
                <div className="detail-row">
                  <div className="detail-left"><p className="detail-title"><span aria-hidden="true">ⓘ</span> Detailed Status</p><small>CURRENT STATUS</small><p className={`track-status-value ${isRejected ? 'rejected' : application.application_status === 'approved' ? 'approved' : ''}`}>{status}</p><small>EXPECTED UPDATE</small><p><strong>{application.application_status === 'approved' ? 'A license record is available if issued.' : application.application_status === 'rejected' ? 'Please contact support for details.' : 'No further update is available yet.'}</strong></p></div>
                  <div className="detail-right"><small>OFFICER REMARK</small><p>{application.remarks || application.officer_remark || 'No officer remark is available from the application record.'}</p><p className="officer">Officer details unavailable</p></div>
                </div>
                {application.application_status === 'approved' && <div className="view-btn-row"><Link className="track-button btn-view" to="/download-license">View License</Link></div>}
              </section>
            )}
            <Link className="track-button btn-cancel" to="/dashboard">← Back to Dashboard</Link>
          </div>
          <aside className="track-right">
            <section className="notif-card"><div className="notif-header"><h3>Recent Notifications</h3><span className="badge-num">Info</span></div>
              {isLoading ? <p className="track-muted">Application updates will appear here.</p> : error ? <p className="track-muted">Application updates are unavailable.</p> : application ? <div className="notif-item"><strong>Application status (informational)</strong><p>The latest status in your application record is {status}.</p><small>{dateLabel(application.submitted_at)}</small></div> : <p className="track-muted">No application updates are available.</p>}
              <p className="notif-disclaimer">These updates are derived from the application record, not a notifications service.</p>
            </section>
            <section className="assist-card"><span className="assist-icon" aria-hidden="true">?</span><h3>Need Assistance?</h3><p>Contact support for application queries or report technical issues.</p><Link className="track-button btn-support" to="/helpdesk">Contact Support</Link></section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function ReactStep({ title, index, currentIndex, isRejected, submittedDate, isLast }) {
  const done = index < currentIndex || (index === currentIndex && !isRejected);
  const current = index === currentIndex;
  return <>
    <div className={`step ${current ? 'current' : ''}`}><div className={`circle ${done ? 'done' : current ? 'current' : 'pending'} ${isRejected && current ? 'rejected' : ''}`}>{done ? '✓' : isRejected && current ? '×' : index + 1}</div><span>{title}</span><small>{submittedDate || 'Date unavailable'}</small></div>
    {!isLast && <div className={`line ${index < currentIndex && !isRejected ? 'line-done' : ''}`} />}
  </>;
}
