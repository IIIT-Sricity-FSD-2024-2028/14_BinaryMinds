import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import { selectCurrentUser } from '../../features/auth/authSelectors.js';
import { createDocument, fetchDocumentsByApplication, selectDocumentsByApplication } from '../../department-officer/store/documentsSlice.js';
import { createApplicantApplication, fetchApplicantApplications, selectApplicantApplicationWorkflow, selectApplicantApplications, setSelectedApplicationId, setUploadError, setUploadFile, setUploadMessage, updateApplicantApplication } from '../store/applicantApplicationsSlice.js';
import '../styles/ApplicantUploadDocuments.css';

const maxFileBytes = 5 * 1024 * 1024;
const documentItems = [
  { inputId: 'file1', type: 'aadhar_card', title: 'Aadhaar Card', description: 'Identity proof of the applicant (Front & Back)' },
  { inputId: 'file2', type: 'business_affidavit', title: 'Business Address Proof', description: 'Property tax receipt, utility bill, or rent agreement' },
  { inputId: 'file3', type: 'passport_photo', title: 'Shop Photograph', description: 'Front view of shop with board name visible' },
];
const errorText = (error) => error?.message || error?.payload?.message || 'The request could not be completed. Please try again.';

export default function ApplicantUploadDocuments() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const workflow = useSelector(selectApplicantApplicationWorkflow);
  const applications = useSelector(selectApplicantApplications);
  const applicationId = useSelector((state) => state.applicantApplications.current?.application_id);
  const documents = useSelector((state) => selectDocumentsByApplication(state, applicationId));
  const isUploading = useSelector((state) => ['create', 'update'].some((key) => state.applicantApplications.requests[key] === 'pending') || state.departmentOfficerDocuments.requests.create === 'pending');

  useEffect(() => {
    if (!user || user.role !== 'applicant') navigate('/login', { replace: true });
    else dispatch(fetchApplicantApplications());
  }, [dispatch, navigate, user]);

  useEffect(() => {
    if (applicationId) dispatch(fetchDocumentsByApplication(applicationId));
  }, [dispatch, applicationId]);

  function handleFileChange(event, item) {
    const file = event.target.files?.[0];
    dispatch(setUploadError({ type: item.type, message: '' }));
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      dispatch(setUploadError({ type: item.type, message: 'Invalid file type. Please upload JPG, PNG, or PDF.' }));
      dispatch(setUploadFile({ type: item.type, file: null })); event.target.value = ''; return;
    }
    if (file.size > maxFileBytes) {
      dispatch(setUploadError({ type: item.type, message: 'File too large. Maximum allowed size is 5 MB.' }));
      dispatch(setUploadFile({ type: item.type, file: null })); event.target.value = ''; return;
    }
    dispatch(setUploadFile({ type: item.type, file }));
  }

  async function ensureApplication(currentApplications) {
    const draft = workflow.applicationForm;
    const existing = currentApplications.find((item) => String(item.business_name || '').trim().toLowerCase() === draft.businessName.trim().toLowerCase() && String(item.municipality_id || '').toLowerCase() === String(draft.municipalityId).toLowerCase());
    if (existing) {
      const details = { father_name: draft.fatherName, mother_name: draft.motherName, shop_area: draft.shopArea };
      const missing = Object.fromEntries(Object.entries(details).filter(([key, value]) => value && !String(existing[key] || '').trim()));
      if (Object.keys(missing).length) { const response = await dispatch(updateApplicantApplication({ id: existing.application_id, body: missing })).unwrap(); return response?.data || response; }
      return existing;
    }
    const response = await dispatch(createApplicantApplication({
      applicantName: draft.fullName || user?.fullName || 'Applicant', aadhaar_number: draft.aadhaar || undefined, gender: draft.gender || undefined,
      father_name: draft.fatherName || undefined, mother_name: draft.motherName || undefined, shop_area: draft.shopArea || undefined,
      businessName: draft.businessName || '', businessType: draft.businessType || 'General', tradeCategory: draft.businessType || 'General',
      shopAddress: draft.shopAddress || '', city: draft.city || draft.district || '', district: draft.district || '', state: draft.state || '', pincode: draft.pincode || '', phone: draft.phone || '',
      municipality_id: draft.municipalityId || undefined, municipalityId: draft.municipalityId || undefined,
    })).unwrap();
    return response?.data || response;
  }

  async function handleSubmit(event) {
    event.preventDefault(); dispatch(setUploadMessage(''));
    try {
      const rows = await dispatch(fetchApplicantApplications()).unwrap();
      const application = await ensureApplication(Array.isArray(rows?.data) ? rows.data : Array.isArray(rows) ? rows : applications);
      if (!application?.application_id) throw new Error('The backend did not return an application ID.');
      const recordsResponse = await dispatch(fetchDocumentsByApplication(application.application_id)).unwrap();
      const records = Array.isArray(recordsResponse?.data) ? recordsResponse.data : Array.isArray(recordsResponse) ? recordsResponse : [];
      const uploaded = Object.fromEntries(records.map((record) => [record.document_type, record]));
      const missing = documentItems.filter((item) => !uploaded[item.type] && !workflow.files[item.type]);
      if (missing.length) { dispatch(setUploadMessage('Please select every document not confirmed by the server, then submit again.')); return; }
      const failures = {};
      for (const item of documentItems) {
        if (uploaded[item.type]) continue;
        try {
          await dispatch(createDocument({ application_id: application.application_id, document_type: item.type, file: workflow.files[item.type] })).unwrap();
        } catch (error) { failures[item.type] = errorText(error); }
      }
      if (Object.keys(failures).length) {
        Object.entries(failures).forEach(([type, message]) => dispatch(setUploadError({ type, message })));
        dispatch(setUploadMessage('Some documents could not be uploaded. Correct the errors and try again.'));
        return;
      }
      const submittedApplicationId = String(application.application_id);
      dispatch(setSelectedApplicationId(submittedApplicationId));
      navigate('/pay-now', { state: { applicationId: submittedApplicationId } });
    } catch (error) { dispatch(setUploadMessage(errorText(error))); }
  }

  return <div className="applicant-upload-documents-page"><ApplicantNavigation /><main className="container"><div className="page-top"><div><h2>Upload Required Documents</h2><p>Step 3 of 4. Please upload the required documents for verification.</p></div><div className="progress-box"><span>75% Completed</span><div className="progress-bg"><div className="progress-fill" /></div></div></div><div className="info-note">Allowed file types: JPG, PNG or PDF. Max file size: 5MB per document.</div><form onSubmit={handleSubmit}>
    {documentItems.map((item) => { const record = documents.find((document) => document.document_type === item.type); const file = workflow.files[item.type]; return <section className="doc-card" key={item.inputId}><div className="doc-header"><strong>{item.title}</strong><span>{item.description}</span></div><div className="upload-area"><button type="button" onClick={() => document.getElementById(item.inputId)?.click()} disabled={isUploading || Boolean(record)}>Upload File</button><span>Drag &amp; drop files here, or <label htmlFor={item.inputId} className="browse">Browse Files</label></span><input type="file" id={item.inputId} accept=".jpg,.png,.pdf" onChange={(event) => handleFileChange(event, item)} disabled={isUploading || Boolean(record)} /></div><div className="file-status">{record ? 'Uploaded successfully.' : file ? `${file.name} is ready to upload.` : ''}</div><div className="error" role={workflow.uploadErrors[item.type] ? 'alert' : undefined}>{workflow.uploadErrors[item.type] || ''}</div></section>; })}
    {workflow.uploadMessage && <p className="upload-page-message" role="alert">{workflow.uploadMessage}</p>}<div className="bottom-actions"><button type="button" className="btn-back" onClick={() => navigate('/apply-license')}>← Back</button><button type="submit" className="btn-preview" disabled={isUploading}>{isUploading ? 'Uploading...' : 'Preview & Review →'}</button></div></form></main></div>;
}
