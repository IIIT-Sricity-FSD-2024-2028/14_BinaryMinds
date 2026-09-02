// paynow/scriot.js

function getFeeBreakdown() {
  var form = {};
  try { form = JSON.parse(sessionStorage.getItem('applicationForm') || '{}'); } catch(e){}

  var processingFee = 1200; // default base fee
  try {
    var storedFees = JSON.parse(localStorage.getItem('tradezo_fees'));
    if (storedFees && storedFees.new) processingFee = Number(storedFees.new) || 1200;
  } catch(e) {}

  var platformFee = 250;
  var tax = processingFee * 0.05;
  var total = processingFee + tax + platformFee;

  return {
    processingFee: processingFee,
    platformFee: platformFee,
    tax: tax,
    total: total,
    form: form
  };
}

// Highlight selected payment option on click & populate summary
document.addEventListener('DOMContentLoaded', function() {
  var feeData = getFeeBreakdown();
  var form = feeData.form;
  var processingFee = feeData.processingFee;
  var platformFee = feeData.platformFee;
  var tax = feeData.tax;
  var total = feeData.total;

  sessionStorage.setItem('calculatedFeeString', '₹' + total.toFixed(2));

  var baseEl = document.getElementById('baseFee');
  if(baseEl) baseEl.innerHTML = '&#8377;' + processingFee.toFixed(2);
  var taxEl = document.getElementById('taxFee');
  if(taxEl) taxEl.innerHTML = '&#8377;' + tax.toFixed(2);
  var platformEl = document.getElementById('platformFee');
  if(platformEl) platformEl.innerHTML = '&#8377;' + platformFee.toFixed(2);
  var totalEl = document.getElementById('totalFee');
  if(totalEl) totalEl.innerHTML = '&#8377;' + total.toFixed(2);
  var btnEl = document.getElementById('btnFee');
  if(btnEl) btnEl.innerHTML = '&#8377;' + total.toFixed(2);

  // Fill Trade Name
  var tradeNameEl = document.getElementById('tradeName');
  if (tradeNameEl && form.businessName) tradeNameEl.textContent = form.businessName;

  // Fill License Category
  var licCatEl = document.getElementById('licCat');
  if (licCatEl && form.tradeCategory) licCatEl.textContent = form.tradeCategory;

  // Fill Establishment Type
  var estTypeEl = document.getElementById('estType');
  if (estTypeEl && form.businessType) estTypeEl.textContent = form.businessType;

  // Fill REF number from applicationRef
  var refEl = document.getElementById('refNo');
  var appRef = sessionStorage.getItem('applicationRef');
  if (!appRef || /^\d+$/.test(String(appRef).trim()) || /^APP-/i.test(String(appRef).trim())) {
    appRef = (window.TRADEZO && typeof TRADEZO.generateApplicationId === 'function')
      ? TRADEZO.generateApplicationId()
      : ('TL-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6));
    sessionStorage.setItem('applicationRef', appRef);
  }
  if (refEl) refEl.textContent = 'REF: ' + appRef;

  // Make Validity Period dynamic
  var validityEl = document.querySelector('.val:nth-of-type(3)') || Array.from(document.querySelectorAll('.lbl')).find(function(el) { return el.textContent.includes('Validity Period'); })?.nextElementSibling;
  if (validityEl) {
      var currentYear = new Date().getFullYear();
      validityEl.textContent = '1 Year (' + currentYear + '-' + (currentYear + 1) + ')';
  }

  // Wire radio highlights
  var labels = document.querySelectorAll('.pay-opt');
  labels.forEach(function(label) {
    label.addEventListener('click', function() {
      labels.forEach(function(l) { l.classList.remove('active'); });
      label.classList.add('active');
    });
  });
});

async function doPayment() {
  var selected = document.querySelector('input[name="method"]:checked');
  if (!selected) {
    alert('Please select a payment method.');
    return;
  }

  var btn = document.querySelector('.pay-btn');
  if (btn) { btn.textContent = 'Processing Payment...'; btn.disabled = true; }

  setTimeout(async function() {
    var feeData = getFeeBreakdown();
    var processingFee = feeData.processingFee;
    var platformFee = feeData.platformFee;
    var tax = feeData.tax;
    var total = feeData.total;

    // --- SAVE APPLICATION TO TRADEZO on success ---
    var form = {};
    var docs = {};
    try { form = JSON.parse(sessionStorage.getItem('applicationForm') || '{}'); } catch(e){}
    try { docs = JSON.parse(sessionStorage.getItem('uploadedDocs')   || '{}'); } catch(e){}

    var user = null;
    try { user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null'); } catch(e){}

    var appRef = sessionStorage.getItem('applicationRef');
    if (!appRef) {
      appRef = (window.TRADEZO && typeof TRADEZO.generateApplicationId === 'function')
        ? TRADEZO.generateApplicationId()
        : ('TL-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6));
      sessionStorage.setItem('applicationRef', appRef);
    }

    var backendApplicationId = Number(sessionStorage.getItem('backendApplicationId')) || null;

    var muniId = form.municipalityId || form.municipality_id || '';
    if (!muniId && (form.state || form.city)) {
      var st = (form.state || '').toLowerCase();
      var ct = (form.city || '').toLowerCase();
      if (st === 'karnataka' || ct.includes('bangalore') || ct.includes('bengaluru')) muniId = 'muni-blr';
      else if (st === 'telangana' || ct.includes('hyderabad')) muniId = 'muni-hyd';
    }
    var muniName = form.municipalityName || (window.TRADEZO && typeof TRADEZO.getMunicipality === 'function' && muniId ? TRADEZO.getMunicipality(muniId).name : (muniId === 'muni-blr' ? 'Bruhat Bengaluru Mahanagara Palike (BBMP)' : (muniId === 'muni-hyd' ? 'Greater Hyderabad Municipal Corporation (GHMC)' : '')));

    // Sync payment with backend API if backend is running and application ID exists
    if (backendApplicationId) {
      try {
        var paymentResponse = await fetch('http://localhost:3000/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (sessionStorage.getItem('accessToken') || '') },
          body: JSON.stringify({
            application_id: backendApplicationId,
            municipality_id: muniId,
            amount: Number(String(sessionStorage.getItem('calculatedFeeString') || '').replace(/[^0-9.]/g, '')) || total,
            processing_fee: processingFee,
            platform_fee: platformFee,
            service_tax: tax,
            payment_status: 'COMPLETED'
          })
        });
        if (!paymentResponse.ok) {
          console.warn('Backend payment status:', paymentResponse.status);
        }
      } catch (error) {
        console.warn('Backend payment API unavailable, saving locally:', error);
      }
    }

    // Build new application object
    var nowIso = new Date().toISOString();
    var newApp = {
      id:            appRef,
      appRef:        appRef,
      backendId:     backendApplicationId,
      municipalityId: muniId,
      municipality_id: muniId,
      municipalityName: muniName,
      applicantId:   user ? (user.email || '') : '',
      applicantName: form.fullName     || (user ? user.name : ''),
      email:         form.email        || (user ? user.email : ''),
      phone:         form.phone        || '',
      businessName:  form.businessName || '',
      businessType:  form.businessType || '',
      tradeCategory: form.tradeCategory|| '',
      shopAddress:   form.shopAddress  || '',
      city:          form.city         || '',
      district:      form.district     || '',
      state:         form.state        || '',
      pincode:       form.pincode      || '',
      shopArea:      form.shopArea     || '',
      fatherName:    form.fatherName   || '',
      motherName:    form.motherName   || '',
      gender:        form.gender       || '',
      aadhaar:       form.aadhaar      || '',
      submittedDate: new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}),
      createdAt: nowIso,
      updatedAt: nowIso,
      status:        'Submitted',
      paymentStatus: 'Paid',
      paymentDate: nowIso,
      paymentAmount: sessionStorage.getItem('calculatedFeeString') || ('₹' + total.toFixed(2)),
      paymentRef:    'PAY-' + String(Date.now()).slice(-8),
      assignedFO:    '',
      foName:        '',
      inspectionDate:'', inspectionTime:'', inspectionResult:'',
      doReview:      'Pending',
      licenseId:     null,
      rejectionReason:'',
      docs:          docs,
      docsVerifiedDate:'', reviewDate:'', approvedDate:''
    };

    // Add to TRADEZO.applications in memory
    if (window.TRADEZO && TRADEZO.applications) {
      TRADEZO.applications = TRADEZO.applications.filter(function(a){ return a.appRef !== appRef; });
      TRADEZO.applications.unshift(newApp);
      if (!backendApplicationId && typeof TRADEZO.syncApplicationToBackend === 'function') {
        TRADEZO.syncApplicationToBackend(newApp, 'applicant');
      }
    }

    // Persist to localStorage so track page and dashboard can find it
    var saved = JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]');
    saved = saved.filter(function(a){ return a.appRef !== appRef; });
    saved.unshift(newApp);
    localStorage.setItem('tz_submitted_apps', JSON.stringify(saved));

    // Persist to verification queue for Field Officer
    var queue = [];
    try { queue = JSON.parse(localStorage.getItem('tz_verification_queue') || '[]'); } catch(e){ queue = []; }
    if (!Array.isArray(queue)) queue = [];
    var verifyItem = {
      appId: newApp.id,
      businessName: newApp.businessName,
      applicant: newApp.applicantName,
      category: newApp.tradeCategory || newApp.businessType,
      address: (newApp.shopAddress ? newApp.shopAddress + (newApp.city ? ', ' + newApp.city : '') : ''),
      submitted: newApp.submittedDate,
      createdAt: nowIso,
      status: 'Pending Review'
    };
    queue = queue.filter(function(item){ return item.appId !== newApp.id; });
    queue.unshift(verifyItem);
    localStorage.setItem('tz_verification_queue', JSON.stringify(queue));

    // Store reference and mark applied
    sessionStorage.setItem('applicationRef', appRef);
    localStorage.setItem('hasApplied', 'true');

    window.location.href = '../payment success/index.html';
  }, 1000);
}
