import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformAdminRequest } from '../../services/platformAdminApi';
import MunicipalOfficersModal from '../components/MunicipalOfficersModal';
import '../styles/PlatformAdminDashboard.css';

const rowsFrom = (payload) => Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

export default function PlatformAdminDashboard() {
  const navigate = useNavigate();
  const [corporations, setCorporations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    platformAdminRequest('platform-admin/corporations')
      .then((corpPayload) => { if (active) setCorporations(rowsFrom(corpPayload)); })
      .catch((requestError) => { if (active) setError(requestError.message || 'Unable to load the dashboard.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <section className="pa-dashboard"><header className="pa-page-header"><h1>Dashboard</h1><p>Platform overview and municipal corporation summary</p></header>
    {loading ? <p className="pa-dashboard-status" role="status">Loading dashboard…</p> : error ? <p className="pa-dashboard-error" role="alert">{error}</p> : <>
      <section className="pa-dashboard-section"><h2>Municipal Corporations</h2><p>Configured cities, municipal heads, and application access</p>
        {corporations.length ? <div className="pa-table-wrap"><table><thead><tr><th>Municipality / Corporation</th><th>State / District</th><th>Municipal Head</th><th>Applications</th></tr></thead><tbody>{corporations.map((row) => {
          const id = row.corporation_id || row.municipality_id;
          return <tr key={id}><td><button className="pa-text-action" type="button" onClick={() => setSelected({ id, name: row.name || id })}>{row.name || 'Unnamed'} <small>({id})</small></button></td><td>{row.state || '—'} / {row.district || '—'}</td><td>{row.municipal_head ? `${row.municipal_head.name}${row.municipal_head.email ? ` (${row.municipal_head.email})` : ''}` : <button className="pa-action-button" type="button" onClick={() => navigate('/platform-admin/corporations')}>+ Add Head</button>}</td><td><button className="pa-action-button" type="button" onClick={() => navigate(`/platform-admin/corporations/${encodeURIComponent(id)}/applications`, { state: { municipalityName: row.name || id, returnTo: '/platform-admin' } })}>View</button></td></tr>;
        })}</tbody></table></div> : <p className="pa-empty">No municipal corporations are available.</p>}
      </section>
    </>}
    {selected && <MunicipalOfficersModal municipality={selected} onClose={() => setSelected(null)} />}
  </section>;
}
