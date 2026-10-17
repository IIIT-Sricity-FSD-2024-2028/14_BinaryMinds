import { useState } from 'react';
import FieldOfficerPageShell from '../components/FieldOfficerPageShell';
import { useFieldOfficerData } from '../components/useFieldOfficerData';
import '../styles/EditFieldOfficerProfile.css';

function ProfileEditForm({ data }) {
  const profile = data.profile;
  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await data.request(`/users/${encodeURIComponent(data.officerId)}`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        }),
      });
      data.navigate(`/officer/${data.officerId}/profile`, {
        state: { profileUpdated: true },
      });
    } catch (saveError) {
      setError(saveError.message || 'Unable to save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function field(label, name, type = 'text') {
    return (
      <label className="fo-react-field" key={name}>
        {label}
        <input
          required
          maxLength={name === 'full_name' ? 120 : name === 'email' ? 120 : 15}
          name={name}
          type={type}
          value={form[name]}
          onChange={updateField}
        />
      </label>
    );
  }

  return (
    <section className="fo-react-card fo-edit-card fo-edit-profile-page">
      <form onSubmit={save}>
        <h2>Personal Details</h2>
        <div className="fo-react-form-grid">
          {field('Full Name', 'full_name')}
          {field('Email Address', 'email', 'email')}
          {field('Phone Number', 'phone', 'tel')}
        </div>
        <h2 className="fo-professional-heading">Professional Details</h2>
        <div className="fo-react-form-grid">
          <label className="fo-react-field">Employee ID (Officer ID)<input disabled value={profile.employee_id || 'Not assigned'} /></label>
          <label className="fo-react-field">Location<input disabled value={profile.municipalityName || profile.municipality_id || '—'} /></label>
          <label className="fo-react-field">Role<input disabled value={profile.role || 'Field Officer'} /></label>
        </div>
        {error && <p className="fo-react-message error" role="alert">{error}</p>}
        <div className="fo-react-actions">
          <button className="fo-react-button secondary" type="button" disabled={saving} onClick={() => data.navigate(`/officer/${data.officerId}/profile`)}>Cancel</button>
          <button className="fo-react-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </section>
  );
}

export default function EditFieldOfficerProfile() {
  const data = useFieldOfficerData();
  return (
    <FieldOfficerPageShell activeSection="profile_edit" title="Edit Profile" {...data}>
      {data.loading ? <section className="fo-react-card"><p>Loading your profile…</p></section> : data.profile ? (
        <ProfileEditForm data={data} />
      ) : (
        <section className="fo-react-card"><p role="alert">{data.error || 'Your profile could not be loaded.'}</p></section>
      )}
    </FieldOfficerPageShell>
  );
}
