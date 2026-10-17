import { useEffect, useState } from 'react';
import { platformAdminRequest } from '../../services/platformAdminApi';
import './MunicipalOfficersModal.css';

export default function MunicipalOfficersModal({ municipality, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

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
      {loading ? <p className="pa-modal-status">Loading assigned officers…</p> : error ? <p className="pa-modal-error" role="alert">{error}</p> : <>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#475569', fontSize: 13 }}>
          Officer status
          <select aria-label="Filter officers by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="active">Active officers</option>
            <option value="inactive">Inactive officers</option>
          </select>
        </label>
        <div className="pa-officer-groups">{groups.map(([label, roles, tone]) => {
          const members = users.filter((user) => {
            const isActive = (user.status || 'Active').toLowerCase() !== 'inactive';
            return roles.includes(user.role) && (statusFilter === 'active' ? isActive : !isActive);
          });
          return <section className={`pa-officer-group ${tone}`} key={label}><h3>{label}</h3>{members.length ? members.map((person) => {
            const isActive = (person.status || 'Active').toLowerCase() !== 'inactive';
            return <div className="pa-person" key={person.user_id || person.email}><strong>{person.full_name || 'Name unavailable'} <span style={{ display: 'inline-block', marginLeft: 8, padding: '2px 7px', borderRadius: 999, background: isActive ? '#dcfce7' : '#e2e8f0', color: isActive ? '#166534' : '#475569', fontSize: 11, fontWeight: 600, verticalAlign: 'middle' }}>{isActive ? 'Active' : 'Inactive'}</span></strong><span>{person.email || 'Email unavailable'}</span><span>{person.phone || 'Phone unavailable'}</span></div>;
          }) : <p>No {statusFilter} {label.toLowerCase()} records.</p>}</section>;
      })}</div>
      </>}
    </section>
  </div>;
}
