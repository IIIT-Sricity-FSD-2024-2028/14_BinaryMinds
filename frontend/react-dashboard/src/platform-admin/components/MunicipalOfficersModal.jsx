import { useEffect, useState } from 'react';
import { platformAdminRequest } from '../../services/platformAdminApi';
import './MunicipalOfficersModal.css';

export default function MunicipalOfficersModal({ municipality, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    platformAdminRequest('users')
      .then((payload) => {
        const rows = Array.isArray(payload) ? payload : payload?.data;
        if (active) setUsers(Array.isArray(rows) ? rows.filter((user) => String(user.municipality_id || '').toLowerCase() === String(municipality.id).toLowerCase()) : []);
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Unable to load municipal officers.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [municipality.id]);

  const groups = [
    ['Municipal Commissioner / Head', ['municipal_commissioner', 'super_user'], 'head'],
    ['Department Officer (DO)', ['department_officer'], 'department'],
    ['Field Officer (FO)', ['field_officer'], 'field'],
  ];

  return <div className="pa-officer-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="pa-officer-modal" role="dialog" aria-modal="true" aria-labelledby="pa-officer-title">
      <header><div><h2 id="pa-officer-title">{municipality.name}</h2><p>Tenant ID: {municipality.id} · Assigned officers</p></div><button type="button" className="pa-close" onClick={onClose} aria-label="Close">×</button></header>
      {loading ? <p className="pa-modal-status">Loading assigned officers…</p> : error ? <p className="pa-modal-error" role="alert">{error}</p> : <div className="pa-officer-groups">{groups.map(([label, roles, tone]) => {
        const members = users.filter((user) => roles.includes(user.role));
        return <section className={`pa-officer-group ${tone}`} key={label}><h3>{label}</h3>{members.length ? members.map((person) => <div className="pa-person" key={person.user_id || person.email}><strong>{person.full_name || 'Name unavailable'}</strong><span>{person.email || 'Email unavailable'}</span><span>{person.phone || 'Phone unavailable'}</span></div>) : <p>No {label} currently registered.</p>}</section>;
      })}</div>}
    </section>
  </div>;
}
