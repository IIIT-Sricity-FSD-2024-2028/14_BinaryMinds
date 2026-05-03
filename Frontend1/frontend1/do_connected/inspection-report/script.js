// DO inspection-report/script.js
document.addEventListener('DOMContentLoaded', function() {
  // Get selected application ID from session storage
  var appId = sessionStorage.getItem('selectedAppDO');
  
  if (!appId) {
    alert('No application selected. Redirecting to worklist...');
    window.location.href = '../worklist/index.html';
    return;
  }

  // Find application and inspection data from local storage first
  var applications = [];
  try { applications = JSON.parse(localStorage.getItem('tradezo_applications') || '[]'); } catch(e){}
  var savedApps = [];
  try { savedApps = JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]'); } catch(e){}
  
  // Combine all possible sources for applications
  var allApps = [].concat(applications, savedApps, window.TRADEZO ? TRADEZO.applications : []);
  var app = allApps.find(function(a) { return a.id === appId || a.appRef === appId; });
  
  // Find inspection
  var inspections = [];
  try { inspections = JSON.parse(localStorage.getItem('tz_inspection_reports') || '[]'); } catch(e){}
  var inspection = inspections.find(function(ins) { return ins.appId === appId; });
  if (!inspection && window.TRADEZO) {
    inspection = TRADEZO.inspections.find(function(ins) { return ins.appId === appId; });
  }

  // Find verification
  var verifications = [];
  try { verifications = JSON.parse(localStorage.getItem('tz_verification_history') || '[]'); } catch(e){}
  var verification = verifications.find(function(v) { return v.appId === appId; });
  if (!verification && window.TRADEZO) {
    verification = TRADEZO.verifications.find(function(v) { return v.appId === appId; });
  }

  if (!app) {
    alert('Application not found. Redirecting to worklist...');
    window.location.href = '../worklist/index.html';
    return;
  }

  // Find field officer
  var fo = TRADEZO.users.find(function(u) { return u.id === app.assignedFO; });

  // Populate Application Information
  document.getElementById('appId').textContent = app.id || app.appRef;
  document.getElementById('businessName').textContent = app.businessName;
  document.getElementById('ownerName').textContent = app.applicantName || app.ownerName || '-';
  document.getElementById('category').textContent = app.tradeCategory || app.category || '-';
  var fullAddress = app.shopAddress || app.address || '';
  if (app.city) fullAddress += ', ' + app.city;
  if (app.district) fullAddress += ', ' + app.district;
  if (app.state) fullAddress += ', ' + app.state;
  if (app.pincode) fullAddress += ' - ' + app.pincode;
  document.getElementById('address').textContent = fullAddress;
  document.getElementById('submissionDate').textContent = app.submittedDate;

  // Populate Field Officer Information
  document.getElementById('officerName').textContent = fo ? fo.name : 'Not Assigned';
  document.getElementById('officerId').textContent = fo ? fo.id : '-';
  document.getElementById('inspectionDate').textContent = app.inspectionDate || (inspection ? inspection.date : 'Not Scheduled');
  document.getElementById('inspectionTime').textContent = app.inspectionTime || (inspection ? inspection.time : '-');

  // Populate Verification Status
  var verifStatusBadge = document.getElementById('verificationStatus');
  var verifDetails = document.getElementById('verificationDetails');
  var verifSection = document.getElementById('verificationResultSection');
  
  if (verification) {
    var vStatus = verification.decision || verification.status || 'Verified';
    verifStatusBadge.textContent = vStatus;
    if (vStatus === 'Approved' || vStatus === 'Verified') {
      verifStatusBadge.className = 'status-badge completed';
      if (verification.reason || verification.notes || verification.remarks) {
        verifSection.style.display = 'block';
        verifDetails.textContent = verification.reason || verification.notes || verification.remarks;
      }
    } else if (vStatus.includes('Reject')) {
      verifStatusBadge.className = 'status-badge not-assigned';
      verifSection.style.display = 'block';
      verifDetails.textContent = verification.reason || verification.notes || verification.remarks || app.rejectionReason || 'Rejected during verification.';
      verifDetails.style.color = '#dc2626';
    } else {
      verifStatusBadge.className = 'status-badge scheduled';
    }
  } else {
    verifStatusBadge.textContent = app.status || 'Pending Review';
    if (app.status === 'Approved') verifStatusBadge.className = 'status-badge completed';
    else if (app.status === 'Rejected') verifStatusBadge.className = 'status-badge not-assigned';
    else verifStatusBadge.className = 'status-badge scheduled';
  }

  // Populate Inspection Status
  var statusBadge = document.getElementById('inspectionStatus');
  var inspectionStatus = 'Not Assigned';
  if (inspection) {
    inspectionStatus = inspection.status || (inspection.result ? 'Completed' : 'Scheduled');
  }
  statusBadge.textContent = inspectionStatus;
  statusBadge.className = 'status-badge';
  
  if (inspectionStatus === 'Completed') {
    statusBadge.classList.add('completed');
  } else if (inspectionStatus === 'Scheduled') {
    statusBadge.classList.add('scheduled');
  } else {
    statusBadge.classList.add('not-assigned');
  }

  // Populate Result Section if inspection is completed
  var resultSection = document.getElementById('resultSection');
  if (inspectionStatus === 'Completed') {
    resultSection.style.display = 'block';
    var resultBadge = document.getElementById('resultBadge');
    resultBadge.textContent = inspection.result || app.inspectionResult || 'Pending';
    resultBadge.className = 'result-badge';
    
    if (inspection.result === 'Approved' || app.inspectionResult === 'Approved') {
      resultBadge.classList.add('approved');
    } else if (inspection.result === 'Rejected' || app.inspectionResult === 'Rejected') {
      resultBadge.classList.add('rejected');
    } else {
      resultBadge.classList.add('pending');
    }
  }

  // Populate Field Officer Notes
  var notesContent = document.getElementById('notesContent');
  if (inspection && inspection.notes) {
    notesContent.innerHTML = '<p>' + inspection.notes + '</p>';
  } else if (app.rejectionReason) {
    notesContent.innerHTML = '<p><strong>Rejection Reason:</strong> ' + app.rejectionReason + '</p>';
  } else {
    notesContent.innerHTML = '<p>No inspection report available yet. The field officer has not submitted their report.</p>';
  }

  // Populate Documents
  var docsList = document.getElementById('docsList');
  if (app.docs) {
    var docsHtml = '';
    var docNames = {
      'aadhaar': 'Aadhaar Card',
      'addressProof': 'Address Proof',
      'shopPhoto': 'Shop Photo'
    };
    
    for (var key in app.docs) {
      if (app.docs[key]) {
        docsHtml += '<div class="doc-item"><span class="doc-icon">📄</span><span>' + (docNames[key] || key) + ': ' + app.docs[key] + '</span></div>';
      }
    }
    docsList.innerHTML = docsHtml || '<p>No documents uploaded.</p>';
  }

  // Update proceed button visibility
  var proceedBtn = document.getElementById('proceedBtn');
  if (inspectionStatus !== 'Completed') {
    proceedBtn.textContent = 'Inspection Not Completed';
    proceedBtn.style.background = '#94a3b8';
    proceedBtn.style.cursor = 'not-allowed';
    proceedBtn.onclick = function() {
      alert('Cannot proceed: Field Officer has not completed the inspection report.');
    };
  }
});
