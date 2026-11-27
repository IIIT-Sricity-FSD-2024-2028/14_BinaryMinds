import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import { selectCurrentUser } from '../../features/auth/authSelectors.js';
import { fetchLicenseByApplication } from '../../features/licenses/licensesSlice.js';
import { fetchApplicantApplications, selectApplicantApplications, selectApplicantApplicationsError, selectApplicantApplicationsRequest } from '../../features/applications/applicationsSlice.js';
import '../styles/ApplicantTrackStatus.css';

const steps = ['Submitted', 'Documents Verified', 'Inspection Scheduled', 'Review Done', 'Approved'];

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
  return ({
    submitted: 'Submitted',
    assigned: 'Assigned',
    verified: 'Documents Verified',
    documents_uploaded: 'Documents Uploaded',
    inspection_scheduled: 'Inspection Scheduled',
    inspection_completed: 'Inspection Completed',
    department_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
  })[String(status || '').toLowerCase()] || 'Status unavailable';
}

export default function ApplicantTrackStatus() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const applications = useSelector(selectApplicantApplications);
  const loading = useSelector((state) => selectApplicantApplicationsRequest(state, 'fetchMine') === 'pending');
  const error = useSelector((state) => selectApplicantApplicationsError(state, 'fetchMine'));
  const licenses = useSelector((state) => state.licenses.byApplicationId);
  const licenseError = useSelector((state) => state.licenses.errors.fetchByApplication);
  const sortedApplications = applications.slice().sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));

  useEffect(() => {
    if (!user || user.role !== 'applicant') {
      navigate('/login', { replace: true });
      return;
    }
    dispatch(fetchApplicantApplications());
  }, [dispatch, navigate, user]);

  useEffect(() => {
    applications
      .filter((application) => String(application.application_status || '').toLowerCase() === 'approved')
      .forEach((application) => {
        const applicationId = String(application.application_id);
        if (!(applicationId in licenses)) dispatch(fetchLicenseByApplication(application.application_id));
      });
  }, [dispatch, applications, licenses]);

  return (
    <div className="applicant-track-status-page">
      <ApplicantNavigation />
      <main className="track-main">
        <div className="track-content">
          <div className="track-left">
            <h1>Track Application Status</h1>
            <p className="track-sub">Monitor the current status of your trade license applications.</p>
            {loading ? (
              <div className="track-state">Loading your applications...</div>
            ) : error ? (
              <div className="track-state track-error" role="alert">
                <h3>Unable to Load Applications</h3>
                <p>{error}</p>
                <button type="button" onClick={() => dispatch(fetchApplicantApplications())}>Try Again</button>
              </div>
            ) : sortedApplications.length === 0 ? (
              <div className="track-state track-empty">
                <h3>No Application Found</h3>
                <p>You have not submitted a trade license application yet.</p>
                <Link className="track-action" to="/apply-license">Apply Now</Link>
              </div>
            ) : (
              <div className="track-applications">
                {sortedApplications.map((application) => {
                  const applicationId = String(application.application_id);
                  const license = licenses[applicationId];
                  const rawStatus = String(application.application_status || '').toLowerCase();
                  const isRejected = rawStatus === 'rejected';
                  const isApproved = rawStatus === 'approved';
                  const status = statusLabel(rawStatus);
                  const stepIndex = currentStep(rawStatus);
                  const paymentStatus = typeof application.paymentDone === 'boolean'
                    ? (application.paymentDone ? 'Paid' : 'Not paid')
                    : 'Unavailable';
                  const issueDateLabel = license?.issued_date
                    ? `Issue date: ${dateLabel(license.issued_date)}`
                    : licenseError
                      ? 'Could not load the license issue date.'
                      : 'Issue date pending';

                  return (
                    <section className="app-card" key={application.application_id}>
                      <header className="app-card-heading">
                        <div>
                          <small>APPLICATION ID</small>
                          <strong>{application.application_ref || application.application_id || 'Unavailable'}</strong>
                        </div>
                        <span className={`track-status-value ${isRejected ? 'rejected' : isApproved ? 'approved' : ''}`}>{status}</span>
                      </header>
                      <div className="app-info">
                        <div><small>APPLICATION DATE</small><strong>{dateLabel(application.submitted_at) || 'Unavailable'}</strong></div>
                        <div><small>APPLICANT NAME</small><strong>{application.full_name || user.fullName || user.name || 'Unavailable'}</strong></div>
                        <div><small>BUSINESS NAME</small><strong>{application.business_name || 'Unavailable'}</strong></div>
                        <div><small>BUSINESS TYPE</small><strong>{application.business_type || application.trade_category || 'Unavailable'}</strong></div>
                        <div><small>PAYMENT STATUS</small><strong>{paymentStatus}</strong></div>
                        <div><small>MUNICIPALITY</small><strong>{application.municipality_name || application.municipality_id || 'Unavailable'}</strong></div>
                      </div>
                      <div className="stepper" aria-label={`Application progress for ${application.application_ref || application.application_id}`}>
                        {steps.map((step, index) => (
                          <ReactStep
                            key={step}
                            title={isRejected && index === 4 ? 'Approved / Rejected' : step}
                            index={index}
                            currentIndex={stepIndex}
                            isRejected={isRejected}
                            date={index === 0 ? dateLabel(application.submitted_at) : index === 4 && isApproved ? issueDateLabel : ''}
                            isLast={index === steps.length - 1}
                          />
                        ))}
                      </div>
                      <section className="detail-row" aria-label={`Detailed application status for ${application.application_ref || application.application_id}`}>
                        <div className="detail-left">
                          <p className="detail-title"><span aria-hidden="true">i</span> Detailed Status</p>
                          <div className="detail-status-grid">
                            <div>
                              <small>CURRENT STATUS</small>
                              <p className={`track-status-value ${isRejected ? 'rejected' : isApproved ? 'approved' : ''}`}>{status}</p>
                            </div>
                            <div>
                              <small>EXPECTED UPDATE</small>
                              <p><strong>{isApproved ? 'A license record is available if issued.' : isRejected ? 'Please contact support for details.' : 'No further update is available yet.'}</strong></p>
                            </div>
                          </div>
                        </div>
                      </section>
                      {isApproved && (
                        <div className="view-btn-row">
                          <Link className="track-button btn-view" to="/download-license">View License</Link>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
            <Link className="track-button btn-cancel" to="/dashboard">Back to Dashboard</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReactStep({ title, index, currentIndex, isRejected, date, isLast }) {
  const done = index < currentIndex || (index === currentIndex && !isRejected);
  const current = index === currentIndex;
  return (
    <>
      <div className={`step ${current ? 'current' : ''}`}>
        <div className={`circle ${done ? 'done' : current ? 'current' : 'pending'} ${isRejected && current ? 'rejected' : ''}`}>
          {done ? '✓' : isRejected && current ? '×' : index + 1}
        </div>
        <span>{title}</span>
        {date && <small>{date}</small>}
      </div>
      {!isLast && <div className={`line ${index < currentIndex && !isRejected ? 'line-done' : ''}`} />}
    </>
  );
}
