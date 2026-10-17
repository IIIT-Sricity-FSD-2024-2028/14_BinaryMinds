import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import './ApplicantNavigation.css';

const links = [
  { label: 'Dashboard', to: '/dashboard', activeOn: ['/dashboard'] },
  { label: 'Apply License', to: '/apply-license', activeOn: ['/apply-license', '/upload-documents'] },
  { label: 'Track Application', to: '/track-status', activeOn: ['/track-status'] },
  { label: 'Download License', to: '/download-license', activeOn: ['/download-license'] },
  { label: 'Payments', to: '/payments', activeOn: ['/payments'] },
  { label: 'Profile', to: '/profile', activeOn: ['/profile', '/profile/edit'] },
];

export default function ApplicantNavigation({ onLogout }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function handleLogout(event) {
    event.preventDefault();
    if (onLogout) {
      onLogout(event);
      return;
    }

    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('applicationRef');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  return (
    <>
      <header className="applicant-portal-header">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
          alt="Government of India emblem"
        />
        <div className="applicant-portal-brand">
          <span>Government of India</span>
          <strong>TradeZo</strong>
          <small>Municipal Corporation &ndash; Trade License Management System</small>
        </div>
      </header>
      <nav className="applicant-shared-navigation" aria-label="Applicant portal navigation">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `applicant-nav-link${isActive || item.activeOn.includes(pathname) ? ' active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
        <Link to="/login" onClick={handleLogout} className="applicant-nav-link applicant-nav-logout">
          Logout
        </Link>
      </nav>
    </>
  );
}
