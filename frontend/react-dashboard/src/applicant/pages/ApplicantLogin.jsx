import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import PublicNavigation from '../../shared/components/PublicNavigation.jsx';
import { loginApplicant, selectLoginError, selectLoginForm, selectLoginFormErrors, selectLoginStatus, setLoginFormErrors, setLoginFormField } from '../../features/auth/authSlice.js';
import '../styles/ApplicantLogin.css';
import loginStyles from '../../../../applicant_connected/connected/login/style.css?inline';

const roleValues = {
  applicant: 'applicant',
  'field officer': 'field_officer',
  'department officer': 'department_officer',
  municipal_commissioner: 'municipal_commissioner',
};

const demoPassword = 'TradeZo@123';
const demoAccounts = {
  hyderabad: [
    { label: 'Commissioner:', email: 'ramesh@tradezo.gov.in', role: 'municipal_commissioner', title: 'Click to fill Ramesh' },
    { label: 'Dept Officer (DO):', email: 'kumara@tradezo.gov.in', role: 'department officer', title: 'Click to fill Kumar' },
    { label: 'Field Officer (FO):', email: 'ravi@tradezo.gov.in', role: 'field officer', title: 'Click to fill Ravi' },
  ],
  bengaluru: [
    { label: 'Commissioner:', email: 'suraj@tradezo.gov.in', role: 'municipal_commissioner', title: 'Click to fill Suraj' },
    { label: 'Dept Officer (DO):', email: 'naveen@tradezo.gov.in', role: 'department officer', title: 'Click to fill Naveen' },
    { label: 'Field Officer (FO):', email: 'arjun@tradezo.gov.in', role: 'field officer', title: 'Click to fill Arjun' },
  ],
  citizen: { label: 'Demo Citizen:', email: 'applicant@tradezo.gov.in', role: 'applicant', title: 'Click to fill Demo Applicant' },
};
const platformAdmin = { email: 'superadmin@tradezo.gov.in', password: 'admin123' };

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '3px 4px',
  borderRadius: '4px',
};

const clickableRowStyle = { ...rowStyle, cursor: 'pointer' };

const codeStyle = {
  color: '#0f172a',
  background: '#f1f5f9',
  padding: '1px 5px',
  borderRadius: '3px',
};

