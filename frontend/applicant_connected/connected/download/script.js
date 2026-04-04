// download/script.js — shows real license data from TRADEZO

document.addEventListener('DOMContentLoaded', function() {
  function safeParse(value, fallback) {
    try { return JSON.parse(value); } catch (error) { return fallback; }
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getUser() {
    if (window.TRADEZO && typeof TRADEZO.getLoggedInUser === 'function') {
      return TRADEZO.getLoggedInUser() || {};
    }
    return safeParse(sessionStorage.getItem('loggedInUser') || 'null', {}) || {};
  }

  function getAllApps() {
    var apps = [];
    if (window.TRADEZO && Array.isArray(TRADEZO.applications)) {
      apps = JSON.parse(JSON.stringify(TRADEZO.applications));
    }

    var saved = safeParse(localStorage.getItem('tz_submitted_apps') || '[]', []);
    var globalSaved = safeParse(localStorage.getItem('applications') || '[]', []);
    var combined = saved.concat(globalSaved);

    if (Array.isArray(combined)) {
      combined.forEach(function(app) {
        var existing = apps.find(function(ex) {
          return ex.appRef === app.id || ex.id === app.id || ex.id === app.appRef;
        });
        if (existing) {
          Object.assign(existing, app);
        } else {
          apps.push(app);
        }
      });
    }

    var generatedLics = safeParse(localStorage.getItem('tz_generated_licenses') || '[]', []);
    if (Array.isArray(generatedLics)) {
      generatedLics.forEach(function(lic) {
          var existing = apps.find(function(ex) {
             return ex.appRef === lic.appId || ex.id === lic.appId;
          });
          if (existing) {
             existing.status = 'License Issued';
             existing.licenseNo = lic.licenseNo;
             existing.licenseId = lic.licenseNo;
             if (lic.licenseIssueDate) existing.licenseIssueDate = lic.licenseIssueDate;
             if (lic.licenseExpiryDate) existing.licenseExpiryDate = lic.licenseExpiryDate;
             if (lic.issuedBy) existing.issuedBy = lic.issuedBy;
          }
      });
    }
    return apps;
  }

  function belongsToUser(app, user) {
    if (!app) return false;
    if (user.email && normalize(app.email) === normalize(user.email)) return true;
    if (user.name && normalize(app.applicantName) === normalize(user.name)) return true;
    if (user.id && (normalize(app.userId) === normalize(user.id) || normalize(app.applicantId) === normalize(user.id))) return true;
    return false;
  }

  function findApprovedApp(user) {
    var apps = getAllApps();
    var appRef = sessionStorage.getItem('applicationRef') || '';
    var matches = [];

    if (appRef) {
      matches = apps.filter(function(app) {
        return (app.appRef === appRef || app.id === appRef) && belongsToUser(app, user);
      });
    }

    if (!matches.length && user.email) {
      matches = apps.filter(function(app) {
        return normalize(app.email) === normalize(user.email);
      });
    }

    if (!matches.length && user.name) {
      matches = apps.filter(function(app) {
        return normalize(app.applicantName) === normalize(user.name);
      });
    }

    if (!matches.length && user.id) {
      matches = apps.filter(function(app) {
        return normalize(app.userId) === normalize(user.id) || normalize(app.applicantId) === normalize(user.id);
      });
    }

    var approved = matches.filter(function(app) {
      var s = normalize(app.status);
      return s === 'approved' || s === 'license issued' || s === 'licensed' || app.licenseId || app.licenseNo;
    });

    return approved.length ? approved[approved.length - 1] : null;
  }

  function fill(selector, value) {
    document.querySelectorAll(selector).forEach(function(el) {
      el.textContent = value || '—';
    });
  }

  var user = getUser();
  if (!user || !user.email) {
    window.location.href = '../login/index.html';
    return;
  }

  var app = findApprovedApp(user);
  var layout = document.querySelector('.main-layout');

  if (!app) {
    if (layout) {
      var msg = document.createElement('div');
      msg.style.cssText = 'text-align:center;padding:48px 20px;';
      msg.innerHTML =
        '<div style="font-size:52px;margin-bottom:16px;">📜</div>' +
        '<h3 style="color:#1E3A8A;margin-bottom:10px;">No License Available</h3>' +
        '<p style="color:#64748b;margin-bottom:24px;">Your trade license will appear here once your application is approved.</p>' +
        '<a href="../Track Application Status/index.html" style="background:#1E3A8A;color:#fff;padding:11px 28px;border-radius:8px;font-weight:600;text-decoration:none;">Track Application →</a>';
      layout.innerHTML = '';
      layout.appendChild(msg);
    }
    return;
  }

  fill('.license-number', app.licenseId || app.licenseNo || app.id || app.appRef);
  fill('.applicant-name', app.applicantName || user.name);
  fill('.trade-category', app.tradeCategory || app.category || '—');
  
  var issueStr = app.licenseIssueDate;
  var expiryStr = app.licenseExpiryDate;
  
  if (!issueStr || !expiryStr) {
     var d = new Date();
     var e = new Date();
     e.setFullYear(d.getFullYear() + 1);
     issueStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
     expiryStr = e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  fill('.issue-date', issueStr);
  fill('.expiry-date', expiryStr);
  
  var doNameElem = document.querySelector('.do-name');
  if (doNameElem) {
      doNameElem.textContent = app.issuedBy || 'Anjali Mehta';
  }

  var badge = document.getElementById('licenseBadge');
  if (badge) badge.textContent = '✅ ACTIVE';

  var status = document.getElementById('licenseStatus');
  if (status) status.textContent = '✔ Active';
});

function handleDownload() { window.print(); }
function handlePrint()    { window.print(); }
function handleCancel()   { window.location.href = '../Applicant dashboard/index.html'; }
