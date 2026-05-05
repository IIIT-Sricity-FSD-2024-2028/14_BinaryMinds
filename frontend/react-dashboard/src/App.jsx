import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import SuperuserDashboard from './pages/SuperuserDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import './index.css';

function Home() {
  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="brand">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
            alt="Emblem"
            className="emblem"
          />
          <div>
            <span className="gov-text">Government of India</span>
            <h1>TradeZo</h1>
          </div>
        </div>
      </header>

      <section className="card home-card">
        <h2>Digital Application & Licensing System</h2>
        <p className="home-subtitle">Select your role to continue</p>

        <div className="role-grid">
          <Link to="/superuser" className="role-link superuser">
            <div className="role-icon">🛡️</div>
            <h3>Superuser</h3>
            <p>View submitted applications, assign to officers, monitor workload</p>
          </Link>

          <Link to="/officer/1" className="role-link officer">
            <div className="role-icon">👤</div>
            <h3>Officer 1 — Myra Singh</h3>
            <p>View assigned applications, verify documents</p>
          </Link>

          <Link to="/officer/2" className="role-link officer">
            <div className="role-icon">👤</div>
            <h3>Officer 2 — Vikram Desai</h3>
            <p>View assigned applications, verify documents</p>
          </Link>

          <Link to="/officer/3" className="role-link officer">
            <div className="role-icon">👤</div>
            <h3>Officer 3 — Anjali Mehta</h3>
            <p>View assigned applications, verify documents</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/superuser" element={<SuperuserDashboard />} />
        <Route path="/officer/:officerId" element={<OfficerDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
