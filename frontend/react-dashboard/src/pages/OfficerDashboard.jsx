import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getOfficerApplications, verifyApplication } from '../api';

const freshTime = (app) => {
  const value = app.submitted_at || app.updated_at || app.created_at || app.submittedDate;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
};

export default function OfficerDashboard() {
  const { officerId } = useParams();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await getOfficerApplications(officerId);
      setApps([...(res.data || [])].sort((a, b) => freshTime(b) - freshTime(a)));
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [officerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerify = async (id) => {
    setVerifying(id);
    setMessage('');
    try {
      await verifyApplication(id);
      setMessage(`✅ Application #${id} marked as verified.`);
      await fetchData();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading officer dashboard…</div>;
  }

  const assignedApps = apps.filter((a) => a.application_status === 'assigned');
  const verifiedApps = apps.filter((a) => a.application_status === 'verified');

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
        <div className="role-badge officer">Officer #{officerId} Dashboard</div>
      </header>

      {message && <div className="toast">{message}</div>}

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{assignedApps.length}</span>
          <span className="stat-label">Assigned</span>
        </div>
        <div className="stat-card verified-stat">
          <span className="stat-number">{verifiedApps.length}</span>
          <span className="stat-label">Verified</span>
        </div>
        <div className="stat-card total-stat">
          <span className="stat-number">{apps.length}</span>
          <span className="stat-label">Total</span>
        </div>
      </div>

      <section className="card">
        <h2>📑 Assigned Applications</h2>
        {apps.length === 0 ? (
          <p className="empty">No applications assigned to you.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Applicant</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.application_id}>
                  <td>#{app.application_id}</td>
                  <td>{app.full_name}</td>
                  <td>
                    <span
                      className={`badge ${app.application_status}`}
                    >
                      {app.application_status}
                    </span>
                  </td>
                  <td>
                    {app.submitted_at
                      ? new Date(app.submitted_at).toLocaleDateString('en-IN')
                      : '—'}
                  </td>
                  <td>
                    {app.application_status === 'assigned' ? (
                      <button
                        className="btn-verify"
                        onClick={() => handleVerify(app.application_id)}
                        disabled={verifying === app.application_id}
                      >
                        {verifying === app.application_id
                          ? 'Verifying…'
                          : '✔ Verify'}
                      </button>
                    ) : (
                      <span className="done-text">Verified ✅</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
