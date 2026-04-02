// payment success/script.js
document.addEventListener('DOMContentLoaded', function() {
  var ref = sessionStorage.getItem('applicationRef') || '';
  var app = null;

  if (ref && window.TRADEZO) {
    app = TRADEZO.applications.find(function(a){ return a.appRef === ref || a.id === ref; }) || null;
  }

  // Show ref number wherever it appears
  var refEls = document.querySelectorAll('.ref-number, #appRef, .application-ref');
  refEls.forEach(function(el){ if (ref) el.textContent = ref; });

  // Show business name if available
  if (app) {
    var bizEls = document.querySelectorAll('.business-name, .biz-name');
    bizEls.forEach(function(el){ el.textContent = app.businessName; });
    var amtEls = document.querySelectorAll('.payment-amount');
    amtEls.forEach(function(el){ el.textContent = app.paymentAmount || '₹5,000'; });
  }

  // Wire buttons
  var trackBtn = document.getElementById('trackBtn');
  if (trackBtn) trackBtn.addEventListener('click', function(){
    window.location.href = '../Track Application Status/index.html';
  });

  var downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) downloadBtn.addEventListener('click', function(){ window.print(); });

  var cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', function(){
    window.location.href = '../Applicant dashboard/index.html';
  });

  // Also handle any inline onclick="goTrack()" patterns
  window.goTrack = function() { window.location.href = '../Track Application Status/index.html'; };
  window.goDashboard = function() { window.location.href = '../Applicant dashboard/index.html'; };
});
