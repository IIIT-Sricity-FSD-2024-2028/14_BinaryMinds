import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import '../styles/ApplicantDownloadLicense.css';

const apiBase = 'http://localhost:3000/api';

function readUser() {
  try { return JSON.parse(sessionStorage.getItem('loggedInUser') || '{}') || {}; } catch { return {}; }
}

function formatDate(value) {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function responseMessage(payload, fallback) {
  if (Array.isArray(payload?.message)) return payload.message.join(', ');
  return payload?.message || fallback;
}

async function readResponse(response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

export default function ApplicantDownloadLicense() {
  const navigate = useNavigate();
  const [user] = useState(readUser);
  const [license, setLicense] = useState(null);
  const [application, setApplication] = useState(null);
  const [municipality, setMunicipality] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem('accessToken');
    if (!token || user.role !== 'applicant') {
      navigate('/login', { replace: true });
      return () => { active = false; };
    }
    async function loadLicense() {
      try {
        const applicationsResponse = await fetch(`${apiBase}/applications/mine`, { headers: { Authorization: `Bearer ${token}` } });
        const applicationsPayload = await readResponse(applicationsResponse);
        if (!applicationsResponse.ok) throw new Error(responseMessage(applicationsPayload, 'Could not load your applications.'));
        if (!Array.isArray(applicationsPayload.data)) throw new Error('The server returned an invalid application list.');
        const approved = applicationsPayload.data.filter((item) => String(item.application_status || '').toLowerCase() === 'approved')
          .sort((first, second) => new Date(second.submitted_at || 0) - new Date(first.submitted_at || 0));
        let licenseFound = null;
        let applicationFound = null;
        for (const item of approved) {
          const licenseResponse = await fetch(`${apiBase}/licenses/application/${item.application_id}`, { headers: { Authorization: `Bearer ${token}` } });
          const licensePayload = await readResponse(licenseResponse);
          if (licenseResponse.ok) {
            licenseFound = licensePayload.data || licensePayload;
            applicationFound = item;
            break;
          }
          if (licenseResponse.status !== 404) throw new Error(responseMessage(licensePayload, 'Could not load your license details.'));
        }
        let authorityName = '';
        if (applicationFound) {
          const municipalityResponse = await fetch(`${apiBase}/municipalities`);
          if (municipalityResponse.ok) {
            const municipalityPayload = await readResponse(municipalityResponse);
            const rows = Array.isArray(municipalityPayload) ? municipalityPayload : municipalityPayload.data;
            const match = Array.isArray(rows) && rows.find((item) => String(item.municipality_id).toLowerCase() === String(applicationFound.municipality_id || licenseFound.municipality_id || '').toLowerCase());
            authorityName = match?.name || '';
          }
        }
        if (active) {
          setLicense(licenseFound);
          setApplication(applicationFound);
          setMunicipality(authorityName);
        }
      } catch (requestError) {
        if (active) setError(requestError.message || 'Please check your connection and try again.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadLicense();
    return () => { active = false; };
  }, [navigate, user.role]);

  function logout(event) {
    event.preventDefault();
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  return (
    <div className="applicant-download-license-page">
      <ApplicantNavigation onLogout={logout} />
      <header className="download-page-title"><h2>Trade License</h2><p>View your approved trade license details. Use print to save a copy as PDF.</p></header>
      {isLoading ? <p className="download-state">Loading your license details...</p> : error ? <p className="download-state download-error" role="alert">{error}</p> : !license ? (
        <div className="download-state download-empty"><h3>No License Available</h3><p>Your license will appear here once an approved application has a license record.</p><Link to="/dashboard">Back to Dashboard</Link></div>
      ) : (
        <div className="main-layout">
          <section className="left-section">
            <article className="license-card">
              <div className="card-header"><h3><span aria-hidden="true">♜</span><span>{municipality ? `${municipality} - Trade License` : 'Trade License'}</span></h3><span className={`badge-status ${String(license.status || '').toLowerCase()}`}>{license.status || 'Status unavailable'}</span></div>
              <div className="details-grid">
                <LicenseDetail label="License Number" value={license.license_number} /><LicenseDetail label="Applicant Name" value={application?.full_name || user.full_name || user.name} /><LicenseDetail label="Trade Category" value={application?.trade_category || application?.business_type} /><LicenseDetail label="Issue Date" value={formatDate(license.issued_date)} /><LicenseDetail label="Expiry Date" value={formatDate(license.expiry_date)} /><LicenseDetail label="Status" value={license.status || 'Unavailable'} active={String(license.status).toLowerCase() === 'active'} />
              </div>
              <div className="card-footer"><p>Licensing Authority<br /><strong>{municipality || 'Authority information unavailable'}</strong></p></div>
            </article>
            <Link className="download-cancel-btn" to="/dashboard">← Back to Dashboard</Link>
          </section>
          <aside className="right-section">
            <section className="preview-card"><h4>License Preview</h4><div className="license-preview-box"><h5>{municipality || 'Trade License'}</h5><div className="preview-official">Preview only — not a PDF certificate</div><p><b>License Number:</b> {license.license_number || 'Unavailable'}</p><p><b>Applicant:</b> {application?.full_name || user.full_name || user.name || 'Unavailable'}</p><p><b>Status:</b> {license.status || 'Unavailable'}</p><p><b>Expiry:</b> {formatDate(license.expiry_date)}</p><div className="fake-line" /><div className="fake-line short" /><div className="fake-line" /></div><button type="button" className="btn-download" onClick={() => window.print()}>Print / Save as PDF</button><button type="button" className="btn-print" onClick={() => window.print()}>Print License</button></section>
          </aside>
        </div>
      )}
    </div>
  );
}

function LicenseDetail({ label, value, active }) {
  return <div className="detail-item"><label>{label}</label><p className={active ? 'active-text' : ''}>{value || 'Unavailable'}</p></div>;
}
