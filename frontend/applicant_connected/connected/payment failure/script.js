document.documentElement.style.visibility = 'hidden';

function loadFailedPayment(paymentId) {
  var token = sessionStorage.getItem('accessToken') || '';
  if (!token || !paymentId) return Promise.reject(new Error('A failed payment record was not provided.'));
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

function formatFailedPaymentMoney(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amount) || 0);
}

function redirectFromUnconfirmedFailure(message) {
  sessionStorage.removeItem('failedPaymentId');
  sessionStorage.setItem('paymentFlowNotice', message);
  window.location.replace('../paynow/index.html');
}

document.addEventListener('DOMContentLoaded', function() {
  var paymentId = sessionStorage.getItem('failedPaymentId');
  loadFailedPayment(paymentId).then(function(payment) {
    if (String(payment.payment_status || '').toUpperCase() !== 'FAILED') {
      redirectFromUnconfirmedFailure('TradeZo has not confirmed a failed payment.');
      return;
    }

    var expectedApplicationId = Number(sessionStorage.getItem('backendApplicationId'));
    if (expectedApplicationId && Number(payment.application_id) !== expectedApplicationId) {
      redirectFromUnconfirmedFailure('The failed payment does not match the current application.');
      return;
    }
    var app = (window.TRADEZO && Array.isArray(TRADEZO.applications) ? TRADEZO.applications : []).find(function(item) {
      return Number(item.application_id || item.backendId) === Number(payment.application_id);
    }) || null;
    var ref = (app && (app.application_ref || app.appRef || app.id)) || sessionStorage.getItem('applicationRef') || ('APP-' + payment.application_id);
    var appId = document.getElementById('dispAppId');
    if (appId) appId.textContent = ref;
    var txnId = document.getElementById('dispTxnId');
    if (txnId) txnId.textContent = payment.transaction_id || ('Payment ' + payment.payment_id);
    var amount = document.getElementById('dispAmount');
    if (amount) amount.textContent = formatFailedPaymentMoney(payment.amount);
    var date = document.getElementById('dispDate');
    if (date) {
      var paymentDate = new Date(payment.payment_date);
      date.textContent = isNaN(paymentDate.getTime()) ? '—' : paymentDate.toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    var reason = document.querySelector('.reason-box p');
    if (reason) reason.textContent = 'TradeZo has marked this payment FAILED through its existing verification flow. The application has not been marked paid.';
    var retryBtn = document.getElementById('retryBtn');
    if (retryBtn) retryBtn.addEventListener('click', function() { window.location.href = '../paynow/index.html'; });
    var historyBtn = document.getElementById('historyBtn');
    if (historyBtn) historyBtn.addEventListener('click', function() { window.location.href = '../payments/index.html'; });
    var cancelBtn = document.querySelector('.btn-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', function() { window.location.href = '../Applicant%20dashboard/index.html'; });
    document.documentElement.style.visibility = '';
  }).catch(function(error) {
    redirectFromUnconfirmedFailure(error.message || 'Could not verify payment status.');
  });
});
