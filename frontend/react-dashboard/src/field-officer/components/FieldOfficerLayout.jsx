import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import './FieldOfficerLayout.css';

const navigation = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', section: '' },
  { label: 'Verification', section: 'verification' },
  { label: 'Record Inspection', section: 'recordinspection' },
  { label: 'Verification History', section: 'verificationhistory' },
  { label: 'Inspection History', section: 'inspectionhistory' },
  { label: 'Profile', section: 'profile' },
];

export default function FieldOfficerLayout({ activeSection = '', children }) {
  const { officerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const activeKey = activeSection === 'detail' ? 'verification'
    : ['scheduleinspection', 'start-inspection'].includes(activeSection) ? 'recordinspection'
      : activeSection === 'inspection_report' ? 'inspectionhistory'
        : activeSection === 'profile_edit' ? 'profile' : activeSection;

  function logout() {
    sessionStorage.clear();
    navigate('/login', { replace: true });
  }

  return (
    <div className="fo-react-shell">
      <header className="fo-react-header">
        <div className="fo-react-brand">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Government emblem" />
          <div><span>Government of India</span><strong>TradeZo</strong><small>Municipal Corporation – Trade License Management System</small></div>
        </div>
        <div className="fo-react-user"><span>Field Officer</span><button type="button" onClick={logout}>Logout</button></div>
      </header>
      <div className="fo-react-layout">
        <aside className="fo-react-sidebar" aria-label="Field Officer navigation">
          <h2>Field Officer</h2>
          <nav>
            {navigation.map((item) => {
              const to = item.path || (item.section ? `/officer/${officerId}/${item.section}` : `/officer/${officerId}`);
              const active = item.path ? location.pathname === item.path : item.section === activeKey;
              return <NavLink key={item.label} to={to} end className={active ? 'active' : ''}>{item.label}</NavLink>;
            })}
          </nav>
        </aside>
        <div className="fo-react-main">{children}</div>
      </div>
    </div>
  );
}
