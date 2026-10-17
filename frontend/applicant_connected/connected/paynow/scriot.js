// TradeZo's existing local payment flow is simulated by its Payments API.
function getFeeBreakdown() {
  var form = {};
  try { form = JSON.parse(sessionStorage.getItem('applicationForm') || '{}'); } catch (error) {}
  var municipalityId = form.municipalityId || form.municipality_id || '';
  var municipality = window.TRADEZO && municipalityId && typeof TRADEZO.getMunicipality === 'function'
    ? TRADEZO.getMunicipality(municipalityId)
    : null;
  var processingFee = Number(municipality && municipality.base_processing_fee) || 1200;
  var platformFee = Number(municipality && municipality.platform_fee) || 250;
  var taxPercent = Number(municipality && municipality.service_tax_percentage);
  if (!Number.isFinite(taxPercent)) taxPercent = 5;
  var tax = Math.round(processingFee * taxPercent / 100);
  return { processingFee: processingFee, platformFee: platformFee, tax: tax, total: processingFee + platformFee + tax, form: form };
}

function paymentRequest(path, options) {
  var token = sessionStorage.getItem('accessToken') || '';
  return fetch(TRADEZO.API_BASE + path, Object.assign({
    cache: 'no-store',
    headers: { Authorization: 'Bearer ' + token }
  }, options || {})).then(function(response) {
    return response.text().then(function(text) {
      var payload = null;
      try { payload = text ? JSON.parse(text) : null; } catch (error) {}
      if (!response.ok) {
        var errorMessage = payload && payload.message;
        if (Array.isArray(errorMessage)) errorMessage = errorMessage.join(' ');
        throw new Error(errorMessage || ('Payment request failed (' + response.status + ').'));
      }
      return payload;
    });
  });
}

function readPaymentApplicationContext() {
  var form = {};
  var current = {};
  try { form = JSON.parse(sessionStorage.getItem('applicationForm') || '{}'); } catch (error) {}
  try { current = JSON.parse(sessionStorage.getItem('currentApplication') || '{}'); } catch (error) {}
  if (!form || typeof form !== 'object') form = {};
  if (!current || typeof current !== 'object') current = {};
  return { form: form, current: current };
}

function resolvePaymentApplication() {
  var context = readPaymentApplicationContext();
  var storedId = Number(sessionStorage.getItem('backendApplicationId')) || Number(context.current.application_id || context.current.backendId || context.current.id);
  var storedRef = String(sessionStorage.getItem('applicationRef') || context.current.application_ref || context.current.appRef || '');
  return paymentRequest('/applications/mine').then(function (result) {
    var applications = Array.isArray(result) ? result : (result && Array.isArray(result.data) ? result.data : []);
    if (!applications.length) throw new Error('No saved application was found for this Applicant account.');

    var application = storedId && applications.find(function (item) { return Number(item.application_id) === storedId; });
    if (!application && storedRef) {
      application = applications.find(function (item) {
        return String(item.application_ref || '').toLowerCase() === storedRef.toLowerCase() || String(item.application_id) === storedRef;
      });
    }
    if (!application && (context.form.businessName || context.form.municipalityId || context.form.municipality_id)) {
      application = applications.find(function (item) {
        var sameBusiness = !context.form.businessName || String(item.business_name || item.businessName || '').trim().toLowerCase() === String(context.form.businessName).trim().toLowerCase();
        var formMunicipality = context.form.municipalityId || context.form.municipality_id;
        var sameMunicipality = !formMunicipality || String(item.municipality_id || item.municipalityId || '').toLowerCase() === String(formMunicipality).toLowerCase();
        return sameBusiness && sameMunicipality;
      });
    }

    if (!application) {
      var unpaid = applications.filter(function (item) { return item.paymentDone !== true && item.payment_done !== true; });
      var candidates = unpaid.length ? unpaid : applications;
      candidates.sort(function (left, right) {
        return new Date(right.submitted_at || right.created_at || 0) - new Date(left.submitted_at || left.created_at || 0);
      });
      application = candidates[0];
    }
    var id = Number(application && application.application_id);
    if (!id) throw new Error('The saved application did not include a valid TradeZo application ID.');

    sessionStorage.setItem('backendApplicationId', String(id));
    if (application.application_ref) sessionStorage.setItem('applicationRef', application.application_ref);
    sessionStorage.setItem('currentApplication', JSON.stringify(application));
    var form = Object.assign({}, context.form, {
      businessName: application.business_name || application.businessName || context.form.businessName || '',
      businessType: application.business_type || application.businessType || context.form.businessType || '',
      tradeCategory: application.trade_category || application.tradeCategory || context.form.tradeCategory || '',
      municipalityId: application.municipality_id || application.municipalityId || context.form.municipalityId || context.form.municipality_id || ''
    });
    sessionStorage.setItem('applicationForm', JSON.stringify(form));
    return application;
  });
}

function followPaymentStatus(payment) {
  var status = String(payment.payment_status || '').toUpperCase();
  if (status === 'COMPLETED') {
    sessionStorage.setItem('confirmedPaymentId', String(payment.payment_id));
    sessionStorage.removeItem('failedPaymentId');
    window.location.href = '../payment%20success/index.html';
    return true;
  }
  if (status === 'FAILED') {
    sessionStorage.setItem('failedPaymentId', String(payment.payment_id));
    sessionStorage.removeItem('confirmedPaymentId');
    window.location.href = '../payment%20failure/index.html';
    return true;
  }
  if (status === 'PENDING') {
    sessionStorage.setItem('pendingPaymentId', String(payment.payment_id));
    sessionStorage.setItem('pendingPaymentApplicationId', String(payment.application_id));
    sessionStorage.setItem('confirmedPaymentId', '');
    return false;
  }
  throw new Error('The payment service returned an unrecognized status. No success was recorded.');
}

