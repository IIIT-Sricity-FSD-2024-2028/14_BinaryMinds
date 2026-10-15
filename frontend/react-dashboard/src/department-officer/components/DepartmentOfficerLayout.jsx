import { NavLink, useNavigate } from 'react-router-dom';
import './DepartmentOfficerLayout.css';

const links = [
  ['Dashboard', '/department-officer'],
  ['Worklist', '/department-officer/worklist'],
  ['Final Authorization', '/department-officer/authorization'],
  ['Generated Licenses', '/department-officer/compliance'],
];

export default function DepartmentOfficerLayout({ active = '', pageClass = '', children }) {
  const navigate = useNavigate();
  function logout() {
    if (!window.confirm('Are you sure you want to logout?')) return;
    sessionStorage.clear(); localStorage.removeItem('loggedInUser'); navigate('/login', { replace: true });
  }
  return <div className={`do-page-root ${pageClass}`}>
    <div className="top-header"><div className="header"><img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="India Logo"/><div className="header-text">Government of India<span>TradeZo</span><small>Municipal Corporation – Trade License Management System</small></div></div><button className="logout-btn" onClick={logout}>Logout</button></div>
    <div className="container"><aside className="sidebar" aria-label="Department Officer navigation"><NavLink end to="/" className="nav-item">Home</NavLink>{links.map(([label, to]) => <NavLink key={to} to={to} end className={({ isActive }) => `nav-item${isActive || active === to ? ' active' : ''}`}>{label}</NavLink>)}</aside><main className="main">{children}</main></div>
  </div>;
}
