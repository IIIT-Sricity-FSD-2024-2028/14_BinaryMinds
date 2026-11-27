import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CommissionerPageFrame from '../components/CommissionerPageFrame';
import { createDepartmentOfficerUser, fetchDepartmentOfficerUsers, selectDepartmentOfficerUsersState } from '../../features/users/usersSlice.js';
import { selectCommissionerUi, setDepartmentOfficerForm, setDepartmentOfficerFormField } from '../state/commissionerUiSlice.js';
import '../styles/CommissionerDepartmentOfficers.css';

const empty = { full_name: '', email: '', phone: '', department: 'Trade License Department', password: '' };

export default function CommissionerDepartmentOfficers() {
  const dispatch = useDispatch();
  const userState = useSelector(selectDepartmentOfficerUsersState);
  const form = useSelector(selectCommissionerUi).departmentOfficerForm;
  const [notice, setNotice] = useState('');
  useEffect(() => { dispatch(fetchDepartmentOfficerUsers()); }, [dispatch]);

  const officer = useMemo(() => {
    const active = userState.items.filter((user) => user.role === 'department_officer' && String(user.status || 'Active').toLowerCase() !== 'inactive');
    return active.at(-1) || null;
  }, [userState.items]);
  const loading = userState.requests.fetchAll === undefined || userState.requests.fetchAll === 'pending';
  const error = userState.requests.fetchAll === 'rejected' ? userState.errors.fetchAll || 'Unable to load Department Officer.' : '';
  const saveError = userState.requests.create === 'rejected' ? userState.errors.create || 'Unable to save Department Officer.' : '';
  const saving = userState.requests.create === 'pending';

  async function saveOfficer(event) {
    event.preventDefault();
    setNotice('');
    const result = await dispatch(createDepartmentOfficerUser({ ...form, role: 'department_officer', replace: Boolean(officer) }));
    if (createDepartmentOfficerUser.fulfilled.match(result)) {
      dispatch(setDepartmentOfficerForm(null));
      setNotice(officer ? 'Department Officer replaced.' : 'Department Officer created.');
    }
  }

  return <CommissionerPageFrame title="Department Officer Management" subtitle="Manage the Department Officer for this Municipal Corporation">
    <div className="page-top-bar"><span/><button className="btn-primary" onClick={() => dispatch(setDepartmentOfficerForm({ ...empty }))}>{officer ? '↔ Replace Department Officer' : '+ Add Department Officer'}</button></div>
    {(error || saveError) && <div className="alert-banner red-banner" role="alert">{error || saveError}</div>}
    {notice && <div className="alert-banner green-banner" role="status">{notice}</div>}
    {loading ? <div className="card" role="status">Loading Department Officer…</div> : officer ? <section className="card"><div className="card-title">Active Department Officer</div><div className="detail-grid commissioner-details">{[['Full Name', officer.full_name], ['Email Address', officer.email], ['Phone Number', officer.phone], ['Employee ID', officer.employee_id], ['Department', officer.department || 'Trade License Department'], ['Status', officer.status || 'Active']].map(([label, value]) => <div className="detail-item" key={label}><label>{label}</label><p>{value || '—'}</p></div>)}</div></section> : !error && <section className="card commissioner-empty"><div className="commissioner-empty-icon">▤</div><h3>No Department Officer Added</h3><p>This municipality does not currently have an active Department Officer to review trade licenses and compliance reports.</p><button className="btn-primary" onClick={() => dispatch(setDepartmentOfficerForm({ ...empty }))}>+ Add Department Officer</button></section>}
    {form && <div className="modal-overlay show" onMouseDown={(event) => event.target === event.currentTarget && !saving && dispatch(setDepartmentOfficerForm(null))}><div className="modal"><div className="modal-header"><div><div className="modal-title">{officer ? 'Replace Department Officer' : 'Add Department Officer'}</div><div className="modal-sub">{officer ? `Replace current officer (${officer.full_name})` : 'Enter details for this municipality’s Department Officer'}</div></div><button type="button" className="modal-close" onClick={() => dispatch(setDepartmentOfficerForm(null))}>×</button></div><div className="modal-body"><form onSubmit={saveOfficer}><div className="form-grid-2">{[['Full Name *', 'full_name', 'text'], ['Email Address *', 'email', 'email'], ['Phone Number *', 'phone', 'tel'], ['Department', 'department', 'text'], ['Password *', 'password', 'password']].map(([label, key, type]) => <label className="form-group" key={key}>{label}<input className="form-input" type={type} required value={form[key]} minLength={key === 'password' ? 6 : key === 'full_name' ? 3 : undefined} onChange={(event) => dispatch(setDepartmentOfficerFormField({ field: key, value: event.target.value }))}/></label>)}</div><div className="info-note">Employee ID and municipality assignment are managed by the backend.</div><div className="form-actions"><button type="button" className="btn-outline" disabled={saving} onClick={() => dispatch(setDepartmentOfficerForm(null))}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : officer ? 'Replace Officer' : 'Create Officer'}</button></div></form></div></div></div>}
  </CommissionerPageFrame>;
}
