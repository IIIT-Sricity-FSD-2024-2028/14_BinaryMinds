import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logoutAndResetApi } from '../../features/auth/authLogout.js';
import { selectCurrentUser, selectIsAuthenticated } from '../../features/auth/authSelectors.js';
import { fetchDepartmentOfficerProfile, selectDepartmentOfficerProfile, selectDepartmentOfficerUsersState } from '../../features/users/usersSlice.js';
import './PlatformAdminLayout.css';

const emblem = 'https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg';

export default function PlatformAdminLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const profile = useSelector(selectDepartmentOfficerProfile);
  const usersState = useSelector(selectDepartmentOfficerUsersState);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'platform_admin') {
      dispatch(logoutAndResetApi());
      navigate('/platform-admin/login', { replace: true });
      return;
    }
    if (usersState.requests.fetchProfile === undefined) dispatch(fetchDepartmentOfficerProfile());
    else if (usersState.requests.fetchProfile === 'fulfilled' && profile?.role !== 'platform_admin') {
      dispatch(logoutAndResetApi());
      navigate('/platform-admin/login', { replace: true });
    } else if (usersState.requests.fetchProfile === 'rejected' && /unauthorized|token|expired/i.test(usersState.errors.fetchProfile || '')) {
      dispatch(logoutAndResetApi());
      navigate('/platform-admin/login', { replace: true });
    }
  }, [dispatch, isAuthenticated, navigate, profile?.role, user?.role, usersState.errors.fetchProfile, usersState.requests.fetchProfile]);

  function logout() {
    dispatch(logoutAndResetApi());
    navigate('/platform-admin/login', { replace: true });
  }

  const name = profile?.full_name || user?.name || 'TradeZo Super Admin';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'SA';
  const profileError = usersState.requests.fetchProfile === 'rejected' ? usersState.errors.fetchProfile : '';
  const profileReady = usersState.requests.fetchProfile === 'fulfilled' && profile?.role === 'platform_admin';

  return <div className="platform-admin-root">
    <aside className="sidebar">
      <div className="sidebar-logo"><img src={emblem} alt="Government of India emblem" className="emblem" height="42" /><div><div className="logo-gov">Government of India</div><div className="logo-title">TradeZo</div><div className="logo-sub">Central Platform Admin</div></div></div>
      <nav className="sidebar-nav" aria-label="Platform Admin navigation">
        <NavLink end to="/platform-admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><span className="nav-icon">&#9783;</span> Dashboard</NavLink>
        <NavLink to="/platform-admin/corporations" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><span className="nav-icon">&#127970;</span> Municipal Corporations</NavLink>
        <NavLink to="/platform-admin/revenue" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><span className="nav-icon">&#128176;</span> Revenue &amp; Fees</NavLink>
        <NavLink to="/platform-admin/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><span className="nav-icon">&#9881;</span> Fee Settings</NavLink>
      </nav>
      <div className="sidebar-footer">© 2026 Government of India</div>
    </aside>
    <div className="main-wrapper">
      <header className="topbar">
        <div className="topbar-left"><img src={emblem} alt="Government of India emblem" className="emblem" height="38" /><div><div className="gov-title">Government of India – Ministry of Housing &amp; Urban Affairs</div><div className="gov-sub">TradeZo Central Platform – Super Admin &amp; Platform Governance</div></div></div>
        <div className="topbar-right"><div className="user-info"><div className="user-avatar">{initials}</div><div><div className="user-name">{name}</div><div className="user-role">Platform Owner</div></div></div><Link to="/" className="topbar-btn">Public Home</Link><button type="button" className="topbar-btn logout-btn" onClick={logout}>Logout</button></div>
      </header>
      <main className="content-area">{profileError ? <p className="platform-admin-alert error" role="alert">{profileError}</p> : profileReady ? <Outlet context={{ user: profile }} /> : <p className="platform-admin-loading" role="status">Checking Platform Admin access…</p>}</main>
    </div>
  </div>;
}
