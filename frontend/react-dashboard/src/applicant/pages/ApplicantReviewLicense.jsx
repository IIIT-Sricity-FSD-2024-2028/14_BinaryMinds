import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import '../styles/ApplicantReviewLicense.css';

const apiBase = 'http://localhost:3000/api';

function readUser() {
  try { return JSON.parse(sessionStorage.getItem('loggedInUser') || '{}') || {}; } catch { return {}; }
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function addYears(value, years) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  date.setFullYear(date.getFullYear() + years);
  return date;
}

function renewalFee(years) {
  let base = 1500;
  try {
    const savedFees = JSON.parse(localStorage.getItem('tradezo_fees') || '{}');
    const fee = Number.parseInt(savedFees.renewal, 10);
    if (Number.isFinite(fee)) base = fee;
  } catch { /* Keep the page's existing default fee. */ }
  return `₹${(base * years).toLocaleString('en-IN')}`;
}

const renewalSteps = ['Submitted', 'Inspection Scheduled', 'Inspection Completed', 'Department Review', 'Approved/Rejected'];

export default function ApplicantReviewLicense() {
  const navigate = useNavigate();
  const [user] = useState(readUser);
  const [license, setLicense] = useState(null);
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [renewalPeriod, setRenewalPeriod] = useState('1year');
  const [licenseCategory, setLicenseCategory] = useState('grocery');
  const [shopArea, setShopArea] = useState('450');
  const [files, setFiles] = useState([null, null, null]);
  const [validation, setValidation] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');

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
        const applicationsPayload = await applicationsResponse.json().catch(() => ({}));
        if (!applicationsResponse.ok) {
          const message = Array.isArray(applicationsPayload.message) ? applicationsPayload.message.join(', ') : applicationsPayload.message;
          throw new Error(message || 'Could not load your applications.');
        }
        if (!Array.isArray(applicationsPayload.data)) throw new Error('The server returned an invalid application list.');
        const approved = applicationsPayload.data
          .filter((item) => String(item.application_status || '').toLowerCase() === 'approved')
          .sort((first, second) => new Date(second.submitted_at || 0) - new Date(first.submitted_at || 0));

        for (const item of approved) {
          const licenseResponse = await fetch(`${apiBase}/licenses/application/${item.application_id}`, { headers: { Authorization: `Bearer ${token}` } });
          const licensePayload = await licenseResponse.json().catch(() => ({}));
          if (licenseResponse.ok) {
            const record = licensePayload.data || licensePayload;
            if (active) {
              setApplication(item);
              setLicense(record);
              const category = item.trade_category || item.business_type || '';
              const options = [
                ['grocery', 'Retail Trade - Grocery'], ['food', 'Food & Beverage'], ['electronics', 'Electronics'],
              ];
              const match = options.find((option) => option[1].trim().toLowerCase() === category.trim().toLowerCase());
              if (match) setLicenseCategory(match[0]);
            }
            break;
          }
          if (licenseResponse.status !== 404) {
            const message = Array.isArray(licensePayload.message) ? licensePayload.message.join(', ') : licensePayload.message;
            throw new Error(message || 'Could not load the license record.');
          }
        }
      } catch (error) {
        if (active) setLoadError(error.message || 'Please check your connection and try again.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadLicense();
    return () => { active = false; };
  }, [navigate, user.role]);

  function selectFile(index, event) {
    const file = event.target.files?.[0] || null;
    setFiles((current) => current.map((item, position) => position === index ? file : item));
    setValidation((current) => ({ ...current, files: '' }));
    setSubmitMessage('');
  }

  function submitRenewal(event) {
    event.preventDefault();
    setSubmitMessage('');
    const nextValidation = {};
    if (!renewalPeriod) nextValidation.period = 'Please select a renewal period.';
    if (!licenseCategory) nextValidation.category = 'Please select a category.';
    if (!shopArea || Number(shopArea) <= 0) nextValidation.area = 'Please enter a valid shop area.';
    if (files.some((file) => !file)) nextValidation.files = 'Please upload all required documents before submitting.';
    setValidation(nextValidation);
    if (Object.keys(nextValidation).length) return;
    setSubmitMessage('Online renewal submission is not currently supported. No renewal was submitted or saved.');
  }

  const periodYears = Number(renewalPeriod.replace('year', '')) || 1;
  const proposedExpiry = addYears(license?.expiry_date, periodYears);

  return (
    <div className="applicant-review-license-page">
      <ApplicantNavigation />
      <main className="review-page">
        <h1>Renew Trade License</h1>
        <p className="review-subtitle">Review your current license details and submit renewal documentation.</p>
        {isLoading ? <div className="review-state">Loading your license details...</div> : loadError ? <div className="review-state review-error" role="alert">{loadError}</div> : !license ? (
          <div className="review-state"><h3>No Active License Found</h3><p>You can renew only after a license is issued.</p><Link className="review-renew-btn" to="/track-status">Track Application</Link></div>
        ) : (
          <>
            <section className="review-card">
              <div className="review-card-top"><h2>Existing License Details</h2><span className="review-badge green">● {String(license.status || 'ACTIVE').toUpperCase()}</span></div>
              <div className="review-row3"><ReviewField label="LICENSE NUMBER" value={license.license_number} /><ReviewField label="BUSINESS NAME" value={application?.business_name} /><ReviewField label="LICENSE STATUS" value={license.status} green /></div>
              <hr />
              <div className="review-row3"><ReviewField label="ISSUE DATE" value={formatDate(license.issued_date)} /><ReviewField label="EXPIRY DATE" value={formatDate(license.expiry_date)} /><ReviewField label="PROPOSED NEW EXPIRY" value={proposedExpiry ? formatDate(proposedExpiry) : '—'} blue /></div>
            </section>
            <form onSubmit={submitRenewal} noValidate>
              <div className="review-two-col">
                <section className="review-card"><h2>Renewal Details</h2>
                  <div className="review-form-group"><label htmlFor="renewal-period">Renewal Period</label><select id="renewal-period" value={renewalPeriod} onChange={(event) => { setRenewalPeriod(event.target.value); setSubmitMessage(''); }}><option value="1year">1 Year</option><option value="2year">2 Years</option><option value="3year">3 Years</option></select><span className={`review-error-text ${validation.period ? 'show' : ''}`}>{validation.period || 'Please select a renewal period.'}</span></div>
                  <div className="review-form-group"><label htmlFor="license-category">License Category</label><select id="license-category" value={licenseCategory} onChange={(event) => { setLicenseCategory(event.target.value); setSubmitMessage(''); }}><option value="grocery">Retail Trade - Grocery</option><option value="food">Food &amp; Beverage</option><option value="electronics">Electronics</option></select><span className={`review-error-text ${validation.category ? 'show' : ''}`}>{validation.category || 'Please select a category.'}</span></div>
                  <div className="review-form-group"><label htmlFor="shop-area">Shop Area (sq. ft.)</label><input id="shop-area" type="number" min="1" placeholder="Enter area" value={shopArea} onChange={(event) => { setShopArea(event.target.value); setSubmitMessage(''); }} className={validation.area ? 'invalid-field' : ''} /><span className={`review-error-text ${validation.area ? 'show' : ''}`}>{validation.area || 'Please enter a valid shop area.'}</span></div>
                  <div className="review-form-group"><label htmlFor="submitted-at">Submitted At</label><input id="submitted-at" type="text" value={formatDate(new Date())} readOnly /></div>
                </section>
                <section className="review-card"><h2>Upload Updated Documents</h2>
                  {['Aadhar Card', 'Business Affidavit', 'Passport Photo'].map((title, index) => <div className="review-doc-row" key={title}><span>✓ {title}</span><div><span className="review-filename">{files[index]?.name || 'No file chosen'}</span><input className="review-file-input" type="file" id={`renewal-file-${index}`} onChange={(event) => selectFile(index, event)} /><label className="review-upload-btn" htmlFor={`renewal-file-${index}`}>UPLOAD FILE</label></div></div>)}
                  {validation.files && <p className="review-error-text show">{validation.files}</p>}
                </section>
              </div>
              <section className="review-card"><h2>Payment Information</h2><div className="review-row5"><ReviewField label="RENEWAL ID" value="—" /><ReviewField label="LICENSE ID" value={license.license_id} /><ReviewField label="RENEWAL FEE" value={renewalFee(periodYears)} blue big /><ReviewField label="PAYMENT METHOD" value="Online (UPI/Netbanking)" /><div className="review-field"><label>RENEWAL STATUS</label><span className="review-badge orange">Not submitted</span></div></div>
                <div className="review-steps">{renewalSteps.map((step, index) => <ReactReviewStep key={step} step={step} index={index} last={index === renewalSteps.length - 1} />)}</div>
              </section>
              <div className="review-buttons"><Link className="review-cancel-btn" to="/dashboard">← Cancel</Link><button className="review-renew-btn" type="submit">Renew License</button></div>
              {submitMessage && <div className="review-submit-message" role="status">{submitMessage}</div>}
            </form>
          </>
        )}
      </main>
    </div>
  );
}

function ReviewField({ label, value, green, blue, big }) {
  return <div className="review-field"><label>{label}</label><p className={`${green ? 'green' : ''} ${blue ? 'blue' : ''} ${big ? 'big' : ''}`}>{value || '—'}</p></div>;
}

function ReactReviewStep({ step, index, last }) {
  return <><div className={`review-step ${index === 0 ? 'active' : ''}`}><div className={`review-circle ${index === 0 ? 'done' : ''}`}>{index === 0 ? '✓' : index + 1}</div><p>{step}</p></div>{!last && <div className="review-line" />}</>;
}
