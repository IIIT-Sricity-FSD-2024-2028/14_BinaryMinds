import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginApplicant, selectLoginError, selectLoginForm, selectLoginStatus, setLoginFormField } from '../../features/auth/authSlice.js';
import '../styles/PlatformAdminLogin.css';

export default function PlatformAdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const form = useSelector(selectLoginForm);
  const error = useSelector(selectLoginError);
  const busy = useSelector(selectLoginStatus) === 'pending';

  async function submit(event) {
    event.preventDefault();
    try {
      await dispatch(loginApplicant({ email: form.email, password: form.password, role: 'platform_admin' })).unwrap();
      navigate('/platform-admin', { replace: true });
    } catch { /* Error is stored centrally in auth state. */ }
  }

  return <main className="pa-login-page"><section className="pa-login-card"><p className="pa-login-eyebrow">TradeZo Internal Access</p><h1>TradeZo Platform Admin</h1><p className="pa-login-subtitle">Platform management &amp; revenue administration</p>
    <form onSubmit={submit}>
      <label htmlFor="pa-login-email">Email<input id="pa-login-email" type="email" required autoComplete="username" placeholder="Platform Admin email" value={form.email} onChange={(event) => dispatch(setLoginFormField({ field: 'email', value: event.target.value }))} /></label>
      <label htmlFor="pa-login-password">Password<input id="pa-login-password" type="password" required autoComplete="current-password" value={form.password} onChange={(event) => dispatch(setLoginFormField({ field: 'password', value: event.target.value }))} /></label>
      {error && <p className="pa-login-error" role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <aside className="pa-login-demo"><strong>{import.meta.env.DEV ? 'Local Development Login' : 'Platform Admin Access'}</strong><span>{import.meta.env.DEV ? <>Email: <a href="mailto:superadmin@tradezo.gov.in">superadmin@tradezo.gov.in</a> · Password: admin123</> : 'Credentials must match PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD configured by the backend.'}</span>{!import.meta.env.DEV && <span>Contact your system administrator if you do not have these credentials.</span>}</aside>
    <Link className="pa-login-home" to="/">← Return to public home</Link>
  </section></main>;
}
