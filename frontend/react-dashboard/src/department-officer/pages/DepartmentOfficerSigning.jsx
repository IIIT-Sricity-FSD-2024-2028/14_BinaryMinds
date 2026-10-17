import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import DepartmentOfficerPageFrame from '../components/DepartmentOfficerPageFrame';
import { useDepartmentOfficerData } from '../components/useDepartmentOfficerData';
import '../styles/DepartmentOfficerSigning.css';

function defaultExpiryDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function displayDate(value) {
  if (!value) return 'Waiting for approval';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString('en-IN');
}

function dateAtEndOfDay(value) {
  const date = new Date(`${value}T23:59:59`);
  if (Number.isNaN(date.getTime())) throw new Error('Choose a valid license expiry date.');
  return date.toISOString();
}

export default function DepartmentOfficerSigning() {
  const data = useDepartmentOfficerData();
  const { applicationId } = useParams();
  const location = useLocation();
  const [signature, setSignature] = useState('');
  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(location.state?.decisionNotice || '');
  const [issued, setIssued] = useState(null);
  const app = data.applications.find((row) => Number(row.application_id) === Number(applicationId));
  const review = data.reviews.find((row) => Number(row.application_id) === Number(applicationId));
  const existing = data.licenses.find((row) => Number(row.application_id) === Number(applicationId));
  const license = issued || existing;

  useEffect(() => {
    if (existing?.expiry_date) setExpiryDate(String(existing.expiry_date).slice(0, 10));
  }, [existing?.expiry_date]);

  async function issue() {
    if (!app || !review || review.status !== 'APPROVED' || app.application_status !== 'approved') {
      setNotice('A Department Officer approved review and an approved application record are required before issuance.');
      return;
    }
    const signingStatement = signature.trim() || data.user?.full_name || '';
    if (!signingStatement) {
      setNotice('Enter the signing officer name/statement before signing.');
      return;
    }
    if (!expiryDate || dateAtEndOfDay(expiryDate) <= new Date().toISOString()) {
      setNotice('Choose a future expiry date.');
      return;
    }

    setBusy(true);
    setNotice('');
    try {
      if (existing) {
        setIssued(existing);
        setNotice(`Backend license confirmed: ${existing.license_number}.`);
        return;
      }

      let signedReview = review;
      if (!review.digital_signature) {
        signedReview = await data.request(`/department-reviews/${review.review_id}/sign`, {
          method: 'POST',
          body: JSON.stringify({ digital_signature: signingStatement }),
        });
        data.setReviews((rows) => rows.map((row) =>
          Number(row.review_id) === Number(signedReview.review_id) ? signedReview : row,
        ));
      }

      await data.request('/licenses', {
        method: 'POST',
        body: JSON.stringify({
          application_id: Number(app.application_id),
          issued_by: Number(data.user.user_id),
          expiry_date: dateAtEndOfDay(expiryDate),
        }),
      });

      const confirmedLicense = await data.request(
        `/licenses/application/${encodeURIComponent(app.application_id)}`,
      );
      if (
        Number(confirmedLicense.application_id) !== Number(app.application_id) ||
        !confirmedLicense.license_number ||
        !confirmedLicense.issued_date ||
        !confirmedLicense.expiry_date
      ) {
        throw new Error('The backend did not return a complete saved license record.');
      }

      setIssued(confirmedLicense);
      setExpiryDate(String(confirmedLicense.expiry_date).slice(0, 10));
      setNotice(`License issuance confirmed by the backend (${confirmedLicense.license_number}).`);
      await data.reload();
    } catch (error) {
      setNotice(`Issuance was not confirmed: ${error.message}. You can retry after checking the saved review/license status.`);
      await data.reload();
    } finally {
      setBusy(false);
    }
  }

  const inspectionComplete = data.inspections.some((inspection) => {
    const assignment = data.assignments.find(
      (row) => Number(row.assignment_id) === Number(inspection.assignment_id),
    );
    return Number(assignment?.application_id) === Number(app?.application_id) &&
      String(inspection.status).toUpperCase() === 'COMPLETED';
  });

  return (
    <DepartmentOfficerPageFrame
      pageClass="do-page-signing"
      active="/department-officer/authorization"
      title="Final Authorization & Signing"
      data={data}
    >
      {notice && <p className="do-notice" role="status">{notice}</p>}
      {app ? <>
        <div className="breadcrumb">
          <Link to="/department-officer/authorization">Applications</Link>
          <span className="bc-sep">›</span>
          <span className="bc-active">{app.application_ref || `#${app.application_id}`}</span>
        </div>
        <div className="title-row">
          <div>
            <h1>Final Authorization &amp; Signing</h1>
            <p>Review the license data and record final authorization.</p>
          </div>
          <span className="awaiting-badge">
            {license ? 'License issued' : review?.digital_signature ? 'Signature recorded' : 'Awaiting signature'}
          </span>
        </div>
        <div className="two-col">
          <section className="panel">
            <div className="panel-hdr"><span className="panel-title">License Document Preview</span></div>
            <div className="doc-preview">
              <div className="watermark">{license ? 'ISSUED LICENSE RECORD' : 'DRAFT PREVIEW'}</div>
              <div className="doc-title">OFFICIAL TRADE LICENSE</div>
              <div className="doc-serial">Application: {app.application_ref || `#${app.application_id}`}</div>
              <hr className="doc-hr" />
              <div className="doc-grid">
                <div><div className="doc-label">LICENSEE NAME</div><div className="doc-val">{app.business_name || '—'}</div></div>
                <div><div className="doc-label">REGISTRATION ID</div><div className="doc-val">{app.application_ref || app.application_id}</div></div>
              </div>
              <div className="doc-section">
                <div className="doc-label">AUTHORIZED ACTIVITIES</div>
                <div className="doc-body">{app.trade_category || app.business_type || 'Trade License'}{app.shop_address ? ` at ${app.shop_address}` : ''}</div>
              </div>
              <div className="doc-grid">
                <div><div className="doc-label">ISSUE DATE</div><div className="doc-val">{displayDate(license?.issued_date)}</div></div>
                <div>
                  <div className="doc-label">EXPIRY DATE</div>
                  <div className="doc-val">{license ? displayDate(license.expiry_date) : displayDate(expiryDate)}</div>
                </div>
              </div>
              <div className="sig-area">
                <div>
                  <div className="sig-line">{license?.license_number || review?.digital_signature || signature || data.user?.full_name || 'Pending signature'}</div>
                  <div className="doc-label">{license ? 'LICENSE NUMBER' : 'SIGNING OFFICER'}</div>
                </div>
              </div>
              {license && <p><strong>License number:</strong> {license.license_number}</p>}
            </div>
          </section>

          <div className="right-col">
            <Link className="go-back-btn" to="/department-officer/authorization">← Back to Applications</Link>
            <section className="card sign-card">
              <h2 className="card-title">Sign</h2>
              {!license && (
                <>
                  <label className="signature-input">
                    Signing officer name / statement
                    <input
                      value={signature}
                      onChange={(event) => setSignature(event.target.value)}
                      placeholder={data.user?.full_name || 'Enter your name'}
                    />
                  </label>
                  <label className="expiry-input">
                    License expiry date
                    <input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={expiryDate}
                      onChange={(event) => setExpiryDate(event.target.value)}
                    />
                  </label>
                </>
              )}
              <button className="sign-btn" disabled={busy || Boolean(license)} onClick={issue}>
                {busy ? 'Saving…' : license ? 'License Issued' : 'Do Sign'}
              </button>
            </section>
            <section className="card verification-card">
              <div className="card-title">Verification Steps</div>
              <p className="vstep done">Field Officer Inspection: {inspectionComplete ? 'Completed' : 'No completed record found'}</p>
              <p className="vstep done">Department Review: {review?.status || 'Not approved'}</p>
              <p className="vstep pending">Final signature: {review?.digital_signature ? 'Recorded' : 'Pending'}</p>
            </section>
          </div>
        </div>
      </> : !data.loading && <section className="card">Application not found in your municipality.</section>}
    </DepartmentOfficerPageFrame>
  );
}
