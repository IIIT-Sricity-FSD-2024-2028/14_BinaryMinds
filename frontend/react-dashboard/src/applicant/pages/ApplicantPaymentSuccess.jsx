import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import '../styles/ApplicantPaymentSuccess.css';

const apiBase = 'http://localhost:3000/api';

function readCurrentApplication() {
  try { return JSON.parse(sessionStorage.getItem('currentApplication') || '{}'); } catch { return {}; }
}

function formatDate(value) {
  const date = new Date(value);
  return !value || Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value) || 0);
}

export default function ApplicantPaymentSuccess() {
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const paymentId = sessionStorage.getItem('confirmedPaymentId');
    const token = sessionStorage.getItem('accessToken');
    const application = readCurrentApplication();
    const expectedApplicationId = Number(sessionStorage.getItem('backendApplicationId') || application.application_id || application.backendId || application.id);

    async function verifyPayment() {
      if (!paymentId || !token || !expectedApplicationId) {
        throw new Error('Payment confirmation details are missing. Please return to Pay Now and check the payment status.');
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
      if (String(record.payment_status || '').toUpperCase() !== 'COMPLETED') {
        throw new Error('The backend has not confirmed a completed payment. Transaction details are hidden.');
      }
      if (Number(record.application_id) !== expectedApplicationId) {
        throw new Error('The confirmed payment does not match the saved application. Transaction details are hidden.');
      }
      if (active) setPayment(record);
    }

    verifyPayment().catch((requestError) => { if (active) setError(requestError.message || 'Unable to verify payment.'); })
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
    <div className="applicant-payment-success-page">
      <ApplicantNavigation onLogout={logout} />
      <main className="success-main">
        {loading ? <p className="result-message" role="status">Verifying payment with TradeZo...</p> : error ? (
          <section className="success-card result-error" role="alert"><h1>Payment Status Unavailable</h1><p>{error}</p><Link className="result-primary" to="/pay-now">Return to Pay Now</Link></section>
        ) : payment && (
          <>
            <h1 className="success-title">Payment Successful</h1>
            <p className="success-subtitle">TradeZo confirmed this simulated payment record. No real money was collected.</p>
            <section className="success-card">
              <div className="success-check" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="25" stroke="#4CAF50" strokeWidth="2" fill="#e8f5e9"/><polyline points="14,27 22,35 38,18" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg></div>
              <h2>Application Submitted Successfully</h2>
              <div className="success-info-grid">
                <div className="success-info-item"><label>APPLICATION ID</label><span>{applicationLabel}</span></div>
                <div className="success-info-item"><label>TRANSACTION ID</label><span>{payment.transaction_id || `Payment ${payment.payment_id}`}</span></div>
                <div className="success-info-item"><label>AMOUNT PAID</label><span className="success-amount">{formatMoney(payment.amount)}</span></div>
                <div className="success-info-item"><label>SUBMISSION DATE</label><span>{formatDate(payment.payment_date)}</span></div>
              </div>
              <div className="success-button-row">
                <Link className="result-primary" to="/track-status">📋 Track Application</Link>
                <button type="button" className="result-outline" onClick={() => window.print()}>⬇ Download Receipt</button>
              </div>
              <p className="success-note">Your application can now proceed for verification. This project displays a simulated payment record and does not connect to a payment gateway.</p>
            </section>
            <Link className="result-cancel" to="/dashboard">← Dashboard</Link>
          </>
        )}
      </main>
    </div>
  );
}
