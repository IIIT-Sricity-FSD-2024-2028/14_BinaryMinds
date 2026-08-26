(function() {
  function safeParse(value) {
    try { return JSON.parse(value); } catch (error) { return null; }
  }

  window.handleLogout = function() {
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('applicationRef');
    Object.keys(sessionStorage).forEach(function(key) {
      if (key.indexOf('notifsRead_') === 0) sessionStorage.removeItem(key);
    });
    localStorage.removeItem('user');
    window.location.href = '../login/index.html';
  };

  var user = safeParse(sessionStorage.getItem('loggedInUser') || 'null');
  if (!user || typeof user.name !== 'string' || !user.name.trim() || typeof user.email !== 'string' || !user.email.trim() || typeof user.role !== 'string' || !user.role.trim() || typeof user.accessToken !== 'string' || !user.accessToken.trim() || user.role.toLowerCase() !== 'applicant') {
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    window.location.href = '../login/index.html';
    return;
  }
})();

document.addEventListener('DOMContentLoaded', function() {
  var nav = document.querySelector('.navbar') || document.querySelector('nav');
  if (!nav) return;

  var user = {};
  try { user = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch(e){}
  if (!user.email) return;

  // 1. Inject Styles
  if (!document.getElementById('_notif_style')) {
    var s = document.createElement('style');
    s.id = '_notif_style';
    s.textContent = 
      '.notif-wrapper { position:relative; margin-left:auto; display:flex; align-items:center; }' +
      '.notif-bell { font-size:16px; cursor:pointer; color: #fff; background: rgba(255,255,255,0.2); border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; transition:0.2s; position:relative; user-select:none; }' +
      '.notif-bell:hover { background: rgba(255,255,255,0.35); }' +
      '.notif-badge { position:absolute; top:-2px; right:-2px; background:#ef4444; color:white; font-size:10px; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border-radius:50%; font-weight:bold; }' +
      '.notif-dropdown { position:absolute; top:46px; right:0; background:white; width:300px; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.15); display:none; flex-direction:column; z-index:9999; border:1px solid #e2e8f0; overflow:hidden; opacity:0; transition:opacity 0.2s; }' +
      '.notif-dropdown.show { display:flex; opacity:1; }' +
      '.notif-header { padding:12px 16px; font-size:14px; font-weight:bold; color:#1e3a8a; border-bottom:1px solid #e2e8f0; background:#f8fafc; }' +
      '.notif-item { padding:14px 16px; border-bottom:1px solid #e2e8f0; font-size:13px; line-height:1.4; color:#334155; }' +
      '.notif-item strong { display:block; color:#1e293b; margin-bottom:4px; }' +
      '.notif-item:last-child { border-bottom:none; }' +
      '.notif-empty { padding:20px; text-align:center; color:#94a3b8; font-size:13px; }';
    document.head.appendChild(s);
  }

  // 2. Compute Notifications
  var itemsHTML = '';
  var notifCount = 0;
  
  function safeArray(key) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch(e) {
      return [];
    }
  }

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getAppId(a) {
    return String(a && (a.appId || a.id || a.appRef || a.application_id || a.applicationId || a.backendId) || '').trim();
  }

  function sameAppId(a, appId) {
    return getAppId(a) === String(appId || '').trim();
  }

  var mockApps = window.TRADEZO && window.TRADEZO.applications ? window.TRADEZO.applications : [];
  var localApps = safeArray('applications');
  // Also search tz_submitted_apps (where payment-confirmed apps are stored)
  var submittedApps = safeArray('tz_submitted_apps');
  var generatedLicenses = safeArray('tz_generated_licenses');
  var applicantNotifications = safeArray('tz_applicant_notifications');
  // Merge all sources
  var allApps = submittedApps.concat(localApps).concat(mockApps);

  generatedLicenses.forEach(function(lic) {
    var licAppId = String(lic.appId || lic.applicationId || lic.application_id || '').trim();
    if (!licAppId) return;

    var existing = allApps.find(function(a) { return sameAppId(a, licAppId); });
    if (!existing) return;

    existing.status = 'License Issued';
    existing.licenseNo = lic.licenseNo || lic.licenseId || lic.id;
    existing.licenseId = lic.licenseNo || lic.licenseId || lic.id;
    existing.licenseIssueDate = lic.licenseIssueDate || lic.issueDate || existing.licenseIssueDate;
    existing.licenseExpiryDate = lic.licenseExpiryDate || lic.expiryDate || existing.licenseExpiryDate;
    existing.updatedAt = lic.createdAt || lic.updatedAt || lic.date || existing.updatedAt;
  });

  function matchesUser(a) {
    return (a.email && normalizeText(a.email) === normalizeText(user.email)) ||
           (a.applicantEmail && normalizeText(a.applicantEmail) === normalizeText(user.email)) ||
           (a.applicantId && normalizeText(a.applicantId) === normalizeText(user.email)) ||
           (a.applicantName && user.name && normalizeText(a.applicantName) === normalizeText(user.name)) ||
           (a.userId && user.id && normalizeText(a.userId) === normalizeText(user.id));
  }

  function notificationMatchesUser(n) {
    if (!n) return false;
    if (user.email && normalizeText(n.applicantEmail || n.email || n.applicantId) === normalizeText(user.email)) return true;
    if (user.name && normalizeText(n.applicantName) === normalizeText(user.name)) return true;
    if (user.id && normalizeText(n.userId || n.applicantId) === normalizeText(user.id)) return true;
    return false;
  }

  function newestFirst(a, b) {
    return new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime();
  }

  function notificationMarkup(item) {
    var title = item.title || 'Notification';
    var message = item.message || '';
    return '<div class="notif-item"><strong>' + title + '</strong>' + message + '</div>';
  }

  // Also check applicationRef from session for most accurate match
  var appRef = sessionStorage.getItem('applicationRef') || '';
  var app = null;
  if (appRef) {
    app = allApps.find(function(a){ return sameAppId(a, appRef); });
  }
  if (!app) app = allApps.find(matchesUser) || null;

  var applicantEventNotifications = applicantNotifications
    .filter(function(n) {
      if (notificationMatchesUser(n)) return true;
      return app && String(n.appId || '') === getAppId(app);
    })
    .sort(newestFirst);

  var latestApplicantNotification = applicantEventNotifications[0] || null;
  if (!app && latestApplicantNotification && latestApplicantNotification.appId) {
    app = allApps.find(function(a) { return sameAppId(a, latestApplicantNotification.appId); }) || null;
  }

  if (applicantEventNotifications.length) {
    notifCount = applicantEventNotifications.length;
    itemsHTML = applicantEventNotifications.slice(0, 5).map(notificationMarkup).join('');
  }
  else if (app) {
    var st = (app.status || '').toLowerCase();

    if (st === 'submitted' || st === 'pending' || st === 'under verification') {
      notifCount++;
      var appIdStr = app.id || app.appRef || '';
      itemsHTML += '<div class="notif-item"><strong>Application Received ✅</strong>Your application <b>' + appIdStr + '</b> has been submitted and is under review.</div>';
      itemsHTML += '<div class="notif-item"><strong>Payment Confirmed 💳</strong>Payment of ' + (app.paymentAmount || '₹2,205.00') + ' was received successfully.</div>';
    }
    else if (app.status === 'Pending Inspection' || app.status === 'Scheduled') {
      notifCount += 2;
      var insDate = app.inspectionDate || 'TBD';
      var insTime = app.inspectionTime || 'TBD';
      itemsHTML += '<div class="notif-item"><strong>Inspection Scheduled 📅</strong>Physical inspection is scheduled for ' + insDate + ' at ' + insTime + '.</div>';
      itemsHTML += '<div class="notif-item"><strong>Documents Verified! ✅</strong>Your submitted documents have been approved by the officer.</div>';
    }  
    else if (app.status === 'Inspection Recorded' || app.status === 'Inspection Completed') {
      notifCount++;
      var reports = [];
      try { reports = JSON.parse(localStorage.getItem('tz_inspection_reports') || '[]'); } catch(e){}
      var myReport = reports.find(function(r) { return r.appId === app.id; });
      var inspResult = myReport ? myReport.result : 'Completed';
      var inspEmoji = inspResult === 'Approved' ? '✅' : (inspResult === 'Rejected' ? '❌' : '📋');
      itemsHTML += '<div class="notif-item"><strong>Inspection ' + inspResult + ' ' + inspEmoji + '</strong>Field officer recorded inspection report.</div>';
      itemsHTML += '<div class="notif-item"><strong>Documents Verified! ✅</strong>Your submitted documents have been approved.</div>';
    }
    else if (app.status === 'Rejected') {
      notifCount++;
      itemsHTML += '<div class="notif-item"><strong>Application Rejected ❌</strong>Your application has been rejected. Check remarks.</div>'; 
    } 
    else if (app.status === 'Approved' || app.status === 'License Issued' || app.status === 'Licensed') {
      notifCount++;
      var licenseNo = app.licenseId || app.licenseNo;
      var licStr = licenseNo ? ('Your Trade License <b>' + licenseNo + '</b> has been generated successfully!') : 'Your trade license has been generated successfully!';
      itemsHTML += '<div class="notif-item"><strong>License Generated</strong>' + licStr + '<br>You can now download it from your dashboard.</div>'; 
    }
    
    // Base notification always shown when app exists
    if (!itemsHTML) {
      notifCount++;
      itemsHTML += '<div class="notif-item"><strong>Application Submitted</strong>We received your application ' + (app.id || app.appRef) + '.</div>';
    }
  } else {
    itemsHTML = '<div class="notif-empty">No active notifications</div>';
  }

  // 3. Construct elements
  var appStatus = applicantEventNotifications.length
    ? applicantEventNotifications.map(function(item) { return item.id; }).join('|')
    : app
    ? [getAppId(app), app.status, app.licenseId || app.licenseNo || ''].join('_')
    : 'none';
  var hasRead = sessionStorage.getItem('notifsRead_' + appStatus) === 'true';

  var wrapper = document.createElement('div');
  wrapper.className = 'notif-wrapper';
  
  var bell = document.createElement('div');
  bell.className = 'notif-bell';
  bell.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top:2px"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>' + ((notifCount > 0 && !hasRead) ? '<span class="notif-badge">' + notifCount + '</span>' : '');
  
  var drop = document.createElement('div');
  drop.className = 'notif-dropdown';
  drop.innerHTML = '<div class="notif-header">Notifications</div>' + itemsHTML;
  
  bell.addEventListener('click', function(e) {
    e.stopPropagation();
    
    // Mark as read
    var badge = bell.querySelector('.notif-badge');
    if (badge) badge.style.display = 'none';
    sessionStorage.setItem('notifsRead_' + appStatus, 'true');

    if (drop.classList.contains('show')) {
      drop.classList.remove('show');
    } else {
      drop.classList.add('show');
    }
  });
  
  document.addEventListener('click', function() {
    drop.classList.remove('show');
  });

  wrapper.appendChild(bell);
  wrapper.appendChild(drop);
  nav.appendChild(wrapper);
});
