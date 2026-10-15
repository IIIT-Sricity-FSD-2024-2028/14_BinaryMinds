import { useState } from 'react';
import FieldOfficerPageShell from '../components/FieldOfficerPageShell';
import { localProfile } from '../components/fieldOfficerUtils';
import { useFieldOfficerData } from '../components/useFieldOfficerData';
import '../styles/EditFieldOfficerProfile.css';

export default function EditFieldOfficerProfile() {
  const d = useFieldOfficerData(); const saved = localProfile();
  const defaults = { full_name: d.profile?.full_name || '', email: d.profile?.email || '', phone: d.profile?.phone || '', department: d.profile?.department || 'Trade License Department', location: d.profile?.municipality_id || '', role: 'Field Officer' };
  const savedValues = { full_name: saved.name, email: saved.email, phone: saved.phone, department: saved.dept, location: saved.location, role: saved.role };
  const [form, setForm] = useState(() => Object.fromEntries(Object.entries(savedValues).filter(([, value]) => value !== undefined && value !== null)));
  const value = (key) => form[key] ?? defaults[key];
  function save(e) { e.preventDefault(); localStorage.setItem('fo_profile_data', JSON.stringify({ name: value('full_name'), email: value('email'), phone: value('phone'), dept: value('department'), location: value('location'), role: value('role') })); d.setMessage('Profile details saved in this browser only. They were not sent to the backend.'); d.navigate(`/officer/${d.officerId}/profile`); }
  const field = (label, key, required = true) => <label className="fo-react-field" key={key}>{label}<input required={required} type={key === 'email' ? 'email' : 'text'} value={value(key)} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} /></label>;
  return <FieldOfficerPageShell activeSection="profile_edit" title="Edit Profile" {...d}><section className="fo-react-card fo-edit-card fo-edit-profile-page"><form onSubmit={save}><h2>Personal Details</h2><div className="fo-react-form-grid">{field('Full Name','full_name')}{field('Email Address','email')}{field('Phone Number','phone')}</div><h2 className="fo-professional-heading">Professional Details</h2><div className="fo-react-form-grid"><label className="fo-react-field">Officer ID<input disabled value={d.profile?.employee_id || ''} /></label>{field('Department','department')}{field('Location','location')}{field('Role','role')}</div><p className="fo-react-message warning">The existing backend does not support Field Officer profile edits. Save Changes stores these fields in this browser only.</p><div className="fo-react-actions"><button className="fo-react-button secondary" type="button" onClick={() => d.navigate(`/officer/${d.officerId}/profile`)}>Cancel</button><button className="fo-react-button" type="submit">Save Changes</button></div></form></section></FieldOfficerPageShell>;
}
