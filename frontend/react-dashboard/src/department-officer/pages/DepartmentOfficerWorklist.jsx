import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DepartmentOfficerPageFrame from '../components/DepartmentOfficerPageFrame';
import { useDepartmentOfficerData } from '../components/useDepartmentOfficerData';
import { applicationWorkflowStatus, getApplicationInspection } from '../components/inspectionWorkflow';
import {
  selectPageSearch,
  selectWorklistFilter,
  selectWorklistNotice,
  setPageSearch,
  setWorklistFilter,
} from '../store/departmentOfficerUiSlice.js';
import '../styles/DepartmentOfficerWorklist.css';

export default function DepartmentOfficerWorklist() {
  const data = useDepartmentOfficerData();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const search = useSelector((state) => selectPageSearch(state, 'worklist'));
  const filter = useSelector(selectWorklistFilter);
  const notice = useSelector(selectWorklistNotice);
  const rows = useMemo(() => data.applications.filter((app) => {
    const { inspection } = getApplicationInspection(data.assignments, data.inspections, app.application_id);
    const inspectionDone = ['COMPLETED', 'FAILED'].includes(String(inspection?.status).toUpperCase());
    const review = data.reviews.find((x) => Number(x.application_id) === Number(app.application_id));
    const q = [app.application_ref, app.application_id, app.business_name, app.full_name, app.tax_id, app.application_status].some((v) => String(v || '').toLowerCase().includes(search.toLowerCase()));
    const urgent = inspectionDone && !review && !data.licenses.some((x) => Number(x.application_id) === Number(app.application_id));
    return q && (filter === 'all' || urgent);
  }).sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0)), [data.applications, data.assignments, data.inspections, data.reviews, data.licenses, search, filter]);
  function open(app) { navigate(`/department-officer/inspection-report/${app.application_id}`); }
  return <DepartmentOfficerPageFrame pageClass="do-page-worklist" active="/department-officer/worklist" title="Application Worklist">
    {notice && <p className="do-notice" role="status">{notice}</p>}
    <div className="filters">{[['all', 'All Applications'], ['urgent', 'Urgent']].map(([id, label]) => <button key={id} className={`filter-btn ${filter === id ? 'active' : ''}`} onClick={() => dispatch(setWorklistFilter(id))}>{label}</button>)}</div>
    <label className="search-bar"><input value={search} onChange={(event) => dispatch(setPageSearch({ page: 'worklist', value: event.target.value }))} placeholder="Search by Application ID, Company Name, or Tax ID" /></label>
    <div className="do-table-scroll"><table className="table"><thead><tr><th>App ID</th><th>Applicant Name</th><th>Company Name</th><th>Submission Date</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map((app) => { const review = data.reviews.find((x) => Number(x.application_id) === Number(app.application_id)); const { inspection } = getApplicationInspection(data.assignments, data.inspections, app.application_id); const lic = data.licenses.find((x) => Number(x.application_id) === Number(app.application_id)); const state = lic ? 'Licensed' : applicationWorkflowStatus(app, review, inspection); return <tr key={app.application_id}><td>{app.application_ref || `#${app.application_id}`}</td><td>{app.full_name || '—'}</td><td>{app.business_name || '—'}</td><td>{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-IN') : '—'}</td><td><span className="do-status">{state}</span></td><td><button className="review-btn" onClick={() => open(app)}>Review Application</button></td></tr>; })}{!rows.length && !data.loading && <tr><td colSpan="6">No applications found.</td></tr>}</tbody></table></div>
    <div className="pagination"><span>Showing {rows.length} of {data.applications.length} applications</span></div>
  </DepartmentOfficerPageFrame>;
}
