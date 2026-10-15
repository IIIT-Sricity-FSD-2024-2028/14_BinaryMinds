import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOfficerApplications } from '../../api';
import FieldOfficerLayout from '../components/FieldOfficerLayout';
import '../styles/FieldOfficerDashboard.css';

const apiBase = 'http://localhost:3000/api';

const freshTime = (app) => {
  const value = app.submitted_at || app.updated_at || app.created_at;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
};

async function getProtectedData(path, token) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(payload.message) ? payload.message.join(' ') : payload.message;
    throw new Error(message || `Request failed (${response.status}).`);
  }
  return payload?.data ?? payload;
}

export default function FieldOfficerDashboard() {
  const { officerId } = useParams();
  const [apps, setApps] = useState([]);
  const [inspectionCount, setInspectionCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    const response = await getOfficerApplications(officerId);
    return [...(response.data || [])].sort((a, b) => freshTime(b) - freshTime(a));
  }, [officerId]);

  useEffect(() => {
    let active = true;
    fetchData()
      .then((rows) => { if (active) setApps(rows); })
      .catch((requestError) => {
        if (active) setError(`Unable to load assigned applications: ${requestError.response?.data?.message || requestError.message}`);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchData]);

  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem('accessToken');

    async function loadInspectionSummary() {
      if (!token) {
        setSummaryError('Sign in to load inspection summary.');
        setSummaryLoading(false);
        return;
      }

      try {
        const inspectionResult = await getProtectedData(`/inspections/field-officer/${encodeURIComponent(officerId)}`, token);

        if (!active) return;
        const records = Array.isArray(inspectionResult) ? inspectionResult : [];
        setInspectionCount(records.length);
      } catch {
        if (active) setSummaryError('Inspection summary data could not be loaded.');
      } finally {
        if (active) setSummaryLoading(false);
      }
    }

    loadInspectionSummary();
    return () => { active = false; };
  }, [officerId]);

  const verifiedCount = apps.filter((item) => item.application_status === 'verified').length;
  const filteredApps = apps.filter((item) => [
    item.application_ref,
    item.application_id,
    item.business_name,
    item.city,
    item.state,
  ].some((value) => String(value || '').toLowerCase().includes(search.toLowerCase())));

  return (
    <FieldOfficerLayout>
      <main className="fo-dashboard-page">
        {error && <p className="fo-dashboard-message error" role="alert">{error}</p>}

        <h1 className="fo-dashboard-title">Field Officer – Admin Team</h1>
        <p className="fo-dashboard-subtitle">Municipal Corporation – Trade License Management System</p>

        <section className="fo-dashboard-stats" aria-label="Field Officer work summary">
          <article className="fo-dashboard-stat blue">
            <div><p>Assigned Applications</p><span aria-hidden="true">▤</span></div>
            <strong>{loading ? '…' : apps.length}</strong>
          </article>
          <article className="fo-dashboard-stat orange">
            <div><p>Verified Applications</p><span aria-hidden="true">✓</span></div>
            <strong>{loading ? '…' : verifiedCount}</strong>
          </article>
          <article className="fo-dashboard-stat green">
            <div><p>Inspection Recorded</p><span aria-hidden="true">▣</span></div>
            <strong>{summaryLoading ? '…' : inspectionCount === null ? '—' : inspectionCount}</strong>
          </article>
        </section>

        {summaryError && <p className="fo-dashboard-message warning" role="status">{summaryError}</p>}

        <label className="fo-dashboard-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by Application ID, Business Name, or Location"
            aria-label="Search assigned applications"
          />
        </label>

        <div className="fo-dashboard-bottom">
          <section className="fo-dashboard-table-card">
            <h2>Assigned Applications</h2>
            {loading ? <p className="fo-dashboard-empty">Loading assigned applications…</p> : error ? null : filteredApps.length ? (
              <div className="fo-dashboard-table-wrap">
                <table>
                  <thead><tr><th>Application ID</th><th>Applicant Name</th><th>Business Name</th><th>Current Status</th><th>Submitted Date</th></tr></thead>
                  <tbody>
                    {filteredApps.map((app) => (
                      <tr key={app.application_id}>
                        <td>{app.application_ref || `#${app.application_id}`}</td>
                        <td>{app.full_name || '—'}</td>
                        <td>{app.business_name || '—'}</td>
                        <td><span className={`fo-dashboard-status ${String(app.application_status || '').toLowerCase()}`}>{String(app.application_status || '—').replace(/_/g, ' ')}</span></td>
                        <td>{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-IN') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="fo-dashboard-empty">{search ? 'No applications match your search.' : 'No applications are assigned to this Field Officer account.'}</p>}
          </section>

          <div className="fo-dashboard-illustration" aria-hidden="true">
            <div className="fo-dashboard-illustration-circle">▤</div>
            <div className="fo-dashboard-illustration-building"><span /><span /><span /></div>
          </div>
        </div>
      </main>
    </FieldOfficerLayout>
  );
}
