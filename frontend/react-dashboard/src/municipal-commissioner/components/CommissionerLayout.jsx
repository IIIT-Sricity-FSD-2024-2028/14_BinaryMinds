import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { logoutAndResetApi } from '../../features/auth/authLogout.js';
import { selectCurrentUser, selectIsAuthenticated } from '../../features/auth/authSelectors.js';
import { fetchDepartmentOfficerProfile, selectDepartmentOfficerProfile, selectDepartmentOfficerUsersState } from '../../features/users/usersSlice.js';

const links = [
  ['Dashboard', '/superuser', 'dashboard'],
  ['Field Officer Management', '/superuser/field-officers', 'user'],
  ['Department Officer Management', '/superuser/department-officers', 'department'],
  ['Applications Overview', '/superuser/applications', 'applications'],
  ['Audit Logs', '/superuser/audit', 'audit'],
];

export default function CommissionerLayout({ children }) {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const profile = useSelector(selectDepartmentOfficerProfile);
  const usersState = useSelector(selectDepartmentOfficerUsersState);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'municipal_commissioner') {
      dispatch(logoutAndResetApi());
      navigate('/login', { replace: true });
      return;
    }
    if (usersState.requests.fetchProfile === undefined) {
      dispatch(fetchDepartmentOfficerProfile());
    } else if (usersState.requests.fetchProfile === 'fulfilled' && profile?.role !== 'municipal_commissioner' && profile?.role !== 'super_user') {
      dispatch(logoutAndResetApi());
      navigate('/login', { replace: true });
    } else if (usersState.requests.fetchProfile === 'rejected') {
      dispatch(logoutAndResetApi());
      navigate('/login', { replace: true });
    }
  }, [dispatch, isAuthenticated, navigate, profile?.role, user?.role, usersState.requests.fetchProfile]);

  const signOut = () => {
    dispatch(logoutAndResetApi());
    navigate('/login', { replace: true });
  };

  if (!isAuthenticated || user?.role !== 'municipal_commissioner' || usersState.requests.fetchProfile !== 'fulfilled' || !profile) return <div className="commissioner-root commissioner-loading">Checking Commissioner session…</div>;

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
        <div className="topbar-right"><div className="user-info"><div className="user-avatar">{(profile.full_name || user?.name || 'MC').split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase()}</div><div><div className="user-name">{profile.full_name || user?.name || 'Municipal Commissioner'}</div><div className="user-email">{profile.email || user?.email || ''}</div></div></div><button className="btn-signout" onClick={signOut}>➤ Sign Out</button></div>
      </header>
      {children}
    </div>
  </div>;
}
