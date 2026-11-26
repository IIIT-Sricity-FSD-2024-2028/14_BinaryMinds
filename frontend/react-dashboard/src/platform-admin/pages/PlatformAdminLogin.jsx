import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginPlatformAdmin } from '../platformAdminAuthThunks.js';
import '../styles/PlatformAdminLogin.css';

export default function PlatformAdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await dispatch(loginPlatformAdmin({ email: form.email, password: form.password })).unwrap();
      navigate('/platform-admin', { replace: true });
    } catch (requestError) {
      setError(typeof requestError === 'string'
        ? requestError
        : requestError?.payload || requestError?.message || 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="pa-login-page"><section className="pa-login-card"><p className="pa-login-eyebrow">TradeZo Internal Access</p><h1>TradeZo Platform Admin</h1><p className="pa-login-subtitle">Platform management &amp; revenue administration</p>
    <form onSubmit={submit}>
      <label htmlFor="pa-login-email">Email<input id="pa-login-email" type="email" required autoComplete="username" placeholder="Platform Admin email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
      <label htmlFor="pa-login-password">Password<input id="pa-login-password" type="password" required autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
      {error && <p className="pa-login-error" role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <aside className="pa-login-demo"><strong>{import.meta.env.DEV ? 'Local Development Login' : 'Platform Admin Access'}</strong><span>Credentials must match PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD configured by the backend.</span><span>{import.meta.env.DEV ? 'Backend fallback values apply only when those variables are unset.' : 'Contact your system administrator if you do not have these credentials.'}</span></aside>
    <Link className="pa-login-home" to="/">← Return to public home</Link>
  </section></main>;
}
