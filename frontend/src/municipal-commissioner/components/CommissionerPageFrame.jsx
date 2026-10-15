import CommissionerLayout from './CommissionerLayout';

export default function CommissionerPageFrame({ title, subtitle, children, className = '' }) {
  return <CommissionerLayout><main className={`content ${className}`.trim()}><div className="page-heading">{title}</div>{subtitle && <div className="page-sub">{subtitle}</div>}{children}</main></CommissionerLayout>;
}
