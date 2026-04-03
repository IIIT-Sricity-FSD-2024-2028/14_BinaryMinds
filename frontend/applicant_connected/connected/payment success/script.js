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
// Generate new application object
function saveApplication() {
    let applications = JSON.parse(localStorage.getItem("applications")) || [];
    
    let form = {};
    try {
        form = JSON.parse(sessionStorage.getItem('applicationForm') || '{}');
    } catch(e) {}
    
    let ref = sessionStorage.getItem('applicationRef') || ("APP-" + Date.now());

    let newApp = {
        id: ref,
        applicantName: form.fullName || "Test Applicant",
        email: form.email || "",
        phone: form.phone || "",
        businessName: form.businessName || "Test Business",
        licenseType: form.businessType || "Business License",
        status: "Pending",
        submittedDate: new Date().toLocaleDateString(),
        shopAddress: form.shopAddress || "Test Location",
        paymentStatus: 'Paid',
        paymentAmount: sessionStorage.getItem('calculatedFeeString') || '₹2100.00'
    };

    // Ensure we don't save duplicates if page is refreshed
    if (!applications.find(a => a.id === ref)) {
        applications.push(newApp);
        localStorage.setItem("applications", JSON.stringify(applications));
    }
}

// Call this when payment is successful
saveApplication();