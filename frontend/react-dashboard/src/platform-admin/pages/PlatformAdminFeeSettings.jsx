import { useEffect, useState } from 'react';
import { platformAdminRequest } from '../../services/platformAdminApi';
import '../styles/PlatformAdminFeeSettings.css';

const defaults = { default_platform_fee: '', default_base_processing_fee: '', default_service_tax_percentage: '' };

export default function PlatformAdminFeeSettings() {
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    platformAdminRequest('platform-admin/settings').then((settings) => { if (active) setForm({ default_platform_fee: settings.default_platform_fee ?? 250, default_base_processing_fee: settings.default_base_processing_fee ?? 1200, default_service_tax_percentage: settings.default_service_tax_percentage ?? 5 }); }).catch((requestError) => { if (active) setError(requestError.message || 'Unable to load fee settings.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const result = await platformAdminRequest('platform-admin/settings', { method: 'PATCH', body: JSON.stringify({ default_platform_fee: Number(form.default_platform_fee), default_base_processing_fee: Number(form.default_base_processing_fee), default_service_tax_percentage: Number(form.default_service_tax_percentage) }) });
      setForm({ default_platform_fee: result.default_platform_fee, default_base_processing_fee: result.default_base_processing_fee, default_service_tax_percentage: result.default_service_tax_percentage });
      setNotice('Fee settings saved successfully.');
    } catch (requestError) { setError(requestError.message || 'Unable to save fee settings.'); }
    finally { setSaving(false); }
  }
  return <section className="pa-fee-settings"><header><h1>Fee Settings</h1><p>Global platform fee and default municipality licensing fee structure</p></header>
    {error && <p className="pa-fee-error" role="alert">{error}</p>}{notice && <p className="pa-fee-notice" role="status">{notice}</p>}
    {loading ? <p className="pa-fee-state" role="status">Loading fee settings…</p> : <form className="pa-fee-form" onSubmit={save}><div className="pa-fee-grid">
      <label>Platform Fee (₹) *<input type="number" min="0" step="1" required value={form.default_platform_fee} onChange={(event) => setForm({ ...form, default_platform_fee: event.target.value })} /></label>
      <label>Base Processing Fee (₹) *<input type="number" min="0" step="1" required value={form.default_base_processing_fee} onChange={(event) => setForm({ ...form, default_base_processing_fee: event.target.value })} /></label>
      <label>Default Service Tax (%) *<input type="number" min="0" max="100" step="1" required value={form.default_service_tax_percentage} onChange={(event) => setForm({ ...form, default_service_tax_percentage: event.target.value })} /></label>
    </div><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Fee Settings'}</button></form>}
  </section>;
}