export default function ApplicantLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loginStatus = useSelector(selectLoginStatus);
  const loginError = useSelector(selectLoginError);
  const { email, password, role } = useSelector(selectLoginForm);
  const errors = useSelector(selectLoginFormErrors);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.dataset.tradezoLoginStyles = 'true';
    styleElement.textContent = loginStyles;
    document.head.appendChild(styleElement);

    return () => styleElement.remove();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    const requestedRole = roleValues[role];

    if (!email.trim()) nextErrors.email = 'Email or phone number is required.';
    if (!password) nextErrors.password = 'Password is required.';
    if (!requestedRole) nextErrors.role = 'Please select your role.';

    dispatch(setLoginFormErrors(nextErrors));
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const payload = await dispatch(loginApplicant({
        email: email.trim(),
        password,
        role: requestedRole,
      })).unwrap();

      const user = payload.user;
      if (user.role === 'applicant') {
        navigate('/dashboard');
      } else if (user.role === 'field_officer') {
        navigate(`/officer/${user.user_id}`);
      } else if (user.role === 'municipal_commissioner') {
        navigate('/superuser');
      } else if (user.role === 'department_officer') {
        navigate('/department-officer');
      }
    } catch {
      // Request errors are stored by the auth thunk and rendered from Redux state.
    }
  };

  const quickFill = (account) => {
    dispatch(setLoginFormField({ field: 'email', value: account.email }));
    dispatch(setLoginFormField({ field: 'password', value: account.password || demoPassword }));
    dispatch(setLoginFormField({ field: 'role', value: account.role }));
    dispatch(setLoginFormErrors({}));
  };

  return (
    <div className="applicant-login-page">
      <div className="top-header">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
          alt="Emblem"
          className="emblem"
          style={{ filter: 'none' }}
        />
        <div>
          <p className="gov-text">Government of India</p>
          <p className="brand-name">TradeZo</p>
          <p className="gov-text">Municipal Corporation &ndash; Trade License Management System</p>
        </div>
      </div>

      <PublicNavigation />

      <div className="main-content">
        <div className="left-card">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNbxoyA4lapNA7_U6NGA_ICVtg7CtumGeJcwVpYKDD&s"
            alt=""
          />
          <h2>Municipal Corporation &ndash; Trade License Management System</h2>
          <p>Manage your trade licenses efficiently online</p>
        </div>

        <div className="login-card">
          <h3>Municipal Corporation<br />Trade License Management System</h3>

          <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
            <input
              type="text"
              id="loginEmail"
              placeholder="Enter Email or Phone Number"
              value={email}
              onChange={(event) => {
                dispatch(setLoginFormField({ field: 'email', value: event.target.value }));
                dispatch(setLoginFormErrors({ ...errors, email: '' }));
              }}
              style={errors.email ? { borderColor: '#dc2626' } : undefined}
            />
            {(errors.email || loginError) && <span className="login-error">{errors.email || loginError}</span>}

            <input
              type="password"
              id="loginPassword"
              placeholder="Enter Password"
              value={password}
              onChange={(event) => {
                dispatch(setLoginFormField({ field: 'password', value: event.target.value }));
                dispatch(setLoginFormErrors({ ...errors, password: '' }));
              }}
              style={errors.password ? { borderColor: '#dc2626' } : undefined}
            />
            {errors.password && <span className="login-error">{errors.password}</span>}

            <select
              id="roleSelect"
              required
              value={role}
              onChange={(event) => {
                dispatch(setLoginFormField({ field: 'role', value: event.target.value }));
                dispatch(setLoginFormErrors({ ...errors, role: '' }));
              }}
              style={errors.role ? { borderColor: '#dc2626' } : undefined}
            >
              <option value="" disabled hidden>Login As</option>
              <option value="applicant">Applicant / User</option>
              <option value="field officer">Field Officer (Admin Team)</option>
              <option value="department officer">Department Officer (Admin Team)</option>
              <option value="municipal_commissioner">Municipal Commissioner (Admin)</option>
            </select>
            {errors.role && <span className="login-error">{errors.role}</span>}

            <button id="loginBtn" type="submit" disabled={loginStatus === 'pending'}>
              {loginStatus === 'pending' ? 'Signing in...' : loginStatus === 'fulfilled' ? 'Redirecting...' : 'Login'}
            </button>
          </form>

          <div className="row-links">
            <label>
              <input type="checkbox" defaultChecked /> Remember Me
            </label>
          </div>

          <p className="register-text" style={{ marginBottom: '8px' }}>
            New Applicant? <a href="/register">Register Here</a>
          </p>

          <div className="demo-box" style={{ width: '100%', marginTop: '14px' }}>
            <div style={{ fontWeight: 700, color: '#1E3A8A', marginBottom: '8px', fontSize: '13px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔑 Demo Officer Credentials</span>
              <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#475569' }}>
                All Officers Pass: <strong style={{ ...codeStyle, padding: '2px 6px' }}>{demoPassword}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px' }}>
                <div style={{ fontWeight: 700, color: '#0284c7', fontSize: '11px', marginBottom: '4px' }}>🏛️ Greater Hyderabad (GHMC)</div>
                {demoAccounts.hyderabad.map((account) => (
                  <div key={account.email} onClick={() => quickFill(account)} style={clickableRowStyle} title={account.title}>
                    <span><strong>{account.label}</strong> <code style={codeStyle}>{account.email}</code></span>
                    <span style={{ color: '#64748b' }}>Password: <code style={codeStyle}>{demoPassword}</code></span>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px' }}>
                <div style={{ fontWeight: 700, color: '#059669', fontSize: '11px', marginBottom: '4px' }}>🏛️ Bengaluru (BBMP)</div>
                {demoAccounts.bengaluru.map((account) => (
                  <div key={account.email} onClick={() => quickFill(account)} style={clickableRowStyle} title={account.title}>
                    <span><strong>{account.label}</strong> <code style={codeStyle}>{account.email}</code></span>
                    <span style={{ color: '#64748b' }}>Password: <code style={codeStyle}>{demoPassword}</code></span>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px' }}>
                <div style={rowStyle}>
                  <span><strong>Super Admin:</strong> <code style={codeStyle}>{platformAdmin.email}</code></span>
                  <span style={{ color: '#64748b' }}>
                    Password: <code style={codeStyle}>{platformAdmin.password}</code> (<Link to="/platform-admin/login" style={{ color: '#1E3A8A', textDecoration: 'underline' }}>Portal</Link>)
                  </span>
                </div>
                <div onClick={() => quickFill({ ...demoAccounts.citizen, password: demoPassword })} style={clickableRowStyle} title={demoAccounts.citizen.title}>
                  <span><strong>{demoAccounts.citizen.label}</strong> <code style={codeStyle}>{demoAccounts.citizen.email}</code></span>
                  <span style={{ color: '#64748b' }}>Password: <code style={codeStyle}>{demoPassword}</code></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
