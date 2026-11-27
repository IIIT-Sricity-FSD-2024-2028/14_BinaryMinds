import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DepartmentOfficerPageFrame from '../components/DepartmentOfficerPageFrame';
import { useDepartmentOfficerData } from '../components/useDepartmentOfficerData';
import {
  clearDocumentPreview,
  downloadDocumentFile,
  fetchDocumentPreview,
  fetchDocumentsByApplication,
  selectDocumentsByApplication,
  selectDocumentsState,
} from '../store/documentsSlice.js';
import {
  clearInspectionEvidence,
  fetchInspectionEvidenceByApplication,
  selectInspectionEvidenceByApplication,
  selectInspectionEvidenceError,
  selectInspectionEvidenceRequest,
} from '../store/inspectionsSlice.js';
import {
  fetchDepartmentOfficerUserById,
  selectDepartmentOfficerUserById,
  selectDepartmentOfficerUsersState,
} from '../store/usersSlice.js';
import { applicationWorkflowStatus, getApplicationInspection } from '../components/inspectionWorkflow';
import { selectInspectionReportFileError, setInspectionReportFileError } from '../state/departmentOfficerUiSlice.js';
import '../styles/DepartmentOfficerInspectionReport.css';

const EMPTY_INSPECTION_EVIDENCE = Object.freeze([]);

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

