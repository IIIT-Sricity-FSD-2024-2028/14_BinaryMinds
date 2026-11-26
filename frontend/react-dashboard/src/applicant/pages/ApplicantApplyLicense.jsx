import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import { selectCurrentUser } from '../../features/auth/authSelectors.js';
import { fetchActiveMunicipalities, selectMunicipalities } from '../../features/municipalities/municipalitiesSlice.js';
import { checkApplicantApplicationsForDuplicates, fetchApplicantLicenseByApplication, selectApplicantApplicationWorkflow, selectApplicantApplications, selectApplicantApplicationsError, selectApplicantApplicationsRequest, selectApplicantLicenseErrorsByApplicationId, selectApplicantLicenseRequestsByApplicationId, selectApplicantLicensesByApplicationId, setApplicationError, setApplicationErrors, setApplicationForm, setSelectedApplicationId, updateApplicationField } from '../store/applicantApplicationsSlice.js';
import '../styles/ApplicantApplyLicense.css';

const emptyForm = { fullName: '', email: '', phone: '', aadhaar: '', motherName: '', gender: '', fatherName: '', municipalityId: '', businessName: '', businessType: 'Retail Shop', shopAddress: '', city: '', district: '', state: '', pincode: '', shopArea: '' };
const requiredFields = { fullName: 'Required', email: 'Required', phone: 'Enter 10 digits', aadhaar: 'Enter 12 digits', motherName: 'Required', gender: 'Required', fatherName: 'Required', businessName: 'Required', shopAddress: 'Required', city: 'Required', district: 'Required', state: 'Required', pincode: 'Enter 6 digits', municipalityId: 'Select a municipal corporation' };
const activeApplicationStatuses = new Set(['submitted', 'assigned', 'verified', 'documents_uploaded', 'inspection_scheduled', 'inspection_completed', 'department_review']);

function normalizeBusinessName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeMunicipalityId(value) {
  return String(value || '').trim().toLowerCase();
}

function hasValidLicense(license) {
  const expiryTime = new Date(license?.expiry_date).getTime();
  return String(license?.status || '').toUpperCase() === 'ACTIVE' && Number.isFinite(expiryTime) && expiryTime > Date.now();
}

