document.documentElement.style.visibility = 'hidden';

function loadConfirmedPayment(paymentId) {
  var token = sessionStorage.getItem('accessToken') || '';
  if (!token || !paymentId) return Promise.reject(new Error('A confirmed payment record was not provided.'));
  return fetch(TRADEZO.API_BASE + '/payments/' + encodeURIComponent(paymentId), {
    cache: 'no-store',
    headers: { Authorization: 'Bearer ' + token }
  }).then(function(response) {
    return response.text().then(function(text) {
      var payload = null;
      try { payload = text ? JSON.parse(text) : null; } catch (error) {}
      if (!response.ok) {
        var message = payload && payload.message;
        if (Array.isArray(message)) message = message.join(' ');
        throw new Error(message || 'Unable to confirm payment status.');
      }
      return payload;
    });
  });
}

function formatPaymentMoney(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amount) || 0);
}

function redirectFromUnconfirmedSuccess(message) {
  sessionStorage.removeItem('confirmedPaymentId');
  sessionStorage.setItem('paymentFlowNotice', message);
  window.location.replace('../paynow/index.html');
}

document.addEventListener('DOMContentLoaded', function() {
  var paymentId = sessionStorage.getItem('confirmedPaymentId');
  loadConfirmedPayment(paymentId).then(function(payment) {
    if (String(payment.payment_status || '').toUpperCase() !== 'COMPLETED') {
      redirectFromUnconfirmedSuccess('TradeZo has not confirmed a completed payment. No receipt has been issued.');
      return;
    }

    var expectedApplicationId = Number(sessionStorage.getItem('backendApplicationId'));
    if (expectedApplicationId && Number(payment.application_id) !== expectedApplicationId) {
      redirectFromUnconfirmedSuccess('The confirmed payment does not match the current application.');
      return;
    }

    var app = (window.TRADEZO && Array.isArray(TRADEZO.applications) ? TRADEZO.applications : []).find(function(item) {
      return Number(item.application_id || item.backendId) === Number(payment.application_id);
    }) || null;
    var ref = (app && (app.application_ref || app.appRef || app.id)) || sessionStorage.getItem('applicationRef') || ('APP-' + payment.application_id);
    document.querySelectorAll('.ref-number, #appRef, .application-ref').forEach(function(element) { element.textContent = ref; });
    document.querySelectorAll('.business-name, .biz-name').forEach(function(element) { element.textContent = (app && (app.business_name || app.businessName)) || '—'; });
    document.querySelectorAll('.payment-amount').forEach(function(element) { element.textContent = formatPaymentMoney(payment.amount); });

    var txnRef = document.getElementById('txnRef');
    if (txnRef) txnRef.textContent = payment.transaction_id || ('Payment ' + payment.payment_id);
    var date = document.getElementById('subDate');
    if (date) {
      var paymentDate = new Date(payment.payment_date);
      date.textContent = isNaN(paymentDate.getTime()) ? '—' : paymentDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    var trackBtn = document.getElementById('trackBtn');
    if (trackBtn) trackBtn.addEventListener('click', function() { window.location.href = '../Track%20Application%20Status/index.html'; });
    var downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.addEventListener('click', function() { window.print(); });
    var cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', function() { window.location.href = '../Applicant%20dashboard/index.html'; });
    window.goTrack = function() { window.location.href = '../Track%20Application%20Status/index.html'; };
    window.goDashboard = function() { window.location.href = '../Applicant%20dashboard/index.html'; };
    document.documentElement.style.visibility = '';
  }).catch(function(error) {
    redirectFromUnconfirmedSuccess(error.message || 'Could not verify payment. No receipt has been issued.');
  });
});
