import { useState, useEffect, useCallback } from 'react';
import {
  getSubmittedApplications,
  getOfficers,
  assignApplication,
  createApplication,
} from '../api';

const freshTime = (app) => {
  const value = app.submitted_at || app.updated_at || app.created_at || app.submittedDate;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
};

export default function SuperuserDashboard() {
  const [apps, setApps] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [appsRes, offRes] = await Promise.all([
        getSubmittedApplications(),
        getOfficers(),
      ]);
      setApps([...(appsRes.data || [])].sort((a, b) => freshTime(b) - freshTime(a)));
      setOfficers(offRes.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssign = async (id, officerId) => {
    if (!officerId) return;
    setAssigning(id);
    setMessage('');
    try {
      const res = await assignApplication(id, officerId);
      const assigned = res.data;
      const officer = officers.find((o) => o.id === assigned.assignedOfficerId);
      setMessage(
        `✅ Application #${id} assigned to ${officer ? officer.name : 'Officer #' + assigned.assignedOfficerId}`
      );
      await fetchData();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setAssigning(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setMessage('');
    try {
      const res = await createApplication(newName.trim());
      setMessage(`✅ Application #${res.data.application_id} created for "${newName.trim()}"`);
      setNewName('');
      await fetchData();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard…</div>;
  }

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
            <span className="municipal-text">Municipal Corporation &ndash; Trade License Management System</span>
          </div>
        </div>
        <div className="role-badge">Municipal Commissioner (Admin)</div>
      </header>

      {message && <div className="toast">{message}</div>}

      <section className="card hierarchy-card">
        <div className="hierarchy-eyebrow">Municipal Corporation</div>
        <h2>Municipal Commissioner (Admin)</h2>
        <h3>Admin Team</h3>
        <p><strong>Field Officers</strong> and <strong>Department Officers</strong></p>
        <p className="hierarchy-applicants">Applicants / Users</p>
      </section>

      {/* Create Application */}
      <section className="card create-section">
        <h2>➕ Submit New Application</h2>
        <form onSubmit={handleCreate} className="create-form">
          <input
            type="text"
            placeholder="Applicant Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <button type="submit">Submit Application</button>
        </form>
      </section>

      <div className="grid-2">
        {/* Submitted Applications */}
        <section className="card">
          <h2>Users / Applicants — Submitted Applications</h2>
          {apps.length === 0 ? (
            <p className="empty">No submitted applications.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Applicant</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.application_id}>
                    <td>#{app.application_id}</td>
                    <td>{app.full_name}</td>
                    <td>
                      <span className={`badge ${app.assignedOfficerId ? 'assigned' : 'submitted'}`}>
                        {app.assignedOfficerId ? 'Assigned' : 'Not Assigned'}
                      </span>
                    </td>
                    <td>{app.paymentDone ? '✅ Paid' : '❌ Unpaid'}</td>
                    <td>
                      <select 
                        className="form-input" 
                        disabled={assigning === app.application_id}
                        onChange={(e) => handleAssign(app.application_id, e.target.value)}
                        defaultValue=""
                        style={{ padding: '4px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
                      >
                        <option value="" disabled>
                           {assigning === app.application_id ? 'Assigning…' : 'Assign FO'}
                        </option>
                        {officers.map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Officers */}
        <section className="card">
          <h2>Admin Team — Field Officers Workload</h2>
          {officers.length === 0 ? (
            <p className="empty">No officers available.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Assigned</th>
                  <th>Verified</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((off) => (
                  <tr key={off.id}>
                    <td>#{off.id}</td>
                    <td>{off.name}</td>
                    <td>
                      <span className="count assigned">{off.assignedCount}</span>
                    </td>
                    <td>
                      <span className="count verified">{off.verifiedCount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
