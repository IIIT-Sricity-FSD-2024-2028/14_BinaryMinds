import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import { selectCurrentUser } from '../../features/auth/authSelectors.js';
import {
  changeApplicantPassword,
  clearApplicantPasswordForm,
  selectApplicantPasswordForm,
  selectApplicantProfileForm,
  selectApplicantPasswordChangeError,
  selectApplicantPasswordChangeStatus,
  selectApplicantProfileUpdateError,
  selectApplicantProfileUpdateStatus,
  updateApplicantProfile,
  setApplicantPasswordFormField,
  setApplicantProfileForm,
  setApplicantProfileFormField,
} from '../../features/auth/authSlice.js';
import {
  fetchApplicantApplications,
  selectApplicantApplications,
  selectApplicantApplicationsError,
  selectApplicantApplicationsRequest,
} from '../../features/applications/applicationsSlice.js';
import '../styles/ApplicantProfileEdit.css';

function getAddress(application) {
  if (!application) return 'Unavailable';
  return [application.shop_address, application.city, application.state]
    .filter(Boolean).join(', ') + (application.pincode ? ` - ${application.pincode}` : '') || 'Unavailable';
}

export default function ApplicantProfileEdit() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const applicant = useSelector(selectCurrentUser);
  const applications = useSelector(selectApplicantApplications);
  const applicationRequest = useSelector((state) => selectApplicantApplicationsRequest(state, 'fetchMine'));
  const applicationError = useSelector((state) => selectApplicantApplicationsError(state, 'fetchMine'));
  const profileUpdateStatus = useSelector(selectApplicantProfileUpdateStatus);
  const profileUpdateError = useSelector(selectApplicantProfileUpdateError);
  const passwordChangeStatus = useSelector(selectApplicantPasswordChangeStatus);
  const passwordChangeError = useSelector(selectApplicantPasswordChangeError);
  const loading = applicationRequest === undefined || applicationRequest === 'pending';
  const saving = profileUpdateStatus === 'pending';
  const passwordSaving = passwordChangeStatus === 'pending';
  const latestApplication = applications[0];
  const aadhaarNumber = latestApplication?.aadhaar_number ? String(latestApplication.aadhaar_number) : '';
  const aadhaar = aadhaarNumber ? `XXXX-XXXX-${aadhaarNumber.slice(-4)}` : 'Unavailable';
  const gender = latestApplication?.gender || 'Unavailable';
  const address = getAddress(latestApplication);
  const profile = useSelector(selectApplicantProfileForm);
  const passwordForm = useSelector(selectApplicantPasswordForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  function togglePasswordVisibility(field) {
    setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }));
  }

  useEffect(() => {
    if (applicant?.role !== 'applicant') {
      navigate('/login', { replace: true });
      return undefined;
    }
    const request = dispatch(fetchApplicantApplications());
    return () => request.abort();
  }, [applicant?.role, dispatch, navigate]);

  useEffect(() => {
    dispatch(setApplicantProfileForm({
      fullName: applicant?.name || '',
      email: applicant?.email || '',
      phone: applicant?.phone || '',
    }));
  }, [applicant?.email, applicant?.name, applicant?.phone, dispatch]);

  function updateField(field, value) {
    dispatch(setApplicantProfileFormField({ field, value }));
    setNotice('');
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordError('');
    setPasswordNotice('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Enter your current password and a new password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (!/[A-Za-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword) || !/[^A-Za-z0-9]/.test(passwordForm.newPassword)) {
      setPasswordError('New password must include at least one letter, one number, and one special character.');
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      await dispatch(changeApplicantPassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })).unwrap();
      dispatch(clearApplicantPasswordForm());
      setPasswordNotice('Password changed successfully. Use the new password the next time you sign in.');
    } catch {
      // API errors are shown from Redux auth request state.
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!applicant?.userId) {
      setError('Your session is incomplete. Please sign in again.');
      return;
    }

    setError('');
    try {
      const updatedUser = await dispatch(updateApplicantProfile({
        full_name: profile.fullName.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
      })).unwrap();
      dispatch(setApplicantProfileForm({
        fullName: updatedUser.name || profile.fullName.trim(),
        email: updatedUser.email || profile.email.trim(),
        phone: updatedUser.phone || profile.phone.trim(),
      }));
      setNotice('Profile updated successfully.');
    } catch {
      // API errors are shown from Redux auth request state.
    }
  }

  return (
    <div className="applicant-profile-edit-page">
      <ApplicantNavigation />
      <main className="profile-edit-main">
        <h1>Edit Applicant Profile</h1>
        <p className="profile-edit-sub">Update your personal contact details.</p>
        {loading && <p role="status" className="profile-edit-message">Loading your profile...</p>}
        {error && <p role="alert" className="profile-edit-message profile-edit-error">{error}</p>}
        {applicationRequest === 'rejected' && <p role="alert" className="profile-edit-message profile-edit-error">{applicationError || 'Could not load your read-only application details.'}</p>}
        {profileUpdateError && <p role="alert" className="profile-edit-message profile-edit-error">{profileUpdateError}</p>}
        <div className="profile-edit-layout">
          <section className="profile-edit-card">
            <form onSubmit={handleSubmit}>
              <h2>Contact Information</h2>
              <div className="profile-edit-grid">
                <div className="profile-edit-group"><label htmlFor="edit-full-name">Full Name</label><input id="edit-full-name" type="text" required value={profile.fullName} onChange={(event) => updateField('fullName', event.target.value)} disabled={!applicant?.userId || saving} /></div>
                <div className="profile-edit-group"><label htmlFor="edit-email">Email Address</label><input id="edit-email" type="email" required value={profile.email} onChange={(event) => updateField('email', event.target.value)} disabled={!applicant?.userId || saving} /></div>
                <div className="profile-edit-group"><label htmlFor="edit-phone">Phone Number</label><input id="edit-phone" type="text" maxLength="15" required value={profile.phone} onChange={(event) => updateField('phone', event.target.value)} disabled={!applicant?.userId || saving} /></div>
                <div className="profile-edit-group"><label htmlFor="edit-aadhaar">Aadhaar Number</label><input id="edit-aadhaar" type="text" value={aadhaar} readOnly className="profile-edit-readonly" /></div>
                <div className="profile-edit-group"><label htmlFor="edit-gender">Gender</label><input id="edit-gender" type="text" value={gender} readOnly className="profile-edit-readonly" /></div>
              </div>
              <h2 className="profile-edit-address-heading">Residential Address</h2>
              <div className="profile-edit-group"><label htmlFor="edit-address">Address Line</label><textarea id="edit-address" value={address} readOnly aria-describedby="edit-address-help" className="profile-edit-readonly" /><small id="edit-address-help">Address comes from your application record and cannot be changed here.</small></div>
              <div className="profile-edit-actions"><button type="button" className="profile-edit-cancel" onClick={() => navigate('/profile')}>Cancel</button><button type="submit" className="profile-edit-save" disabled={!applicant?.userId || saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
              {notice && <p className="profile-edit-message" role="status">{notice}</p>}
            </form>
          </section>
        </div>
        <section className="profile-edit-card profile-password-card">
          <form onSubmit={handlePasswordSubmit}>
            <h2>Password &amp; Security</h2>
            <p className="profile-password-help">Change your sign-in password. Your current password is required to confirm this change.</p>
            <div className="profile-edit-grid">
              <div className="profile-edit-group"><label htmlFor="current-password">Current Password</label><div className="profile-password-field"><input id="current-password" type={visiblePasswords.currentPassword ? 'text' : 'password'} autoComplete="current-password" required value={passwordForm.currentPassword} onChange={(event) => dispatch(setApplicantPasswordFormField({ field: 'currentPassword', value: event.target.value }))} disabled={!applicant?.userId || passwordSaving} /><PasswordVisibilityButton visible={visiblePasswords.currentPassword} onClick={() => togglePasswordVisibility('currentPassword')} label="current password" /></div></div>
              <div className="profile-edit-group"><label htmlFor="new-password">New Password</label><div className="profile-password-field"><input id="new-password" type={visiblePasswords.newPassword ? 'text' : 'password'} autoComplete="new-password" minLength={6} required value={passwordForm.newPassword} onChange={(event) => dispatch(setApplicantPasswordFormField({ field: 'newPassword', value: event.target.value }))} disabled={!applicant?.userId || passwordSaving} aria-describedby="new-password-help" /><PasswordVisibilityButton visible={visiblePasswords.newPassword} onClick={() => togglePasswordVisibility('newPassword')} label="new password" /></div><small id="new-password-help">Must be at least 6 characters, include a letter, number, and special character, and differ from your current password.</small></div>
              <div className="profile-edit-group"><label htmlFor="confirm-password">Confirm New Password</label><div className="profile-password-field"><input id="confirm-password" type={visiblePasswords.confirmPassword ? 'text' : 'password'} autoComplete="new-password" minLength={6} required value={passwordForm.confirmPassword} onChange={(event) => dispatch(setApplicantPasswordFormField({ field: 'confirmPassword', value: event.target.value }))} disabled={!applicant?.userId || passwordSaving} /><PasswordVisibilityButton visible={visiblePasswords.confirmPassword} onClick={() => togglePasswordVisibility('confirmPassword')} label="confirm new password" /></div></div>
            </div>
            {(passwordError || passwordChangeError) && <p className="profile-edit-message profile-edit-error" role="alert">{passwordError || passwordChangeError}</p>}
            {passwordNotice && <p className="profile-edit-message" role="status">{passwordNotice}</p>}
            <div className="profile-edit-actions"><button type="submit" className="profile-edit-save" disabled={!applicant?.userId || passwordSaving}>{passwordSaving ? 'Changing Password...' : 'Change Password'}</button></div>
          </form>
        </section>
      </main>
    </div>
  );
}

function PasswordVisibilityButton({ visible, onClick, label }) {
  return (
    <button
      className="password-visibility-toggle"
      type="button"
      onClick={onClick}
      aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
      aria-pressed={visible}
      title={`${visible ? 'Hide' : 'Show'} ${label}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {visible ? (
          <>
            <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
            <path d="M9.9 5.2A10.9 10.9 0 0112 5c5 0 9 4.5 10 7-.4 1-1.4 2.4-2.8 3.7M6.2 6.2C3.9 7.7 2.4 10 2 12c1 2.5 5 7 10 7 1.3 0 2.5-.3 3.6-.8" />
          </>
        ) : (
          <>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </button>
  );
}
