// fo_connected/detail/script.js
// Loads selected application details from TRADEZO mock data

document.addEventListener('DOMContentLoaded', function() {
  var appId = sessionStorage.getItem('selectedApp') || 'TL-2026-001';
  var app = null;

  var applications = [];
  try { applications = JSON.parse(localStorage.getItem('applications') || '[]'); } catch(e){}
  var localApp = applications.find(a => a.id === appId);

  // Fallback data sources for richer detail
  var tzApp = window.TRADEZO ? TRADEZO.getApplication(appId) : null;
  
  var submittedApps = [];
  try { submittedApps = JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]'); } catch(e){}
  var subApp = submittedApps.find(a => (a.id === appId || a.appRef === appId));

  // Merge them prioritize localApp for status, tz/subApp for static data
  var mergedApp = Object.assign({}, tzApp, subApp, localApp);

  if (mergedApp && Object.keys(mergedApp).length > 0) {
      app = {
          id: mergedApp.id || mergedApp.appRef || appId,
          businessName: mergedApp.businessName || 'N/A',
          applicantName: mergedApp.applicantName || 'N/A',
          tradeCategory: mergedApp.tradeCategory || mergedApp.licenseType || mergedApp.category || 'N/A',
          shopAddress: mergedApp.shopAddress || mergedApp.address || 'N/A',
          city: mergedApp.city || '',
          district: mergedApp.district || 'N/A',
          state: mergedApp.state || 'N/A',
          pincode: mergedApp.pincode || 'N/A',
          shopArea: mergedApp.shopArea || 'N/A',
          aadhaar: mergedApp.aadhaar || 'N/A',
          gender: mergedApp.gender || 'N/A',
          fatherName: mergedApp.fatherName || 'N/A',
          motherName: mergedApp.motherName || 'N/A',
          status: mergedApp.status || 'Pending',
          submittedDate: mergedApp.submittedDate || 'N/A',
          phone: mergedApp.phone || 'N/A',
          email: mergedApp.email || 'N/A',
          documents: mergedApp.documents || mergedApp.docs || {}
      };
  } else {
      app = null;
  }

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
    fill(['.applicant-name', '#appName'],           app.applicantName); 
    fill(['.trade-category', '#category'],          app.tradeCategory || app.licenseType);
    fill(['.app-address', '#address'],              app.shopAddress);
    fill(['.app-status', '#status'],                app.status);
    fill(['.submitted-date', '#submittedDate'],     app.submittedDate);
    fill(['.phone', '#contact'],                    app.phone);         
    fill(['.email', '#email'],                      app.email);
    fill(['#city'], app.city);
    fill(['#district'], app.district);
    fill(['#state'], app.state);
    fill(['#pincode'], app.pincode);
    fill(['#shopArea'], app.shopArea);
    fill(['#aadhaar'], app.aadhaar);
    fill(['#gender'], app.gender);
    fill(['#fatherName'], app.fatherName);
    fill(['#motherName'], app.motherName);

    // Documents
    var docs = app.documents || {};
    if (docs.aadhaar) {
        document.getElementById('doc1File').textContent = docs.aadhaar.name;
        document.getElementById('doc1Meta').textContent = docs.aadhaar.size + ' • Uploaded ' + app.submittedDate;
    }
    if (docs.addressProof) {
        document.getElementById('doc2File').textContent = docs.addressProof.name;
        document.getElementById('doc2Meta').textContent = docs.addressProof.size + ' • Uploaded ' + app.submittedDate;
    }
    if (docs.shopPhoto) {
        document.getElementById('doc3File').textContent = docs.shopPhoto.name;
        document.getElementById('doc3Meta').textContent = docs.shopPhoto.size + ' • Uploaded ' + app.submittedDate;
    }
  }

  // Hide action buttons if in readonly mode (e.g. from history)
  if (window.location.search.includes('readonly=true')) {
      var actionBtns = document.querySelector('.action-btns');
      if (actionBtns) actionBtns.style.display = 'none';
  }
});

