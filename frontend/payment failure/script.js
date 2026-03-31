// Retry Payment → go to payment page
document.getElementById('retryBtn').addEventListener('click', function () {
  window.location.href = 'payment.html';
});

// Back to Payment History
document.getElementById('historyBtn').addEventListener('click', function () {
  window.location.href = 'payments.html';
});

// Cancel → go back
document.getElementById('cancelBtn').addEventListener('click', function () {
  window.history.back();
});