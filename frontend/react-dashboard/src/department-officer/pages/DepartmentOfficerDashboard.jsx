import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DepartmentOfficerPageFrame from '../components/DepartmentOfficerPageFrame';
import { useDepartmentOfficerData } from '../components/useDepartmentOfficerData';
import '../styles/DepartmentOfficerDashboard.css';

function appStatus(app, data) {
  const license = data.licenses.find((x) => Number(x.application_id) === Number(app.application_id));
  const review = data.reviews.find((x) => Number(x.application_id) === Number(app.application_id));
  const assignmentIds = data.assignments.filter((x) => Number(x.application_id) === Number(app.application_id)).map((x) => Number(x.assignment_id));
  const inspections = data.inspections.filter((x) => assignmentIds.includes(Number(x.assignment_id)));
  const inspection = inspections.find((x) => ['COMPLETED', 'FAILED'].includes(String(x.status).toUpperCase()));
  return { fo: inspection ? `Inspection ${inspection.status.toLowerCase()}` : app.application_status || '—', department: license ? `Licensed · ${license.license_number}` : review?.status || app.application_status || 'Pending' };
}

export default function DepartmentOfficerDashboard() {
  const data = useDepartmentOfficerData(); const navigate = useNavigate(); const [search, setSearch] = useState('');
  const rows = useMemo(() => data.applications.filter((x) => [x.application_ref, x.application_id, x.business_name, x.full_name, x.application_status].some((v) => String(v || '').toLowerCase().includes(search.toLowerCase()))), [data.applications, search]);
  const pending = data.applications.filter((x) => !data.reviews.some((r) => Number(r.application_id) === Number(x.application_id)) && !data.licenses.some((l) => Number(l.application_id) === Number(x.application_id))).length;
  const authorized = data.applications.filter((x) => x.application_status === 'approved' || data.licenses.some((l) => Number(l.application_id) === Number(x.application_id))).length;
  const rejected = data.applications.filter((x) => String(data.reviews.find((r) => Number(r.application_id) === Number(x.application_id))?.status || '').toUpperCase() === 'REJECTED' || x.application_status === 'rejected').length;
  return <DepartmentOfficerPageFrame pageClass="do-page-dashboard" active="/department-officer" title="Department Officer – Admin Team" subtitle="Municipal Corporation – Trade License Management System" data={data}>
    <section className="cards"><article className="card blue"><p>Total Applications</p><h2>{data.applications.length}</h2></article><article className="card orange"><p>Pending DO Review</p><h2>{pending}</h2></article><article className="card green"><p>Authorized</p><h2>{authorized}</h2></article><article className="card red"><p>Rejected</p><h2>{rejected}</h2></article></section>
    <label className="search-bar"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Application ID, Business Name, Applicant, or Status" /></label>
    <section className="table-section"><div className="table-title"><h3>Applications Overview</h3><p>Showing {rows.length} application(s)</p></div><div className="do-table-scroll"><table className="table"><thead><tr><th>Application ID</th><th>Applicant Name</th><th>Business Name</th><th>FO Status</th><th>Department Status</th><th>Submitted Date</th></tr></thead><tbody>{rows.map((app) => { const status = appStatus(app, data); return <tr key={app.application_id}><td>{app.application_ref || `#${app.application_id}`}</td><td>{app.full_name || '—'}</td><td>{app.business_name || '—'}</td><td>{status.fo}</td><td>{status.department}</td><td>{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-IN') : '—'}</td></tr>; })}{!rows.length && !data.loading && <tr><td colSpan="6">No applications were returned by the backend.</td></tr>}</tbody></table></div></section>
  </DepartmentOfficerPageFrame>;
}