// Approve → go directly to Start Inspection
function approve() {
  var appId = sessionStorage.getItem('selectedApp') || 'TL-2026-001';

  var applications = [];
  try { applications = JSON.parse(localStorage.getItem('applications') || '[]'); } catch(e){}
  
  var approvedApp = null;
  applications.forEach(function(a) {
      if(a.id === appId) {
          a.status = "Pending Inspection";
          approvedApp = a;
      }
  });
  localStorage.setItem('applications', JSON.stringify(applications));

  // Save decision to verification history
  var history = [];
  try { history = JSON.parse(localStorage.getItem('tz_verification_history') || '[]'); } catch(e){ history = []; }
  var appData = approvedApp || (window.TRADEZO ? window.TRADEZO.getApplication(appId) : null);
  var record = {
    appId: appId,
    businessName: appData ? appData.businessName : '',
    applicant: appData ? (appData.applicantName || appData.ownerName) : '',
    submitted: appData ? appData.submittedDate : '',
    decision: 'Approved',
    decidedOn: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
    reason: 'All documents verified'
  };
  history = history.filter(function(item){ return item.appId !== appId; });
  history.push(record);
  localStorage.setItem('tz_verification_history', JSON.stringify(history));

  // Populate Start Inspection session data
  if (approvedApp) {
      sessionStorage.setItem('selectedApp', approvedApp.id);
      sessionStorage.setItem('businessName', approvedApp.businessName || 'N/A');
      sessionStorage.setItem('ownerName', approvedApp.applicantName || 'N/A');
      sessionStorage.setItem('tradeCategory', approvedApp.licenseType || 'N/A');
      sessionStorage.setItem('address', approvedApp.shopAddress || 'N/A');
  }

  // Show verified popup instead of going directly to Start Inspection
  showVerifiedPopup(appId);
}

function showVerifiedPopup(appId) {
  if (!document.getElementById('_veri_styles')) {
    var s = document.createElement('style');
    s.id  = '_veri_styles';
    s.textContent =
      '@keyframes _fadeIn { from{opacity:0} to{opacity:1} }' +
      '@keyframes _popIn  { from{opacity:0;transform:scale(0.75)} to{opacity:1;transform:scale(1)} }';
    document.head.appendChild(s);
  }

  var overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed', 'inset:0',
    'background:rgba(15,23,42,0.55)',
    'z-index:9999',
    'display:flex', 'align-items:center', 'justify-content:center',
    'animation:_fadeIn .25s ease'
  ].join(';');

  var card = document.createElement('div');
  card.style.cssText = [
    'background:#ffffff',
    'border-radius:22px',
    'padding:44px 48px 40px',
    'max-width:420px', 'width:92%',
    'text-align:center',
    'box-shadow:0 24px 72px rgba(0,0,0,0.22)',
    'animation:_popIn .35s cubic-bezier(0.34,1.56,0.64,1)'
  ].join(';');

  card.innerHTML =
    '<div style="width:82px;height:82px;border-radius:50%;' +
      'background:#f0fdf4;' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-size:40px;margin:0 auto 22px;border:3px solid #16a34a22;">' +
      '✅' +
    '</div>' +
    '<h2 style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:8px;">' +
      'Verification Successful!' +
    '</h2>' +
    '<p style="font-size:14px;color:#64748b;line-height:1.65;margin-bottom:26px;">' +
      'Application <b>' + appId + '</b> has been approved and moved to Pending Inspection.' +
    '</p>' +
    '<button id="_popup_ok" style="' +
      'width:100%;padding:14px;border:none;border-radius:12px;cursor:pointer;' +
      'background:linear-gradient(135deg,#2f5bea,#4a90e2);' +
      'color:#fff;font-size:15px;font-weight:700;letter-spacing:0.3px;' +
      'box-shadow:0 4px 14px rgba(47,91,234,.35);' +
      'transition:opacity .2s;">' +
      'Schedule Inspection &rarr;' +
    '</button>';

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  var okBtn = document.getElementById('_popup_ok');
  okBtn.addEventListener('mouseenter', function () { this.style.opacity = '0.88'; });
  okBtn.addEventListener('mouseleave', function () { this.style.opacity = '1'; });

  function closeAndRedirect() {
    overlay.style.opacity    = '0';
    overlay.style.transition = 'opacity .25s';
    setTimeout(function () {
      if (overlay.parentNode) overlay.remove();
      window.location.href = '../scheduleinspection/index.html';
    }, 260);
  }

  okBtn.addEventListener('click', closeAndRedirect);
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
    
    // Update local applications array so applicant side can see it globally
    var applications = [];
    try { applications = JSON.parse(localStorage.getItem('applications') || '[]'); } catch(e){}
    applications.forEach(function(a) {
        if (a.id === appId) {
            a.status = 'Rejected';
            a.rejectionReason = reason.trim();
        }
    });
    localStorage.setItem('applications', JSON.stringify(applications));
    // Save decision to verification history
    var history = [];
    try { history = JSON.parse(localStorage.getItem('tz_verification_history') || '[]'); } catch(e){ history = []; }
    var appData = window.TRADEZO ? TRADEZO.getApplication(appId) : null;
    var record = {
      appId: appId,
      businessName: appData ? appData.businessName : '',
      applicant: appData ? appData.applicantName : '',
      submitted: appData ? appData.submittedDate : '',
      decision: 'Rejected',
      decidedOn: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
      reason: reason.trim()
    };
    history = history.filter(function(item){ return item.appId !== appId; });
    history.push(record);
    localStorage.setItem('tz_verification_history', JSON.stringify(history));

    alert('Application ' + appId + ' has been rejected.\nReason: ' + reason);
    window.location.href = '../verification/index.html';
  }
}
