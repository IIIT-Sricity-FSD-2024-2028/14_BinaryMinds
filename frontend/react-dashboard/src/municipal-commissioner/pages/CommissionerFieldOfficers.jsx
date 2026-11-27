import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CommissionerPageFrame from '../components/CommissionerPageFrame';
import {
  createDepartmentOfficerUser,
  deleteDepartmentOfficerUser,
  fetchDepartmentOfficerUsers,
  selectDepartmentOfficerUsersState,
  updateDepartmentOfficerUser,
} from '../../features/users/usersSlice.js';
import '../styles/CommissionerFieldOfficers.css';
import { selectCommissionerUi, setFieldOfficerEditor, setFieldOfficerFormField } from '../state/commissionerUiSlice.js';

const blank = { full_name: '', email: '', phone: '', password: '', status: 'Active' };

export default function CommissionerFieldOfficers() {
  const dispatch = useDispatch();
  const userState = useSelector(selectDepartmentOfficerUsersState);
  const editor = useSelector(selectCommissionerUi);
  const form = editor.fieldOfficerForm;
  const editing = editor.fieldOfficerEditingId == null ? null : userState.items.find((user) => String(user.user_id) === String(editor.fieldOfficerEditingId)) || { user_id: editor.fieldOfficerEditingId };
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    dispatch(fetchDepartmentOfficerUsers());
  }, [dispatch]);

  const users = useMemo(
    () => userState.items.filter((user) => ['field_officer', 'field officer', 'fo'].includes(String(user.role).toLowerCase())),
    [userState.items],
  );
  const visible = useMemo(
    () => users.filter((user) => `${user.employee_id || ''} ${user.full_name} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase())),
    [users, query],
  );

  const fetchStatus = userState.requests.fetchAll;
  const loading = fetchStatus === undefined || fetchStatus === 'pending';
  const saving = userState.requests.update === 'pending' || userState.requests.create === 'pending';
  const deleting = userState.requests.delete === 'pending';
  const busy = saving || deleting;
  const error = [
    ['fetchAll', 'Unable to load Field Officers.'],
    ['create', 'Unable to create Field Officer.'],
    ['update', 'Unable to update Field Officer.'],
    ['delete', 'Unable to delete Field Officer.'],
  ].find(([operation]) => userState.requests[operation] === 'rejected');
  const errorMessage = error
    ? userState.errors[error[0]] || error[1]
    : '';

  const save = async (event) => {
    event.preventDefault();
    setNotice('');
    const body = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: form.status,
    };
    if (form.password) body.password = form.password;

    const result = editing
      ? await dispatch(updateDepartmentOfficerUser({ id: editing.user_id, body }))
      : await dispatch(createDepartmentOfficerUser({ ...body, role: 'field_officer' }));
    if (updateDepartmentOfficerUser.fulfilled.match(result) || createDepartmentOfficerUser.fulfilled.match(result)) {
      dispatch(setFieldOfficerEditor({ form: null, editingId: null }));
      setNotice(editing ? 'Field Officer updated.' : 'Field Officer created.');
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.full_name}?`)) return;
    setNotice('');
    const result = await dispatch(deleteDepartmentOfficerUser(user.user_id));
    if (deleteDepartmentOfficerUser.fulfilled.match(result)) {
      setNotice('Field Officer deleted.');
    }
  };

  return <CommissionerPageFrame title="Field Officer Management" subtitle="Manage field officer accounts and access">
    <div className="page-top-bar"><span /> <button className="btn-primary" onClick={() => { dispatch(setFieldOfficerEditor({ form: { ...blank }, editingId: null })); }}>+ Add Field Officer</button></div>
    {errorMessage && <div className="alert-banner red-banner" role="alert">{errorMessage}</div>}
    {notice && <div className="alert-banner green-banner" role="status">{notice}</div>}
    <section className="card"><div className="um-filter-bar"><div className="um-stats"><span>Total Field Officers: <strong>{users.length}</strong></span><span className="green">Active: <strong>{users.filter((user) => (user.status || 'Active').toLowerCase() === 'active').length}</strong></span><span className="blue">Field Officers: <strong>{users.length}</strong></span></div><input className="search-input" placeholder="Search by name, email, or ID..." value={query} onChange={(event) => setQuery(event.target.value)}/></div>
      <table className="data-table"><thead><tr><th>Employee ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map((user) => <tr key={user.user_id}><td>{user.employee_id || 'Not assigned'}</td><td><span className="avatar-circle">{(user.full_name || 'F')[0]}</span> {user.full_name}</td><td>{user.email}</td><td><span className="badge badge-blue">Field Officer</span></td><td><span className={`badge ${(user.status || 'Active').toLowerCase() === 'active' ? 'badge-green' : 'badge-grey'}`}>{user.status || 'Active'}</span></td><td className="action-btns"><button className="btn-sm btn-edit" disabled={busy} onClick={() => { dispatch(setFieldOfficerEditor({ editingId: user.user_id, form: { full_name: user.full_name || '', email: user.email || '', phone: user.phone || '', password: '', status: user.status || 'Active' } })); }}>✎ Edit</button><button className="btn-sm btn-delete" disabled={busy} onClick={() => remove(user)}>Delete</button></td></tr>)}{!visible.length && <tr><td colSpan="6" className="empty-row">{loading ? 'Loading Field Officers…' : errorMessage ? 'Field Officers could not be loaded.' : 'No Field Officers found.'}</td></tr>}</tbody></table>
    </section>
    {form && <Modal title={editing ? 'Edit Field Officer Details' : 'Add Field Officer'} close={() => { if (!busy) { dispatch(setFieldOfficerEditor({ form: null, editingId: null })); } }}><form onSubmit={save}>
      <div className="form-grid-2"><Field label="Full Name *" value={form.full_name} onChange={(value) => dispatch(setFieldOfficerFormField({ field: 'full_name', value }))} required minLength={3}/><Field label="Email *" type="email" value={form.email} onChange={(value) => dispatch(setFieldOfficerFormField({ field: 'email', value }))} required/><Field label="Phone *" value={form.phone} onChange={(value) => dispatch(setFieldOfficerFormField({ field: 'phone', value }))} required/>{!editing && <Field label="Password *" type="password" value={form.password} onChange={(value) => dispatch(setFieldOfficerFormField({ field: 'password', value }))} required minLength={6} />}{editing && <label className="form-group">Status<select className="form-input" value={form.status} onChange={(event) => dispatch(setFieldOfficerFormField({ field: 'status', value: event.target.value }))}><option>Active</option><option>Inactive</option></select></label>}</div>
      <div className="form-actions"><button type="button" className="btn-outline" disabled={busy} onClick={() => { dispatch(setFieldOfficerEditor({ form: null, editingId: null })); }}>Cancel</button><button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Field Officer'}</button></div>
    </form></Modal>}
  </CommissionerPageFrame>;
}

function Field({ label, value, onChange, ...props }) {
  return <label className="form-group">{label}<input className="form-input" value={value} onChange={(event) => onChange(event.target.value)} {...props}/></label>;
}

function Modal({ title, close, children }) {
  return <div className="modal-overlay show" onMouseDown={(event) => event.target === event.currentTarget && close()}><div className="modal"><div className="modal-header"><div className="modal-title">{title}</div><button type="button" className="modal-close" onClick={close}>×</button></div><div className="modal-body">{children}</div></div></div>;
}
