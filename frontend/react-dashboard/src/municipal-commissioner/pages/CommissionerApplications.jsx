import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CommissionerPageFrame from '../components/CommissionerPageFrame';
import {
  assignApplicationToOfficer,
  fetchApplications,
  selectApplications,
  selectApplicationsState,
} from '../../features/applications/applicationsSlice.js';
import { fetchOfficers, selectOfficers, selectOfficersState } from '../../features/officers/officersSlice.js';
import { selectIsCommissioner } from '../../features/auth/authSelectors.js';
import '../styles/CommissionerApplications.css';

const pendingReviewStatuses = new Set([
  'submitted',
  'assigned',
  'verified',
  'documents_uploaded',
  'inspection_scheduled',
  'inspection_completed',
  'department_review',
]);

const formatStatus = (status) => String(status || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function CommissionerApplications() {
  const dispatch = useDispatch();
  const applicationState = useSelector(selectApplicationsState);
  const officerState = useSelector(selectOfficersState);
  const apps = useSelector(selectApplications);
  const officers = useSelector(selectOfficers);
  const isCommissioner = useSelector(selectIsCommissioner);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    dispatch(fetchApplications());
    dispatch(fetchOfficers());
  }, [dispatch]);

  const categories = useMemo(
    () => [...new Set(apps.map((application) => application.trade_category || application.tradeCategory).filter(Boolean))],
    [apps],
  );
  const statuses = useMemo(
    () => [...new Set(apps.map((application) => application.application_status || application.status).filter(Boolean))],
    [apps],
  );
  const filtered = useMemo(() => apps.filter((application) => {
    const applicationStatus = application.application_status || application.status || '';
    const text = `${application.application_id} ${application.full_name} ${application.applicant_name} ${application.business_name} ${application.trade_category}`.toLowerCase();
    return text.includes(query.toLowerCase())
      && (!status || String(applicationStatus).toLowerCase() === status.toLowerCase())
      && (!category || (application.trade_category || application.tradeCategory) === category);
  }), [apps, query, status, category]);

  const applicationFetchStatus = applicationState.requests.fetchAll;
  const officerFetchStatus = officerState.requests.fetchAll;
  const assignmentStatus = applicationState.requests.assign;
  const assignmentError = assignmentStatus === 'rejected'
    ? applicationState.errors.assign || 'Unable to assign the Field Officer.'
    : '';
  const assigning = assignmentStatus === 'pending';
  const loading = applicationFetchStatus === undefined || applicationFetchStatus === 'pending';
  const applicationError = applicationFetchStatus === 'rejected'
    ? applicationState.errors.fetchAll || 'Unable to load applications.'
    : '';
  const officerError = officerFetchStatus === 'rejected'
    ? officerState.errors.fetchAll || 'Unable to load Field Officers.'
    : '';
  const pendingCount = apps.filter((application) => pendingReviewStatuses.has(String(application.application_status || application.status || '').toLowerCase())).length;
  const approvedCount = apps.filter((application) => String(application.application_status || application.status || '').toLowerCase() === 'approved').length;
  const rejectedCount = apps.filter((application) => String(application.application_status || application.status || '').toLowerCase() === 'rejected').length;

  const assignOfficer = (application, event) => {
    const officerId = Number(event.target.value);
    if (!Number.isFinite(officerId) || !application.application_id) return;
    dispatch(assignApplicationToOfficer({ id: application.application_id, officerId }));
  };

  return <CommissionerPageFrame title="Applications Overview" subtitle="Monitor municipal trade license applications">
    {applicationError && <div className="alert-banner red-banner" role="alert">{applicationError}</div>}
    {assigning && <div className="alert-banner blue-banner" role="status">Assigning the selected Field Officer…</div>}
    {assignmentError && <div className="alert-banner red-banner" role="alert">{assignmentError}</div>}
    {officerError && <div className="alert-banner red-banner" role="alert">{officerError}</div>}
    <div className="stat-row"><Stat label="Total Applications" value={loading ? '…' : apps.length}/><Stat label="Pending Review" value={loading ? '…' : pendingCount}/><Stat label="Approved" value={loading ? '…' : approvedCount}/><Stat label="Rejected" value={loading ? '…' : rejectedCount}/></div>
    <section className="card"><div className="filter-bar"><input className="search-input" placeholder="Search by applicant, ID, business name..." value={query} onChange={(event) => setQuery(event.target.value)}/><select className="filter-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All Status</option>{statuses.map((value) => <option key={value} value={value}>{formatStatus(value)}</option>)}</select><select className="filter-select" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All Categories</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
      <table className="data-table"><thead><tr><th>Application ID</th><th>Applicant Name</th><th>Business Name</th><th>Trade Category</th><th>Submitted Date</th><th>Assign Field Officer</th><th>Action</th></tr></thead><tbody>{filtered.map((application) => {
        const applicationStatus = String(application.application_status || application.status || '').toLowerCase();
        const assignmentEligible = ['submitted', 'assigned'].includes(applicationStatus);
        const assignedOfficerId = application.assignedOfficerId ?? application.assigned_officer_id ?? '';
        const assignedOfficerAvailable = officers.some((officer) => String(officer.id) === String(assignedOfficerId));
        const assignmentDisabled = !isCommissioner || !assignmentEligible || !application.application_id
          || officerFetchStatus !== 'fulfilled' || officers.length === 0 || assigning;
        const assignmentPlaceholder = !isCommissioner
          ? 'Commissioner access required'
          : !assignmentEligible
            ? 'Not eligible for assignment'
            : officerFetchStatus === undefined || officerFetchStatus === 'pending'
              ? 'Loading Field Officers…'
              : officerFetchStatus === 'rejected'
                ? 'Field Officers unavailable'
                : officers.length === 0
                  ? 'No Field Officers available'
                  : 'Select Field Officer';

        return <tr key={application.application_id}><td>#{application.application_id}</td><td>{application.full_name || application.applicant_name || '—'}</td><td>{application.business_name || '—'}</td><td>{application.trade_category || application.tradeCategory || '—'}</td><td>{application.submitted_at || application.created_at ? new Date(application.submitted_at || application.created_at).toLocaleDateString() : '—'}</td><td><select className="filter-select" disabled={assignmentDisabled} aria-label={`Assign Field Officer for application ${application.application_id}`} value={assignedOfficerId === '' ? '' : String(assignedOfficerId)} onChange={(event) => assignOfficer(application, event)}><option value="">{assignmentPlaceholder}</option>{assignedOfficerId !== '' && !assignedOfficerAvailable && <option value={String(assignedOfficerId)}>Assigned officer #{assignedOfficerId} is not available in the officer list</option>}{officers.map((officer) => <option key={officer.id} value={String(officer.id)}>{officer.employee_id ? `${officer.employee_id} — ` : ''}{officer.name || officer.full_name}</option>)}</select></td><td><span className={`badge ${applicationStatus === 'rejected' ? 'badge-red' : 'badge-blue'}`}>{formatStatus(application.application_status || application.status) || '—'}</span></td></tr>;
      })}{!filtered.length && <tr><td colSpan="7" className="empty-row">{loading ? 'Loading applications…' : applicationError ? 'Applications could not be loaded.' : 'No applications match these filters.'}</td></tr>}</tbody></table>
    </section>
  </CommissionerPageFrame>;
}

function Stat({ label, value }) {
  return <div className="stat-card"><div className="stat-left"><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div></div>;
}
