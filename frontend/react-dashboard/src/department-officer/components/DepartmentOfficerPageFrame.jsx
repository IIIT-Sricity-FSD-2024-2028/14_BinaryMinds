import DepartmentOfficerLayout from './DepartmentOfficerLayout';

export default function DepartmentOfficerPageFrame({ active, pageClass, title, subtitle, data, children }) {
  return <DepartmentOfficerLayout active={active} pageClass={pageClass}><div className="topbar"><div><h2>{title}</h2>{subtitle && <p className="subtitle">{subtitle}</p>}</div></div>
    {data.loading && <p className="do-notice">Loading Department Officer records…</p>}
    {data.error && <p className="do-error" role="alert">{data.error}</p>}
    {data.partialErrors?.map((e) => <p className="do-error" role="status" key={e}>{e}</p>)}
    {!data.loading && !data.error && children}
  </DepartmentOfficerLayout>;
}
