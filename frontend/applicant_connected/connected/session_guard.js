(function() {
  function safeParse(value) {
    try { return JSON.parse(value); } catch (error) { return null; }
  }

  var user = safeParse(sessionStorage.getItem('loggedInUser') || 'null');
  if (!user || !user.email) {
    var localUser = safeParse(localStorage.getItem('user') || 'null');
    if (localUser && localUser.email) {
      user = {
        name: localUser.name || 'Applicant',
        email: localUser.email,
        role: 'applicant'
      };
      sessionStorage.setItem('loggedInUser', JSON.stringify(user));
    }
  }

  if (!user) {
    window.location.href = '../login/index.html';
    return;
  }
  if (user.role && user.role.toLowerCase() !== 'applicant') {
    window.location.href = '../login/index.html';
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
  
  var mockApps = window.TRADEZO && window.TRADEZO.applications ? window.TRADEZO.applications : [];
  var localApps = [];
  try { localApps = JSON.parse(localStorage.getItem('applications') || '[]'); } catch(e){}
  
  var app = localApps.find(function(a) { 
      return (a.email && a.email.toLowerCase() === (user.email||'').toLowerCase()) || 
             (a.applicantName && user.name && a.applicantName.toLowerCase() === user.name.toLowerCase()); 
  }) || mockApps.find(function(a) { 
      return (a.email && a.email.toLowerCase() === (user.email||'').toLowerCase()) || 
             (a.applicantName && user.name && a.applicantName.toLowerCase() === user.name.toLowerCase()); 
  });

  if (app) {
    if (app.status === 'Pending Inspection' || app.status === 'Scheduled') {
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
      var licStr = (app.licenseId || app.licenseNo) ? ('Your Trade License <b>' + (app.licenseId || app.licenseNo) + '</b> has been issued successfully!') : 'Your trade license has been issued successfully!';
      itemsHTML += '<div class="notif-item"><strong>License Generated 🎉</strong>' + licStr + '<br>You can now download it from your dashboard.</div>'; 
    }
    
    // Default base notification
    itemsHTML += '<div class="notif-item"><strong>Application Submitted</strong>We received your application ' + app.id + '.</div>';
  } else {
    itemsHTML = '<div class="notif-empty">No active notifications</div>';
  }

  // 3. Construct elements
  var appStatus = app ? app.status : 'none';
  var hasRead = sessionStorage.getItem('notifsRead_' + appStatus) === 'true';

  var wrapper = document.createElement('div');
  wrapper.className = 'notif-wrapper';
  
  var bell = document.createElement('div');
  bell.className = 'notif-bell';
  bell.innerHTML = '🔔' + ((notifCount > 0 && !hasRead) ? '<span class="notif-badge">' + notifCount + '</span>' : '');
  
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
