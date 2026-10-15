import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformAdminRequest } from '../../services/platformAdminApi';
import MunicipalOfficersModal from '../components/MunicipalOfficersModal';
import '../styles/PlatformAdminCorporations.css';

const rowsFrom = (payload) => Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
const emptyCorporation = { name: '', municipality_id: '', state: '', district: '', base_processing_fee: '1200', platform_fee: '250', service_tax_percentage: '5', head_name: '', head_email: '' };

export default function PlatformAdminCorporations() {
  const navigate = useNavigate();
  const [corporations, setCorporations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyCorporation);
  const [headForm, setHeadForm] = useState({ full_name: '', email: '', phone: '', password: 'super123' });
  const [targetCorporation, setTargetCorporation] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setCorporations(rowsFrom(await platformAdminRequest('platform-admin/corporations'))); }
    catch (requestError) { setError(requestError.message || 'Unable to load municipal corporations.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openHead(corporation) {
    setTargetCorporation(corporation);
    setHeadForm({ full_name: '', email: '', phone: '', password: 'super123' });
    setModal('head');
  }

  async function addCorporation(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const body = { municipality_id: form.municipality_id.trim(), name: form.name.trim(), state: form.state.trim(), district: form.district.trim(), base_processing_fee: Number(form.base_processing_fee), platform_fee: Number(form.platform_fee), service_tax_percentage: Number(form.service_tax_percentage), status: 'active' };
    if (form.head_name.trim()) body.head_name = form.head_name.trim();
    if (form.head_email.trim()) body.head_email = form.head_email.trim();
    try {
      await platformAdminRequest('municipalities', { method: 'POST', body: JSON.stringify(body) });
      setModal(''); setForm(emptyCorporation); setNotice('New Municipal Corporation added successfully.'); await load();
    } catch (requestError) { setError(requestError.message || 'Failed to add corporation.'); }
    finally { setSaving(false); }
  }

  async function addHead(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      await platformAdminRequest('users', { method: 'POST', body: JSON.stringify({ full_name: headForm.full_name.trim(), email: headForm.email.trim(), phone: headForm.phone.trim(), role: 'municipal_commissioner', municipality_id: targetCorporation.id, password_hash: headForm.password }) });
      setModal(''); setNotice(`Municipal Head created successfully for ${targetCorporation.id}.`); await load();
    } catch (requestError) { setError(requestError.message || 'Failed to create Municipal Head.'); }
    finally { setSaving(false); }
  }

  return <section className="pa-corporations"><header className="pa-corporations-header"><div><h1>Municipal Corporations</h1><p>Configured cities, municipal heads, and officer strength</p></div><button className="pa-corp-primary" type="button" onClick={() => { setError(''); setForm(emptyCorporation); setModal('corporation'); }}>+ Add Municipality</button></header>
    {notice && <p className="pa-corp-notice" role="status">{notice}</p>}{error && <p className="pa-corp-error" role="alert">{error}</p>}
    {loading ? <p className="pa-corp-state" role="status">Loading municipal corporations…</p> : corporations.length ? <div className="pa-corp-table-wrap"><table><thead><tr><th>Municipality / Corporation</th><th>State / District</th><th>Municipal Head</th><th>FO / DO Counts</th><th>Applications</th></tr></thead><tbody>{corporations.map((row) => {
      const id = row.corporation_id || row.municipality_id;
      return <tr key={id}><td><button className="pa-corp-name" type="button" onClick={() => setSelected({ id, name: row.name || id })}>{row.name || 'Unnamed'} <small>({id})</small></button></td><td>{row.state || '—'} / {row.district || '—'}</td><td>{row.municipal_head ? `${row.municipal_head.name}${row.municipal_head.email ? ` (${row.municipal_head.email})` : ''}` : <button className="pa-corp-inline" type="button" onClick={() => openHead({ id, name: row.name || id })}>+ Add Head</button>}</td><td>{row.field_officers_count ?? 0} FO / {row.department_officers_count ?? 0} DO</td><td><button className="pa-corp-inline" type="button" onClick={() => navigate(`/platform-admin/corporations/${encodeURIComponent(id)}/applications`, { state: { municipalityName: row.name || id, returnTo: '/platform-admin/corporations' } })}>View ({row.applications ?? 0})</button></td></tr>;
    })}</tbody></table></div> : <p className="pa-corp-empty">No municipal corporations are available.</p>}

    {modal && <div className="pa-corp-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModal(''); }}><section className="pa-corp-modal" role="dialog" aria-modal="true" aria-labelledby="pa-corp-modal-title"><h2 id="pa-corp-modal-title">{modal === 'corporation' ? 'Add New Municipal Corporation' : 'Create Municipal Head (Commissioner)'}</h2><p>{modal === 'corporation' ? 'Add a new municipality tenant with localized processing fees and administrative scope.' : 'Create an account with administrative authority over this corporation.'}</p>
      {modal === 'corporation' ? <form onSubmit={addCorporation}><div className="pa-corp-form-grid">
        <label className="full">Municipality Name *<input required maxLength="160" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Pune Municipal Corporation (PMC)" /></label>
        <label>Unique Tenant ID *<input required maxLength="80" pattern="[A-Za-z0-9_-]+" value={form.municipality_id} onChange={(event) => setForm({ ...form, municipality_id: event.target.value })} placeholder="e.g. muni-pune" /></label>
        <label>State *<input required value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} placeholder="Maharashtra" /></label>
        <label>District *<input required value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} placeholder="Pune" /></label>
        <label>Processing Fee (₹) *<input type="number" min="0" step="1" required value={form.base_processing_fee} onChange={(event) => setForm({ ...form, base_processing_fee: event.target.value })} /></label>
        <label>Platform Fee (₹) *<input type="number" min="0" step="1" required value={form.platform_fee} onChange={(event) => setForm({ ...form, platform_fee: event.target.value })} /></label>
        <label>Service Tax (%) *<input type="number" min="0" max="100" step="1" required value={form.service_tax_percentage} onChange={(event) => setForm({ ...form, service_tax_percentage: event.target.value })} /></label>
        <label>Municipal Head Name<input value={form.head_name} onChange={(event) => setForm({ ...form, head_name: event.target.value })} placeholder="Optional" /></label>
        <label>Municipal Head Email<input type="email" value={form.head_email} onChange={(event) => setForm({ ...form, head_email: event.target.value })} placeholder="Optional" /></label>
      </div><div className="pa-corp-modal-actions"><button type="button" className="pa-corp-secondary" onClick={() => setModal('')} disabled={saving}>Cancel</button><button className="pa-corp-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Corporation'}</button></div></form> : <form onSubmit={addHead}><div className="pa-corp-form-grid"><label className="full">Municipal Corporation<input disabled value={`${targetCorporation?.name} (${targetCorporation?.id})`} /></label><label className="full">Full Name *<input required maxLength="120" value={headForm.full_name} onChange={(event) => setHeadForm({ ...headForm, full_name: event.target.value })} /></label><label>Email Address *<input type="email" required maxLength="120" value={headForm.email} onChange={(event) => setHeadForm({ ...headForm, email: event.target.value })} /></label><label>Phone Number *<input required maxLength="15" value={headForm.phone} onChange={(event) => setHeadForm({ ...headForm, phone: event.target.value })} /></label><label className="full">Temporary Password *<input type="password" minLength="6" required value={headForm.password} onChange={(event) => setHeadForm({ ...headForm, password: event.target.value })} /><small>Temporary password can be changed when creating the account.</small></label></div><div className="pa-corp-modal-actions"><button type="button" className="pa-corp-secondary" onClick={() => setModal('')} disabled={saving}>Cancel</button><button className="pa-corp-primary" type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Municipal Head'}</button></div></form>}</section></div>}
    {selected && <MunicipalOfficersModal municipality={selected} onClose={() => setSelected(null)} />}
  </section>;
}
