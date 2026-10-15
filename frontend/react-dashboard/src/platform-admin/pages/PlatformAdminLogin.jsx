import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { platformAdminRequest } from '../../services/platformAdminApi';
import '../styles/PlatformAdminLogin.css';

export default function PlatformAdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await platformAdminRequest('auth/login', { method: 'POST', body: JSON.stringify({ email: form.email.trim(), password: form.password, role: 'platform_admin' }) });
      if (result?.user?.role !== 'platform_admin' || !result.accessToken) throw new Error('Invalid Platform Admin credentials.');
      sessionStorage.setItem('accessToken', result.accessToken);
      sessionStorage.setItem('loggedInUser', JSON.stringify({ id: result.user.user_id, name: result.user.full_name, email: result.user.email, role: result.user.role, accessToken: result.accessToken }));
      navigate('/platform-admin', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="pa-login-page"><section className="pa-login-card"><p className="pa-login-eyebrow">TradeZo Internal Access</p><h1>TradeZo Platform Admin</h1><p className="pa-login-subtitle">Platform management &amp; revenue administration</p>
    <form onSubmit={submit}>
      <label htmlFor="pa-login-email">Email<input id="pa-login-email" type="email" required autoComplete="username" placeholder="superadmin@tradezo.gov.in" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
      <label htmlFor="pa-login-password">Password<input id="pa-login-password" type="password" required autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
      {error && <p className="pa-login-error" role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <aside className="pa-login-demo"><strong>Demo Super Admin Credentials</strong><span>Email: <code>superadmin@tradezo.gov.in</code></span><span>Password: <code>admin123</code></span></aside>
    <Link className="pa-login-home" to="/">← Return to public home</Link>
  </section></main>;
}
