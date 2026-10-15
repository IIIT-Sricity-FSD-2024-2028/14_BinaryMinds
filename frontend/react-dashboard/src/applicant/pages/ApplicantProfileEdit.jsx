import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import '../styles/ApplicantProfileEdit.css';

const apiBase = 'http://localhost:3000/api';

function readSessionUser() {
  try { return JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch { return {}; }
}

function apiError(payload, fallback) {
  return Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message || fallback;
}

function getAddress(application) {
  if (!application) return 'Unavailable';
  return [application.shop_address, application.city, application.state]
    .filter(Boolean).join(', ') + (application.pincode ? ` - ${application.pincode}` : '') || 'Unavailable';
}

export default function ApplicantProfileEdit() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ userId: '', fullName: '', email: '', phone: '', aadhaar: 'Unavailable', gender: 'Unavailable', address: 'Unavailable' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem('accessToken');
    const sessionUser = readSessionUser();
    if (!token) {
      navigate('/login', { replace: true });
      return () => { active = false; };
    }

    async function loadProfile() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [userResponse, applicationsResponse] = await Promise.all([
          fetch(`${apiBase}/users/me`, { headers }),
          fetch(`${apiBase}/applications/mine`, { headers }),
        ]);
        const user = await userResponse.json().catch(() => ({}));
        const applicationResult = await applicationsResponse.json().catch(() => ({}));
        if (!userResponse.ok) throw new Error(apiError(user, 'Could not load your profile. Please sign in again or try later.'));
        if (!applicationsResponse.ok) throw new Error(apiError(applicationResult, 'Could not load your read-only application details.'));
        const applications = Array.isArray(applicationResult.data) ? applicationResult.data : [];
        const latestApplication = applications[0];
        const aadhaarNumber = latestApplication?.aadhaar_number ? String(latestApplication.aadhaar_number) : '';
        if (active) {
          setProfile({
            userId: user.user_id || sessionUser.user_id || sessionUser.id || '',
            fullName: user.full_name || '',
            email: user.email || '',
            phone: user.phone || '',
            aadhaar: aadhaarNumber ? `XXXX-XXXX-${aadhaarNumber.slice(-4)}` : 'Unavailable',
            gender: latestApplication?.gender || 'Unavailable',
            address: getAddress(latestApplication),
          });
        }
      } catch (requestError) {
        if (active) setError(requestError.message || 'Could not load your profile.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => { active = false; };
  }, [navigate]);

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
    setNotice('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    const token = sessionStorage.getItem('accessToken');
    if (!token || !profile.userId) {
      setError('Your session is incomplete. Please sign in again.');
      return;
    }

    setSaving(true);
    setNotice('Saving profile...');
    try {
      const response = await fetch(`${apiBase}/users/${encodeURIComponent(profile.userId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: profile.fullName.trim(),
          email: profile.email.trim(),
          phone: profile.phone.trim(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(apiError(payload, 'Unable to update profile.'));

      const updatedUser = {
        ...readSessionUser(),
        user_id: payload.user_id || profile.userId,
        id: payload.user_id || profile.userId,
        full_name: payload.full_name || profile.fullName.trim(),
        name: payload.full_name || profile.fullName.trim(),
        email: payload.email || profile.email.trim(),
        phone: payload.phone || profile.phone.trim(),
      };
      sessionStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
      localStorage.setItem('user', JSON.stringify({ name: updatedUser.full_name, email: updatedUser.email, phone: updatedUser.phone }));
      setProfile((current) => ({ ...current, userId: updatedUser.user_id, fullName: updatedUser.full_name, email: updatedUser.email, phone: updatedUser.phone }));
      setNotice('Profile updated successfully.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to update profile. Please try again.');
      setNotice('');
    } finally {
      setSaving(false);
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
    <div className="applicant-profile-edit-page">
      <header className="profile-edit-topbar"><img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="India Logo" /><div className="profile-edit-brand"><span>Government of India</span><strong>TradeZo</strong></div></header>
      <ApplicantNavigation onLogout={logout} />
      <main className="profile-edit-main">
        <h1>Edit Applicant Profile</h1>
        <p className="profile-edit-sub">Update your personal contact details.</p>
        {loading && <p role="status" className="profile-edit-message">Loading your profile...</p>}
        {error && <p role="alert" className="profile-edit-message profile-edit-error">{error}</p>}
        <div className="profile-edit-layout">
          <section className="profile-edit-card">
            <form onSubmit={handleSubmit}>
              <h2>Contact Information</h2>
              <div className="profile-edit-grid">
                <div className="profile-edit-group"><label htmlFor="edit-full-name">Full Name</label><input id="edit-full-name" type="text" required value={profile.fullName} onChange={(event) => updateField('fullName', event.target.value)} disabled={loading || Boolean(error)} /></div>
                <div className="profile-edit-group"><label htmlFor="edit-email">Email Address</label><input id="edit-email" type="email" required value={profile.email} onChange={(event) => updateField('email', event.target.value)} disabled={loading || Boolean(error)} /></div>
                <div className="profile-edit-group"><label htmlFor="edit-phone">Phone Number</label><input id="edit-phone" type="text" maxLength="15" required value={profile.phone} onChange={(event) => updateField('phone', event.target.value)} disabled={loading || Boolean(error)} /></div>
                <div className="profile-edit-group"><label htmlFor="edit-aadhaar">Aadhaar Number</label><input id="edit-aadhaar" type="text" value={profile.aadhaar} readOnly className="profile-edit-readonly" /></div>
                <div className="profile-edit-group"><label htmlFor="edit-gender">Gender</label><input id="edit-gender" type="text" value={profile.gender} readOnly className="profile-edit-readonly" /></div>
              </div>
              <h2 className="profile-edit-address-heading">Residential Address</h2>
              <div className="profile-edit-group"><label htmlFor="edit-address">Address Line</label><textarea id="edit-address" value={profile.address} readOnly aria-describedby="edit-address-help" className="profile-edit-readonly" /><small id="edit-address-help">Address comes from your application record and cannot be changed here.</small></div>
              <div className="profile-edit-actions"><button type="button" className="profile-edit-cancel" onClick={() => navigate('/profile')}>Cancel</button><button type="submit" className="profile-edit-save" disabled={loading || saving || Boolean(error)}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
              {notice && <p className="profile-edit-message" role="status">{notice}</p>}
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
