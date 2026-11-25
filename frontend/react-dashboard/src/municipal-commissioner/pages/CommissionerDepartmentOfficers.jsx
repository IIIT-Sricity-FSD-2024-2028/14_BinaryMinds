import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CommissionerPageFrame from '../components/CommissionerPageFrame';
import {
  fetchDepartmentOfficerUsers,
  selectDepartmentOfficerUsersState,
} from '../../department-officer/store/usersSlice.js';
import '../styles/CommissionerDepartmentOfficers.css';

const empty = { full_name: '', email: '', phone: '', department: 'Trade License Department', password: '' };

export default function CommissionerDepartmentOfficers() {
  const dispatch = useDispatch();
  const userState = useSelector(selectDepartmentOfficerUsersState);
  const [form, setForm] = useState(null);

  useEffect(() => {
    dispatch(fetchDepartmentOfficerUsers());
  }, [dispatch]);

  const officer = useMemo(() => {
    const activeOfficers = userState.items.filter((user) =>
      user.role === 'department_officer' && String(user.status || 'Active').toLowerCase() !== 'inactive',
    );
    return activeOfficers.at(-1) || null;
  }, [userState.items]);
  const loading = userState.requests.fetchAll === undefined || userState.requests.fetchAll === 'pending';
  const error = userState.requests.fetchAll === 'rejected'
    ? userState.errors.fetchAll || 'Unable to load Department Officer.'
    : '';

  return <CommissionerPageFrame title="Department Officer Management" subtitle="Manage the Department Officer for this Municipal Corporation">
    <div className="page-top-bar"><span/><button className="btn-primary" onClick={() => setForm({ ...empty })}>{officer ? '⇄ Replace Department Officer' : '+ Add Department Officer'}</button></div>
    {error && <div className="alert-banner red-banner" role="alert">{error}</div>}
    {loading ? <div className="card" role="status">Loading Department Officer…</div> : officer ? <section className="card"><div className="card-title">Active Department Officer</div><div className="detail-grid commissioner-details">{[['Full Name', officer.full_name],['Email Address', officer.email],['Phone Number', officer.phone],['Employee ID', officer.employee_id],['Department', officer.department || 'Trade License Department'],['Status', officer.status || 'Active']].map(([label, value]) => <div className="detail-item" key={label}><label>{label}</label><p>{value || '—'}</p></div>)}</div></section> : !error && <section className="card commissioner-empty"><div className="commissioner-empty-icon">▤</div><h3>No Department Officer Added</h3><p>This municipality does not currently have an active Department Officer to review trade licenses and compliance reports.</p><button className="btn-primary" onClick={() => setForm({ ...empty })}>+ Add Department Officer</button></section>}
    {form && <div className="modal-overlay show" onMouseDown={(event) => event.target === event.currentTarget && setForm(null)}><div className="modal"><div className="modal-header"><div><div className="modal-title">{officer ? 'Replace Department Officer' : 'Add Department Officer'}</div><div className="modal-sub">{officer ? `Replace current officer (${officer.full_name})` : 'Enter details for this municipality’s Department Officer'}</div></div><button type="button" className="modal-close" onClick={() => setForm(null)}>×</button></div><div className="modal-body"><form onSubmit={(event) => event.preventDefault()}><div className="form-grid-2">{[['Full Name *','full_name','text'],['Email Address *','email','email'],['Phone Number *','phone','tel'],['Department','department','text'],['Password *','password','password']].map(([label,key,type]) => <label className="form-group" key={key}>{label}<input className="form-input" type={type} required value={form[key]} minLength={key==='password'?6:key==='full_name'?3:undefined} onChange={(event) => setForm({ ...form, [key]: event.target.value })}/></label>)}</div><div className="info-note">The existing shared Users Redux actions do not expose Department Officer creation or replacement. This form cannot submit those changes.</div><div className="form-actions"><button type="button" className="btn-outline" onClick={() => setForm(null)}>Cancel</button><button type="button" className="btn-primary" disabled>{officer ? 'Replacement unavailable' : 'Creation unavailable'}</button></div></form></div></div></div>}
  </CommissionerPageFrame>;
}
