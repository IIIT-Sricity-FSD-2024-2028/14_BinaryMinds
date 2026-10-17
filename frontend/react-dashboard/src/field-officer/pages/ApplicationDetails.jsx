import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FieldOfficerPageShell from '../components/FieldOfficerPageShell';
import { useFieldOfficerData } from '../components/useFieldOfficerData';
import '../styles/ApplicationDetails.css';

const apiBase = 'http://localhost:3000/api';
const supportedPreviewTypes = ['application/pdf', 'image/jpeg', 'image/png'];

function responseMessage(payload, fallback) {
  if (Array.isArray(payload?.message)) return payload.message.join(' ');
  return payload?.message || fallback;
}

function getFilename(document) {
  const savedName = document.original_filename || document.file_name;
  if (savedName) return savedName;
  return String(document.file_path || '').split(/[\\/]/).pop() || 'Uploaded document';
}

function getMimeType(document) {
  if (document.mime_type) return document.mime_type;
  const filename = getFilename(document).toLowerCase();
  if (filename.endsWith('.pdf')) return 'application/pdf';
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  return '';
}

function displayValue(value) {
  return value === undefined || value === null || String(value).trim() === ''
    ? 'Not provided'
    : value;
}

export default function ApplicationDetails() {
  const d = useFieldOfficerData();
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState('');
  const [fileError, setFileError] = useState('');
  const [detailedApplication, setDetailedApplication] = useState(null);
  const id = d.recordId || sessionStorage.getItem('selectedApp');
  const listApplication = d.applications.find((item) => String(item.application_id) === String(id));
  const app = detailedApplication
    ? { ...(listApplication || {}), ...detailedApplication }
    : listApplication || null;

  useEffect(() => {
    let active = true;
    if (!id) {
      setDetailedApplication(null);
      return undefined;
    }
    setDetailedApplication(null);
    d.request(`/applications/${encodeURIComponent(id)}`)
      .then((record) => {
        if (active && record && typeof record === 'object') setDetailedApplication(record);
      })
      .catch((error) => {
        if (active) d.setError(error.message || 'Unable to load application details.');
      });
    return () => { active = false; };
  }, [id, d.token]);

  useEffect(() => {
    let active = true;
    setDocuments([]);
    setDocumentsError('');
    setFileError('');
    if (!id) return undefined;

    setDocumentsLoading(true);
    d.request(`/documents/application/${encodeURIComponent(id)}`)
      .then((rows) => {
        if (active) setDocuments(Array.isArray(rows) ? rows : []);
      })
      .catch((error) => {
        if (active) setDocumentsError(error.message || 'Unable to load uploaded documents.');
      })
      .finally(() => {
        if (active) setDocumentsLoading(false);
      });
    return () => { active = false; };
  }, [id, d.token]);

  async function retryDocuments() {
    setDocumentsLoading(true);
    setDocumentsError('');
    try {
      const rows = await d.request(`/documents/application/${encodeURIComponent(id)}`);
      setDocuments(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setDocumentsError(error.message || 'Unable to load uploaded documents.');
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function accessDocument(document, download) {
    setFileError('');
    const previewWindow = download ? null : window.open('', '_blank');
    if (!download && !previewWindow) {
      setFileError('Allow pop-ups to view this document.');
      return;
    }
    if (previewWindow) previewWindow.opener = null;

    try {
      const endpoint = download ? 'download' : 'file';
      const response = await fetch(
        `${apiBase}/documents/${encodeURIComponent(document.document_id)}/${endpoint}`,
        { headers: { Authorization: `Bearer ${d.token}` } },
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(responseMessage(payload, `The document could not be retrieved (${response.status}).`));
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const filename = getFilename(document);
      if (download) {
        const link = window.document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      } else {
        previewWindow.location.href = objectUrl;
        previewWindow.addEventListener('beforeunload', () => URL.revokeObjectURL(objectUrl), { once: true });
      }
    } catch (error) {
      previewWindow?.close();
      setFileError(error.message || 'The document could not be retrieved. Please try again.');
    }
  }

  async function decide(status) {
    if (status === 'verified' && app?.application_status === 'verified') {
      d.setMessage(`Application ${app.application_ref || `#${app.application_id}`} is already verified. No duplicate request was sent.`);
      return;
    }
    if (!app || !window.confirm(`Are you sure you want to ${status === 'verified' ? 'approve and verify' : 'reject'} application ${app.application_ref || `#${app.application_id}`}?`)) return;
    setSaving(true);
    d.setError('');
    try {
      await d.request(
        status === 'verified' ? `/applications/${app.application_id}/verify` : `/applications/${app.application_id}`,
        status === 'verified'
          ? { method: 'PATCH' }
          : { method: 'PATCH', body: JSON.stringify({ application_status: status }) },
      );
      d.setApplications((rows) => rows.map((row) => row.application_id === app.application_id
        ? { ...row, application_status: status }
        : row));
      setDetailedApplication((record) => record ? { ...record, application_status: status } : record);
      d.setMessage(`Application ${app.application_ref || `#${app.application_id}`} updated to ${status}.`);
    } catch (error) {
      if (status === 'verified' && /not in 'assigned' status \(current: verified\)/i.test(error.message)) {
        d.setApplications((rows) => rows.map((row) => row.application_id === app.application_id
          ? { ...row, application_status: 'verified' }
          : row));
        setDetailedApplication((record) => record ? { ...record, application_status: 'verified' } : record);
        d.setMessage(`Application ${app.application_ref || `#${app.application_id}`} is already verified. No duplicate change was made.`);
      } else {
        d.setError(error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  const fields = app ? [
    ['Application ID', app.application_ref || app.application_id],
    ['Business Name', app.business_name],
    ['Applicant Name', app.full_name],
    ['Municipality', app.municipalityName || app.municipality_id],
    ['Contact Number', app.applicant_phone],
    ['Email Address', app.email || app.applicant_email],
    ['Aadhaar Number', app.aadhaar_number ? `XXXX-XXXX-${String(app.aadhaar_number).slice(-4)}` : null],
    ['Gender', app.gender],
    ["Father's Name", app.father_name || app.fatherName],
    ["Mother's Name", app.mother_name || app.motherName],
    ['Trade Category', app.trade_category || app.business_type],
    ['Shop Area (sq.ft)', app.shop_area ?? app.shopArea],
    ['Full Shop Address', app.shop_address],
    ['City', app.city],
    ['District', app.district],
    ['State', app.state],
    ['Pincode', app.pincode],
  ] : [];
  const readonly = new URLSearchParams(window.location.search).get('readonly') === 'true';

  return (
    <FieldOfficerPageShell activeSection="detail" title="Application Details" {...d}>
      {app ? (
        <>
          <section className="fo-react-card">
            <h2>▣ Business Information</h2>
            <div className="fo-react-details-grid">
              {fields.map(([label, value]) => (
                <div className="fo-react-detail-field" key={label}>
                  <strong>{label}</strong><span>{displayValue(value)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="fo-react-card" id="fo-documents">
            <h2>▣ Uploaded Documents</h2>
            {documentsLoading ? <p className="fo-react-muted">Loading uploaded documents…</p> : documentsError ? (
              <div className="fo-react-message error" role="alert">
                <span>{documentsError}</span>
                <button className="fo-react-button secondary" type="button" onClick={retryDocuments}>Retry</button>
              </div>
            ) : documents.length ? (
              <div className="fo-react-table-wrap">
                <table className="fo-react-table">
                  <thead><tr><th>Document Type</th><th>Filename</th><th>Verification Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {documents.map((document) => {
                      const mimeType = getMimeType(document);
                      const canPreview = supportedPreviewTypes.includes(mimeType);
                      return (
                        <tr key={document.document_id}>
                          <td>{displayValue(document.document_type)}</td>
                          <td>{getFilename(document)}</td>
                          <td>{displayValue(document.verification_status)}</td>
                          <td>
                            <div className="fo-react-actions">
                              {canPreview && <button className="fo-react-button secondary" type="button" onClick={() => accessDocument(document, false)}>View</button>}
                              <button className="fo-react-button secondary" type="button" onClick={() => accessDocument(document, true)}>Download</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="fo-react-muted">No document records are linked to this application. Older uploaded files without saved records cannot be matched automatically.</p>}
            {fileError && <p className="fo-react-message error" role="alert">{fileError}</p>}
          </section>

          {app.application_status === 'verified' && <p className="fo-react-message">This application is already verified. No duplicate verification request is needed.</p>}
          <section className="fo-react-card">
            <h2>Application Decision</h2>
            <p>Current status: <span className="fo-react-status">{displayValue(app.application_status)}</span></p>
            {!readonly && (
              <div className="fo-react-actions">
                <button className="fo-react-button" disabled={saving || app.application_status !== 'assigned'} onClick={() => decide('verified')}>Approve Application ✓</button>
                <button className="fo-react-button danger" disabled={saving || !['assigned', 'submitted'].includes(app.application_status)} onClick={() => decide('rejected')}>Reject Application ✕</button>
              </div>
            )}
            <div className="fo-react-actions">
              <Link className="fo-react-link-button secondary" to={`/officer/${d.officerId}/verification`}>Back to Verification</Link>
              {app.application_status === 'verified' && <Link className="fo-react-link-button" to={`/officer/${d.officerId}/scheduleinspection`} onClick={() => sessionStorage.setItem('selectedApp', String(app.application_id))}>Schedule Inspection</Link>}
            </div>
          </section>
        </>
      ) : (
        <section className="fo-react-card">
          <p>Application not found in the current Field Officer application list.</p>
          <Link className="fo-react-link-button" to={`/officer/${d.officerId}/verification`}>Back to Verification</Link>
        </section>
      )}
    </FieldOfficerPageShell>
  );
}
