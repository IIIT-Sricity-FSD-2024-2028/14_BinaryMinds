// DO authorization/signing.js — uses TRADEZO mock data
document.addEventListener('DOMContentLoaded', function() {
  var appId = sessionStorage.getItem('selectedAppDO');

  if (!appId) {
    alert('No application selected. Redirecting to authorization list...');
    window.location.href = 'index.html';
    return;
  }

  var app = TRADEZO.getApplication(appId);
  if (!app) {
    alert('Application not found. Redirecting to authorization list...');
    window.location.href = 'index.html';
    return;
  }

  // Find inspection
  var inspection = TRADEZO.inspections.find(function(ins) { return ins.appId === appId; });

  // Populate page
  document.getElementById('appIdDisplay').textContent = app.id;
  document.getElementById('docSerial').textContent = 'Serial No: ' + app.appRef;
  document.getElementById('docLicensee').textContent = app.businessName;
  document.getElementById('docRegId').textContent = app.appRef;
  document.getElementById('docActivities').textContent = 'Subject to the provisions of the regulatory framework, the licensee is authorized to conduct ' + app.tradeCategory + ' operations at ' + app.shopAddress + ', ' + app.city + '.';
  
  // Set dates
  var today = new Date();
  var expiry = new Date(today);
  expiry.setFullYear(expiry.getFullYear() + 1);
  document.getElementById('docIssueDate').textContent = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('docExpiryDate').textContent = expiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Update FO status
  var foStatusEl = document.getElementById('foStatus');
  if (inspection && inspection.result) {
    foStatusEl.textContent = 'Completed - ' + inspection.result;
  } else {
    foStatusEl.textContent = 'Completed - ' + (app.inspectionResult || 'Approved');
  }

  // Toggle auth options
  document.querySelectorAll('.auth-option').forEach(function(opt) {
    opt.addEventListener('click', function() {
      document.querySelectorAll('.auth-option').forEach(function(o) {
        o.classList.remove('selected');
        var chk = o.querySelector('.auth-check');
        if (chk) chk.remove();
      });
      opt.classList.add('selected');
      if (!opt.querySelector('.auth-check')) {
        var chk = document.createElement('div');
        chk.className = 'auth-check';
        chk.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        opt.appendChild(chk);
      }
    });
  });

  // Sign & Issue button
  var signBtn = document.getElementById('signBtn');
  if (signBtn) {
    signBtn.addEventListener('click', function() {
      var selected = document.querySelector('.auth-option.selected');
      if (!selected) {
        alert('Please select an authorization method before signing.');
        return;
      }
      if (confirm('Confirm: Issue license for application ' + app.id + '?')) {
        var licenseId = 'LIC-' + Date.now().toString().slice(-6);
        sessionStorage.setItem('issuedLicense', app.id);
        alert('License signed and issued successfully! License No: ' + licenseId);
        window.location.href = '../compliance/index.html';
      }
    });
  }
});
