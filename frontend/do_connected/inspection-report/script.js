// DO inspection-report/script.js
document.addEventListener('DOMContentLoaded', function() {
  // Get selected application ID from session storage
  var appId = sessionStorage.getItem('selectedAppDO');
  
  if (!appId) {
    alert('No application selected. Redirecting to worklist...');
    window.location.href = '../worklist/index.html';
    return;
  }

  // Find application and inspection data
  var app = TRADEZO.getApplication(appId);
  var inspection = TRADEZO.inspections.find(function(ins) { return ins.appId === appId; });
  var verification = TRADEZO.verifications.find(function(v) { return v.appId === appId; });

  if (!app) {
    alert('Application not found. Redirecting to worklist...');
    window.location.href = '../worklist/index.html';
    return;
  }

  // Find field officer
  var fo = TRADEZO.users.find(function(u) { return u.id === app.assignedFO; });

  // Populate Application Information
  document.getElementById('appId').textContent = app.id;
  document.getElementById('businessName').textContent = app.businessName;
  document.getElementById('ownerName').textContent = app.applicantName;
  document.getElementById('category').textContent = app.tradeCategory;
  document.getElementById('address').textContent = app.shopAddress + ', ' + app.city + ', ' + app.district + ', ' + app.state + ' - ' + app.pincode;
  document.getElementById('submissionDate').textContent = app.submittedDate;

  // Populate Field Officer Information
  document.getElementById('officerName').textContent = fo ? fo.name : 'Not Assigned';
  document.getElementById('officerId').textContent = fo ? fo.id : '-';
  document.getElementById('inspectionDate').textContent = app.inspectionDate || (inspection ? inspection.date : 'Not Scheduled');
  document.getElementById('inspectionTime').textContent = app.inspectionTime || (inspection ? inspection.time : '-');

  // Populate Inspection Status
  var statusBadge = document.getElementById('inspectionStatus');
  var inspectionStatus = inspection ? inspection.status : 'Not Assigned';
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
  if (inspection && inspection.status === 'Completed') {
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
  if (!inspection || inspection.status !== 'Completed') {
    proceedBtn.textContent = 'Inspection Not Completed';
    proceedBtn.style.background = '#94a3b8';
    proceedBtn.style.cursor = 'not-allowed';
    proceedBtn.onclick = function() {
      alert('Cannot proceed: Field Officer has not completed the inspection report.');
    };
  }
});
