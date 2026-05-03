// Set text of an element by ID
function setText(id, value) {
  var el = document.getElementById(id);
  if (el) {
    el.textContent = (value && value.trim() !== '') ? value : '—';
  }
}

// Run when page loads
window.onload = function() {

  // Get form data saved by apply_license.js
  var form = {};
  var docs = {};

  try {
    form = JSON.parse(sessionStorage.getItem('applicationForm') || '{}');
  } catch(e) { form = {}; }

  try {
    docs = JSON.parse(sessionStorage.getItem('uploadedDocs') || '{}');
  } catch(e) { docs = {}; }

  // --- APPLICANT DETAILS ---
  setText('rv-fullName',   form.fullName);
  setText('rv-email',      form.email);
  setText('rv-fatherName', form.fatherName);
  setText('rv-gender',     form.gender);
  setText('rv-motherName', form.motherName);
  setText('rv-phone',      form.phone ? ('+91 ' + form.phone) : '');

  // Show Aadhaar with last 4 digits only
  if (form.aadhaar && form.aadhaar.length >= 4) {
    setText('rv-aadhaar', 'XXXX-XXXX-' + form.aadhaar.slice(-4));
  }

  // --- BUSINESS DETAILS ---
  setText('rv-businessName',  form.businessName);
  setText('rv-businessType',  form.businessType);
  setText('rv-shopAddress',   form.shopAddress);
  setText('rv-city',          form.city);
  setText('rv-district',      form.district);
  setText('rv-state',         form.state);
  setText('rv-pincode',       form.pincode);
  setText('rv-tradeCategory', form.tradeCategory);
  setText('rv-shopArea',      form.shopArea ? (form.shopArea + ' Sq. Ft.') : '');

  // --- UPLOADED DOCUMENTS ---
  var doc1 = document.getElementById('doc1');
  var doc2 = document.getElementById('doc2');
  var doc3 = document.getElementById('doc3');

  if (doc1) {
    doc1.innerHTML = '<span class="tick">✔</span> Aadhaar Card — ' +
      (docs.aadhaar ? '<strong>' + docs.aadhaar + '</strong>' : 'Uploaded');
  }
  if (doc2) {
    doc2.innerHTML = '<span class="tick">✔</span> Business Address Proof — ' +
      (docs.addressProof ? '<strong>' + docs.addressProof + '</strong>' : 'Uploaded');
  }
  if (doc3) {
    doc3.innerHTML = '<span class="tick">✔</span> Shop Photo — ' +
      (docs.shopPhoto ? '<strong>' + docs.shopPhoto + '</strong>' : 'Uploaded');
  }

  // Hide success message on load
  var successMsg = document.getElementById('successMsg');
  if (successMsg) successMsg.style.display = 'none';
};

// EDIT — go back to apply license (form will be prefilled from sessionStorage)
function goEdit() {
  window.location.href = '../../apply_license/apply_license.html';
}

// PREVIOUS — go back to upload documents
function goPrevious() {
  window.location.href = '../../upload_document/upload_document.html';
}

// SUBMIT — validate checkbox then go to Pay Now
function submitForm() {
  var agree   = document.getElementById('agree');
  var declErr = document.getElementById('declError');

  if (!agree || !agree.checked) {
    if (declErr) declErr.style.display = 'block';
    return;
  }
  if (declErr) declErr.style.display = 'none';

  // Save reference number
  var refNo = 'TL2026-' + Math.floor(100000 + Math.random() * 900000);
  sessionStorage.setItem('applicationRef', refNo);
  localStorage.setItem('hasApplied', 'true');

  // Show reference number in success message
  var refEl = document.getElementById('refNo');
  if (refEl) refEl.textContent = refNo;

  var successMsg = document.getElementById('successMsg');
  if (successMsg) successMsg.style.display = 'block';

  // Go to Pay Now after 1.5 seconds
  setTimeout(function() {
    window.location.href = '../../paynow/index.html';
  }, 1500);
}