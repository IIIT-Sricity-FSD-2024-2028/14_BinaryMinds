import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import '../styles/ApplicantApplyLicense.css';

const apiBase = 'http://localhost:3000/api';

function readObject(storage, key) {
  try {
    const value = JSON.parse(storage.getItem(key) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch { return {}; }
}

function clearApplicationDraft() {
  ['applicationForm', 'backendApplicationId', 'applicationRef', 'uploadedDocs', 'documentsUploaded', 'documentsUploadedCount', 'currentApplication'].forEach((key) => sessionStorage.removeItem(key));
}

const emptyForm = {
  fullName: '', email: '', phone: '', aadhaar: '', motherName: '', gender: '', fatherName: '',
  municipalityId: '', businessName: '', businessType: 'Retail Shop', shopAddress: '', city: '',
  district: '', state: '', pincode: '', shopArea: '',
};

const requiredFields = {
  fullName: 'Required', email: 'Required', phone: 'Enter 10 digits', aadhaar: 'Enter 12 digits',
  motherName: 'Required', gender: 'Required', fatherName: 'Required', businessName: 'Required',
  shopAddress: 'Required', city: 'Required', district: 'Required', state: 'Required', pincode: 'Enter 6 digits',
};

export default function ApplicantApplyLicense() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [municipalities, setMunicipalities] = useState([]);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    const user = readObject(sessionStorage, 'loggedInUser');
    if (!sessionStorage.getItem('accessToken') || user.role !== 'applicant') {
      navigate('/login', { replace: true });
      return;
    }

    const localUser = readObject(localStorage, 'user');
    const email = user.email || localUser.email || '';
    const initial = {
      ...emptyForm,
      fullName: user.name || user.full_name || localUser.name || localUser.full_name || '',
      email,
      phone: user.phone || localUser.phone || '',
    };
    const saved = readObject(sessionStorage, 'applicationForm');
    if (sessionStorage.getItem('applicationForm')) {
      const savedOwner = String(saved.ownerEmail || saved.email || '').trim().toLowerCase();
      if (savedOwner && email && savedOwner === email.trim().toLowerCase()) {
        Object.assign(initial, saved);
      } else {
        clearApplicationDraft();
      }
    }
    setForm((current) => ({ ...current, ...initial }));

    fetch(`${apiBase}/municipalities`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Municipal corporation list could not be loaded.');
        const result = await response.json();
        const rows = Array.isArray(result) ? result : result.data;
        setMunicipalities(Array.isArray(rows) ? rows : []);
      })
      .catch((error) => setPageError(error.message || 'Municipal corporation list could not be loaded.'));
  }, [navigate]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (['city', 'district', 'state'].includes(name)) {
        const city = next.city.trim().toLowerCase();
        const district = next.district.trim().toLowerCase();
        const state = next.state.trim().toLowerCase();
        const match = municipalities.find((item) => {
          const mName = String(item.name || '').toLowerCase();
          const mDistrict = String(item.district || '').toLowerCase();
          const mState = String(item.state || '').toLowerCase();
          const mId = String(item.municipality_id || '').toLowerCase().replace(/^muni-?/i, '');
          return (city && (mName.includes(city) || mDistrict.includes(city) || city.includes(mDistrict) || city.includes(mId))) ||
            (district && (mDistrict.includes(district) || district.includes(mDistrict))) || (state && mState.includes(state));
        });
        if (match) next.municipalityId = match.municipality_id;
      }
      return next;
    });
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function chooseMunicipality(event) {
    const municipality = municipalities.find((item) => String(item.municipality_id) === event.target.value);
    const city = municipality?.district || municipality?.city || '';
    const resolvedCity = city.toLowerCase() === 'bangalore' ? 'Bengaluru' : city;
    setForm((current) => ({
      ...current,
      municipalityId: event.target.value,
      city: (!current.city || ['Hyderabad', 'Bangalore', 'Bengaluru', 'Mumbai'].includes(current.city)) ? resolvedCity : current.city,
      district: (!current.district || ['Hyderabad', 'Bangalore', 'Bengaluru', 'Mumbai'].includes(current.district)) ? resolvedCity : current.district,
      state: (!current.state || ['Telangana', 'Karnataka', 'Maharashtra'].includes(current.state)) ? (municipality?.state || '') : current.state,
    }));
  }

  function validateForm() {
    const nextErrors = {};
    Object.entries(requiredFields).forEach(([field, message]) => {
      const value = String(form[field] || '').trim();
      if (!value || /^0+$/.test(value)) nextErrors[field] = /^0+$/.test(value) ? 'Invalid input' : message;
    });
    if (form.phone.length !== 10) nextErrors.phone = 'Enter 10 digits';
    if (form.aadhaar.length !== 12) nextErrors.aadhaar = 'Enter 12 digits';
    if (form.pincode.length !== 6) nextErrors.pincode = 'Enter 6 digits';
    const area = Number.parseFloat(form.shopArea);
    if (!form.shopArea || Number.isNaN(area) || area < 100 || area > 1500) nextErrors.shopArea = 'Enter area between 100 and 1500 sq.ft';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    setPageError('');
    if (!validateForm()) return;

    const user = readObject(sessionStorage, 'loggedInUser');
    const selectedMunicipality = municipalities.find((item) => String(item.municipality_id) === String(form.municipalityId));
    const draft = {
      municipalityId: form.municipalityId || '',
      municipalityName: selectedMunicipality?.name || '',
      fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(), aadhaar: form.aadhaar.trim(),
      motherName: form.motherName.trim(), gender: form.gender, fatherName: form.fatherName.trim(),
      businessName: form.businessName.trim(), businessType: form.businessType, shopAddress: form.shopAddress.trim(),
      city: form.city.trim(), district: form.district.trim(), state: form.state.trim(), pincode: form.pincode.trim(),
      tradeCategory: form.businessType, shopArea: String(form.shopArea).trim(), ownerEmail: user.email || form.email.trim(),
    };
    sessionStorage.setItem('applicationForm', JSON.stringify(draft));
    navigate('/upload-documents');
  }

  function logout(event) {
    event.preventDefault();
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  const field = (name, label, placeholder, type = 'text', maxLength) => (
    <div className="fg">
      <label htmlFor={`apply-${name}`}>{label}</label>
      <input id={`apply-${name}`} name={name} type={type} placeholder={placeholder} value={form[name]} maxLength={maxLength} onChange={updateField} className={errors[name] ? 'invalid' : ''} />
      <span className={`err ${errors[name] ? 'show' : ''}`}>{errors[name] || 'Required'}</span>
    </div>
  );

  return (
    <div className="applicant-apply-license-page">
      <div className="top-bar">
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="India Logo" height="45" />
        <div><span className="brand-gov">Government of India</span><span className="brand-name">TradeZo</span></div>
      </div>
      <ApplicantNavigation onLogout={logout} />
      <main className="page">
        <h1>Apply for Trade License</h1>
        <p className="sub">Fill the form below to submit your trade license application</p>
        <div className="steps">
          <div className="step active"><div className="circle active">1</div><p>Applicant Detail</p></div><div className="line" />
          <div className="step"><div className="circle">2</div><p>Business Details</p></div><div className="line" />
          <div className="step"><div className="circle">3</div><p>Document Upload</p></div><div className="line" />
          <div className="step"><div className="circle">4</div><p>Payment</p></div>
        </div>
        {pageError && <p className="apply-page-error" role="alert">{pageError}</p>}
        <form onSubmit={handleSubmit} noValidate>
          <section className="card"><h2>Applicant Details</h2><div className="grid">
            {field('fullName', 'Full Name *', 'Enter full name')}{field('email', 'Email Address *', 'Enter email address', 'email')}
            {field('phone', 'Phone Number *', 'Enter 10-digit mobile number', 'text', 10)}{field('aadhaar', 'Aadhaar Number *', 'Enter 12-digit Aadhaar number', 'text', 12)}
            {field('motherName', "Mother's Name *", 'Enter full name')}
            <div className="fg"><label htmlFor="apply-gender">Gender *</label><select id="apply-gender" name="gender" value={form.gender} onChange={updateField} className={errors.gender ? 'invalid' : ''}><option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option></select><span className={`err ${errors.gender ? 'show' : ''}`}>{errors.gender || 'Required'}</span></div>
            {field('fatherName', "Father's Name *", 'Enter full name')}
          </div></section>
          <section className="card"><h2>Business Details</h2><div className="grid">
            <div className="fg full"><label htmlFor="apply-municipality">Municipal Corporation *</label><select id="apply-municipality" name="municipalityId" value={form.municipalityId} onChange={chooseMunicipality}><option value="">Select Municipal Corporation</option>{municipalities.map((item) => <option key={item.municipality_id} value={item.municipality_id}>{item.name}</option>)}</select><span className={`err ${errors.municipalityId ? 'show' : ''}`}>{errors.municipalityId || 'Please enter your location to determine municipal corporation'}</span></div>
            {field('businessName', 'Business Name *', 'Enter registered business name')}
            <div className="fg"><label htmlFor="apply-businessType">Business Type *</label><select id="apply-businessType" name="businessType" value={form.businessType} onChange={updateField}><option>Retail Shop</option><option>Wholesale</option><option>Manufacturer</option><option>Service</option></select></div>
            <div className="fg full"><label htmlFor="apply-shopAddress">Shop Address *</label><input id="apply-shopAddress" name="shopAddress" type="text" placeholder="Enter Shop/Plot No, Street, Landmark" value={form.shopAddress} onChange={updateField} className={errors.shopAddress ? 'invalid' : ''} /><span className={`err ${errors.shopAddress ? 'show' : ''}`}>{errors.shopAddress || 'Required'}</span></div>
            {field('city', 'City *', 'Enter City')}{field('district', 'District *', 'Enter District')}{field('state', 'State *', 'Enter State')}{field('pincode', 'Pincode *', 'Enter 6-digit Pincode', 'text', 6)}{field('shopArea', 'Shop Area (sq.ft) *', 'Enter area (100 - 1500)', 'number')}
          </div></section>
          <div className="buttons"><button type="button" className="cancel-btn" onClick={() => navigate(-1)}>Cancel</button><button type="submit" className="next-btn">Next &rarr;</button></div>
        </form>
        <div className="info-row"><div className="info-box"><strong>E-KYC Ready</strong><p>Ensure your Aadhaar is linked with your mobile number for OTP.</p></div><div className="info-box"><strong>Data Privacy</strong><p>All information is processed per the National Data Security Policy.</p></div><div className="info-box"><strong>Need Help?</strong><p>Call 1800-GOV-HELP for any assistance with the application form.</p></div></div>
      </main>
    </div>
  );
}
