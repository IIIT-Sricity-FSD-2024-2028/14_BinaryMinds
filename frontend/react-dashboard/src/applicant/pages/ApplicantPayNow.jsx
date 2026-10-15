import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import '../styles/ApplicantPayNow.css';

const apiBase = 'http://localhost:3000/api';

function readStored(key, fallback = {}) {
  try { return JSON.parse(sessionStorage.getItem(key) || JSON.stringify(fallback)) || fallback; } catch { return fallback; }
}

function errorText(payload, fallback) {
  if (Array.isArray(payload?.message)) return payload.message.join(' ');
  return payload?.message || fallback;
}

async function readJson(response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

function getApplicationChoice(applications) {
  const draft = readStored('applicationForm');
  const current = readStored('currentApplication');
  const storedId = Number(sessionStorage.getItem('backendApplicationId') || current.application_id || current.backendId || current.id);
  const storedRef = String(sessionStorage.getItem('applicationRef') || current.application_ref || current.appRef || '');
  if (storedId) {
    const exact = applications.find((item) => Number(item.application_id) === storedId);
    if (exact) return { application: exact, candidates: [] };
  }
  if (storedRef) {
    const exact = applications.find((item) => String(item.application_ref || '').toLowerCase() === storedRef.toLowerCase() || String(item.application_id) === storedRef);
    if (exact) return { application: exact, candidates: [] };
  }
  if (draft.businessName || draft.municipalityId || draft.municipality_id) {
    const matches = applications.filter((item) => {
      const nameMatches = !draft.businessName || String(item.business_name || item.businessName || '').trim().toLowerCase() === String(draft.businessName).trim().toLowerCase();
      const municipality = draft.municipalityId || draft.municipality_id;
      const municipalityMatches = !municipality || String(item.municipality_id || item.municipalityId || '').toLowerCase() === String(municipality).toLowerCase();
      return nameMatches && municipalityMatches;
    });
    if (matches.length === 1) return { application: matches[0], candidates: [] };
    if (matches.length > 1) return { application: null, candidates: matches };
  }
  const unpaid = applications.filter((item) => item.paymentDone !== true && item.payment_done !== true);
  const sorted = unpaid.slice().sort((left, right) => new Date(right.submitted_at || right.created_at || 0) - new Date(left.submitted_at || left.created_at || 0));
  if (sorted.length === 1) return { application: sorted[0], candidates: [] };
  return { application: null, candidates: sorted.length ? sorted : applications };
}

export default function ApplicantPayNow() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [application, setApplication] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [payments, setPayments] = useState([]);
  const [paymentsReady, setPaymentsReady] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('This is a simulated payment record. No real money is collected or transferred.');

  useEffect(() => {
    let active = true;
    const user = readStored('loggedInUser');
    const token = sessionStorage.getItem('accessToken');
    if (!token || user.role !== 'applicant') {
      navigate('/login', { replace: true });
      return () => { active = false; };
    }
    async function loadData() {
      try {
        const [applicationsResponse, municipalitiesResponse] = await Promise.all([
          fetch(`${apiBase}/applications/mine`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiBase}/municipalities`),
        ]);
        const applicationPayload = await readJson(applicationsResponse);
        if (!applicationsResponse.ok) throw new Error(errorText(applicationPayload, 'Could not load your applications.'));
        const rows = Array.isArray(applicationPayload) ? applicationPayload : applicationPayload.data;
        if (!Array.isArray(rows)) throw new Error('The server returned an invalid application list.');
        let municipalityRows = [];
        if (municipalitiesResponse.ok) {
          const municipalityPayload = await readJson(municipalitiesResponse);
          municipalityRows = Array.isArray(municipalityPayload) ? municipalityPayload : municipalityPayload.data || [];
        }
        if (!active) return;
        setApplications(rows);
        setMunicipalities(Array.isArray(municipalityRows) ? municipalityRows : []);
        const choice = getApplicationChoice(rows);
        if (choice.application) {
          setApplication(choice.application);
          setSelectedId(String(choice.application.application_id));
        } else if (choice.candidates.length === 1) {
          setApplication(choice.candidates[0]);
          setSelectedId(String(choice.candidates[0].application_id));
        }
      } catch (requestError) {
        if (active) setError(requestError.message || 'Could not load payment details.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => {
    let active = true;
    setPayments([]);
    setPaymentsReady(false);
    if (!application?.application_id) return () => { active = false; };
    const token = sessionStorage.getItem('accessToken');
    fetch(`${apiBase}/payments/application/${application.application_id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const payload = await readJson(response);
        if (!response.ok) throw new Error(errorText(payload, 'Could not load existing payments.'));
        const records = Array.isArray(payload) ? payload : payload.data;
        if (!Array.isArray(records)) throw new Error('The server returned an invalid payment list.');
        if (active) {
          setPayments(records);
          setPaymentsReady(true);
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load existing payments.'); });
    return () => { active = false; };
  }, [application]);

  const fees = useMemo(() => {
    const municipalityId = application?.municipality_id || application?.municipalityId || '';
    const municipality = municipalities.find((item) => String(item.municipality_id).toLowerCase() === String(municipalityId).toLowerCase());
    const processing = Number(municipality?.base_processing_fee) || 1200;
    const platform = Number(municipality?.platform_fee) || 250;
    const taxRate = Number.isFinite(Number(municipality?.service_tax_percentage)) ? Number(municipality.service_tax_percentage) : 5;
    const tax = Math.round(processing * taxRate / 100);
    return { processing, platform, tax, total: processing + platform + tax, taxRate };
  }, [application, municipalities]);

  const completedPayment = payments.find((item) => String(item.payment_status).toUpperCase() === 'COMPLETED');
  const alreadyMarkedPaid = application?.paymentDone === true || application?.payment_done === true;
  const pendingPayment = payments.filter((item) => String(item.payment_status).toUpperCase() === 'PENDING').sort((left, right) => new Date(right.payment_date || 0) - new Date(left.payment_date || 0))[0];
  const candidateApplications = applications.filter((item) => item.paymentDone !== true && item.payment_done !== true);

  function chooseApplication(event) {
    const selected = applications.find((item) => String(item.application_id) === event.target.value);
    setSelectedId(event.target.value);
    setApplication(selected || null);
    setPaymentsReady(false);
    setError('');
    setMessage('This is a simulated payment record. No real money is collected or transferred.');
    if (selected) {
      sessionStorage.setItem('backendApplicationId', String(selected.application_id));
      if (selected.application_ref) sessionStorage.setItem('applicationRef', selected.application_ref);
      sessionStorage.setItem('currentApplication', JSON.stringify(selected));
    }
  }

  async function submitPayment() {
    setMessage('');
    setError('');
    const token = sessionStorage.getItem('accessToken');
    if (!paymentMethod) { setError('Please select a payment method.'); return; }
    if (!token) { setError('Your session has expired. Please sign in again.'); return; }
    if (!application?.application_id) { setError('Select a valid application before continuing.'); return; }
    if (!paymentsReady) { setError('Existing payment records are not ready. Please retry before continuing.'); return; }
    if (completedPayment || alreadyMarkedPaid) {
      setMessage('A COMPLETED payment record already exists. This project records simulated payments only; no real money was collected.');
      return;
    }
    setIsPaying(true);
    try {
      let payment;
      if (pendingPayment) {
        const response = await fetch(`${apiBase}/payments/${encodeURIComponent(pendingPayment.payment_id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ payment_status: 'COMPLETED' }),
        });
        payment = await readJson(response);
        if (!response.ok) throw new Error(errorText(payment, 'Payment record could not be updated.'));
      } else {
        const response = await fetch(`${apiBase}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            application_id: Number(application.application_id), municipality_id: application.municipality_id || application.municipalityId,
            amount: fees.total, processing_fee: fees.processing, platform_fee: fees.platform, service_tax: fees.tax, payment_status: 'COMPLETED',
          }),
        });
        payment = await readJson(response);
        if (!response.ok) throw new Error(errorText(payment, 'Payment record could not be created.'));
      }
      if (payment.data) payment = payment.data;
      if (!payment.payment_id) throw new Error('The server did not return a payment record.');
      const verifyResponse = await fetch(`${apiBase}/payments/${encodeURIComponent(payment.payment_id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const verifiedPayment = await readJson(verifyResponse);
      if (!verifyResponse.ok) throw new Error(errorText(verifiedPayment, 'The payment record could not be verified.'));
      if (verifiedPayment.data) payment = verifiedPayment.data;
      else payment = verifiedPayment;
      if (Number(payment.application_id) !== Number(application.application_id)) {
        throw new Error('The payment record does not match the selected application.');
      }
      setPayments((current) => [payment, ...current.filter((item) => item.payment_id !== payment.payment_id)]);
      sessionStorage.setItem('backendApplicationId', String(application.application_id));
      sessionStorage.setItem('currentApplication', JSON.stringify(application));
      if (application.application_ref) sessionStorage.setItem('applicationRef', application.application_ref);
      const paymentStatus = String(payment.payment_status || '').toUpperCase();
      if (paymentStatus === 'COMPLETED') {
        sessionStorage.setItem('confirmedPaymentId', String(payment.payment_id));
        sessionStorage.removeItem('failedPaymentId');
        navigate('/payment-success');
        return;
      }
      if (paymentStatus === 'FAILED') {
        sessionStorage.setItem('failedPaymentId', String(payment.payment_id));
        sessionStorage.removeItem('confirmedPaymentId');
        navigate('/payment-failure');
        return;
      }
      setMessage(`Payment record ${payment.payment_id} is ${paymentStatus || 'unconfirmed'}. This is a simulated record only; no real money was collected or transferred.`);
    } catch (requestError) {
      setError(requestError.message || 'Unable to create a payment record. Please try again.');
    } finally {
      setIsPaying(false);
    }
  }

  function logout(event) {
    event.preventDefault();
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  return (
    <div className="applicant-pay-now-page">
      <div className="pay-topbar"><img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Indian Emblem" /><div><p className="pay-gov">Government of India</p><p className="pay-brand">TradeZo</p></div></div>
      <ApplicantNavigation onLogout={logout} />
      <main className="pay-page">
        <h1 className="pay-title">Complete Your Payment</h1>
        <div className="steps-bar"><PayStep number="1" name="Application Form" state="green" icon="✓" /><div className="step-line" /><PayStep number="2" name="Documents" state="green" icon="✓" /><div className="step-line" /><PayStep number="3" name="Payment" state="blue" icon="₹" /><div className="step-line" /><PayStep number="4" name="Submitted" state="grey" icon="›" /></div>
        {isLoading ? <p className="pay-message">Loading your application and payment details...</p> : error && !application ? <p className="pay-message pay-error" role="alert">{error}</p> : !applications.length ? <p className="pay-message">No application was found for this applicant account. Apply for a license before paying.</p> : (
          <div className="columns">
            <div className="col-left">
              {candidateApplications.length > 1 && !application && <div className="card"><label className="pay-label" htmlFor="payment-application">Select the application to pay for</label><select id="payment-application" value={selectedId} onChange={chooseApplication}><option value="">Choose an application</option>{candidateApplications.map((item) => <option key={item.application_id} value={item.application_id}>{item.application_ref || item.application_id} — {item.business_name || 'Business name unavailable'}</option>)}</select></div>}
              <section className="card">
                <div className="card-head"><span className="card-title">▣ Application Summary</span><span className="ref-no">{application ? `REF: ${application.application_ref || application.application_id}` : 'Application reference unavailable'}</span></div>
                {application ? <>
                  <div className="info-grid"><div><p className="lbl">Trade Name</p><p className="val">{application.business_name || 'Unavailable'}</p></div><div><p className="lbl">License Category</p><p className="val">{application.trade_category || application.business_type || 'Unavailable'}</p></div><div><p className="lbl">Validity Period</p><p className="val">1 Year ({new Date().getFullYear()}–{new Date().getFullYear() + 1})</p></div><div><p className="lbl">Establishment Type</p><p className="val">{application.business_type || 'Unavailable'}</p></div></div>
                  <hr className="divider" /><div className="fee-row"><span>Processing Fee</span><span>{formatMoney(fees.processing)}</span></div><div className="fee-row"><span>Service Tax ({fees.taxRate}%)</span><span>{formatMoney(fees.tax)}</span></div><div className="fee-row"><span>Platform Fee</span><span>{formatMoney(fees.platform)}</span></div><div className="fee-row total"><span>Total Payable Amount</span><span>{formatMoney(fees.total)}</span></div>
                </> : <p className="pay-hint">Choose an application above. The selected application will be displayed here before payment.</p>}
              </section>
              <section className="card">
                <p className="card-title">▤ Select Payment Method</p>
                {[['upi', '▣ UPI / QR Code'], ['card', '▰ Debit / Credit Card'], ['net', '▤ Net Banking']].map(([value, label]) => <label className={`pay-opt ${paymentMethod === value ? 'active' : ''}`} key={value}><input type="radio" name="method" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} />{label}</label>)}
                <button type="button" className="pay-btn" id="payBtn" onClick={submitPayment} disabled={isPaying || isLoading || !paymentsReady || !application || completedPayment || alreadyMarkedPaid}>{isPaying ? 'Recording simulated payment…' : `Pay Now · ${formatMoney(fees.total)}`}</button>
                <p className="small-note">This project does not connect to a payment gateway. Continuing creates or updates a simulated backend payment record only; no money is collected.</p>
                {error && application && <p className="pay-result pay-error" role="alert">{error}</p>}{message && <p className="pay-result" role="status">{message}</p>}
                {(completedPayment || alreadyMarkedPaid) && <p className="pay-result pay-completed">Existing application payment state is complete. This is a simulation only.</p>}
              </section>
            </div>
            <aside className="col-right"><section className="card"><p className="card-title">⬟ Payment Assistance</p><AssistItem icon="◆" heading="Secure Transaction" text="Payment records are managed by the TradeZo backend. No external gateway is connected in this project." /><AssistItem icon="▣" heading="Instant Receipt" text="This screen does not generate a real transaction receipt." /><AssistItem icon="☎" heading="24/7 Support" text="In case of any payment questions, please contact the support team." /></section></aside>
          </div>
        )}
      </main>
    </div>
  );
}

function formatMoney(value) { return `₹${Number(value || 0).toFixed(2)}`; }

function PayStep({ number, name, state, icon }) {
  return <div className="step"><div className={`dot ${state}`}>{icon}</div><div className="step-text"><span className="step-num">STEP {number}</span><span className="step-name">{name}</span></div></div>;
}

function AssistItem({ icon, heading, text }) {
  return <div className="assist-item"><span className="assist-icon">{icon}</span><div><p className="assist-head">{heading}</p><p className="assist-body">{text}</p></div></div>;
}
