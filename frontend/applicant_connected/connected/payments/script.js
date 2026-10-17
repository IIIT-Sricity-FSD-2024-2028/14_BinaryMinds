(function () {
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
    });
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) return '—';
    var date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function renderTransactions(payments) {
    var tbody = document.getElementById('transactionsTbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!payments.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No payment transactions found.</td></tr>';
      return;
    }

    payments.forEach(function (payment) {
      var status = String(payment.payment_status || '').toUpperCase();
      var successful = status === 'COMPLETED';
      var statusBadge = successful
        ? '<span class="badge success">Success</span>'
        : '<span class="badge failed">' + escapeHtml(status || 'PENDING') + '</span>';
      var action = successful
        ? '<a href="#" class="print-receipt">Print Receipt</a>'
        : '<a href="../paynow/index.html">Continue Payment</a>';
      var row = document.createElement('tr');
      row.innerHTML = '<td>' + escapeHtml(payment.transaction_id || payment.payment_id) + '</td>' +
        '<td>' + escapeHtml(formatDate(payment.payment_date)) + '</td>' +
        '<td>' + escapeHtml(formatMoney(payment.amount)) + '</td>' +
        '<td>' + escapeHtml(payment.payment_method || '—') + '</td>' +
        '<td>' + statusBadge + '</td><td>' + action + '</td>';
      tbody.appendChild(row);
    });
  }

  function renderReceipts(payments) {
    var tbody = document.getElementById('receiptsTbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var completed = payments.filter(function (payment) { return String(payment.payment_status || '').toUpperCase() === 'COMPLETED'; });
    if (!completed.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No receipts available.</td></tr>';
      return;
    }
    completed.forEach(function (payment) {
      var row = document.createElement('tr');
      row.innerHTML = '<td>RC-' + escapeHtml(payment.payment_id) + '</td>' +
        '<td>' + escapeHtml(formatDate(payment.payment_date)) + '</td>' +
        '<td><span class="dot green"></span> Generated</td>' +
        '<td><button type="button" class="receipt-view" aria-label="Print receipt">Print</button></td>';
      tbody.appendChild(row);
    });
  }

  async function loadPayments() {
    var message = document.getElementById('paymentsMessage');
    var token = sessionStorage.getItem('accessToken') || '';
    var applications = window.TRADEZO && Array.isArray(TRADEZO.applications) ? TRADEZO.applications : [];
    var applicationIds = applications.map(function (app) { return Number(app.application_id || app.backendId); }).filter(Boolean);
    if (!token) throw new Error('Your session has expired. Please sign in again.');

    var responses = await Promise.all(applicationIds.map(async function (id) {
      var response = await fetch('http://localhost:3000/api/payments/application/' + id, {
        headers: { Authorization: 'Bearer ' + token }
      });
      var payload = await response.json().catch(function () { return []; });
      if (!response.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(' ') : (payload.message || 'Unable to load payment history.'));
      return Array.isArray(payload) ? payload : (payload.data || []);
    }));
    var payments = responses.flat().sort(function (a, b) {
      return new Date(b.payment_date || 0).getTime() - new Date(a.payment_date || 0).getTime();
    });

    renderTransactions(payments);
    renderReceipts(payments);
    var latestCompleted = payments.find(function (payment) { return String(payment.payment_status || '').toUpperCase() === 'COMPLETED'; });
    var dateEl = document.getElementById('lastPaymentDate');
    var amountEl = document.getElementById('lastSuccessfulPayment');
    if (dateEl) dateEl.textContent = latestCompleted ? formatDate(latestCompleted.payment_date) : '—';
    if (amountEl) amountEl.textContent = latestCompleted ? formatMoney(latestCompleted.amount) : '—';
    var statusSummary = document.getElementById('paymentSummaryStatus');
    var methodSummary = document.getElementById('paymentSummaryMethod');
    var receiptSummary = document.getElementById('paymentSummaryReceipt');
    if (statusSummary) statusSummary.textContent = latestCompleted ? 'Latest payment was verified as successful.' : 'No completed payment is recorded.';
    if (methodSummary) methodSummary.textContent = latestCompleted && latestCompleted.payment_method ? 'Method used: ' + latestCompleted.payment_method : 'Payment method is not recorded.';
    if (receiptSummary) receiptSummary.textContent = latestCompleted ? 'A receipt is available to print.' : 'Receipts appear after a payment is verified.';

    document.querySelectorAll('.print-receipt, .receipt-view').forEach(function (button) {
      button.addEventListener('click', function (event) { event.preventDefault(); window.print(); });
    });
    if (message) message.textContent = '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var printButton = document.querySelector('.btn-print');
    if (printButton) printButton.addEventListener('click', function () { window.print(); });
    loadPayments().catch(function (error) {
      var message = document.getElementById('paymentsMessage');
      if (message) message.textContent = error.message || 'Unable to load payment history.';
    });
  });
})();
