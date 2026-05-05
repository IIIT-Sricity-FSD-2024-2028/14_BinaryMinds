document.addEventListener('DOMContentLoaded', function() {
  var ref = sessionStorage.getItem('applicationRef') || '';
  var app = null;

  if (ref && window.TRADEZO) {
    app = TRADEZO.applications.find(function(a){ return a.appRef === ref || a.id === ref; }) || null;
  }

  // Fallback dynamic fee logic based on payment success
  function getDynamicFeeFallback() {
    var feeString = '₹2100.00';
    try {
       var fees = JSON.parse(localStorage.getItem('tradezo_fees'));
       if (fees && fees.new) {
          var val = parseInt(fees.new, 10);
          val = val + (val * 0.05); // including 5% tax/charge
          feeString = '₹' + val.toFixed(2); 
       }
    } catch(e) {}
    return feeString;
  }

  var dispAppId = document.getElementById('dispAppId');
  if (dispAppId) {
    dispAppId.textContent = ref || (app ? app.id : 'TL-UNKNOWN');
  }

  var dispTxnId = document.getElementById('dispTxnId');
  if (dispTxnId) {
    dispTxnId.textContent = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
  }

  var dispAmount = document.getElementById('dispAmount');
  if (dispAmount) {
    var amount = sessionStorage.getItem('calculatedFeeString') || (app ? app.paymentAmount : null) || getDynamicFeeFallback();
    dispAmount.textContent = amount;
  }

  var dispDate = document.getElementById('dispDate');
  if (dispDate) {
    var now = new Date();
    var options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    dispDate.textContent = now.toLocaleDateString('en-IN', options);
  }

  var retryBtn = document.getElementById('retryBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', function() {
      window.location.href = '../paynow/index.html';
    });
  }

  var historyBtn = document.getElementById('historyBtn');
  if (historyBtn) {
    historyBtn.addEventListener('click', function() {
      window.location.href = '../payments/index.html';
    });
  }

  var cancelBtn = document.querySelector('.btn-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      window.location.href = '../Applicant dashboard/index.html';
    });
  }
});
