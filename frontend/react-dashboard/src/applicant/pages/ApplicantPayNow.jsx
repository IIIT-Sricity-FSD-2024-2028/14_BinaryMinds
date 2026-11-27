import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import { selectCurrentUser } from '../../features/auth/authSelectors.js';
import { fetchActiveMunicipalities, selectMunicipalities } from '../../features/municipalities/municipalitiesSlice.js';
import { clearApplicantPaymentAttempt, fetchPaymentById, fetchPaymentsByApplication, selectPayments, simulateApplicantPayment } from '../../features/payments/paymentsSlice.js';
import { fetchApplicantApplications, selectApplicantApplications } from '../../features/applications/applicationsSlice.js';
import { selectApplicantApplicationWorkflow, setPaymentError, setPaymentMessage, setPaymentMethod, setResultState, setSelectedApplicationId } from '../state/applicantWorkflowSlice.js';
import '../styles/ApplicantPayNow.css';

const errorText = (error, fallback) => error?.message || error?.payload?.message || fallback;

export default function ApplicantPayNow() {
  const dispatch = useDispatch(); const navigate = useNavigate(); const location = useLocation();
  const user = useSelector(selectCurrentUser); const applications = useSelector(selectApplicantApplications);
  const municipalities = useSelector(selectMunicipalities); const workflow = useSelector(selectApplicantApplicationWorkflow);
  const routeApplicationId = location.state?.applicationId == null ? '' : String(location.state.applicationId);
  const requestedApplicationId = routeApplicationId || workflow.selectedApplicationId;
  const selected = requestedApplicationId
    ? applications.find((item) => String(item.application_id) === requestedApplicationId) || null
    : null;
  const selectedApplicationId = selected?.application_id ? String(selected.application_id) : '';
  const payments = useSelector(selectPayments).filter((item) => selectedApplicationId && String(item.application_id) === selectedApplicationId);
  const appLoading = useSelector((state) => state.applications.requests.fetchMine === 'pending');
  const paymentsReady = useSelector((state) => selectedApplicationId && state.payments.applicationRequests[selectedApplicationId] === 'fulfilled');
  const paymentAttemptPending = useSelector((state) => Boolean(selectedApplicationId && state.payments.submittingByApplication[selectedApplicationId]));
  const verifyingPayment = useSelector((state) => state.payments.requests.fetchById === 'pending');
  const paying = paymentAttemptPending || verifyingPayment;
  const requestError = useSelector((state) => (selectedApplicationId && (state.payments.applicationErrors[selectedApplicationId] || state.payments.submissionErrorsByApplication[selectedApplicationId])) || state.applications.errors.fetchMine);
  const selectedApplicationUnavailable = Boolean(requestedApplicationId && !selected && !appLoading);

  useEffect(() => {
    if (!user || user.role !== 'applicant') { navigate('/login', { replace: true }); return; }
    dispatch(fetchApplicantApplications()); dispatch(fetchActiveMunicipalities());
  }, [dispatch, navigate, user]);
  useEffect(() => {
    if (!selectedApplicationId) return;
    dispatch(setSelectedApplicationId(selectedApplicationId));
    dispatch(setPaymentError(''));
    dispatch(setPaymentMessage(''));
    if (selected.paymentDone !== true && selected.payment_done !== true) {
      dispatch(fetchPaymentsByApplication({ applicationId: selectedApplicationId }));
    }
  }, [dispatch, selectedApplicationId, selected?.paymentDone, selected?.payment_done]);

  const fees = useMemo(() => {
    const municipalityId = selected?.municipality_id || selected?.municipalityId || '';
    const municipality = municipalities.find((item) => String(item.municipality_id).toLowerCase() === String(municipalityId).toLowerCase());
    const processing = Number(municipality?.base_processing_fee) || 1200, platform = Number(municipality?.platform_fee) || 250;
    const taxRate = Number.isFinite(Number(municipality?.service_tax_percentage)) ? Number(municipality.service_tax_percentage) : 5;
    const tax = Math.round(processing * taxRate / 100); return { processing, platform, tax, total: processing + platform + tax, taxRate };
  }, [selected, municipalities]);
  const completed = payments.find((item) => String(item.payment_status).toUpperCase() === 'COMPLETED');
  const applicationPaymentComplete = selected?.paymentDone === true || selected?.payment_done === true;
  const alreadyComplete = Boolean(completed) || applicationPaymentComplete;
  const candidates = applications.filter((item) => item.paymentDone !== true && item.payment_done !== true);

  function chooseApplication(event) {
    const applicationId = String(event.target.value || '');
    dispatch(setSelectedApplicationId(applicationId));
    if (location.state?.applicationId != null) {
      navigate('/pay-now', { replace: true, state: { applicationId } });
    }
  }

  async function submitPayment() {
    dispatch(setPaymentError('')); dispatch(setPaymentMessage(''));
    if (!workflow.paymentMethod) { dispatch(setPaymentError('Please select a payment method.')); return; }
    if (!selected?.application_id) { dispatch(setPaymentError('Select a valid application before continuing.')); return; }
    if (paymentAttemptPending) return;
    if (alreadyComplete) { dispatch(setPaymentMessage('This application is already marked as paid. This project records simulated payments only; no real money was collected.')); return; }
    if (!paymentsReady) { dispatch(setPaymentError('Existing payment records are not ready for this application. Please retry before continuing.')); return; }
    let ownsAttempt = true;
    try {
      const paymentRequest = dispatch(simulateApplicantPayment({ body: { application_id: Number(selected.application_id), municipality_id: selected.municipality_id || selected.municipalityId, amount: fees.total, processing_fee: fees.processing, platform_fee: fees.platform, service_tax: fees.tax, payment_method: workflow.paymentMethod.toUpperCase() } }));
      let record;
      try {
        record = await paymentRequest.unwrap();
      } catch (error) {
        if (error?.name === 'ConditionError') { ownsAttempt = false; return; }
        throw error;
      }
      record = record?.data || record;
      if (!record?.payment_id) throw new Error('The server did not return a payment record.');
      const paymentId = record.payment_id;
      const verified = await dispatch(fetchPaymentById({ id: paymentId, applicationId: selectedApplicationId })).unwrap(); record = verified?.data || verified;
      if (Number(record.payment_id) !== Number(paymentId) || Number(record.application_id) !== Number(selectedApplicationId)) throw new Error('The payment record does not match the selected application.');
      dispatch(setResultState({ resultPayment: record, resultLoading: false, resultError: '' }));
      const status = String(record.payment_status || '').toUpperCase();
      if (status === 'COMPLETED') navigate(`/payment-success/${record.payment_id}`);
      else if (status === 'FAILED') navigate(`/payment-failure/${record.payment_id}`);
      else dispatch(setPaymentMessage(`Payment record ${record.payment_id} is ${status || 'unconfirmed'}. This is a simulated record only; no real money was collected or transferred.`));
    } catch (error) {
      dispatch(setPaymentError(errorText(error, 'Unable to complete the simulated payment. Please try again.')));
    } finally {
      if (ownsAttempt) dispatch(clearApplicantPaymentAttempt(selectedApplicationId));
    }
  }

  return <div className="applicant-pay-now-page"><ApplicantNavigation /><main className="pay-page"><h1 className="pay-title">Complete Your Payment</h1><div className="steps-bar"><PayStep number="1" name="Application Form" state="green" icon="✓" /><div className="step-line" /><PayStep number="2" name="Documents" state="green" icon="✓" /><div className="step-line" /><PayStep number="3" name="Payment" state="blue" icon="₹" /><div className="step-line" /><PayStep number="4" name="Submitted" state="grey" icon="›" /></div>
    {appLoading ? <p className="pay-message">Loading your application and payment details...</p> : requestError && !selected ? <p className="pay-message pay-error" role="alert">{requestError}</p> : selectedApplicationUnavailable ? <p className="pay-message pay-error" role="alert">The selected application is unavailable for this Applicant account. Return to the application workflow and try again.</p> : !applications.length ? <p className="pay-message">No application was found for this applicant account. Apply for a license before paying.</p> : <div className="columns"><div className="col-left">
      {(candidates.length > 1 || (!selected && candidates.length > 0)) && <div className="card"><label className="pay-label" htmlFor="payment-application">Select the application to pay for</label><select id="payment-application" value={selected?.application_id || ''} onChange={chooseApplication}><option value="">Choose an application</option>{candidates.map((item) => <option key={item.application_id} value={item.application_id}>{item.application_ref || item.application_id} — {item.business_name || 'Business name unavailable'}</option>)}</select></div>}
      <section className="card"><div className="card-head"><span className="card-title">Application Summary</span><span className="ref-no">{selected ? `REF: ${selected.application_ref || selected.application_id}` : 'Application reference unavailable'}</span></div>{selected ? <><div className="info-grid"><div><p className="lbl">Trade Name</p><p className="val">{selected.business_name || 'Unavailable'}</p></div><div><p className="lbl">License Category</p><p className="val">{selected.trade_category || selected.business_type || 'Unavailable'}</p></div><div><p className="lbl">Validity Period</p><p className="val">1 Year ({new Date().getFullYear()}–{new Date().getFullYear()+1})</p></div><div><p className="lbl">Establishment Type</p><p className="val">{selected.business_type || 'Unavailable'}</p></div></div><hr className="divider" /><div className="fee-row"><span>Processing Fee</span><span>{formatMoney(fees.processing)}</span></div><div className="fee-row"><span>Service Tax ({fees.taxRate}%)</span><span>{formatMoney(fees.tax)}</span></div><div className="fee-row"><span>Platform Fee</span><span>{formatMoney(fees.platform)}</span></div><div className="fee-row total"><span>Total Payable Amount</span><span>{formatMoney(fees.total)}</span></div></> : <p className="pay-hint">Choose an application above. The selected application will be displayed here before payment.</p>}</section>
      <section className="card"><p className="card-title">Select Payment Method</p>{[['upi','UPI / QR Code'],['card','Debit / Credit Card'],['net','Net Banking']].map(([value,label]) => <label className={`pay-opt ${workflow.paymentMethod === value ? 'active' : ''}`} key={value}><input type="radio" name="method" value={value} checked={workflow.paymentMethod === value} onChange={() => dispatch(setPaymentMethod(value))} />{label}</label>)}<button type="button" className={`pay-btn${alreadyComplete ? ' pay-btn-paid' : ''}`} id="payBtn" onClick={submitPayment} disabled={paying || appLoading || !paymentsReady || !selected || alreadyComplete}>{paying ? 'Recording simulated payment…' : `Pay Now · ${formatMoney(fees.total)}`}</button>{!alreadyComplete && (workflow.paymentError || requestError) && <p className="pay-result pay-error" role="alert">{workflow.paymentError || requestError}</p>}{workflow.paymentMessage && <p className="pay-result" role="status">{workflow.paymentMessage}</p>}{alreadyComplete && <p className="pay-result pay-completed">Existing application payment state is complete. This is a simulation only.</p>}</section>
    </div></div>}</main></div>;
}
function formatMoney(value) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value) || 0); }
function PayStep({ number, name, state, icon }) { return <div className="step"><div className={`dot ${state}`}>{icon}</div><div className="step-text"><span className="step-num">STEP {number}</span><span className="step-name">{name}</span></div></div>; }
