// payment failure/script.js
document.addEventListener('DOMContentLoaded', function() {
  var retryBtn = document.getElementById('retryBtn') || document.querySelector('.retry-btn, .btn-retry');
  if (retryBtn) retryBtn.addEventListener('click', function(){
    window.location.href = '../paynow/index.html';
  });

  var historyBtn = document.getElementById('historyBtn');
  if (historyBtn) historyBtn.addEventListener('click', function(){
    window.location.href = '../payments/index.html';
  });

  var cancelBtn = document.querySelector('.btn-cancel, .cancel-btn');
  if (cancelBtn) cancelBtn.addEventListener('click', function(){
    window.location.href = '../Applicant dashboard/index.html';
  });

  window.goDashboard = function(){ window.location.href = '../Applicant dashboard/index.html'; };
  window.goRetry     = function(){ window.location.href = '../paynow/index.html'; };
});
