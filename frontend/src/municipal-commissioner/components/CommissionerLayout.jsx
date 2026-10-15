import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getCommissionerProfile } from '../../services/api';

const links = [
  ['Dashboard', '/superuser', 'dashboard'],
  ['Field Officer Management', '/superuser/field-officers', 'user'],
  ['Department Officer Management', '/superuser/department-officers', 'department'],
  ['Applications Overview', '/superuser/applications', 'applications'],
  ['Audit Logs', '/superuser/audit', 'audit'],
];

export default function CommissionerLayout({ children }) {
  const [user, setUser] = useState(null);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      navigate('/login', { replace: true });
      return undefined;
    }
    getCommissionerProfile().then((profile) => {
      if (!active) return;
      const role = String(profile?.role || '').toLowerCase();
      if (!['municipal_commissioner', 'super_user'].includes(role)) {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('loggedInUser');
        navigate('/login', { replace: true });
        return;
      }
      setUser(profile);
      setState('ready');
    }).catch((err) => {
      if (!active) return;
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('loggedInUser');
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login', { replace: true });
        return;
      }
      setError(err.response?.data?.message || err.message || 'Unable to verify your session.');
      setState('error');
    });
    return () => { active = false; };
  }, [navigate]);

  const signOut = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('loggedInUser');
    navigate('/login', { replace: true });
  };

  if (state === 'loading') return <div className="commissioner-root commissioner-loading">Checking Commissioner session…</div>;
  if (state === 'error') return <div className="commissioner-root commissioner-error"><p>{error}</p><button className="btn-outline" onClick={() => navigate('/login')}>Return to Login</button></div>;

  return <div className="commissioner-root">
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Government of India emblem" className="emblem" />
        <div><div className="logo-gov">Government of India</div><div className="logo-title">TradeZo</div><div className="logo-sub">Municipal Corporation – Trade License Management System</div></div>
      </div>
      <nav className="sidebar-nav">{links.map(([label, to, icon]) => <NavLink key={to} to={to} end={to === '/superuser'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><span className="nav-icon">{icon === 'dashboard' ? '☷' : icon === 'user' ? '☻' : icon === 'department' ? '♔' : icon === 'applications' ? '✎' : '▤'}</span>{label}</NavLink>)}</nav>
      <div className="sidebar-footer">© 2026 Government of India</div>
    </aside>
    <div className="main-wrapper">
      <header className="topbar"><div className="topbar-left"><img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Government of India emblem" className="emblem"/><div><div className="gov-title">Government of India</div><div className="gov-sub">Municipal Corporation – Trade License Management System</div></div></div>
        <div className="topbar-right"><div className="user-info"><div className="user-avatar">{(user?.full_name || 'MC').split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase()}</div><div><div className="user-name">{user?.full_name || 'Municipal Commissioner'}</div><div className="user-email">{user?.email || ''}</div></div></div><button className="btn-signout" onClick={signOut}>➤ Sign Out</button></div>
      </header>
      {children}
    </div>
  </div>;
}
