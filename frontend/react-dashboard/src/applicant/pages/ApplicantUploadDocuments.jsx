import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import '../styles/ApplicantUploadDocuments.css';

const apiBase = 'http://localhost:3000/api';
const maxFileBytes = 5 * 1024 * 1024;
const documentItems = [
  { inputId: 'file1', statusId: 'status1', errorId: 'err1', type: 'aadhar_card', title: 'Aadhaar Card', description: 'Identity proof of the applicant (Front & Back)' },
  { inputId: 'file2', statusId: 'status2', errorId: 'err2', type: 'business_affidavit', title: 'Business Address Proof', description: 'Property tax receipt, utility bill, or rent agreement' },
  { inputId: 'file3', statusId: 'status3', errorId: 'err3', type: 'passport_photo', title: 'Shop Photograph', description: 'Front view of shop with board name visible' },
];

function readObject(storage, key) {
  try {
    const value = JSON.parse(storage.getItem(key) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch { return {}; }
}

function messageFrom(payload, fallback) {
  if (Array.isArray(payload?.message)) return payload.message.join(', ');
  if (typeof payload?.message === 'string') return payload.message;
  return fallback;
}

function clearUploadState() {
  ['backendApplicationId', 'applicationRef', 'uploadedDocs', 'documentsUploaded', 'documentsUploadedCount', 'currentApplication'].forEach((key) => sessionStorage.removeItem(key));
}

export default function ApplicantUploadDocuments() {
  const navigate = useNavigate();
  const [files, setFiles] = useState({});
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [pageMessage, setPageMessage] = useState('');

  useEffect(() => {
    const user = readObject(sessionStorage, 'loggedInUser');
    if (!sessionStorage.getItem('accessToken') || user.role !== 'applicant') {
      navigate('/login', { replace: true });
      return;
    }
    const draft = readObject(sessionStorage, 'applicationForm');
    const owner = String(draft.ownerEmail || draft.email || '').trim().toLowerCase();
    const email = String(user.email || '').trim().toLowerCase();
    if (!sessionStorage.getItem('applicationForm') || !owner || !email || owner !== email) {
      clearUploadState();
      navigate('/apply-license', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;
    const user = readObject(sessionStorage, 'loggedInUser');
    const token = sessionStorage.getItem('accessToken');
    const applicationId = Number(sessionStorage.getItem('backendApplicationId'));
    if (!token || user.role !== 'applicant' || !applicationId) {
      setUploadedDocs({});
      sessionStorage.setItem('uploadedDocs', '{}');
      return () => { active = false; };
    }

    loadPersistedDocuments(applicationId, token)
      .then((confirmed) => {
        if (!active) return;
        setUploadedDocs(confirmed);
        sessionStorage.setItem('uploadedDocs', JSON.stringify(confirmed));
      })
      .catch((error) => {
        if (!active) return;
        setUploadedDocs({});
        sessionStorage.setItem('uploadedDocs', '{}');
        setPageMessage(error.message || 'Could not verify previously uploaded documents.');
      });
    return () => { active = false; };
  }, []);

  function handleFileChange(event, item) {
    const file = event.target.files?.[0];
    setErrors((current) => ({ ...current, [item.errorId]: '' }));
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      setErrors((current) => ({ ...current, [item.errorId]: 'Invalid file type. Please upload JPG, PNG, or PDF.' }));
      setFiles((current) => ({ ...current, [item.statusId]: null }));
      event.target.value = '';
      return;
    }
    if (file.size > maxFileBytes) {
      setErrors((current) => ({ ...current, [item.errorId]: 'File too large. Maximum allowed size is 5 MB.' }));
      setFiles((current) => ({ ...current, [item.statusId]: null }));
      event.target.value = '';
      return;
    }
    setFiles((current) => ({ ...current, [item.statusId]: file }));
  }

  function saveUploadedDocuments(nextDocuments) {
    setUploadedDocs(nextDocuments);
    sessionStorage.setItem('uploadedDocs', JSON.stringify(nextDocuments));
  }

  async function readResponse(response) {
    const text = await response.text();
    let payload = {};
    try { payload = text ? JSON.parse(text) : {}; } catch { payload = {}; }
    return { payload, response };
  }

  async function ensureApplication(user, draft, token) {
    let applicationId = Number(sessionStorage.getItem('backendApplicationId'));
    if (applicationId) {
      const check = await fetch(`${apiBase}/applications/${applicationId}`, { headers: { Authorization: `Bearer ${token}` } });
      const { payload } = await readResponse(check);
      const application = payload.data || payload;
      const applicantId = user.user_id || user.id;
      if (check.ok && applicantId && String(application.applicant_id) === String(applicantId)) {
        const submittedDetails = {
          father_name: draft.fatherName || draft.father_name,
          mother_name: draft.motherName || draft.mother_name,
          shop_area: draft.shopArea ?? draft.shop_area,
        };
        const missingDetails = Object.fromEntries(
          Object.entries(submittedDetails).filter(([field, value]) =>
            (application[field] === undefined || application[field] === null || String(application[field]).trim() === '') &&
            value !== undefined && value !== null && String(value).trim() !== '',
          ),
        );
        if (Object.keys(missingDetails).length) {
          const updated = await fetch(`${apiBase}/applications/${applicationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(missingDetails),
          });
          const { payload: updatePayload } = await readResponse(updated);
          if (!updated.ok) throw new Error(messageFrom(updatePayload, 'Could not save the applicant details. Please try again.'));
        }
        return applicationId;
      }
      if (!check.ok && ![403, 404].includes(check.status)) {
        throw new Error(messageFrom(payload, 'Could not verify the saved application. Please try again.'));
      }
      clearUploadState();
      setUploadedDocs({});
      applicationId = 0;
    }

    const body = {
      applicantName: draft.fullName || 'Applicant',
      aadhaar_number: draft.aadhaar || draft.aadhaar_number || undefined,
      gender: draft.gender || undefined,
      father_name: draft.fatherName || undefined,
      mother_name: draft.motherName || undefined,
      shop_area: draft.shopArea || undefined,
      businessName: draft.businessName || '',
      businessType: draft.businessType || draft.tradeCategory || 'General',
      tradeCategory: draft.tradeCategory || draft.businessType || 'General',
      shopAddress: draft.shopAddress || '', city: draft.city || draft.district || '', district: draft.district || '',
      state: draft.state || '', pincode: draft.pincode || '', phone: draft.phone || '',
      municipality_id: draft.municipalityId || draft.municipality_id || undefined,
      municipalityId: draft.municipalityId || draft.municipality_id || undefined,
    };
    const created = await fetch(`${apiBase}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const { payload } = await readResponse(created);
    if (!created.ok) throw new Error(messageFrom(payload, 'Could not create the application.'));
    const application = payload.data || {};
    applicationId = Number(application.application_id);
    if (!applicationId) throw new Error('The backend did not return an application ID.');
    sessionStorage.setItem('backendApplicationId', String(applicationId));
    if (application.application_ref) sessionStorage.setItem('applicationRef', application.application_ref);
    return applicationId;
  }

  async function uploadOne(applicationId, item, file, token) {
    const body = new FormData();
    body.append('application_id', String(applicationId));
    body.append('document_type', item.type);
    body.append('file', file);
    const response = await fetch(`${apiBase}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    const { payload } = await readResponse(response);
    if (!response.ok) throw new Error(messageFrom(payload, 'Document upload failed.'));
    return payload;
  }

  async function loadPersistedDocuments(applicationId, token) {
    const response = await fetch(`${apiBase}/documents/application/${encodeURIComponent(applicationId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { payload } = await readResponse(response);
    if (!response.ok) throw new Error(messageFrom(payload, 'Could not verify previously uploaded documents.'));
    const documents = Array.isArray(payload) ? payload : payload.data;
    if (!Array.isArray(documents)) throw new Error('The server returned an invalid document list.');

    const confirmed = {};
    for (const item of documentItems) {
      const record = documents.find((document) => document.document_type === item.type);
      if (record) confirmed[item.statusId] = String(record.document_id);
    }
    return confirmed;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setPageMessage('');
    setIsUploading(true);
    const user = readObject(sessionStorage, 'loggedInUser');
    const draft = readObject(sessionStorage, 'applicationForm');
    const token = sessionStorage.getItem('accessToken');
    try {
      let applicationId = Number(sessionStorage.getItem('backendApplicationId'));
      let nextUploaded = {};
      if (applicationId) {
        applicationId = await ensureApplication(user, draft, token);
        nextUploaded = await loadPersistedDocuments(applicationId, token);
      } else {
        saveUploadedDocuments(nextUploaded);
      }

      const missing = documentItems.filter((item) => !nextUploaded[item.statusId] && !files[item.statusId]);
      if (missing.length) {
        setPageMessage('Please select every document not confirmed by the server, then submit again.');
        return;
      }

      if (!applicationId) applicationId = await ensureApplication(user, draft, token);
      const failures = {};
      for (const item of documentItems) {
        if (nextUploaded[item.statusId]) continue;
        try {
          const result = await uploadOne(applicationId, item, files[item.statusId], token);
          nextUploaded[item.statusId] = String(result.document_id);
          saveUploadedDocuments(nextUploaded);
          setErrors((current) => ({ ...current, [item.errorId]: '' }));
        } catch (error) {
          failures[item.errorId] = error.message || 'Document upload failed.';
        }
      }
      setErrors((current) => ({ ...current, ...failures }));
      const completed = documentItems.every((item) => nextUploaded[item.statusId]);
      if (!completed) {
        setPageMessage('Some documents could not be uploaded. Correct the errors and try again.');
        return;
      }
      sessionStorage.setItem('documentsUploaded', 'true');
      sessionStorage.setItem('documentsUploadedCount', String(documentItems.length));
      navigate('/pay-now');
    } catch (error) {
      setPageMessage(error.message || 'Could not submit the documents. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  function logout(event) {
    event.preventDefault();
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  return (
    <div className="applicant-upload-documents-page">
      <ApplicantNavigation onLogout={logout} />
      <main className="container">
        <div className="page-top"><div><h2>Upload Required Documents</h2><p>Step 3 of 4. Please upload the required documents for verification.</p></div><div className="progress-box"><span>75% Completed</span><div className="progress-bg"><div className="progress-fill" /></div></div></div>
        <div className="info-note">Allowed file types: JPG, PNG or PDF. Max file size: 5MB per document.</div>
        <form onSubmit={handleSubmit}>
          {documentItems.map((item) => (
            <section className="doc-card" key={item.inputId}>
              <div className="doc-header"><strong>{item.title}</strong><span>{item.description}</span></div>
              <div className="upload-area">
                <button type="button" onClick={() => document.getElementById(item.inputId)?.click()} disabled={isUploading || Boolean(uploadedDocs[item.statusId])}>Upload File</button>
                <span>Drag &amp; drop files here, or <label htmlFor={item.inputId} className="browse">Browse Files</label></span>
                <input type="file" id={item.inputId} accept=".jpg,.png,.pdf" onChange={(event) => handleFileChange(event, item)} disabled={isUploading || Boolean(uploadedDocs[item.statusId])} />
              </div>
              <div className="file-status">{uploadedDocs[item.statusId] ? 'Uploaded successfully.' : files[item.statusId] ? `${files[item.statusId].name} is ready to upload.` : ''}</div>
              <div className="error" role={errors[item.errorId] ? 'alert' : undefined}>{errors[item.errorId] || ''}</div>
            </section>
          ))}
          {pageMessage && <p className="upload-page-message" role="alert">{pageMessage}</p>}
          <div className="bottom-actions"><button type="button" className="btn-back" onClick={() => navigate('/apply-license')}>← Back</button><button type="submit" className="btn-preview" disabled={isUploading}>{isUploading ? 'Uploading...' : 'Preview & Review →'}</button></div>
        </form>
      </main>
    </div>
  );
}
