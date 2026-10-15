import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import '../styles/ApplicantDashboard.css';

const apiBase = 'http://localhost:3000/api';

function readSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
  } catch {
    return {};
  }
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ApplicantDashboard() {
  const navigate = useNavigate();
  const [applicant] = useState(readSessionUser);
  const [applications, setApplications] = useState([]);
  const [license, setLicense] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadApplications() {
      const accessToken = sessionStorage.getItem('accessToken');
      if (!accessToken || applicant.role !== 'applicant') {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const response = await fetch(`${apiBase}/applications/mine`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error('Could not load applications. Please sign in again or try later.');

        const result = await response.json();
        if (isActive) setApplications(Array.isArray(result.data) ? result.data : []);
      } catch (requestError) {
        if (isActive) setError(requestError.message || 'Could not load applications.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadApplications();
    return () => { isActive = false; };
  }, [applicant.role, navigate]);

  const currentApplication = applications[0];

  useEffect(() => {
    let isActive = true;
    setLicense(null);

    async function loadLicense() {
      if (!currentApplication || currentApplication.application_status !== 'approved' || !currentApplication.application_id) return;
      const accessToken = sessionStorage.getItem('accessToken');
      if (!accessToken) return;

      try {
        const response = await fetch(`${apiBase}/licenses/application/${currentApplication.application_id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) return;
        const record = await response.json();
        if (isActive) setLicense(record);
      } catch {
        // License details are optional; the application card remains visible.
      }
    }

    loadLicense();
    return () => { isActive = false; };
  }, [currentApplication]);

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

  const applicantName = applicant.full_name || applicant.name || 'Applicant';
  const applicantEmail = applicant.email || '';
  const currentStatus = currentApplication?.application_status || '';
  const hasPaid = currentApplication?.paymentDone === true;

  return (
    <div className="applicant-dashboard-page">
      <div className="top-bar">
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Government of India emblem" style={{ filter: 'none' }} />
        <div className="brand">
          <span>Government of India</span>
          <strong>TradeZo</strong>
          <span>Municipal Corporation &ndash; Trade License Management System</span>
        </div>
      </div>

      <ApplicantNavigation onLogout={handleLogout} />

      <div className="main">
        <aside className="sidebar">
          <p className="active">Dashboard</p>
          <p onClick={() => navigate('/apply-license')}>Apply License</p>
          <p onClick={() => navigate('/track-status')}>Track Application</p>
          <p onClick={() => navigate('/review-license')}>Renew Licenses</p>
        </aside>

        <main className="content">
          <section className="card welcome">
            <div>
              <h2>Welcome, {applicantName}</h2>
              <p className="applicant-role-label">Applicant / User</p>
              <p>{applicantEmail}</p>
            </div>
            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Applicant profile" />
          </section>

          {isLoading && <p className="page-message">Loading your applications...</p>}
          {error && <p className="page-message error" role="alert">{error}</p>}

          <div className="grid">
            <section className="card">
              <h3>My Application Status</h3>
              <table>
                <thead>
                  <tr><th>ID</th><th>Business</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.application_id}>
                      <td>{application.application_ref || application.application_id || '—'}</td>
                      <td>{application.business_name || '—'}</td>
                      <td><span className="badge">{(application.application_status || '—').replace(/_/g, ' ').toUpperCase()}</span></td>
                      <td>{formatDate(application.submitted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!isLoading && !error && applications.length === 0 && (
                <p className="empty-message">You have no active applications. <Link to="/apply-license">Apply License</Link> to get started.</p>
              )}
              {hasPaid && <button type="button" onClick={() => navigate('/payments')}>Payment Details</button>}
            </section>

            <section className="card">
              <h3>{license ? 'My Current License' : currentApplication ? 'My Application & Fees' : 'My Current License'}</h3>
              {license ? (
                <>
                  <p><b>License No:</b> {license.license_number || '—'}</p>
                  <p><b>Business:</b> {currentApplication.business_name || '—'}</p>
                  <p><b>Valid:</b> {formatDate(license.issued_date)} - {formatDate(license.expiry_date)}</p>
                  <button type="button" onClick={() => navigate('/download-license')}>Download License</button>
                </>
              ) : currentApplication ? (
                <>
                  <p><b>Application ID:</b> {currentApplication.application_ref || currentApplication.application_id || '—'}</p>
                  <p><b>Business:</b> {currentApplication.business_name || '—'}</p>
                  <p><b>Fee:</b> — ({hasPaid ? 'Paid' : 'Payment status unavailable'})</p>
                  <p><b>Status:</b> {currentStatus.replace(/_/g, ' ') || '—'}</p>
                </>
              ) : (
                <p>No license or application data is available.</p>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
