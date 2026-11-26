import DepartmentOfficerLayout from './DepartmentOfficerLayout';
import { useSelector } from 'react-redux';
import { selectDepartmentOfficerPortalStatus } from './useDepartmentOfficerData';

export default function DepartmentOfficerPageFrame({ active, pageClass, title, subtitle, children }) {
  const { loading, error, partialErrors } = useSelector(selectDepartmentOfficerPortalStatus);
  return <DepartmentOfficerLayout active={active} pageClass={pageClass}><div className="topbar"><div><h2>{title}</h2>{subtitle && <p className="subtitle">{subtitle}</p>}</div></div>
    {loading && <p className="do-notice">Loading Department Officer records…</p>}
    {error && <p className="do-error" role="alert">{error}</p>}
    {partialErrors.map((message) => <p className="do-error" role="status" key={message}>{message}</p>)}
    {!loading && !error && children}
  </DepartmentOfficerLayout>;
}
