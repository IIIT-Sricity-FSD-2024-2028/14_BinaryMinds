import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import '../styles/ApplicantProfile.css';

const apiBase = 'http://localhost:3000/api';

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
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: '—', email: '—', phone: '—' });
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      const accessToken = sessionStorage.getItem('accessToken');
      if (!accessToken) {
        navigate('/login', { replace: true });
        return;
      }

      const headers = { Authorization: `Bearer ${accessToken}` };
      try {
        const [userResponse, applicationsResponse] = await Promise.all([
          fetch(`${apiBase}/users/me`, { headers }),
          fetch(`${apiBase}/applications/mine`, { headers }),
        ]);
        if (!userResponse.ok || !applicationsResponse.ok) {
          throw new Error('Could not load your profile. Please sign in again or try later.');
        }

        const user = await userResponse.json();
        const result = await applicationsResponse.json();
        if (isActive) {
          setProfile({
            name: user.full_name || '—',
            email: user.email || '—',
            phone: user.phone || '—',
          });
          setApplications(Array.isArray(result.data) ? result.data.map(makeSafeApplication) : []);
        }
      } catch (requestError) {
        if (isActive) setError(requestError.message || 'Could not load your profile.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadProfile();
    return () => { isActive = false; };
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('applicationRef');
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('notifsRead_')) sessionStorage.removeItem(key);
    });
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const latestApplication = applications[0];

  return (
    <div className="applicant-profile-page">
      <div className="top-bar">
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="India Logo" style={{ filter: 'none' }} />
        <div className="brand"><span>Government of India</span><strong>TradeZo</strong></div>
      </div>

      <ApplicantNavigation onLogout={handleLogout} />

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
                <h2>{profile.name}</h2>
                <p><i className="fa-solid fa-at" /> <span>{profile.email}</span></p>
                <p><i className="fa-solid fa-phone" /> <span>{profile.phone}</span></p>
                <Link className="btn-edit" to="/profile/edit"><i className="fa-solid fa-pen" /> Edit Profile</Link>
              </div>
            </section>

            <section className="details-card">
              <div className="detail-grid">
                <div><small>AADHAAR NUMBER</small><p>{latestApplication?.aadhaar || '—'}</p></div>
                <div><small>GENDER</small><p>{latestApplication?.gender || '—'}</p></div>
                <div><small>NATIONALITY</small><p>Not provided</p></div>
              </div>
              <div className="address-block"><small>ADDRESS</small><p>{latestApplication?.address || '—'}</p></div>
            </section>

            <section className="activity-card">
              <div className="act-header"><h3>Recent Activity</h3><Link to="/track-status">View All</Link></div>
              {applications.map((application) => (
                <div className="act-item" key={application.applicationId}>
                  <div className="act-icon orange"><i className="fa-solid fa-file-circle-check" /></div>
                  <div className="act-info">
                    <strong>Application Status</strong>
                    <p>{application.businessName || application.applicationRef || 'Trade license application'}: {(application.status || '—').replace(/_/g, ' ')}</p>
                  </div>
                  <span className="act-time">{formatDate(application.submittedAt)}</span>
                </div>
              ))}
              {!isLoading && applications.length === 0 && <p className="profile-message">No recent application activity.</p>}
            </section>

            <Link className="btn-cancel" to="/dashboard">← Back to Dashboard</Link>
          </div>

        </div>
      </main>
    </div>
  );
}
