// Track Application Status — fills the EXISTING HTML structure dynamically

document.addEventListener('DOMContentLoaded', function() {

  // Get logged in user
  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null'); } catch(e){}
  if (!user) { window.location.href = '../login/index.html'; return; }

  // Find this user's application
  // Match by email in TRADEZO.applications OR use applicationRef from session
  var appRef = sessionStorage.getItem('applicationRef') || '';
  var app    = null;

  // Try to find by appRef or email across all pools and MERGE state
  var appsPool = [];
  if (window.TRADEZO && Array.isArray(TRADEZO.applications)) appsPool = appsPool.concat(TRADEZO.applications);
  try { appsPool = appsPool.concat(JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]')); } catch(e){}
  try { appsPool = appsPool.concat(JSON.parse(localStorage.getItem('applications') || '[]')); } catch(e){}
  
  // Aggregate to get the absolute latest status
  var aggregateMap = {};
  appsPool.forEach(function(a) {
      if (!a) return;
      var key = a.id || a.appRef;
      if (!key) return;
      if (!aggregateMap[key]) aggregateMap[key] = a;
      else aggregateMap[key] = Object.assign({}, aggregateMap[key], a); // later elements (like `applications`) override earlier ones
  });

  var combinedApps = Object.values(aggregateMap);

  if (appRef) {
    app = combinedApps.find(function(a) { return a.appRef === appRef || a.id === appRef; }) || null;
  }
  if (!app) {
    app = combinedApps.find(function(a) { return a.email && a.email.toLowerCase() === user.email.toLowerCase(); }) || null;
  }
  if (!app) {
    app = combinedApps.find(function(a) { return a.applicantName && a.applicantName.toLowerCase() === user.name.toLowerCase(); }) || null;
  }

  // No application found — show message
  if (!app) {
    var appCard = document.querySelector('.app-card');
    if (appCard) {
      appCard.innerHTML =
        '<div style="text-align:center;padding:40px 20px;">' +
        '<div style="font-size:48px;margin-bottom:16px;">📋</div>' +
        '<h3 style="color:#1E3A8A;margin-bottom:8px;">No Application Found</h3>' +
        '<p style="color:#64748b;margin-bottom:24px;">You haven\'t submitted a trade license application yet.</p>' +
        '<button onclick="window.location.href=\'../apply_license/apply_license.html\'" ' +
        'style="background:#1E3A8A;color:#fff;border:none;padding:12px 28px;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">📝 Apply Now</button>' +
        '</div>';
    }
    return;
  }

  // ---- FILL APPLICATION INFO ----
  var infoBlocks = document.querySelectorAll('.app-info > div');
  if (infoBlocks[0]) {
    var s0 = infoBlocks[0].querySelector('strong');
    if (s0) s0.textContent = app.id;
  }
  if (infoBlocks[1]) {
    var s1 = infoBlocks[1].querySelector('strong');
    if (s1) s1.textContent = app.submittedDate;
  }
  if (infoBlocks[2]) {
    var s2 = infoBlocks[2].querySelector('strong');
    if (s2) s2.textContent = app.applicantName || user.name;
  }

  // ---- STATUS FLOW ----
  // Map status to stepper step index (0-based)
  var STATUS_STEPS = [
    'Submitted',
    'Documents Verified',
    'Inspection Scheduled',
    'Review Done',
    'Approved'
  ];

  var STATUS_DATES = {
    'Submitted':            app.submittedDate || '',
    'Documents Verified':   app.docsVerifiedDate || '',
    'Inspection Scheduled': app.inspectionDate || '',
    'Review Done':          app.reviewDate || '',
    'Approved':             app.approvedDate || ''
  };

  // Figure out which step is current
  var currentStepIdx = 0;
  var statusMap = {
    'Submitted':           0,
    'Pending':             0,
    'Under Verification':  1,
    'Documents Verified':  1,
    'Pending Inspection':  2,
    'Scheduled':           2,
    'Inspection Scheduled':2,
    'Inspection Recorded': 3,
    'Inspection Completed':3,
    'Under Review':        3,
    'Review Done':         3,
    'Approved':            4,
    'Licensed':            4,
    'License Issued':      4,
    'Rejected':            4
  };
  currentStepIdx = statusMap[app.status] !== undefined ? statusMap[app.status] : 0;

  // ---- REBUILD STEPPER ----
  var stepper = document.querySelector('.stepper');
  if (stepper) {
    stepper.innerHTML = '';
    STATUS_STEPS.forEach(function(stepName, idx) {
      var isDone    = idx < currentStepIdx || (idx === currentStepIdx && app.status !== 'Rejected');
      var isCurrent = idx === currentStepIdx;
      var isRejected= app.status === 'Rejected' && idx === currentStepIdx;

      // Circle
      var circleClass = isDone ? 'circle done' : isCurrent ? 'circle current' : 'circle pending';
      var circleContent;
      if (isRejected) {
        circleContent = '<i class="fa-solid fa-x"></i>';
      } else if (isDone) {
        circleContent = '<i class="fa-solid fa-check"></i>';
      } else {
        circleContent = String(idx + 1);
      }

      var stepDiv = document.createElement('div');
      stepDiv.className = 'step';

      var circleStyle = '';
      if (isDone && !isRejected) {
        circleStyle = 'background:#1E3A8A;border-color:#1E3A8A;color:#fff;';
      } else if (isRejected) {
        circleStyle = 'background:#dc2626;border-color:#dc2626;color:#fff;';
      } else if (isCurrent) {
        circleStyle = 'background:#fff;border-color:#1E3A8A;color:#1E3A8A;font-weight:700;';
      } else {
        circleStyle = 'background:#f1f5f9;border-color:#d1d5db;color:#9ca3af;';
      }

      var dateStr = STATUS_DATES[stepName] || '';
      stepDiv.innerHTML =
        '<div class="circle" style="' + circleStyle + '">' + circleContent + '</div>' +
        '<span style="' + (isDone || isCurrent ? 'font-weight:700;color:#1a1a2e;' : 'color:#94a3b8;') + '">' + stepName + '</span>' +
        '<small style="color:#94a3b8;">' + dateStr + '</small>';

      stepper.appendChild(stepDiv);

      // Line between steps
      if (idx < STATUS_STEPS.length - 1) {
        var line = document.createElement('div');
        line.className = 'line';
        line.style.background = (idx < currentStepIdx && !isRejected) ? '#1E3A8A' : '#e2e8f0';
        stepper.appendChild(line);
      }
    });
  }

  // ---- DETAIL STATUS SECTION ----
  var statusEl = document.querySelector('.status-approved, .detail-left p.status-approved, p[class*="status"]');
  if (statusEl) {
    statusEl.textContent = app.status;
    var c = TRADEZO.statusColor(app.status);
    statusEl.style.color = c;
    statusEl.style.fontWeight = '700';
    // Remove old class and apply dynamic style
    statusEl.className = '';
    statusEl.style.fontSize = '16px';
  }

  // Expected update text
  var expectedEl = document.querySelector('.detail-left p strong, .detail-left p:last-of-type strong');
  var remarkMap = {
    'Submitted':           'Documents are being reviewed by the field officer.',
    'Under Verification':  'Documents are under verification by the field officer.',
    'Documents Verified':  'Inspection will be scheduled shortly.',
    'Inspection Scheduled':'Inspection is scheduled on ' + (app.inspectionDate || 'a future date') + '.',
    'Inspection Completed':'Application is under department review.',
    'Under Review':        'Application is under department review.',
    'Review Done':         'Final approval decision pending.',
    'Approved':            'License issued successfully! Download from the Download section.',
    'Licensed':            'License issued successfully! Download from the Download section.',
    'License Issued':      'License issued successfully! Download from the Download section.',
    'Rejected':            'Application rejected. Reason: ' + (app.rejectionReason || 'Please contact support.')
  };
  if (expectedEl) expectedEl.textContent = remarkMap[app.status] || 'Status update pending.';

  // Officer remark
  var remarkEl = document.querySelector('.detail-right p:first-of-type');
  var officerRemarks = {
    'Submitted':           'Application received and queued for document review.',
    'Under Verification':  'Field officer ' + (app.foName || 'assigned officer') + ' is reviewing your documents.',
    'Documents Verified':  'All submitted documents have been verified successfully.',
    'Inspection Scheduled':'Physical inspection scheduled for ' + (app.inspectionDate || 'TBD') + ' at ' + (app.inspectionTime || 'TBD') + '.',
    'Inspection Completed':'Field inspection has been completed. Report submitted for department review.',
    'Under Review':        'Application is being reviewed by the department officer.',
    'Approved':            'Application approved. License is now available for download.',
    'Licensed':            'Application approved. License is now available for download.',
    'License Issued':      'Application approved. License is now available for download.',
    'Rejected':            app.rejectionReason || 'Application could not be approved at this time.'
  };
  if (remarkEl) remarkEl.textContent = officerRemarks[app.status] || '';

  // ---- VIEW LICENSE BUTTON ----
  var viewBtn = document.querySelector('.btn-view');
  if (viewBtn) {
    if (app.status === 'Approved' || app.status === 'License Issued' || app.status === 'Licensed' || app.licenseId || app.licenseNo) {
      viewBtn.style.display = 'inline-block';
    } else {
      viewBtn.style.display = 'none';
    }
  }

  // ---- NOTIFICATIONS PANEL — fill dynamically ----
  // Update badge with count
  var badgeNum = document.querySelector('.badge-num');
  if (badgeNum) {
    // Simulate notification count based on current status step
    badgeNum.textContent = Math.max(1, currentStepIdx);
  }

  // Update notification items based on status
  var notifItems = document.querySelectorAll('.notif-item');
  var notifData = [];
  
  if (app.status === 'Pending Inspection' || app.status === 'Scheduled') {
    var inspDate = app.inspectionDate || 'TBD';
    var inspTime = app.inspectionTime || 'TBD';
    notifData = [
      { title: 'Inspection Scheduled 📅', msg: 'Physical inspection is scheduled for ' + inspDate + ' at ' + inspTime + '.', time: 'Recently' },
      { title: 'Documents Verified! ✅',   msg: 'Your submitted documents have been successfully verified.',  time: '' },
      { title: 'Application Submitted',  msg: 'Your application ' + app.id + ' has been received.',           time: app.submittedDate || '' }
    ];
  } else if (app.status === 'Inspection Recorded' || app.status === 'Inspection Completed') {
    var reports = [];
    try { reports = JSON.parse(localStorage.getItem('tz_inspection_reports') || '[]'); } catch(e){}
    var myReport = reports.find(r => r.appId === app.id);
    var inspResult = myReport ? myReport.result : 'Completed';
    var inspEmoji = inspResult === 'Approved' ? '✅' : (inspResult === 'Rejected' ? '❌' : '📋');
    
    notifData = [
      { title: 'Inspection ' + inspResult + ' ' + inspEmoji, msg: 'Field inspection recorded. Status: ' + inspResult + '.', time: 'Recently' },
      { title: 'Documents Verified! ✅',   msg: 'Your submitted documents have been approved.',  time: '' },
      { title: 'Application Submitted',  msg: 'Your application ' + app.id + ' has been received.',           time: app.submittedDate || '' }
    ];
  } else if (app.status === 'Rejected') {
    notifData = [
      { title: 'Application Rejected ❌', msg: 'Your application has been rejected. Check remarks for details.', time: 'Recently' },
      { title: 'Application Submitted',  msg: 'Your application ' + app.id + ' has been received.',           time: app.submittedDate || '' },
      { title: 'Action Required', msg: 'Please resolve the identified issues and re-apply.', time: '' }
    ];
  } else if (app.status === 'Approved' || app.status === 'Licensed' || app.status === 'License Issued') {
    notifData = [
      { title: 'License Approved! 🎉',   msg: 'Your trade license has been issued. You can download it now.', time: 'Today' },
      { title: 'Inspection Completed',   msg: 'Site inspection for ' + app.id + ' completed successfully.',  time: app.inspectionDate || '' },
      { title: 'Documents Verified',     msg: 'All your submitted documents have been verified.',              time: '' }
    ];
  } else {
    notifData = [
      { title: 'Application Submitted',    msg: 'Your application ' + app.id + ' has been received.',           time: app.submittedDate || 'Recently' },
      { title: 'Documents Under Review',   msg: 'Field officer is reviewing your submitted documents.',          time: '' },
      { title: 'Inspection Scheduled',     msg: 'Pending document verification.',   time: '' }
    ];
  }

  notifItems.forEach(function(item, i) {
    if (!notifData[i]) return;
    var strong = item.querySelector('strong');
    var p      = item.querySelector('p');
    var small  = item.querySelector('small');
    if (strong) strong.textContent = notifData[i].title;
    if (p)      p.textContent      = notifData[i].msg;
    if (small)  small.textContent  = notifData[i].time;
  });
});
