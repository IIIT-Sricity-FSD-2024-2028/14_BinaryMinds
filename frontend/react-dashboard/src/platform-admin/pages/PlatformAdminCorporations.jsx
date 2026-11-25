import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  createMunicipality,
  deleteMunicipality,
  fetchAllMunicipalities,
  selectMunicipalities,
  selectMunicipalitiesError,
  selectMunicipalitiesRequest,
  updateMunicipality,
} from '../../features/municipalities/municipalitiesSlice.js';
import { fetchDepartmentOfficerUsers, selectDepartmentOfficerUsersState } from '../../department-officer/store/usersSlice.js';
import {
  fetchPlatformAdminCorporationSummaries,
  selectPlatformAdminCorporationSummaries,
  selectPlatformAdminReadModelError,
  selectPlatformAdminReadModelRequest,
} from '../../features/platformAdmin/platformAdminReadModelSlice.js';
import MunicipalOfficersModal from '../components/MunicipalOfficersModal';
import '../styles/PlatformAdminCorporations.css';

const emptyMunicipality = {
  name: '', municipality_id: '', state: '', district: '',
  base_processing_fee: '1200', platform_fee: '250', service_tax_percentage: '5', status: 'active',
};

export default function PlatformAdminCorporations() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const municipalities = useSelector(selectMunicipalities);
  const municipalityRequest = useSelector((state) => selectMunicipalitiesRequest(state, 'fetchAll'));
  const fetchError = useSelector((state) => selectMunicipalitiesError(state, 'fetchAll'));
  const createError = useSelector((state) => selectMunicipalitiesError(state, 'create'));
  const updateError = useSelector((state) => selectMunicipalitiesError(state, 'update'));
  const deleteError = useSelector((state) => selectMunicipalitiesError(state, 'delete'));
  const createStatus = useSelector((state) => selectMunicipalitiesRequest(state, 'create'));
  const updateStatus = useSelector((state) => selectMunicipalitiesRequest(state, 'update'));
  const deleteStatus = useSelector((state) => selectMunicipalitiesRequest(state, 'delete'));
  const usersState = useSelector(selectDepartmentOfficerUsersState);
  const corporationSummaries = useSelector(selectPlatformAdminCorporationSummaries);
  const summaryStatus = useSelector((state) => selectPlatformAdminReadModelRequest(state, 'corporations'));
  const summaryError = useSelector((state) => selectPlatformAdminReadModelError(state, 'corporations'));
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyMunicipality);

  useEffect(() => {
    dispatch(fetchAllMunicipalities());
    dispatch(fetchDepartmentOfficerUsers());
    dispatch(fetchPlatformAdminCorporationSummaries());
  }, [dispatch]);

  const loading = municipalityRequest === undefined || municipalityRequest === 'pending'
    || usersState.requests.fetchAll === undefined || usersState.requests.fetchAll === 'pending'
    || summaryStatus === undefined || summaryStatus === 'pending';
  const saving = createStatus === 'pending' || updateStatus === 'pending';
  const error = fetchError || usersState.errors.fetchAll || summaryError || createError || updateError || deleteError;
  const usersLoaded = usersState.requests.fetchAll === 'fulfilled';
  const rows = useMemo(() => municipalities.map((municipality) => {
    const municipalityId = String(municipality.municipality_id);
    const users = usersState.items.filter((user) => String(user.municipality_id || '').toLowerCase() === municipalityId.toLowerCase());
    const activeUsers = users.filter((user) => String(user.status || 'Active').toLowerCase() !== 'inactive');
    const head = usersLoaded ? users.find((user) => ['municipal_commissioner', 'super_user'].includes(user.role)) : null;
    return {
      ...municipality,
      municipal_head: head ? { name: head.full_name, email: head.email } : null,
      fieldOfficersCount: usersLoaded ? activeUsers.filter((user) => user.role === 'field_officer').length : null,
      departmentOfficersCount: usersLoaded ? activeUsers.filter((user) => user.role === 'department_officer').length : null,
      applicationCount: corporationSummaries[municipalityId]?.applications,
    };
  }), [municipalities, usersState.items, usersLoaded, corporationSummaries]);

  function openCreate() {
    setNotice('');
    setForm(emptyMunicipality);
    setSelected(null);
    setModal('create');
  }

  function openEdit(municipality) {
    setNotice('');
    setSelected(municipality);
    setForm({
      ...emptyMunicipality,
      ...municipality,
      base_processing_fee: String(municipality.base_processing_fee ?? ''),
      platform_fee: String(municipality.platform_fee ?? ''),
      service_tax_percentage: String(municipality.service_tax_percentage ?? ''),
    });
    setModal('edit');
  }

  async function saveMunicipality(event) {
    event.preventDefault();
    setNotice('');
    const body = {
      name: form.name.trim(),
      state: form.state.trim(),
      district: form.district.trim(),
      status: form.status,
      base_processing_fee: Number(form.base_processing_fee),
      platform_fee: Number(form.platform_fee),
      service_tax_percentage: Number(form.service_tax_percentage),
    };
    try {
      if (modal === 'create') {
        await dispatch(createMunicipality({ body: { ...body, municipality_id: form.municipality_id.trim() } })).unwrap();
        setNotice('New Municipal Corporation added successfully.');
      } else {
        await dispatch(updateMunicipality({ id: selected.municipality_id, body })).unwrap();
        setNotice(`Municipality ${selected.municipality_id} updated successfully.`);
      }
      setModal('');
      setSelected(null);
    } catch {
      // Redux stores the rejected request error.
    }
  }

  async function removeMunicipality(municipality) {
    const confirmed = window.confirm(`Delete municipality ${municipality.name} (${municipality.municipality_id})?`);
    if (!confirmed) return;
    setNotice('');
    try {
      await dispatch(deleteMunicipality({ id: municipality.municipality_id })).unwrap();
      setNotice(`Municipality ${municipality.municipality_id} deleted successfully.`);
    } catch {
      // Redux stores the rejected request error.
    }
  }

  return <section className="pa-corporations"><header className="pa-corporations-header"><div><h1>Municipal Corporations</h1><p>Configured cities, municipal heads, and officer strength</p></div><button className="pa-corp-primary" type="button" onClick={openCreate}>+ Add Municipality</button></header>
    {notice && <p className="pa-corp-notice" role="status">{notice}</p>}{error && <p className="pa-corp-error" role="alert">{error}</p>}
    {loading ? <p className="pa-corp-state" role="status">Loading municipal corporations…</p> : rows.length ? <div className="pa-corp-table-wrap"><table><thead><tr><th>Municipality / Corporation</th><th>State / District</th><th>Municipal Head</th><th>Active FO / DO Counts</th><th>Applications</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => {
      const id = row.municipality_id;
      return <tr key={id}><td><button className="pa-corp-name" type="button" onClick={() => setSelected({ id, name: row.name || id })}>{row.name || 'Unnamed'} <small>({id})</small></button></td><td>{row.state || '—'} / {row.district || '—'}</td><td>{row.municipal_head ? `${row.municipal_head.name}${row.municipal_head.email ? ` (${row.municipal_head.email})` : ''}` : <button className="pa-corp-inline" type="button" disabled title={usersLoaded ? 'The protected Users slice does not export a create-user thunk; municipal-head creation is unavailable here.' : 'Municipal-head records could not be loaded.'}>{usersLoaded ? 'Municipal Head creation unavailable' : 'Municipal Head unavailable'}</button>}</td><td>{row.fieldOfficersCount ?? '—'} FO / {row.departmentOfficersCount ?? '—'} DO</td><td><button className="pa-corp-inline" type="button" onClick={() => navigate(`/platform-admin/corporations/${encodeURIComponent(id)}/applications`, { state: { municipalityName: row.name || id, returnTo: '/platform-admin/corporations' } })}>View ({row.applicationCount ?? '—'})</button></td><td><button className="pa-corp-inline" type="button" onClick={() => openEdit(row)}>Edit</button>{' '}<button className="pa-corp-inline" type="button" disabled={deleteStatus === 'pending'} onClick={() => removeMunicipality(row)}>Delete</button></td></tr>;
    })}</tbody></table></div> : <p className="pa-corp-empty">No municipal corporations are available.</p>}

    {modal && <div className="pa-corp-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModal(''); }}><section className="pa-corp-modal" role="dialog" aria-modal="true" aria-labelledby="pa-corp-modal-title"><h2 id="pa-corp-modal-title">{modal === 'create' ? 'Add New Municipal Corporation' : 'Edit Municipal Corporation'}</h2><p>{modal === 'create' ? 'Configure a municipality and its default fee structure.' : 'Update municipality fields supported by the backend.'}</p>
      <form onSubmit={saveMunicipality}><div className="pa-corp-form-grid">
        <label className="full">Municipality Name *<input required maxLength="160" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Pune Municipal Corporation (PMC)" /></label>
        {modal === 'create' && <label>Unique Tenant ID *<input required maxLength="80" pattern="[A-Za-z0-9_-]+" value={form.municipality_id} onChange={(event) => setForm({ ...form, municipality_id: event.target.value })} placeholder="e.g. muni-pune" /></label>}
        <label>State *<input required value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} placeholder="Maharashtra" /></label>
        <label>District *<input required value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} placeholder="Pune" /></label>
        <label>Processing Fee (₹) *<input type="number" min="0" step="any" required value={form.base_processing_fee} onChange={(event) => setForm({ ...form, base_processing_fee: event.target.value })} /></label>
        <label>Platform Fee (₹) *<input type="number" min="0" step="any" required value={form.platform_fee} onChange={(event) => setForm({ ...form, platform_fee: event.target.value })} /></label>
        <label>Service Tax (%) *<input type="number" min="0" max="100" step="any" required value={form.service_tax_percentage} onChange={(event) => setForm({ ...form, service_tax_percentage: event.target.value })} /></label>
        {modal === 'edit' && <label>Status *<select required value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>}
      </div><p className="pa-corp-modal-note">Municipal-head account creation is unavailable: the protected Users slice does not export the required create thunk.</p><div className="pa-corp-modal-actions"><button type="button" className="pa-corp-secondary" onClick={() => setModal('')} disabled={saving}>Cancel</button><button className="pa-corp-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : modal === 'create' ? 'Add Corporation' : 'Save Changes'}</button></div></form></section></div>}
    {selected && !modal && selected.municipality_id === undefined && <MunicipalOfficersModal municipality={selected} users={usersState.items} loading={usersState.requests.fetchAll === undefined || usersState.requests.fetchAll === 'pending'} error={usersState.errors.fetchAll} onClose={() => setSelected(null)} />}
  </section>;
}
