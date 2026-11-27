import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DepartmentOfficerPageFrame from '../components/DepartmentOfficerPageFrame';
import { useDepartmentOfficerData } from '../components/useDepartmentOfficerData';
import { selectPageSearch, setPageSearch } from '../state/departmentOfficerUiSlice.js';
import '../styles/DepartmentOfficerGeneratedLicenses.css';

export default function DepartmentOfficerGeneratedLicenses() {
  const data = useDepartmentOfficerData();
  const dispatch = useDispatch();
  const query = useSelector((state) => selectPageSearch(state, 'generatedLicenses'));
  const apps = useMemo(() => Object.fromEntries(data.applications.map((x) => [String(x.application_id), x])), [data.applications]);
  const rows = useMemo(() => data.licenses.map((l) => ({ ...l, app: apps[String(l.application_id)] || {} })).filter((l) => [l.license_number, l.app.business_name, l.app.full_name, l.app.application_ref].some((v) => String(v || '').toLowerCase().includes(query.toLowerCase()))), [apps, data.licenses, query]);
  return <DepartmentOfficerPageFrame pageClass="do-page-generated-licenses" active="/department-officer/compliance" title="Generated Licenses Log">
    <section className="card">
      <div className="search-bar"><input value={query} onChange={(event) => dispatch(setPageSearch({ page: 'generatedLicenses', value: event.target.value }))} placeholder="Search by Business Name, License ID..." /></div>
      <div className="do-table-scroll"><table className="data-table"><thead><tr><th>Application ID</th><th>Applicant Name</th><th>License Number</th><th>Business Name</th><th>Category</th><th>Status</th></tr></thead><tbody>
        {rows.map((x) => <tr key={x.license_id}><td>{x.app.application_ref || `#${x.application_id}`}</td><td>{x.app.full_name || '—'}</td><td>{x.license_number}</td><td>{x.app.business_name || '—'}</td><td>{x.app.trade_category || x.app.business_type || '—'}</td><td>{x.status}</td></tr>)}
        {!rows.length && <tr><td colSpan="6">{data.partialErrors.length ? 'License data could not be loaded.' : 'No generated licenses found.'}</td></tr>}
      </tbody></table></div>
      <div className="pagination">Showing {rows.length} licenses</div>
    </section>
  </DepartmentOfficerPageFrame>;
}
