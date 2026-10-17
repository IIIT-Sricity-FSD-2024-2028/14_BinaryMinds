import FieldOfficerLayout from './FieldOfficerLayout';

export default function FieldOfficerPageShell({ activeSection, title, loading, error, message, children }) {
  return <FieldOfficerLayout activeSection={activeSection}><div className="fo-officer-page">
    {loading ? <p className="fo-react-message">Loading Field Officer records…</p> : <>
      {error && <p className="fo-react-message error" role="alert">{error}</p>}
      {message && <p className="fo-react-message" role="status">{message}</p>}
      <h1 className="fo-react-page-title">{title}</h1><p className="fo-react-subtitle">Municipal Corporation – Trade License Management System</p>
      {children}
    </>}
  </div></FieldOfficerLayout>;
}
