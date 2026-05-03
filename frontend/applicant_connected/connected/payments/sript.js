// Highlight selected payment option on click
var options = document.querySelectorAll('.pay-option');
options.forEach(function (option) {
  option.addEventListener('click', function () {
    options.forEach(function (o) { o.classList.remove('selected'); });
    option.classList.add('selected');
  });
});

// Pay Now button — validate payment method is selected
document.getElementById('payBtn').addEventListener('click', function () {
  var selected = document.querySelector('input[name="payment"]:checked');

  // Remove any old error message
  var oldErr = document.getElementById('paymentError');
  if (oldErr) oldErr.remove();

  if (!selected) {
    var err = document.createElement('p');
    err.id = 'paymentError';
    err.style.color = '#e53935';
    err.style.fontSize = '13px';
    err.style.textAlign = 'center';
    err.style.marginTop = '10px';
    err.innerText = 'Please select a payment method before proceeding.';
    document.querySelector('.payment-options').after(err);
    return;
  }

  // All good — go to payment success page
  window.location.href = '../payment-success/index.html';
});

// Cancel button
document.getElementById('cancelBtn').addEventListener('click', function () {
  window.history.back();
});