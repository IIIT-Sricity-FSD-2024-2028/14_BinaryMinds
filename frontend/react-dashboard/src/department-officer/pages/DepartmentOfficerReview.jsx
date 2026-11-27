import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import DepartmentOfficerPageFrame from '../components/DepartmentOfficerPageFrame';
import { useDepartmentOfficerData } from '../components/useDepartmentOfficerData';
import { recordDepartmentDecision } from '../store/departmentReviewsSlice.js';
import {
  clearDocumentPreview,
  downloadDocumentFile,
  fetchDocumentPreview,
  fetchDocumentsByApplication,
  selectDocumentsByApplication,
  selectDocumentsState,
} from '../store/documentsSlice.js';
import { applicationWorkflowStatus, getApplicationInspection } from '../components/inspectionWorkflow';
import {
  selectReviewForm,
  setReviewFileError,
  setReviewNotice,
  setReviewReason,
  setSigningNotice,
  setWorklistNotice,
} from '../state/departmentOfficerUiSlice.js';
import '../styles/DepartmentOfficerReview.css';

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
  const dispatch = useDispatch();
  const { applicationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const form = useSelector((state) => selectReviewForm(state, applicationId));
  const saving = useSelector((state) => state.departmentReviews.requests.recordDecision === 'pending');
  const requestedDocumentApps = useRef(new Set());
  const previewWindows = useRef(new Map());
  const previewRequests = useRef(new Map());
  const previewUrls = useRef(new Map());
  const documentsState = useSelector(selectDocumentsState);
  const app = data.applications.find((row) => Number(row.application_id) === Number(applicationId));
  const applicationKey = app?.application_id == null ? null : String(app.application_id);
  const documents = useSelector((state) => selectDocumentsByApplication(state, app?.application_id));
  const hasDocuments = applicationKey !== null && Object.prototype.hasOwnProperty.call(
    documentsState.byApplicationId,
    applicationKey,
  );
  const documentsStatus = documentsState.requests.fetchByApplication || 'idle';
  const documentsLoading = Boolean(applicationKey && !hasDocuments && documentsStatus !== 'rejected');
  const documentsError = applicationKey && !hasDocuments && documentsStatus === 'rejected'
    ? documentsState.errors.fetchByApplication || 'Unable to load supporting documents.'
    : '';
  const visibleDocumentErrors = documents.flatMap((document) => {
    const errors = documentsState.fileErrorsByDocumentId[String(document.document_id)] || {};
    return [errors.preview, errors.download].filter(Boolean);
  });
  const documentFileError = visibleDocumentErrors[0] || '';
  const { inspection } = getApplicationInspection(
    data.assignments,
    data.inspections,
    app?.application_id,
  );

  useEffect(() => {
    if (!applicationKey || hasDocuments || requestedDocumentApps.current.has(applicationKey)) return;
    requestedDocumentApps.current.add(applicationKey);
    dispatch(fetchDocumentsByApplication(app.application_id));
  }, [app?.application_id, applicationKey, dispatch, hasDocuments]);

  useEffect(() => {
    Object.entries(documentsState.previewsByDocumentId).forEach(([id, preview]) => {
      const pending = previewWindows.current.get(id);
      if (!pending || pending.requestId !== preview.requestId) return;
      previewWindows.current.delete(id);
      if (pending.window.closed) {
        URL.revokeObjectURL(preview.url);
        dispatch(clearDocumentPreview({ documentId: id, requestId: preview.requestId }));
        return;
      }
      const urlKey = `${id}:${preview.requestId}`;
      const releasePreview = () => {
        URL.revokeObjectURL(preview.url);
        previewUrls.current.delete(urlKey);
        dispatch(clearDocumentPreview({ documentId: id, requestId: preview.requestId }));
      };
      previewUrls.current.set(urlKey, releasePreview);
      pending.window.location.href = preview.url;
      pending.window.addEventListener('beforeunload', releasePreview, { once: true });
    });
  }, [dispatch, documentsState.previewsByDocumentId]);

  useEffect(() => () => {
    previewRequests.current.forEach((request) => request.abort());
    previewRequests.current.clear();
    previewWindows.current.forEach(({ window: previewWindow }) => previewWindow.close());
    previewWindows.current.clear();
    previewUrls.current.forEach((releasePreview) => releasePreview());
    previewUrls.current.clear();
  }, []);

  function loadDocuments() {
    dispatch(setReviewFileError({ applicationId, value: '' }));
    if (applicationKey) {
      requestedDocumentApps.current.add(applicationKey);
      dispatch(fetchDocumentsByApplication(app.application_id));
    }
  }

  function accessDocument(document, download) {
    dispatch(setReviewFileError({ applicationId, value: '' }));
    const id = String(document.document_id);
    const filename = documentFilename(document);
    if (download) {
      dispatch(downloadDocumentFile({ id, filename }));
      return;
    }

    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      dispatch(setReviewFileError({ applicationId, value: 'Allow pop-ups to view this document.' }));
      return;
    }
    if (previewWindow) previewWindow.opener = null;
    previewRequests.current.get(id)?.abort();
    previewWindows.current.get(id)?.window.close();
    const request = dispatch(fetchDocumentPreview({ id, filename }));
    previewWindows.current.set(id, { window: previewWindow, requestId: request.requestId });
    previewRequests.current.set(id, request);
    request.then((action) => {
      if (fetchDocumentPreview.rejected.match(action)) {
        const pending = previewWindows.current.get(id);
        if (pending?.requestId === request.requestId) {
          pending.window.close();
          previewWindows.current.delete(id);
        }
      }
      if (previewRequests.current.get(id) === request) previewRequests.current.delete(id);
    });
  }

  async function decide(status) {
    if (!app) return;
    if (!form.reason.trim()) {
      dispatch(setReviewNotice({ applicationId, value: status === 'REJECTED'
        ? 'Enter a reason before rejecting.'
        : 'Enter a formal justification before recording this decision.' }));
      return;
    }
    dispatch(setReviewNotice({ applicationId, value: '' }));
    try {
      const result = await dispatch(recordDepartmentDecision({
        applicationId: app.application_id,
        status,
        comments: form.reason.trim(),
      })).unwrap();
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
        dispatch(setReviewReason({ applicationId, value: '' }));
        dispatch(setSigningNotice({ applicationId: app.application_id, value: decisionNotice }));
        navigate(`/department-officer/authorization/${app.application_id}/sign`, {
          replace: true,
        });
      } else if (status === 'REJECTED') {
        dispatch(setReviewReason({ applicationId, value: '' }));
        dispatch(setWorklistNotice(decisionNotice));
        navigate('/department-officer/worklist', {
          replace: true,
        });
      } else {
        dispatch(setReviewNotice({ applicationId, value: decisionNotice }));
      }
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : errorMessage(error?.data, error?.error || 'The decision request failed.');
      dispatch(setReviewNotice({ applicationId, value: `Decision not saved: ${message}` }));
    }
  }

  const inspectionStatus = String(inspection?.status || 'No inspection record').toUpperCase();
  const review = data.reviews.find((row) => Number(row.application_id) === Number(app?.application_id));
  return (
    <DepartmentOfficerPageFrame pageClass="do-page-review" active="/department-officer/worklist" title="Application Review">
      {form.notice && <p className="do-notice" role="status">{form.notice}</p>}
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
                <button className="btn-outline" type="button" onClick={loadDocuments}>Retry</button>
              </div>
            ) : documents.length ? (
              <div className="doc-list">
                {documents.map((document) => {
                  const mimeType = documentMimeType(document);
                  const canPreview = ['application/pdf', 'image/jpeg', 'image/png'].includes(mimeType);
                  const fileRequests = documentsState.fileRequestsByDocumentId[String(document.document_id)] || {};
                  return (
                    <div className="doc-item" key={document.document_id}>
                      <span>{document.document_type || 'Document'}</span>
                      <span className="do-doc-filename">{documentFilename(document)}</span>
                      <span className="verified">{document.verification_status || 'pending'}</span>
                      <div className="do-doc-actions">
                        {canPreview && <button className="btn-outline" type="button" disabled={fileRequests.preview === 'pending'} onClick={() => accessDocument(document, false)}>{fileRequests.preview === 'pending' ? 'Opening…' : 'View'}</button>}
                        <button className="btn-outline" type="button" disabled={fileRequests.download === 'pending'} onClick={() => accessDocument(document, true)}>{fileRequests.download === 'pending' ? 'Downloading…' : 'Download'}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p>No supporting documents are available for this application.</p>}
          {(form.fileError || documentFileError) && <p className="do-doc-error" role="alert">{form.fileError || documentFileError}</p>}
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
          <label className="justify-label">Reviewer Justification<textarea value={form.reason} onChange={(event) => dispatch(setReviewReason({ applicationId, value: event.target.value }))} placeholder="Enter formal justification for the decision..." /></label>
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
