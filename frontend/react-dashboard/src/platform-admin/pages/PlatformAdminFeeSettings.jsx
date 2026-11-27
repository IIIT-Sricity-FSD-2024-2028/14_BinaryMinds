import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPlatformAdminSettings,
  selectPlatformAdminReadModelError,
  selectPlatformAdminReadModelRequest,
  selectPlatformAdminSettings,
  updatePlatformAdminSettings,
} from '../state/platformAdminReadModelSlice.js';
import {
  selectPlatformAdminUi,
  setFeeSettingsForm,
  setFeeSettingsFormField,
} from '../state/platformAdminUiSlice.js';
import '../styles/PlatformAdminFeeSettings.css';

const settingFields = ['tradezo_revenue_percentage', 'default_platform_fee', 'default_base_processing_fee', 'default_service_tax_percentage'];

export default function PlatformAdminFeeSettings() {
  const dispatch = useDispatch();
  const settings = useSelector(selectPlatformAdminSettings);
  const form = useSelector(selectPlatformAdminUi).feeSettingsForm;
  const loadStatus = useSelector((state) => selectPlatformAdminReadModelRequest(state, 'fetchSettings'));
  const saveStatus = useSelector((state) => selectPlatformAdminReadModelRequest(state, 'updateSettings'));
  const loadError = useSelector((state) => selectPlatformAdminReadModelError(state, 'fetchSettings'));
  const saveError = useSelector((state) => selectPlatformAdminReadModelError(state, 'updateSettings'));
  const [notice, setNotice] = useState('');

  useEffect(() => { dispatch(fetchPlatformAdminSettings()); }, [dispatch]);
  useEffect(() => {
    if (settings) dispatch(setFeeSettingsForm(Object.fromEntries(settingFields.map((field) => [field, settings[field] ?? '']))));
  }, [dispatch, settings]);

  const loading = loadStatus === undefined || loadStatus === 'pending';
  const error = loadError || saveError;
  const saving = saveStatus === 'pending';
  const canSave = useMemo(() => form && settingFields.every((field) => form[field] !== '' && Number.isFinite(Number(form[field]))), [form]);

  async function save(event) {
    event.preventDefault();
    setNotice('');
    const body = Object.fromEntries(settingFields.map((field) => [field, Number(form[field])]));
    try {
      await dispatch(updatePlatformAdminSettings(body)).unwrap();
      setNotice('Fee settings saved successfully.');
    } catch { /* Redux stores the rejected request error. */ }
  }

  const setField = (field, value) => dispatch(setFeeSettingsFormField({ field, value }));
  return <section className="pa-fee-settings"><header><h1>Fee Settings</h1><p>Global platform fee and default municipality licensing fee structure</p></header>
    {error && <p className="pa-fee-error" role="alert">{error}</p>}{notice && <p className="pa-fee-notice" role="status">{notice}</p>}
    {loading ? <p className="pa-fee-state" role="status">Loading fee settings…</p> : form ? <form className="pa-fee-form" onSubmit={save}><div className="pa-fee-grid">
      <label>TradeZo Revenue Share (%) *<input type="number" min="0" max="100" step="1" required value={form.tradezo_revenue_percentage} onChange={(event) => setField('tradezo_revenue_percentage', event.target.value)} /></label>
      <label>Platform Fee (₹) *<input type="number" min="0" step="any" required value={form.default_platform_fee} onChange={(event) => setField('default_platform_fee', event.target.value)} /></label>
      <label>Base Processing Fee (₹) *<input type="number" min="0" step="any" required value={form.default_base_processing_fee} onChange={(event) => setField('default_base_processing_fee', event.target.value)} /></label>
      <label>Default Service Tax (%) *<input type="number" min="0" max="100" step="any" required value={form.default_service_tax_percentage} onChange={(event) => setField('default_service_tax_percentage', event.target.value)} /></label>
    </div><button type="submit" disabled={saving || !canSave}>{saving ? 'Saving…' : 'Save Fee Settings'}</button></form> : <p className="pa-fee-state">Fee settings were not returned by the backend.</p>}
  </section>;
}
