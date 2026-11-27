import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDepartmentOfficerUsers, selectDepartmentOfficerUsersState } from '../../features/users/usersSlice.js';
import { fetchAllMunicipalities, selectMunicipalities, selectMunicipalitiesError, selectMunicipalitiesRequest } from '../../features/municipalities/municipalitiesSlice.js';
import { fetchPlatformAdminCorporationSummaries, selectPlatformAdminCorporationSummaries, selectPlatformAdminReadModelError, selectPlatformAdminReadModelRequest } from '../state/platformAdminReadModelSlice.js';
import MunicipalOfficersModal from '../components/MunicipalOfficersModal';
import '../styles/PlatformAdminDashboard.css';

export default function PlatformAdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const municipalities = useSelector(selectMunicipalities);
  const summaries = useSelector(selectPlatformAdminCorporationSummaries);
  const municipalityRequest = useSelector((state) => selectMunicipalitiesRequest(state, 'fetchAll'));
  const municipalityError = useSelector((state) => selectMunicipalitiesError(state, 'fetchAll'));
  const summaryRequest = useSelector((state) => selectPlatformAdminReadModelRequest(state, 'corporations'));
  const summaryError = useSelector((state) => selectPlatformAdminReadModelError(state, 'corporations'));
  const userState = useSelector(selectDepartmentOfficerUsersState);
  const usersLoaded = userState.requests.fetchAll === 'fulfilled';

  useEffect(() => {
    dispatch(fetchAllMunicipalities());
    dispatch(fetchDepartmentOfficerUsers());
    dispatch(fetchPlatformAdminCorporationSummaries());
  }, [dispatch]);

  const openMunicipalityOfficers = (municipality) => {
    setSelected({ id: municipality.municipality_id, name: municipality.name || municipality.municipality_id });
  };

  const corporations = useMemo(() => municipalities.map((municipality) => ({
    ...municipality,
    corporation_id: municipality.municipality_id,
    municipal_head: usersLoaded
      ? userState.items.find((user) => (
        String(user.municipality_id || '').toLowerCase() === String(municipality.municipality_id).toLowerCase()
        && ['municipal_commissioner', 'super_user'].includes(user.role)
      )) ?? null
      : null,
  })), [municipalities, userState.items, usersLoaded]);
  const loading = municipalityRequest === undefined || municipalityRequest === 'pending'
    || userState.requests.fetchAll === undefined || userState.requests.fetchAll === 'pending'
    || summaryRequest === undefined || summaryRequest === 'pending';
  const error = municipalityRequest === 'rejected'
    ? municipalityError || 'Unable to load municipalities.'
    : userState.requests.fetchAll === 'rejected'
      ? userState.errors.fetchAll || 'Unable to load municipal heads.'
      : summaryRequest === 'rejected' ? summaryError || 'Unable to load corporation summaries.' : '';

  return <section className="pa-dashboard"><header className="pa-page-header"><h1>Dashboard</h1><p>Platform overview and municipal corporation summary</p></header>
    {loading ? <p className="pa-dashboard-status" role="status">Loading dashboard…</p> : error ? <p className="pa-dashboard-error" role="alert">{error}</p> : <>
      <section className="pa-dashboard-section"><h2>Municipal Corporations</h2><p>Configured cities, municipal heads, and application access</p>
        {corporations.length ? <div className="pa-table-wrap"><table><thead><tr><th>Municipality / Corporation</th><th>State / District</th><th>Municipal Head</th><th>Applications</th></tr></thead><tbody>{corporations.map((row) => {
          const id = row.corporation_id || row.municipality_id;
          return <tr key={id}><td><button className="pa-text-action" type="button" onClick={() => openMunicipalityOfficers(row)}>{row.name || 'Unnamed'} <small>({id})</small></button></td><td>{row.state || '—'} / {row.district || '—'}</td><td>{row.municipal_head ? `${row.municipal_head.full_name || row.municipal_head.name || 'Name unavailable'}${row.municipal_head.email ? ` (${row.municipal_head.email})` : ''}` : <button className="pa-action-button" type="button" onClick={() => navigate('/platform-admin/corporations')}>+ Add Head</button>}</td><td><button className="pa-action-button" type="button" onClick={() => navigate(`/platform-admin/corporations/${encodeURIComponent(id)}/applications`, { state: { municipalityName: row.name || id, returnTo: '/platform-admin' } })}>View</button></td></tr>;
        })}</tbody></table></div> : <p className="pa-empty">No municipal corporations are available.</p>}
      </section>
    </>}
    {selected && <MunicipalOfficersModal municipality={selected} users={userState.items} loading={userState.requests.fetchAll === undefined || userState.requests.fetchAll === 'pending'} error={userState.errors.fetchAll} onClose={() => setSelected(null)} />}
  </section>;
}
