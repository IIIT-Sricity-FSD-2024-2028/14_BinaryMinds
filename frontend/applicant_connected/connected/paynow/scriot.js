// paynow/scriot.js

// Highlight selected payment option on click
document.addEventListener('DOMContentLoaded', function() {
  // Fill Application Summary from sessionStorage
  var form = {};
  try { form = JSON.parse(sessionStorage.getItem('applicationForm') || '{}'); } catch(e){}

  // Fill Trade Name
  var tradeNameEl = document.querySelector('.info-grid .val');
  if (tradeNameEl && form.businessName) tradeNameEl.textContent = form.businessName;

  // Fill License Category
  var licCatEls = document.querySelectorAll('.info-grid .val');
  if (licCatEls[1] && form.tradeCategory) licCatEls[1].textContent = form.tradeCategory;

  // Fill Establishment Type
  if (licCatEls[3] && form.businessType) licCatEls[3].textContent = form.businessType;

  // Fill REF number from applicationRef
  var refEl = document.querySelector('.ref-no');
  var appRef = sessionStorage.getItem('applicationRef');
  if (refEl && appRef) refEl.textContent = 'REF: ' + appRef;

  // Wire radio highlights
  var labels = document.querySelectorAll('.pay-opt');
  labels.forEach(function(label) {
    label.addEventListener('click', function() {
      labels.forEach(function(l) { l.classList.remove('active'); });
      label.classList.add('active');
    });
  });
});

function doPayment() {
  var selected = document.querySelector('input[name="method"]:checked');
  if (!selected) {
    alert('Please select a payment method.');
    return;
  }

  var btn = document.querySelector('.pay-btn');
  if (btn) { btn.textContent = 'Processing...'; btn.disabled = true; }

  setTimeout(function() {
    // 80% success, 20% failure
    var success = Math.random() > 0.2;

    if (success) {
      // --- SAVE APPLICATION TO TRADEZO on success ---
      var form = {};
      var docs = {};
      try { form = JSON.parse(sessionStorage.getItem('applicationForm') || '{}'); } catch(e){}
      try { docs = JSON.parse(sessionStorage.getItem('uploadedDocs')   || '{}'); } catch(e){}

      var user = null;
      try { user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null'); } catch(e){}

      var appRef = sessionStorage.getItem('applicationRef') || ('TL2026-' + Math.floor(100000 + Math.random() * 900000));

      // Build new application object
      var newApp = {
        id:            appRef,
        appRef:        appRef,
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
        status:        'Submitted',
        paymentStatus: 'Paid',
        paymentAmount: '₹5,000',
        paymentRef:    'PAY-' + String(Date.now()).slice(-8),
        assignedFO:    'FO-2001',
        foName:        'Myra Singh',
        inspectionDate:'', inspectionTime:'', inspectionResult:'',
        doReview:      'Pending',
        licenseId:     null,
        rejectionReason:'',
        docs:          docs,
        docsVerifiedDate:'', reviewDate:'', approvedDate:''
      };

      // Add to TRADEZO.applications in memory
      if (window.TRADEZO && TRADEZO.applications) {
        // Remove old entry with same ref if exists
        TRADEZO.applications = TRADEZO.applications.filter(function(a){ return a.appRef !== appRef; });
        TRADEZO.applications.push(newApp);
      }

      // Persist to localStorage so track page can find it even after refresh
      var saved = JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]');
      saved = saved.filter(function(a){ return a.appRef !== appRef; });
      saved.push(newApp);
      localStorage.setItem('tz_submitted_apps', JSON.stringify(saved));

      // Store reference and mark applied
      sessionStorage.setItem('applicationRef', appRef);
      localStorage.setItem('hasApplied', 'true');

      window.location.href = '../payment success/index.html';
    } else {
      window.location.href = '../payment failure/index.html';
    }
  }, 1500);
}
