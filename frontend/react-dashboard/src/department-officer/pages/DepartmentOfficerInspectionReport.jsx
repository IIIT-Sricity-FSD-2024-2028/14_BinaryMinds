import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DepartmentOfficerPageFrame from '../components/DepartmentOfficerPageFrame';
import { useDepartmentOfficerData } from '../components/useDepartmentOfficerData';
import { applicationWorkflowStatus, getApplicationInspection } from '../components/inspectionWorkflow';
import '../styles/DepartmentOfficerInspectionReport.css';

const apiBase = 'http://localhost:3000/api';

function documentFilename(document) {
  const filename = document.original_filename || document.file_name || document.file_path?.split(/[\\/]/).pop();
  return filename || `Document ${document.document_id}`;
}

function documentMimeType(document) {
  if (document.mime_type) return document.mime_type;
  const filename = documentFilename(document).toLowerCase();
  if (filename.endsWith('.pdf')) return 'application/pdf';
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  return '';
}

function responseMessage(payload, fallback) {
  return Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message || fallback;
}

export default function DepartmentOfficerInspectionReport() {
  const data = useDepartmentOfficerData();
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState('');
  const [fileError, setFileError] = useState('');
  const [fo, setFo] = useState(null);
  const [detailError, setDetailError] = useState('');
  const app = data.applications.find((row) => Number(row.application_id) === Number(applicationId));
  const { assignment, inspection } = getApplicationInspection(
    data.assignments,
    data.inspections,
    applicationId,
  );

  async function loadDocuments(id) {
    setDocumentsLoading(true);
    setDocumentsError('');
    setFileError('');
    try {
      const rows = await data.request(`/documents/application/${encodeURIComponent(id)}`);
      setDocuments(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setDocumentsError(error.message || 'Unable to load supporting documents.');
    } finally {
      setDocumentsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    if (!app) return undefined;
    setDocuments([]);
    setDocumentsLoading(true);
    setDocumentsError('');
    setFileError('');
    setDetailError('');

    const requests = [data.request(`/documents/application/${encodeURIComponent(app.application_id)}`)];
    if (assignment?.field_officer_id) requests.push(data.request(`/users/${assignment.field_officer_id}`));
    Promise.allSettled(requests).then((results) => {
      if (!active) return;
      if (results[0].status === 'fulfilled') {
        setDocuments(Array.isArray(results[0].value) ? results[0].value : []);
      } else {
        setDocumentsError(results[0].reason?.message || 'Unable to load supporting documents.');
      }
      setDocumentsLoading(false);
      if (results[1]?.status === 'fulfilled') setFo(results[1].value);
      else if (results[1]?.status === 'rejected') {
        setDetailError(`Field Officer profile unavailable: ${results[1].reason.message}`);
      }
    });
    return () => { active = false; };
  }, [app?.application_id, assignment?.field_officer_id, data.request]);

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
        { headers: { Authorization: `Bearer ${data.token}` } },
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(responseMessage(payload, `The document could not be retrieved (${response.status}).`));
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      if (download) {
        const link = window.document.createElement('a');
        link.href = objectUrl;
        link.download = documentFilename(document);
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

  function toReview() {
    sessionStorage.setItem('selectedAppDO', String(app.application_id));
    navigate(`/department-officer/review/${app.application_id}`, {
      state: { from: `/department-officer/inspection-report/${app.application_id}` },
    });
  }

  return (
    <DepartmentOfficerPageFrame pageClass="do-page-inspection-report" active="/department-officer/worklist" title="Inspection Report" data={data}>
      {detailError && <p className="do-error">{detailError}</p>}
      {app ? <div className="report-container">
        <section className="card info-card">
          <h3>Application Information</h3>
          <div className="info-grid">
            {[
              ['Application ID', app.application_ref || `#${app.application_id}`],
              ['Business Name', app.business_name],
              ['Owner Name', app.full_name],
              ['Category', app.trade_category || app.business_type],
              ['Address', [app.shop_address, app.city, app.district, app.state, app.pincode].filter(Boolean).join(', ')],
              ['Submission Date', app.submitted_at && new Date(app.submitted_at).toLocaleDateString('en-IN')],
            ].map(([label, value]) => (
              <div className="info-item" key={label}><label>{label}</label><span>{value || '—'}</span></div>
            ))}
          </div>
        </section>
        <section className="card officer-card">
          <h3>Field Officer Details</h3>
          <div className="info-grid">
            {[
              ['Officer Name', fo?.full_name],
              ['Employee ID', fo?.employee_id],
              ['Inspection Date', inspection?.completed_date || inspection?.scheduled_date],
              ['Inspection Status', inspection?.status],
            ].map(([label, value]) => (
              <div className="info-item" key={label}>
                <label>{label}</label>
                <span>{value ? (label.includes('Date') ? new Date(value).toLocaleString('en-IN') : value) : '—'}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card status-card">
          <h3>Application Status</h3>
          <div className="status-display">
            <span className="status-badge">{applicationWorkflowStatus(
              app,
              data.reviews.find((row) => Number(row.application_id) === Number(app.application_id)),
              inspection,
            )}</span>
          </div>
        </section>
        <section className="card status-card">
          <h3>Inspection Status</h3>
          <div className="status-display"><span className="status-badge">{inspection?.status || 'Not scheduled'}</span></div>
          <div className="result-section">
            <h4>Inspection Result</h4>
            <p>{String(inspection?.status).toUpperCase() === 'COMPLETED' ? 'Completed' : String(inspection?.status).toUpperCase() === 'FAILED' ? 'Failed' : 'No completed inspection result recorded.'}</p>
          </div>
        </section>
        <section className="card notes-card">
          <h3>Field Officer Report Notes</h3>
          <div className="notes-content">{inspection?.notes || 'No inspection report available yet.'}</div>
        </section>
        <section className="card docs-card">
          <h3>Supporting Documents</h3>
          {documentsLoading ? <p>Loading supporting documents…</p> : documentsError ? (
            <div className="do-document-error" role="alert">
              <span>{documentsError}</span>
              <button className="btn-secondary" type="button" onClick={() => loadDocuments(app.application_id)}>Retry</button>
            </div>
          ) : documents.length ? (
            <div className="docs-list">
              {documents.map((document) => {
                const mimeType = documentMimeType(document);
                const canPreview = ['application/pdf', 'image/jpeg', 'image/png'].includes(mimeType);
                return (
                  <div className="doc-item" key={document.document_id}>
                    <span>{document.document_type || 'Document'}</span>
                    <span className="do-document-filename">{documentFilename(document)}</span>
                    <span className={`do-document-status ${document.verification_status || 'pending'}`}>
                      {document.verification_status || 'pending'}
                    </span>
                    <div className="do-document-actions">
                      {canPreview && <button className="btn-secondary" type="button" onClick={() => accessDocument(document, false)}>View</button>}
                      <button className="btn-secondary" type="button" onClick={() => accessDocument(document, true)}>Download</button>
                    </div>
                    {document.verification_status === 'rejected' && document.rejection_reason && (
                      <p className="do-document-rejection-reason">Rejection reason: {document.rejection_reason}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : <p>No supporting documents are available for this application.</p>}
          {fileError && <p className="do-document-error" role="alert">{fileError}</p>}
        </section>
        <div className="actions-bar">
          <button className="btn-primary" disabled={inspection?.status !== 'COMPLETED'} onClick={toReview}>
            {inspection?.status === 'COMPLETED' ? 'Proceed to Final Review' : 'Inspection Not Completed'}
          </button>
          <Link className="btn-secondary" to="/department-officer/worklist">Back to Worklist</Link>
        </div>
      </div> : !data.loading && <section className="card">Application not found in your municipality.</section>}
    </DepartmentOfficerPageFrame>
  );
}