export default function ApplicantApplyLicense() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { applicationForm: form, applicationErrors: errors, applicationError: pageError } = useSelector(selectApplicantApplicationWorkflow);
  const applications = useSelector(selectApplicantApplications);
  const municipalities = useSelector(selectMunicipalities);
  const applicationCheckStatus = useSelector((state) => selectApplicantApplicationsRequest(state, 'checkForDuplicates'));
  const applicationCheckError = useSelector((state) => selectApplicantApplicationsError(state, 'checkForDuplicates'));
  const licensesByApplicationId = useSelector(selectApplicantLicensesByApplicationId);
  const licenseRequestsByApplicationId = useSelector(selectApplicantLicenseRequestsByApplicationId);
  const licenseErrorsByApplicationId = useSelector(selectApplicantLicenseErrorsByApplicationId);

  const businessNameKey = normalizeBusinessName(form.businessName);
  const municipalityKey = normalizeMunicipalityId(form.municipalityId);
  const matchingApplications = useMemo(() => (businessNameKey && municipalityKey
    ? applications.filter((application) => normalizeBusinessName(application.business_name) === businessNameKey && normalizeMunicipalityId(application.municipality_id) === municipalityKey)
    : []), [applications, businessNameKey, municipalityKey]);
  const inProgressApplication = matchingApplications.find((application) => activeApplicationStatuses.has(String(application.application_status || '').toLowerCase()));
  const approvedApplications = useMemo(() => matchingApplications.filter((application) => String(application.application_status || '').toLowerCase() === 'approved'), [matchingApplications]);
  const approvedLicensePending = approvedApplications.some((application) => {
    const requestStatus = licenseRequestsByApplicationId[String(application.application_id)];
    return requestStatus === undefined || requestStatus === 'pending';
  });
  const approvedLicenseError = approvedApplications.find((application) => licenseRequestsByApplicationId[String(application.application_id)] === 'rejected');
  const validLicenseApplication = approvedApplications.find((application) => hasValidLicense(licensesByApplicationId[String(application.application_id)]));
  const blockingApplication = inProgressApplication || validLicenseApplication;
  const checkingApplications = !['fulfilled', 'rejected'].includes(applicationCheckStatus);

  useEffect(() => {
    if (!user || user.role !== 'applicant') { navigate('/login', { replace: true }); return; }
    dispatch(fetchActiveMunicipalities());
    dispatch(checkApplicantApplicationsForDuplicates());
  }, [dispatch, navigate, user]);

  useEffect(() => {
    if (!user) return;
    const current = form;
    dispatch(setApplicationForm({ ...emptyForm, ...current, fullName: current.fullName || user.fullName || user.name || '', email: current.email || user.email || '', phone: current.phone || user.phone || '' }));
  }, [dispatch, form, user]);

  useEffect(() => {
    if (applicationCheckStatus !== 'fulfilled') return;
    approvedApplications.forEach((application) => {
      const id = String(application.application_id);
      if (licenseRequestsByApplicationId[id] === undefined) dispatch(fetchApplicantLicenseByApplication(application.application_id));
    });
  }, [dispatch, applicationCheckStatus, approvedApplications, licenseRequestsByApplicationId]);

  function updateField(event) {
    const { name, value } = event.target;
    dispatch(updateApplicationField({ field: name, value }));
    if (['city', 'district', 'state'].includes(name)) {
      const next = { ...form, [name]: value };
      const city = next.city.trim().toLowerCase(), district = next.district.trim().toLowerCase(), state = next.state.trim().toLowerCase();
      const match = municipalities.find((item) => {
        const mName = String(item.name || '').toLowerCase(), mDistrict = String(item.district || '').toLowerCase(), mState = String(item.state || '').toLowerCase();
        const mId = String(item.municipality_id || '').toLowerCase().replace(/^muni-?/i, '');
        return (city && (mName.includes(city) || mDistrict.includes(city) || city.includes(mDistrict) || city.includes(mId))) || (district && (mDistrict.includes(district) || district.includes(mDistrict))) || (state && mState.includes(state));
      });
      if (match) dispatch(updateApplicationField({ field: 'municipalityId', value: String(match.municipality_id) }));
    }
  }

  function chooseMunicipality(event) {
    const municipality = municipalities.find((item) => String(item.municipality_id) === event.target.value);
    const city = municipality?.district || municipality?.city || '';
    const resolvedCity = city.toLowerCase() === 'bangalore' ? 'Bengaluru' : city;
    const values = { municipalityId: event.target.value };
    if (!form.city || ['Hyderabad', 'Bangalore', 'Bengaluru', 'Mumbai'].includes(form.city)) values.city = resolvedCity;
    if (!form.district || ['Hyderabad', 'Bangalore', 'Bengaluru', 'Mumbai'].includes(form.district)) values.district = resolvedCity;
    if (!form.state || ['Telangana', 'Karnataka', 'Maharashtra'].includes(form.state)) values.state = municipality?.state || '';
    Object.entries(values).forEach(([field, value]) => dispatch(updateApplicationField({ field, value })));
  }

  function handleSubmit(event) {
    event.preventDefault();
    dispatch(setApplicationError(''));
    if (applicationCheckStatus !== 'fulfilled' || blockingApplication || approvedLicensePending || approvedLicenseError) return;
    const nextErrors = {};
    Object.entries(requiredFields).forEach(([field, message]) => { const value = String(form[field] || '').trim(); if (!value || /^0+$/.test(value)) nextErrors[field] = /^0+$/.test(value) ? 'Invalid input' : message; });
    if (form.phone.length !== 10) nextErrors.phone = 'Enter 10 digits';
    if (form.aadhaar.length !== 12) nextErrors.aadhaar = 'Enter 12 digits';
    if (form.pincode.length !== 6) nextErrors.pincode = 'Enter 6 digits';
    const area = Number.parseFloat(form.shopArea);
    if (!form.shopArea || Number.isNaN(area) || area < 100 || area > 1500) nextErrors.shopArea = 'Enter area between 100 and 1500 sq.ft';
    dispatch(setApplicationErrors(nextErrors));
    if (Object.keys(nextErrors).length) return;
    dispatch(setSelectedApplicationId(''));
    navigate('/upload-documents');
  }

  const field = (name, label, placeholder, type = 'text', maxLength) => <div className="fg"><label htmlFor={`apply-${name}`}>{label}</label><input id={`apply-${name}`} name={name} type={type} placeholder={placeholder} value={form[name]} maxLength={maxLength} onChange={updateField} className={errors[name] ? 'invalid' : ''} /><span className={`err ${errors[name] ? 'show' : ''}`}>{errors[name] || 'Required'}</span></div>;
  return <div className="applicant-apply-license-page"><ApplicantNavigation /><main className="page"><h1>Apply for Trade License</h1><p className="sub">Fill the form below to submit your trade license application</p><div className="steps"><div className="step active"><div className="circle active">1</div><p>Applicant Detail</p></div><div className="line" /><div className="step"><div className="circle">2</div><p>Business Details</p></div><div className="line" /><div className="step"><div className="circle">3</div><p>Document Upload</p></div><div className="line" /><div className="step"><div className="circle">4</div><p>Payment</p></div></div>
    {checkingApplications ? <p role="status">Checking your existing applications...</p> : applicationCheckError ? <section className="apply-page-error" role="alert"><p>{applicationCheckError}</p><button type="button" onClick={() => dispatch(checkApplicantApplicationsForDuplicates())}>Retry application check</button></section> : <>
      {pageError && <p className="apply-page-error" role="alert">{pageError}</p>}
      {blockingApplication && <section className="apply-page-error" role="alert"><p>An application for <strong>{blockingApplication.business_name}</strong> in this municipality already blocks a duplicate application. Reference: <strong>{blockingApplication.application_ref || blockingApplication.application_id}</strong>. Current status: <strong>{String(blockingApplication.application_status || 'unavailable').replace(/_/g, ' ')}</strong>{validLicenseApplication && ' (the associated license is active and unexpired)' }.</p><Link to="/track-status">Track this application</Link></section>}
      {approvedLicensePending && <p role="status">Checking the existing approved application’s license validity...</p>}
      {approvedLicenseError && <section className="apply-page-error" role="alert"><p>{licenseErrorsByApplicationId[String(approvedLicenseError.application_id)] || 'Unable to verify whether this approved application has a valid license.'} New applications are paused until the license can be checked.</p><button type="button" onClick={() => dispatch(fetchApplicantLicenseByApplication(approvedLicenseError.application_id))}>Retry license check</button></section>}
      <form onSubmit={handleSubmit} noValidate><section className="card"><h2>Applicant Details</h2><div className="grid">{field('fullName', 'Full Name *', 'Enter full name')}{field('email', 'Email Address *', 'Enter email address', 'email')}{field('phone', 'Phone Number *', 'Enter 10-digit mobile number', 'text', 10)}{field('aadhaar', 'Aadhaar Number *', 'Enter 12-digit Aadhaar number', 'text', 12)}{field('motherName', "Mother's Name *", 'Enter full name')}<div className="fg"><label htmlFor="apply-gender">Gender *</label><select id="apply-gender" name="gender" value={form.gender} onChange={updateField} className={errors.gender ? 'invalid' : ''}><option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option></select><span className={`err ${errors.gender ? 'show' : ''}`}>{errors.gender || 'Required'}</span></div>{field('fatherName', "Father's Name *", 'Enter full name')}</div></section>
        <section className="card"><h2>Business Details</h2><div className="grid"><div className="fg full"><label htmlFor="apply-municipality">Municipal Corporation *</label><select id="apply-municipality" name="municipalityId" value={form.municipalityId} onChange={chooseMunicipality}><option value="">Select Municipal Corporation</option>{municipalities.map((item) => <option key={item.municipality_id} value={item.municipality_id}>{item.name}</option>)}</select><span className={`err ${errors.municipalityId ? 'show' : ''}`}>{errors.municipalityId || 'Please enter your location to determine municipal corporation'}</span></div>{field('businessName', 'Business Name *', 'Enter registered business name')}<div className="fg"><label htmlFor="apply-businessType">Business Type *</label><select id="apply-businessType" name="businessType" value={form.businessType} onChange={updateField}><option>Retail Shop</option><option>Wholesale</option><option>Manufacturer</option><option>Service</option></select></div><div className="fg full"><label htmlFor="apply-shopAddress">Shop Address *</label><input id="apply-shopAddress" name="shopAddress" type="text" placeholder="Enter Shop/Plot No, Street, Landmark" value={form.shopAddress} onChange={updateField} className={errors.shopAddress ? 'invalid' : ''} /><span className={`err ${errors.shopAddress ? 'show' : ''}`}>{errors.shopAddress || 'Required'}</span></div>{field('city', 'City *', 'Enter City')}{field('district', 'District *', 'Enter District')}{field('state', 'State *', 'Enter State')}{field('pincode', 'Pincode *', 'Enter 6-digit Pincode', 'text', 6)}{field('shopArea', 'Shop Area (sq.ft) *', 'Enter area (100 - 1500)', 'number')}</div></section><div className="buttons"><button type="button" className="cancel-btn" onClick={() => navigate(-1)}>Cancel</button><button type="submit" className="next-btn" disabled={Boolean(blockingApplication || approvedLicensePending || approvedLicenseError)}>Next &rarr;</button></div></form>
    </>}</main></div>;
}
