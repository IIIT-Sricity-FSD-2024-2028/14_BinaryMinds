import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import { selectCurrentUser } from '../../features/auth/authSelectors.js';
import {
  fetchApplicantApplications,
  selectApplicantApplications,
  selectApplicantApplicationsError,
  selectApplicantApplicationsRequest,
} from '../store/applicantApplicationsSlice.js';
import '../styles/ApplicantProfile.css';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function makeSafeApplication(application) {
  const aadhaar = application.aadhaar_number ? String(application.aadhaar_number) : '';
  const address = [application.shop_address, application.city, application.state, application.pincode]
    .filter(Boolean)
    .join(', ');

  return {
    applicationId: application.application_id,
    applicationRef: application.application_ref,
    businessName: application.business_name,
    status: application.application_status,
    submittedAt: application.submitted_at,
    gender: application.gender,
    aadhaar: aadhaar ? `XXXX-XXXX-${aadhaar.slice(-4)}` : '—',
    address: address || '—',
  };
}

export default function ApplicantProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const applicant = useSelector(selectCurrentUser);
  const applications = useSelector(selectApplicantApplications);
  const applicationRequest = useSelector((state) => selectApplicantApplicationsRequest(state, 'fetchMine'));
  const applicationError = useSelector((state) => selectApplicantApplicationsError(state, 'fetchMine'));
  const isLoading = applicationRequest === undefined || applicationRequest === 'pending';
  const error = applicationRequest === 'rejected' ? applicationError : '';

  useEffect(() => {
    if (applicant?.role !== 'applicant') {
      navigate('/login', { replace: true });
      return undefined;
    }
    const request = dispatch(fetchApplicantApplications());
    return () => request.abort();
  }, [applicant?.role, dispatch, navigate]);

  const safeApplications = applications.map(makeSafeApplication);
  const latestApplication = safeApplications[0];

  return (
    <div className="applicant-profile-page">
      <ApplicantNavigation />

      <main>
        <h1>Applicant Profile</h1>
        <p className="sub">View and manage your registered applicant details</p>
        {isLoading && <p className="profile-message">Loading your profile...</p>}
        {error && <p className="profile-message error" role="alert">{error}</p>}

        <div className="layout">
          <div className="left-col">
            <section className="profile-card">
              <div className="avatar-wrap">
                <div className="avatar"><i className="fa-solid fa-user fa-2x" /></div>
                <div className="cam-icon" aria-hidden="true"><i className="fa-solid fa-camera" /></div>
              </div>
              <div className="profile-info">
                <h2>{applicant?.name || '—'}</h2>
                <p><i className="fa-solid fa-at" /> <span>{applicant?.email || '—'}</span></p>
                <p><i className="fa-solid fa-phone" /> <span>{applicant?.phone || '—'}</span></p>
                <Link className="btn-edit" to="/profile/edit"><i className="fa-solid fa-pen" /> Edit Profile</Link>
              </div>
            </section>

            <section className="details-card">
              <div className="detail-grid">
                <div><small>AADHAAR NUMBER</small><p>{latestApplication?.aadhaar || '—'}</p></div>
                <div><small>GENDER</small><p>{latestApplication?.gender || '—'}</p></div>
                <div><small>NATIONALITY</small><p>Indian</p></div>
              </div>
              <div className="address-block"><small>ADDRESS</small><p>{latestApplication?.address || '—'}</p></div>
            </section>

            <section className="activity-card">
              <div className="act-header"><h3>Recent Activity</h3><Link to="/track-status">View All</Link></div>
              {safeApplications.map((application) => (
                <div className="act-item" key={application.applicationId}>
                  <div className="act-icon orange"><i className="fa-solid fa-file-circle-check" /></div>
                  <div className="act-info">
                    <strong>Application Status</strong>
                    <p>{application.businessName || application.applicationRef || 'Trade license application'}: {(application.status || '—').replace(/_/g, ' ')}</p>
                  </div>
                  <span className="act-time">{formatDate(application.submittedAt)}</span>
                </div>
              ))}
              {!isLoading && !error && safeApplications.length === 0 && <p className="profile-message">No recent application activity.</p>}
            </section>

            <Link className="btn-cancel" to="/dashboard">← Back to Dashboard</Link>
          </div>

        </div>
      </main>
    </div>
  );
}
