import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CommissionerPageFrame from '../components/CommissionerPageFrame';
import { selectMunicipalityId } from '../../features/auth/authSelectors.js';
import {
  fetchMunicipalityById,
  selectMunicipalityById,
  selectMunicipalitiesError,
  selectMunicipalitiesRequest,
} from '../../features/municipalities/municipalitiesSlice.js';
import '../styles/CommissionerSettings.css';

const currency = (amount) => (amount === undefined || amount === null
  ? '—'
  : `₹${Number(amount).toLocaleString('en-IN')}`);

export default function CommissionerSettings() {
  const dispatch = useDispatch();
  const municipalityId = useSelector(selectMunicipalityId);
  const municipality = useSelector((state) => selectMunicipalityById(state, municipalityId));
  const requestStatus = useSelector((state) => selectMunicipalitiesRequest(state, 'fetchById'));
  const requestError = useSelector((state) => selectMunicipalitiesError(state, 'fetchById'));

  useEffect(() => {
    if (municipalityId) dispatch(fetchMunicipalityById({ id: municipalityId }));
  }, [dispatch, municipalityId]);

  const loading = Boolean(municipalityId) && (requestStatus === undefined || requestStatus === 'pending');
  const error = requestStatus === 'rejected' ? requestError || 'Unable to load municipality settings.' : '';

  return <CommissionerPageFrame title="System Settings" subtitle="Municipal configuration and system settings">
    <div className="alert-banner blue-banner"><strong>Settings availability:</strong> Trade categories, renewal fees, notification settings, security settings, backup controls, and system information have no Commissioner API. The values below are read-only fields from this municipality’s backend record.</div>

    <section className="card"><div className="card-top-bar"><div><div className="card-title">Trade Category Management</div><div className="card-sub">No backend category repository or Commissioner category endpoint is available.</div></div><button className="btn-primary" type="button" disabled title="No supported category API is available">+ Add Category</button></div><p className="empty">Trade categories cannot be displayed or changed from this portal.</p></section>

    <section className="card"><div className="card-title">Municipal Fee Configuration</div><div className="card-sub">Values are read from the municipality repository. Editing requires Platform Admin authorization; no renewal-fee field is provided by the backend.</div>
      {error && <div className="alert-banner red-banner" role="alert">{error}</div>}
      {loading ? <p role="status">Loading municipality fee values…</p> : !municipalityId ? <p className="empty">Your authenticated session has no municipality ID, so municipal fee values cannot be loaded.</p> : municipality ? <>
        <div className="fee-summary-box"><div className="fee-summary-title">{municipality.name || municipality.municipality_id}</div><div className="fee-summary-row-2"><div><div className="fee-label">Base Processing Fee</div><div className="fee-val">{currency(municipality.base_processing_fee)}</div></div><div><div className="fee-label">Platform Fee</div><div className="fee-val">{currency(municipality.platform_fee)}</div></div><div><div className="fee-label">Service Tax</div><div className="fee-val">{municipality.service_tax_percentage ?? '—'}%</div></div></div></div>
        <p className="form-hint">Renewal fee is not represented by the municipality API.</p>
      </> : !error && <p className="empty">No municipality record was returned.</p>}
    </section>

    <section className="card"><div className="card-title">System Information</div><p className="empty">No system-information endpoint is available to this portal.</p></section>

    <div className="settings-grid">{['Notification Settings', 'Security Settings', 'Backup & Recovery'].map((label) => <button type="button" className="settings-card" key={label} disabled title="No supported backend endpoint is available"><div className="settings-card-title">{label}</div><div className="settings-card-sub">No supported server setting endpoint is available.</div><span className="settings-link">Unavailable</span></button>)}</div>
  </CommissionerPageFrame>;
}
