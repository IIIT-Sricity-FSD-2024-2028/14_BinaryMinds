import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import DepartmentOfficerPageFrame from '../components/DepartmentOfficerPageFrame';
import { useDepartmentOfficerData } from '../components/useDepartmentOfficerData';
import { applicationWorkflowStatus, getApplicationInspection } from '../components/inspectionWorkflow';
import '../styles/DepartmentOfficerReview.css';

const apiBase = 'http://localhost:3000/api';

function errorMessage(payload, fallback) {
  return Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message || fallback;
}

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

export default function DepartmentOfficerReview() {
  const data = useDepartmentOfficerData();
  const { applicationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState('');
  const [fileError, setFileError] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const app = data.applications.find((row) => Number(row.application_id) === Number(applicationId));
  const { inspection } = getApplicationInspection(
    data.assignments,
    data.inspections,
    app?.application_id,
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
    setDocumentsLoading(true);
    setDocumentsError('');
    data.request(`/documents/application/${encodeURIComponent(app.application_id)}`).then((rows) => {
      if (active) {
        setDocuments(Array.isArray(rows) ? rows : []);
        setDocumentsError('');
      }
    }).catch((error) => {
      if (active) setDocumentsError(error.message || 'Unable to load supporting documents.');
    }).finally(() => {
      if (active) setDocumentsLoading(false);
    });
    return () => { active = false; };
  }, [app?.application_id, data.request]);

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
        throw new Error(errorMessage(payload, `The document could not be retrieved (${response.status}).`));
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

  async function decide(status) {
    if (!app) return;
    if (!reason.trim()) {
      setNotice(status === 'REJECTED'
        ? 'Enter a reason before rejecting.'
        : 'Enter a formal justification before recording this decision.');
      return;
    }
    setSaving(true);
    setNotice('');
    try {
      const result = await data.request(
        `/department-reviews/application/${encodeURIComponent(app.application_id)}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({
            status,
            comments: reason.trim(),
          }),
        },
      );
      const expectedStatus = status === 'APPROVED'
        ? 'approved'
        : status === 'REJECTED'
          ? 'rejected'
          : 'department_review';
      if (
        result?.application?.application_status !== expectedStatus ||
        result?.review?.status !== status
      ) {
        throw new Error('The backend did not confirm the requested decision and application status.');
      }
      const decisionNotice = status === 'APPROVED'
        ? 'Application approved. Continue to final authorization and signing.'
        : status === 'REJECTED'
          ? 'Application rejection and justification were saved.'
          : 'Clarification request was saved.';
      if (status === 'APPROVED') {
        navigate(`/department-officer/authorization/${app.application_id}/sign`, {
          replace: true,
          state: { decisionNotice },
        });
      } else if (status === 'REJECTED') {
        navigate('/department-officer/worklist', {
          replace: true,
          state: { decisionNotice },
        });
      } else {
        setNotice(decisionNotice);
        await data.reload();
      }
    } catch (error) {
      setNotice(`Decision not saved: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  const inspectionStatus = String(inspection?.status || 'No inspection record').toUpperCase();
  const review = data.reviews.find((row) => Number(row.application_id) === Number(app?.application_id));
  return (
    <DepartmentOfficerPageFrame pageClass="do-page-review" active="/department-officer/worklist" title="Application Review" data={data}>
      {notice && <p className="do-notice" role="status">{notice}</p>}
      {app ? <>
        <section className="card company-card">
          <div className="badge-pending">{applicationWorkflowStatus(app, review, inspection)}</div>
          <div className="company-row">
            <div><h2>{app.business_name || 'Business name unavailable'}</h2><p className="company-sub">{app.trade_category || app.business_type || 'Trade License'}</p></div>
            <div className="company-actions"><button className="btn-outline" onClick={() => window.print()}>Print</button></div>
          </div>
        </section>
        <div className="two-col">
          <section className="card">
            <div className="section-title">▣ Applicant Details</div>
            <div className="detail-grid">
              {[
                ['APPLICATION ID', app.application_ref || `#${app.application_id}`],
                ['APPLICANT NAME', app.full_name],
                ['CONTACT', app.applicant_phone],
                ['EMAIL', app.email || app.applicant_email],
                ['PRINCIPAL ADDRESS', [app.shop_address, app.city, app.state, app.pincode].filter(Boolean).join(', ')],
                ['TRADE CATEGORY', app.trade_category || app.business_type],
              ].map(([label, value]) => (
                <div key={label}><div className="detail-label">{label}</div><div className="detail-val">{value || '—'}</div></div>
              ))}
            </div>
          </section>
          <section className="card">
            <div className="section-title">▣ Supporting Documents</div>
            {documentsLoading ? <p>Loading supporting documents…</p> : documentsError ? (
              <div className="do-doc-error" role="alert">
                <span>{documentsError}</span>
                <button className="btn-outline" type="button" onClick={() => loadDocuments(app.application_id)}>Retry</button>
              </div>
            ) : documents.length ? (
              <div className="doc-list">
                {documents.map((document) => {
                  const mimeType = documentMimeType(document);
                  const canPreview = ['application/pdf', 'image/jpeg', 'image/png'].includes(mimeType);
                  return (
                    <div className="doc-item" key={document.document_id}>
                      <span>{document.document_type || 'Document'}</span>
                      <span className="do-doc-filename">{documentFilename(document)}</span>
                      <span className="verified">{document.verification_status || 'pending'}</span>
                      <div className="do-doc-actions">
                        {canPreview && <button className="btn-outline" type="button" onClick={() => accessDocument(document, false)}>View</button>}
                        <button className="btn-outline" type="button" onClick={() => accessDocument(document, true)}>Download</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p>No supporting documents are available for this application.</p>}
            {fileError && <p className="do-doc-error" role="alert">{fileError}</p>}
          </section>
        </div>
        <section className="card">
          <div className="section-title">✓ Field Officer Inspection</div>
          <p><strong>Inspection status:</strong> {inspectionStatus}</p>
          <p><strong>Submitted notes:</strong> {inspection?.notes || 'No inspection report notes returned.'}</p>
        </section>
        <section className="card dark-card">
          <h3>Final Review &amp; Decision</h3>
          <p className="dark-sub">Provide the final administrative justification to record this review.</p>
          <label className="justify-label">Reviewer Justification<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Enter formal justification for the decision..." /></label>
          <div className="decision-actions">
            <button className="btn-approve" disabled={saving} onClick={() => decide('APPROVED')}>Approve Application</button>
            <button className="btn-defer" disabled={saving} onClick={() => decide('CLARIFICATION_REQUESTED')}>Defer Decision</button>
            <button className="btn-reject" disabled={saving} onClick={() => decide('REJECTED')}>Reject</button>
          </div>
        </section>
        {data.reviews.some((review) => Number(review.application_id) === Number(app.application_id) && review.status === 'APPROVED') && (
          <Link className="do-action-link" to={`/department-officer/authorization/${app.application_id}/sign`}>Proceed to Final Authorization</Link>
        )}
        <div className="go-back-row"><Link className="btn-goback" to={location.state?.from || '/department-officer/worklist'}>Go Back</Link></div>
      </> : !data.loading && (
        <section className="card"><p>Application not found in the Department Officer municipality.</p><Link to="/department-officer/worklist">Back to Worklist</Link></section>
      )}
    </DepartmentOfficerPageFrame>
  );
}