function renderPaymentSummary() {
  var feeData = getFeeBreakdown();
  var form = feeData.form;
  sessionStorage.setItem('calculatedFeeString', '₹' + feeData.total.toFixed(2));

  var amounts = {
    baseFee: feeData.processingFee,
    taxFee: feeData.tax,
    platformFee: feeData.platformFee,
    totalFee: feeData.total,
    btnFee: feeData.total
  };
  Object.keys(amounts).forEach(function (id) {
    var element = document.getElementById(id);
    if (element) element.textContent = '₹' + amounts[id].toFixed(2);
  });

  var tradeName = document.getElementById('tradeName');
  var category = document.getElementById('licCat');
  var establishment = document.getElementById('estType');
  if (tradeName && form.businessName) tradeName.textContent = form.businessName;
  if (category && form.tradeCategory) category.textContent = form.tradeCategory;
  if (establishment && form.businessType) establishment.textContent = form.businessType;

  var reference = document.getElementById('refNo');
  var appRef = sessionStorage.getItem('applicationRef');
  if (reference) reference.textContent = appRef ? 'REF: ' + appRef : 'Application reference pending';

  var validity = Array.from(document.querySelectorAll('.lbl')).find(function (element) {
    return element.textContent.includes('Validity Period');
  });
  if (validity && validity.nextElementSibling) {
    var currentYear = new Date().getFullYear();
    validity.nextElementSibling.textContent = '1 Year (' + currentYear + '-' + (currentYear + 1) + ')';
  }

  document.querySelectorAll('.pay-opt').forEach(function (label) {
    label.addEventListener('click', function () {
      document.querySelectorAll('.pay-opt').forEach(function (option) { option.classList.remove('active'); });
      label.classList.add('active');
    });
  });

  var paymentMessage = document.getElementById('paymentMessage');
  var notice = sessionStorage.getItem('paymentFlowNotice');
  if (notice && paymentMessage) {
    paymentMessage.textContent = notice;
    sessionStorage.removeItem('paymentFlowNotice');
  }
}

var paymentApplicationPromise = null;
document.addEventListener('DOMContentLoaded', function () {
  paymentApplicationPromise = resolvePaymentApplication().then(function (application) {
    renderPaymentSummary();
    return application;
  }).catch(function (error) {
    renderPaymentSummary();
    var message = document.getElementById('paymentMessage');
    if (message) message.textContent = error.message || 'Unable to load your saved application.';
    throw error;
  });
  // The click handler also awaits this promise; this catch prevents an
  // unhandled rejection when the page is opened without an Applicant session.
  paymentApplicationPromise.catch(function () {});
});

var paymentInProgress = false;
window.doPayment = async function () {
  var message = document.getElementById('paymentMessage');
  var button = document.getElementById('payBtn');
  var token = sessionStorage.getItem('accessToken') || '';
  var selectedMethod = document.querySelector('input[name="method"]:checked');
  if (paymentInProgress) return;
  if (!selectedMethod) {
    if (message) message.textContent = 'Please select a payment method.';
    return;
  }
  if (!token) {
    if (message) message.textContent = 'Your session has expired. Please sign in again.';
    return;
  }

  paymentInProgress = true;
  var originalButtonHtml = button ? button.innerHTML : '';
  if (button) {
    button.disabled = true;
    button.textContent = 'Checking payment status...';
  }
  if (message) message.textContent = '';

  try {
    var application = await (paymentApplicationPromise || resolvePaymentApplication());
    var applicationId = Number(application.application_id);
    var existing = await paymentRequest('/payments/application/' + applicationId);
    var payments = Array.isArray(existing) ? existing : (existing && Array.isArray(existing.data) ? existing.data : []);
    var completed = payments.find(function (item) { return String(item.payment_status || '').toUpperCase() === 'COMPLETED'; });
    if (completed) {
      followPaymentStatus(completed);
      return;
    }

    var pending = payments.filter(function (item) { return String(item.payment_status || '').toUpperCase() === 'PENDING'; })
      .sort(function (left, right) { return new Date(right.payment_date || 0) - new Date(left.payment_date || 0); })[0];

    var feeData = getFeeBreakdown();
    var municipalityId = feeData.form.municipalityId || feeData.form.municipality_id || '';
    var paymentData = {
      application_id: applicationId,
      municipality_id: municipalityId,
      amount: feeData.total,
      processing_fee: feeData.processingFee,
      platform_fee: feeData.platformFee,
      service_tax: feeData.tax,
      payment_status: 'COMPLETED'
    };
    if (button) button.textContent = 'Processing Payment...';
    // Reuse an existing pending record; create one only when this application
    // has no pending payment, so repeat clicks do not create duplicate records.
    var payment = pending
      ? await paymentRequest('/payments/' + encodeURIComponent(pending.payment_id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ payment_status: 'COMPLETED' })
        })
      : await paymentRequest('/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify(paymentData)
        });
    if (!payment || !payment.payment_id) throw new Error('The backend did not return a payment record.');

    if (followPaymentStatus(payment)) return;
    if (message) message.textContent = 'Payment request ' + payment.payment_id + ' is pending. This server has no payment gateway, so no money was collected and the application has not been marked paid.';
  } catch (error) {
    if (message) message.textContent = error.message || 'Unable to connect to the payment service. Please try again.';
  } finally {
    paymentInProgress = false;
    if (button) {
      button.disabled = false;
      button.innerHTML = originalButtonHtml;
    }
  }
};