export default function DepartmentOfficerInspectionReport() {
  const data = useDepartmentOfficerData();
  const dispatch = useDispatch();
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const fileError = useSelector((state) => selectInspectionReportFileError(state, applicationId));
  const requestedDocumentApps = useRef(new Set());
  const requestedFieldOfficers = useRef(new Set());
  const evidenceTask = useRef(null);
  const previewWindows = useRef(new Map());
  const previewRequests = useRef(new Map());
  const previewUrls = useRef(new Map());
  const documentsState = useSelector(selectDocumentsState);
  const usersState = useSelector(selectDepartmentOfficerUsersState);
  const app = data.applications.find((row) => Number(row.application_id) === Number(applicationId));
  const { assignment, inspection } = getApplicationInspection(
    data.assignments,
    data.inspections,
    applicationId,
  );
  const reports = useMemo(() => {
    const assignmentIds = new Set(data.assignments
      .filter((row) => Number(row.application_id) === Number(applicationId))
      .map((row) => Number(row.assignment_id)));
    return data.inspections
      .filter((row) => assignmentIds.has(Number(row.assignment_id)) && row.evidence_files?.length)
      .sort((left, right) => new Date(right.completed_date || right.scheduled_date || 0) - new Date(left.completed_date || left.scheduled_date || 0));
  }, [applicationId, data.assignments, data.inspections]);
  const evidenceKey = `${applicationId}:${reports.map((report) =>
    `${report.inspection_id}/${report.evidence_files.map((file) => file.filename).join(',')}`,
  ).join('|')}`;
  const evidenceRecord = useSelector((state) => selectInspectionEvidenceByApplication(state, applicationId));
  const evidenceRequest = useSelector((state) => selectInspectionEvidenceRequest(state, applicationId));
  const evidenceRequestKey = useSelector((state) => state.inspections.evidenceRequestKeysByApplicationId[String(applicationId)] || '');
  const evidenceRequestError = useSelector((state) => selectInspectionEvidenceError(state, applicationId));
  const evidenceIsCurrent = evidenceRecord?.key === evidenceKey;
  const inspectionEvidence = evidenceIsCurrent ? evidenceRecord.items : EMPTY_INSPECTION_EVIDENCE;
  const evidenceLoading = reports.length > 0 && !evidenceIsCurrent &&
    (!evidenceRequestKey || evidenceRequestKey !== evidenceKey || evidenceRequest === 'pending');
  const evidenceError = evidenceRequestKey === evidenceKey && evidenceRequest === 'rejected' ? evidenceRequestError : '';
  const applicationKey = app?.application_id == null ? null : String(app.application_id);
  const fieldOfficerKey = assignment?.field_officer_id == null
    ? null
    : String(assignment.field_officer_id);
  const documents = useSelector((state) => selectDocumentsByApplication(state, app?.application_id));
  const hasDocuments = applicationKey !== null &&
    Object.prototype.hasOwnProperty.call(documentsState.byApplicationId, applicationKey);
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
  const documentFileRequests = documentsState.fileRequestsByDocumentId;
  const fo = useSelector((state) => selectDepartmentOfficerUserById(state, assignment?.field_officer_id));
  const detailError = fieldOfficerKey && !fo && usersState.requests.fetchById === 'rejected'
    ? `Field Officer profile unavailable: ${usersState.errors.fetchById || 'Unable to load Field Officer profile.'}`
    : '';

  useEffect(() => {
    if (!applicationKey || hasDocuments || requestedDocumentApps.current.has(applicationKey)) return;
    requestedDocumentApps.current.add(applicationKey);
    dispatch(fetchDocumentsByApplication(app.application_id));
  }, [app?.application_id, applicationKey, dispatch, hasDocuments]);

  useEffect(() => {
    if (!fieldOfficerKey || fo || requestedFieldOfficers.current.has(fieldOfficerKey)) return;
    requestedFieldOfficers.current.add(fieldOfficerKey);
    dispatch(fetchDepartmentOfficerUserById(assignment.field_officer_id));
  }, [assignment?.field_officer_id, dispatch, fieldOfficerKey, fo]);

  useEffect(() => {
    if (!reports.length) return undefined;
    const request = dispatch(fetchInspectionEvidenceByApplication({
      applicationId,
      evidenceKey,
      reports,
    }));
    evidenceTask.current = request;
    return () => {
      request.abort();
      if (evidenceTask.current === request) evidenceTask.current = null;
    };
  }, [applicationId, dispatch, evidenceKey, reports]);

  useEffect(() => {
    const urls = evidenceIsCurrent ? inspectionEvidence.map((item) => item.url).filter(Boolean) : [];
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [evidenceIsCurrent, evidenceKey, evidenceRecord, inspectionEvidence]);

  useEffect(() => () => {
    evidenceTask.current?.abort();
    dispatch(clearInspectionEvidence({ applicationId: String(applicationId) }));
  }, [applicationId, dispatch]);

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
    dispatch(setInspectionReportFileError({ applicationId, value: '' }));
    if (applicationKey) {
      requestedDocumentApps.current.add(applicationKey);
      dispatch(fetchDocumentsByApplication(app.application_id));
    }
  }

  function accessDocument(document, download) {
    dispatch(setInspectionReportFileError({ applicationId, value: '' }));
    const id = String(document.document_id);
    const filename = documentFilename(document);
    if (download) {
      dispatch(downloadDocumentFile({ id, filename }));
      return;
    }

    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      dispatch(setInspectionReportFileError({ applicationId, value: 'Allow pop-ups to view this document.' }));
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

  function toReview() {
    navigate(`/department-officer/review/${app.application_id}`, {
      state: { from: `/department-officer/inspection-report/${app.application_id}` },
    });
  }

  return (
    <DepartmentOfficerPageFrame pageClass="do-page-inspection-report" active="/department-officer/worklist" title="Inspection Report">
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
          <h3>Field Officer Inspection Evidence</h3>
          {evidenceLoading ? <p>Loading field inspection evidence…</p> : evidenceError ? <p className="do-document-error" role="alert">{evidenceError}</p> : inspectionEvidence.length ? (
            <div className="docs-list">
              {inspectionEvidence.map((item, index) => (
                <div className="doc-item" key={`${item.inspectionId}-${item.file.filename}`} style={{ alignItems: 'center' }}>
                  <div style={{ display: 'grid', gap: 6, flex: '1 1 200px' }}>
                    <strong>Inspection #{item.inspectionId}</strong>
                    <span>{item.inspectionDate ? new Date(item.inspectionDate).toLocaleString('en-IN') : 'Date unavailable'}</span>
                    <span>{item.file.original_filename || `Evidence photo ${index + 1}`}</span>
                  </div>
                  {item.error ? <span className="do-document-error">Evidence unavailable</span> : item.file.mime_type?.startsWith('image/') ? (
                    <a href={item.url} target="_blank" rel="noreferrer" aria-label={`Open evidence for inspection ${item.inspectionId}`}>
                      <img src={item.url} alt={`Inspection ${item.inspectionId} evidence: ${item.file.original_filename || 'photo'}`} style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 6 }} />
                    </a>
                  ) : <a href={item.url} target="_blank" rel="noreferrer">Open file</a>}
                </div>
              ))}
            </div>
          ) : <p>No field inspection evidence uploaded.</p>}
        </section>
        <section className="card docs-card">
          <h3>Supporting Documents</h3>
          {documentsLoading ? <p>Loading supporting documents…</p> : documentsError ? (
            <div className="do-document-error" role="alert">
              <span>{documentsError}</span>
              <button className="btn-secondary" type="button" onClick={loadDocuments}>Retry</button>
            </div>
          ) : documents.length ? (
            <div className="docs-list">
              {documents.map((document) => {
                const mimeType = documentMimeType(document);
                const canPreview = ['application/pdf', 'image/jpeg', 'image/png'].includes(mimeType);
                  const fileRequests = documentFileRequests[String(document.document_id)] || {};
                return (
                  <div className="doc-item" key={document.document_id}>
                    <span>{document.document_type || 'Document'}</span>
                    <span className="do-document-filename">{documentFilename(document)}</span>
                    <span className={`do-document-status ${document.verification_status || 'pending'}`}>
                      {document.verification_status || 'pending'}
                    </span>
                    <div className="do-document-actions">
                      {canPreview && <button className="btn-secondary" type="button" disabled={fileRequests.preview === 'pending'} onClick={() => accessDocument(document, false)}>{fileRequests.preview === 'pending' ? 'Opening…' : 'View'}</button>}
                      <button className="btn-secondary" type="button" disabled={fileRequests.download === 'pending'} onClick={() => accessDocument(document, true)}>{fileRequests.download === 'pending' ? 'Downloading…' : 'Download'}</button>
                    </div>
                    {document.verification_status === 'rejected' && document.rejection_reason && (
                      <p className="do-document-rejection-reason">Rejection reason: {document.rejection_reason}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : <p>No supporting documents are available for this application.</p>}
          {(fileError || documentFileError) && <p className="do-document-error" role="alert">{fileError || documentFileError}</p>}
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
