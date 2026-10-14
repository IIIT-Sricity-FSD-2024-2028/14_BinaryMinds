import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import '../styles/ApplicantPaymentFailure.css';

const apiBase = 'http://localhost:3000/api';

function readCurrentApplication() {
  try { return JSON.parse(sessionStorage.getItem('currentApplication') || '{}'); } catch { return {}; }
}

function formatDate(value) {
  const date = new Date(value);
  return !value || Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value) || 0);
}

export default function ApplicantPaymentFailure() {
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const paymentId = sessionStorage.getItem('failedPaymentId');
    const token = sessionStorage.getItem('accessToken');
    const application = readCurrentApplication();
    const expectedApplicationId = Number(sessionStorage.getItem('backendApplicationId') || application.application_id || application.backendId || application.id);

    async function verifyPayment() {
      if (!paymentId || !token || !expectedApplicationId) {
        throw new Error('Payment verification details are missing. Please return to Pay Now and check the status.');
      }
      const response = await fetch(`${apiBase}/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(payload.message) ? payload.message.join(' ') : payload.message;
        throw new Error(message || 'Unable to verify the payment record.');
      }
      const record = payload.data || payload;
      if (String(record.payment_status || '').toUpperCase() !== 'FAILED') {
        throw new Error('The backend has not confirmed a failed payment. Transaction details are hidden.');
      }
      if (Number(record.application_id) !== expectedApplicationId) {
        throw new Error('The failed payment does not match the saved application. Transaction details are hidden.');
      }
      if (active) setPayment(record);
    }

    verifyPayment().catch((requestError) => { if (active) setError(requestError.message || 'Unable to verify payment status.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function logout(event) {
    event.preventDefault();
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    navigate('/login', { replace: true });
  }

  const application = readCurrentApplication();
  const applicationLabel = sessionStorage.getItem('applicationRef') || application.application_ref || (payment ? `APP-${payment.application_id}` : '—');

  return (
    <div className="applicant-payment-failure-page">
      <header className="failure-header">
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="India Logo" />
        <div className="failure-brand"><span>Government of India</span><strong>TradeZo</strong></div>
      </header>
      <ApplicantNavigation onLogout={logout} />
      <main className="failure-main">
        {loading ? <p className="failure-message" role="status">Verifying payment status with TradeZo...</p> : error ? (
          <section className="failure-card failure-error" role="alert"><h1>Payment Status Unavailable</h1><p>{error}</p><div className="failure-button-row"><Link className="failure-primary" to="/pay-now">Retry / Check Payment</Link><Link className="failure-outline" to="/dashboard">Dashboard</Link></div></section>
        ) : payment && (
          <>
            <h1 className="failure-title">Payment Failed</h1>
            <p className="failure-subtitle">The backend marked this simulated payment record as failed. No real money was collected by this project.</p>
            <div className="failure-grid">
              <section className="failure-card">
                <div className="failure-icon" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="25" fill="#ffe5e5" stroke="#e53935" strokeWidth="2"/><text x="26" y="34" textAnchor="middle" fontSize="24" fill="#e53935">!</text></svg></div>
                <h2>Transaction Failed</h2>
                <p className="failure-desc">TradeZo confirmed a FAILED payment status for this record.</p>
                <div className="failure-info-grid">
                  <div className="failure-info-item"><label>APPLICATION ID</label><span>{applicationLabel}</span></div>
                  <div className="failure-info-item"><label>TRANSACTION ID</label><span>{payment.transaction_id || `Payment ${payment.payment_id}`}</span></div>
                  <div className="failure-info-item"><label>AMOUNT</label><span className="failure-amount">{formatMoney(payment.amount)}</span></div>
                  <div className="failure-info-item"><label>DATE &amp; TIME</label><span>{formatDate(payment.payment_date)}</span></div>
                </div>
                <div className="failure-reason"><strong>Reason for Failure</strong><p>The backend payment record is marked FAILED. The project uses simulated payment records and does not connect to a bank or payment gateway.</p></div>
                <div className="failure-button-row">
                  <Link className="failure-primary" to="/pay-now">↻ Retry Payment</Link>
                  <Link className="failure-outline" to="/payments">▣ Back to Payment History</Link>
                </div>
                <p className="failure-note">No real payment was processed through this project. If an external transaction was made, verify it with the payment provider.</p>
              </section>
              <aside className="failure-side">
                <section className="failure-side-card"><h3>💡 What You Can Do Next</h3><ol><li><strong>Retry payment</strong><br />Return to Pay Now and check the current record.</li><li><strong>Check payment status</strong><br />TradeZo shows only the status returned by its backend.</li><li><strong>Use support</strong><br />Contact the support team if the issue continues.</li></ol></section>
                <section className="failure-side-card failure-help"><h3>❔ Need Help?</h3><p>If you are facing repeated payment failures, please reach out to our support team.</p><div className="failure-contact"><span>☎</span><div><small>TOLL FREE</small><strong>1800-123-4567</strong></div></div><div className="failure-contact"><span>✉</span><div><small>EMAIL SUPPORT</small><strong>support.tlms@gov.in</strong></div></div></section>
              </aside>
            </div>
            <Link className="failure-cancel" to="/dashboard">← Cancel</Link>
          </>
        )}
      </main>
    </div>
  );
}
