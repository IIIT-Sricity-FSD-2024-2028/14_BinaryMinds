import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import { fetchPaymentById, selectPaymentById } from '../../features/payments/paymentsSlice.js';
import { fetchApplicantApplications, selectApplicantApplications, setResultState } from '../store/applicantApplicationsSlice.js';
import '../styles/ApplicantPaymentSuccess.css';

function formatDate(value) {
  const date = new Date(value);
  return !value || Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value) || 0);
}

export default function ApplicantPaymentSuccess() {
  const { paymentId: routePaymentId } = useParams();
  const dispatch = useDispatch();
  const workflow = useSelector((state) => state.applicantApplications.workflow);
  const paymentId = routePaymentId || workflow.resultPayment?.payment_id;
  const payment = useSelector((state) => selectPaymentById(state, paymentId));
  const applications = useSelector(selectApplicantApplications);
  const application = applications.find((item) => String(item.application_id) === String(payment?.application_id));
  const loading = useSelector((state) => state.payments.requests.fetchById === 'pending' || state.applicantApplications.requests.fetchMine === 'pending');
  const error = workflow.resultError;

  useEffect(() => {
    if (!/^\d+$/.test(String(paymentId || ''))) {
      dispatch(setResultState({ resultLoading: false, resultError: 'Payment details are unavailable. Return to Pay Now and check the payment status.' }));
      return;
    }
    let active = true;
    dispatch(setResultState({ resultLoading: true, resultError: '' }));
    (async () => {
      try {
        const paymentResponse = await dispatch(fetchPaymentById({ id: paymentId })).unwrap();
        const record = paymentResponse?.data || paymentResponse;
        if (String(record?.payment_id) !== String(paymentId)) throw new Error('The requested payment record could not be verified.');
        if (String(record.payment_status || '').toUpperCase() !== 'COMPLETED') throw new Error('The backend has not confirmed a completed payment. Transaction details are hidden.');
        const applicationsResponse = await dispatch(fetchApplicantApplications()).unwrap();
        const rows = Array.isArray(applicationsResponse?.data) ? applicationsResponse.data : Array.isArray(applicationsResponse) ? applicationsResponse : [];
        if (!rows.some((item) => String(item.application_id) === String(record.application_id))) throw new Error('This payment is not associated with an application available to your account.');
        if (active) dispatch(setResultState({ resultPayment: record, resultLoading: false, resultError: '' }));
      } catch (requestError) {
        if (active) dispatch(setResultState({ resultLoading: false, resultError: requestError?.message || 'Unable to verify payment.' }));
      }
    })();
    return () => { active = false; };
  }, [dispatch, paymentId]);

  const applicationLabel = application?.application_ref || (payment?.application_id ? `APP-${payment.application_id}` : '-');

  return (
    <div className="applicant-payment-success-page">
      <ApplicantNavigation />
      <main className="success-main">
        {loading || workflow.resultLoading ? (
          <p className="result-message" role="status">Verifying payment with TradeZo...</p>
        ) : error ? (
          <section className="success-card result-error" role="alert">
            <h1>Payment Status Unavailable</h1>
            <p>{error}</p>
            <Link className="result-primary" to="/pay-now">Return to Pay Now</Link>
          </section>
        ) : payment && application ? (
          <>
            <h1 className="success-title">Payment Successful</h1>
            <p className="success-subtitle">TradeZo confirmed this simulated payment record. No real money was collected.</p>
            <section className="success-card">
              <div className="success-check" aria-hidden="true">
                <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="25" stroke="#4CAF50" strokeWidth="2" fill="#e8f5e9"/><polyline points="14,27 22,35 38,18" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              </div>
              <h2>Application Submitted Successfully</h2>
              <div className="success-info-grid">
                <div className="success-info-item"><label>APPLICATION ID</label><span>{applicationLabel}</span></div>
                <div className="success-info-item"><label>BUSINESS NAME</label><span>{application.business_name || 'Unavailable'}</span></div>
                <div className="success-info-item"><label>TRANSACTION ID</label><span>{payment.transaction_id || `Payment ${payment.payment_id}`}</span></div>
                <div className="success-info-item"><label>AMOUNT PAID</label><span className="success-amount">{formatMoney(payment.amount)}</span></div>
                <div className="success-info-item"><label>SUBMISSION DATE</label><span>{formatDate(payment.payment_date)}</span></div>
              </div>
              <div className="success-button-row">
                <Link className="result-primary" to="/track-status">Track Application</Link>
                <button type="button" className="result-outline" onClick={() => window.print()}>Download Receipt</button>
              </div>
              <p className="success-note">Your application can now proceed for verification. This project displays a simulated payment record and does not connect to a payment gateway.</p>
            </section>
            <Link className="result-cancel" to="/dashboard">Dashboard</Link>
          </>
        ) : null}
      </main>
    </div>
  );
}
