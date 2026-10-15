import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import '../styles/ApplicantPaymentHistory.css';

const apiBase = 'http://localhost:3000/api';

function readJson(response) {
  return response.json().catch(() => ({}));
}

function errorMessage(payload, fallback) {
  return Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message || fallback;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value) || 0);
}

export default function ApplicantPaymentHistory() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partialError, setPartialError] = useState('');

  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem('accessToken');
    let user = {};
    try { user = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch { user = {}; }

    async function loadPayments() {
      if (!token || user.role !== 'applicant') {
        navigate('/login', { replace: true });
        return;
      }
      try {
        const applicationsResponse = await fetch(`${apiBase}/applications/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const applicationPayload = await readJson(applicationsResponse);
        if (!applicationsResponse.ok) throw new Error(errorMessage(applicationPayload, 'Could not load your applications.'));
        const applications = Array.isArray(applicationPayload) ? applicationPayload : applicationPayload.data;
        if (!Array.isArray(applications)) throw new Error('The server returned an invalid application list.');
        if (!applications.length) {
          if (active) setPayments([]);
          return;
        }

        const applicationsWithIds = applications.filter((app) => app.application_id);
        const results = await Promise.allSettled(applicationsWithIds.map(async (app) => {
          const response = await fetch(`${apiBase}/payments/application/${encodeURIComponent(app.application_id)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const payload = await readJson(response);
          if (!response.ok) throw new Error(errorMessage(payload, `Could not load payments for application ${app.application_id}.`));
          const records = Array.isArray(payload) ? payload : payload.data;
          if (!Array.isArray(records)) throw new Error('The server returned an invalid payment list.');
          return records.map((payment) => ({ ...payment, application: app }));
        }));

        const failedRequests = results.filter((result) => result.status === 'rejected');
        const successfulRecords = results.filter((result) => result.status === 'fulfilled').flatMap((result) => result.value);
        if (!applicationsWithIds.length || (failedRequests.length && !successfulRecords.length)) {
          throw new Error(failedRequests[0]?.reason?.message || 'Payment history could not be loaded for the returned applications.');
        }
        const unique = new Map();
        successfulRecords.forEach((payment) => {
          const key = payment.payment_id ?? `${payment.application_id}-${payment.transaction_id ?? payment.payment_date ?? ''}`;
          if (!unique.has(String(key))) unique.set(String(key), payment);
        });
        const sorted = [...unique.values()].sort((left, right) => new Date(right.payment_date || 0) - new Date(left.payment_date || 0));
        if (active) {
          setPayments(sorted);
          if (failedRequests.length) setPartialError('Some application payment records could not be loaded. The rows shown are only the records returned successfully.');
        }
      } catch (requestError) {
        if (active) setError(requestError.message || 'Unable to load payment history.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPayments();
    return () => { active = false; };
  }, [navigate]);

  function continuePayment(payment) {
    sessionStorage.setItem('backendApplicationId', String(payment.application_id));
    const application = payment.application || {};
    if (application.application_ref) sessionStorage.setItem('applicationRef', application.application_ref);
    else sessionStorage.removeItem('applicationRef');
    sessionStorage.setItem('currentApplication', JSON.stringify(application));
    navigate('/pay-now');
  }

  function logout(event) {
    event.preventDefault();
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  const completedPayments = payments.filter((payment) => String(payment.payment_status || '').toUpperCase() === 'COMPLETED');
  const latestSuccessful = completedPayments[0];
  const latestPayment = payments[0];

  return (
    <div className="applicant-payment-history-page">
      <header className="history-topbar"><img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="India Logo" /><div className="history-brand"><span>Government of India</span><strong>TradeZo</strong></div></header>
      <ApplicantNavigation onLogout={logout} />
      <main className="history-main">
        <h1>Payment History</h1>
        <p className="history-sub">View your completed and failed payment records.</p>
        {loading && <p className="history-message" role="status">Loading your payment history...</p>}
        {error && <p className="history-message history-error" role="alert">{error}</p>}
        {partialError && !error && <p className="history-message history-error" role="alert">{partialError}</p>}

        <div className="history-cards">
          <section className="history-card summary-card"><span className="history-icon">₹</span><div><small>LAST SUCCESSFUL PAYMENT</small><h2>{latestSuccessful ? formatMoney(latestSuccessful.amount) : '—'}</h2></div></section>
          <section className="history-card summary-card"><span className="history-icon">▦</span><div><small>LAST PAYMENT DATE</small><h2>{latestPayment ? formatDate(latestPayment.payment_date) : '—'}</h2></div></section>
        </div>

        <div className="history-bottom">
          <section className="history-panel">
            <h3>Payment Transactions</h3>
            <div className="history-table-wrap"><table><thead><tr><th>TRANSACTION ID</th><th>DATE</th><th>AMOUNT</th><th>METHOD</th><th>STATUS</th><th>ACTION</th></tr></thead>
              <tbody>
                {payments.map((payment) => {
                  const status = String(payment.payment_status || 'Unknown');
                  const completed = status.toUpperCase() === 'COMPLETED';
                  return <tr key={payment.payment_id}><td>{payment.transaction_id || `Payment ${payment.payment_id}`}</td><td>{formatDate(payment.payment_date)}</td><td>{formatMoney(payment.amount)}</td><td>{payment.payment_method || '—'}</td><td><span className={`history-badge ${completed ? 'is-complete' : 'is-other'}`}>{status.replace(/_/g, ' ')}</span></td><td>{completed ? <button className="history-text-action" type="button" onClick={() => window.print()}>Print Receipt</button> : <button className="history-text-action" type="button" onClick={() => continuePayment(payment)}>Continue Payment</button>}</td></tr>;
                })}
                {!loading && !error && payments.length === 0 && <tr><td colSpan="6" className="history-empty">No payment transactions found.</td></tr>}
              </tbody>
            </table></div>
          </section>

          <aside className="history-side"><section className="history-panel history-summary">
            <h3>Payment Summary</h3>
            <ul>
              <li>{latestSuccessful ? 'Latest payment status: COMPLETED.' : 'No completed payment is recorded.'}</li>
              <li>{latestSuccessful?.payment_method ? `Method used: ${latestSuccessful.payment_method}` : 'Payment method is not recorded.'}</li>
              <li>{latestSuccessful ? 'Print the completed payment record from the transaction table.' : 'Receipt actions are available for completed payment records.'}</li>
            </ul>
            <button type="button" className="history-print" onClick={() => window.print()}>▣ Print Full Statement</button>
            <div className="history-assist"><p><strong>Need Assistance?</strong></p><p>If you face issues with payment records or receipt printing, contact the Help Desk.</p><Link to="/helpdesk">Contact Support</Link><h3>1800-123-4567</h3></div>
          </section></aside>
        </div>

        <section className="history-panel receipts-panel"><h3>Recent Receipts</h3><div className="history-table-wrap"><table><thead><tr><th>PAYMENT ID</th><th>DATE</th><th>STATUS</th><th>VIEW</th></tr></thead><tbody>
          {completedPayments.map((payment) => <tr key={payment.payment_id}><td>{payment.payment_id}</td><td>{formatDate(payment.payment_date)}</td><td><span className="history-dot" />Completed payment record</td><td><button type="button" className="history-text-action" onClick={() => window.print()}>Print</button></td></tr>)}
          {!loading && !error && completedPayments.length === 0 && <tr><td colSpan="4" className="history-empty">No completed payment records are available.</td></tr>}
        </tbody></table></div></section>
        <Link className="history-back" to="/dashboard">← Back to Dashboard</Link>
      </main>
    </div>
  );
}
