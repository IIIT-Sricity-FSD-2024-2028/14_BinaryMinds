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

  function getDynamicFeeFallback() {
    var feeString = '₹2100.00';
    try {
       var fees = JSON.parse(localStorage.getItem('tradezo_fees'));
       if (fees && fees.new) {
          var val = parseInt(fees.new, 10);
          val = val + (val * 0.05);
          feeString = '₹' + val.toFixed(2); 
       }
    } catch(e) {}
    return feeString;
  }

  // Show business name if available
  if (app) {
    var bizEls = document.querySelectorAll('.business-name, .biz-name');
    bizEls.forEach(function(el){ el.textContent = app.businessName; });
    var amtEls = document.querySelectorAll('.payment-amount');
    amtEls.forEach(function(el){ el.textContent = app.paymentAmount || getDynamicFeeFallback(); });
  }

  // Show date
  var subDateEl = document.getElementById('subDate');
  if (subDateEl) {
    subDateEl.textContent = (app && app.submittedDate) ? app.submittedDate : new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
  }

  // Show fake txn id
  var txnRefEl = document.getElementById('txnRef');
  if (txnRefEl) {
    txnRefEl.textContent = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
  }

  // Wire buttons
  var trackBtn = document.getElementById('trackBtn');
  if (trackBtn) trackBtn.addEventListener('click', function(){
    window.location.href = '../Track%20Application%20Status/index.html';
  });

  var downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) downloadBtn.addEventListener('click', function(){ window.print(); });

  var cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', function(){
    window.location.href = '../Applicant%20dashboard/index.html';
  });

  // Also handle any inline onclick="goTrack()" patterns
  window.goTrack = function() { window.location.href = '../Track%20Application%20Status/index.html'; };
  window.goDashboard = function() { window.location.href = '../Applicant%20dashboard/index.html'; };
});
// Generate new application object
function saveApplication() {
    let applications = JSON.parse(localStorage.getItem("applications")) || [];
    let submittedApps = [];
    try { submittedApps = JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]'); } catch(e) {}
    
    let form = {};
    try {
        form = JSON.parse(sessionStorage.getItem('applicationForm') || '{}');
    } catch(e) {}
    
    function findExistingApplication(value) {
        var wanted = String(value || '').trim();
        if (!wanted) return null;
        var allApps = applications.concat(submittedApps).concat((window.TRADEZO && Array.isArray(TRADEZO.applications)) ? TRADEZO.applications : []);
        return allApps.find(function(app) {
            return String(app && (app.id || app.appRef || app.appId) || '').trim() === wanted;
        }) || null;
    }

    let ref = sessionStorage.getItem('applicationRef');
    if (!ref || /^\d+$/.test(String(ref).trim()) || /^APP-/i.test(String(ref).trim())) {
        ref = (window.TRADEZO && typeof TRADEZO.generateApplicationId === 'function')
            ? TRADEZO.generateApplicationId([applications])
            : ('TL-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6));
        sessionStorage.setItem('applicationRef', ref);
    }
    var existingApplication = findExistingApplication(ref);
    if (existingApplication) {
        ref = existingApplication.appRef || existingApplication.id || existingApplication.appId || ref;
        sessionStorage.setItem('applicationRef', ref);
    }

    var nowIso = new Date().toISOString();
    let newApp = {
        id: ref,
        appId: ref,
        appRef: ref,
        applicantName: form.fullName || "Test Applicant",
        email: form.email || "",
        phone: form.phone || "",
        aadhaar: form.aadhaar || "",
        gender: form.gender || "",
        businessName: form.businessName || "Test Business",
        licenseType: form.businessType || "Business License",
        status: "Pending",
        submittedDate: new Date().toLocaleDateString(),
        createdAt: nowIso,
        updatedAt: nowIso,
        shopAddress: form.shopAddress || "Test Location",
        paymentStatus: 'Paid',
        paymentAmount: sessionStorage.getItem('calculatedFeeString') || getDynamicFeeFallback(),
        paymentDate: nowIso
    };

    // Mirror the paid application into the legacy key without minting a second ID.
    var existingIndex = applications.findIndex(function(a) {
        return String(a && (a.id || a.appRef || a.appId) || '').trim() === String(ref).trim();
    });
    if (existingIndex === -1) {
        applications.unshift(newApp);
    } else {
        applications[existingIndex] = Object.assign({}, applications[existingIndex], newApp);
    }
    localStorage.setItem("applications", JSON.stringify(applications));
}

// Call this when payment is successful
saveApplication();
