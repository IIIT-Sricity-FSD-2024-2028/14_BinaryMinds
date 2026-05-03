// DO review/script.js — uses TRADEZO mock data
document.addEventListener('DOMContentLoaded', function() {
  var appId = sessionStorage.getItem('selectedAppDO') || 'TL-2026-001';
  var app   = TRADEZO.getApplication(appId);
  if (!app) return;

  // Fill app details in page
  function fill(selectors, value) {
    [].concat(selectors).forEach(function(sel) {
      var el = document.querySelector(sel);
      if (el) el.textContent = value;
    });
  }

  fill(['.app-id', '.breadcrumb .bc-active', '#appId'], app.id);
  fill(['.business-name', '#bizName'],  app.businessName);
  fill(['.applicant-name'],             app.applicantName);
  fill(['.trade-category'],             app.tradeCategory);
  fill(['.app-address'],                app.shopAddress + ', ' + app.city + ', ' + app.state);
  fill(['.submitted-date'],             app.submittedDate);
  fill(['.payment-ref'],                app.paymentRef || '—');
  fill(['.fo-name'],                    app.foName || '—');
  fill(['.inspection-result'],          app.inspectionResult || '—');

  // Approve → Final Authorization
  var approveBtn = document.querySelector('.btn-approve');
  if (approveBtn) {
    approveBtn.addEventListener('click', function() {
      var justification = document.querySelector('textarea');
      if (justification && justification.value.trim() === '') {
        alert('Please enter reviewer justification before approving.'); return;
      }
      app.doReview = 'Approved'; app.status = 'Approved';
      sessionStorage.setItem('approvedAppDO', appId);
      alert('Application approved! Proceeding to Final Authorization.');
      window.location.href = '../authorization/index.html';
    });
  }

  // Defer
  var deferBtn = document.querySelector('.btn-defer');
  if (deferBtn) {
    deferBtn.addEventListener('click', function() {
      alert('Decision deferred. Application moved back to pending queue.');
      window.location.href = '../worklist/index.html';
    });
  }

  // Reject
  var rejectBtn = document.querySelector('.btn-reject');
  if (rejectBtn) {
    rejectBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to REJECT this application?')) {
        var reason = prompt('Enter rejection reason:');
        if (reason && reason.trim()) {
          app.doReview = 'Rejected'; app.status = 'Rejected'; app.rejectionReason = reason;
          alert('Application ' + appId + ' rejected.\nReason: ' + reason);
          window.location.href = '../worklist/index.html';
        }
      }
    });
  }

  // Go Back
  var goBackBtn = document.querySelector('.btn-goback, .back-btn');
  if (goBackBtn) goBackBtn.addEventListener('click', function() { window.location.href = '../worklist/index.html'; });
});