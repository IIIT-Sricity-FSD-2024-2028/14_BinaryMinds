// fo_connected/detail/script.js
// Loads selected application details from TRADEZO mock data

document.addEventListener('DOMContentLoaded', function() {
  var appId = sessionStorage.getItem('selectedApp') || 'TL-2026-001';
  var app   = TRADEZO ? TRADEZO.getApplication(appId) : null;

  // Helper to fill any element
  function fill(selectors, value) {
    selectors.forEach(function(sel) {
      var el = document.querySelector(sel);
      if (el) el.textContent = value || '—';
    });
  }

  if (app) {
    fill(['.app-id', '#appId', '.application-id'], app.id);
    fill(['.business-name', '#bizName'],            app.businessName);
    fill(['.applicant-name', '#applicantName'],      app.applicantName);
    fill(['.trade-category', '#category'],           app.tradeCategory);
    fill(['.app-address', '#address'],               app.shopAddress + ', ' + app.city);
    fill(['.app-status', '#status'],                 app.status);
    fill(['.submitted-date', '#submittedDate'],       app.submittedDate);
    fill(['.phone', '#phone'],                        app.phone);
    fill(['.email', '#email'],                        app.email);
  }
});

// Approve → go directly to Schedule Inspection (no popups)
function approve() {
  var appId = sessionStorage.getItem('selectedApp') || 'TL-2026-001';
  sessionStorage.setItem('approvedApp', appId);

  // Update status in mock data
  if (window.TRADEZO) {
    var app = TRADEZO.getApplication(appId);
    if (app) app.status = 'Under Verification';
  }

  // Go directly to Schedule Inspection page
  window.location.href = '../scheduleinspection/index.html';
}

// Reject → ask reason then go back to verification
function reject() {
  var appId  = sessionStorage.getItem('selectedApp') || 'TL-2026-001';
  var reason = prompt('Enter rejection reason:');
  if (reason && reason.trim()) {
    if (window.TRADEZO) {
      var app = TRADEZO.getApplication(appId);
      if (app) { app.status = 'Rejected'; app.rejectionReason = reason; }
    }
    alert('Application ' + appId + ' has been rejected.\nReason: ' + reason);
    window.location.href = '../verification/index.html';
  }
}
