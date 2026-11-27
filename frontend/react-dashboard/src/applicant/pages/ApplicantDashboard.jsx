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
} from '../../features/applications/applicationsSlice.js';
import {
  fetchApplicantLicenseByApplication,
  selectApplicantLicenseErrorsByApplicationId,
  selectApplicantLicenseRequestsByApplicationId,
  selectApplicantLicensesByApplicationId,
} from '../state/applicantWorkflowSlice.js';
import '../styles/ApplicantDashboard.css';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ApplicantDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const applicant = useSelector(selectCurrentUser);
  const applications = useSelector(selectApplicantApplications);
  const applicationRequest = useSelector((state) => selectApplicantApplicationsRequest(state, 'fetchMine'));
  const applicationError = useSelector((state) => selectApplicantApplicationsError(state, 'fetchMine'));
  const licensesByApplicationId = useSelector(selectApplicantLicensesByApplicationId);
  const licenseRequestsByApplicationId = useSelector(selectApplicantLicenseRequestsByApplicationId);
  const licenseErrorsByApplicationId = useSelector(selectApplicantLicenseErrorsByApplicationId);
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

  const currentApplication = applications[0];
  const currentApplicationId = currentApplication?.application_id;
  const licenseRequest = currentApplicationId
    ? licenseRequestsByApplicationId[String(currentApplicationId)]
    : undefined;
  const license = currentApplicationId
    ? licensesByApplicationId[String(currentApplicationId)]
    : null;
  const licenseError = currentApplicationId
    ? licenseErrorsByApplicationId[String(currentApplicationId)]
    : null;

  useEffect(() => {
    if (
      !currentApplicationId ||
      currentApplication?.application_status !== 'approved'
    ) return undefined;
    const request = dispatch(fetchApplicantLicenseByApplication(currentApplicationId));
    return () => request.abort();
  }, [currentApplication?.application_status, currentApplicationId, dispatch]);

  const applicantName = applicant?.name || 'Applicant';
  const applicantEmail = applicant?.email || '';
  const currentStatus = currentApplication?.application_status || '';
  const hasPaid = currentApplication?.paymentDone === true;

  return (
    <div className="applicant-dashboard-page">
      <ApplicantNavigation />

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
              ) : licenseRequest === 'pending' ? (
                <p className="page-message" role="status">Loading your license details...</p>
              ) : currentApplication ? (
                <>
                  {licenseError && <p className="page-message error" role="alert">License details could not be loaded. Your application information is shown below.</p>}
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
