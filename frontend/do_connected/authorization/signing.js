// DO authorization/signing.js

function safeArray(key) {
  try {
    var value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch(e) {
    return [];
  }
}

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
}

function createApplicantLicenseNotification(app, appId, licenseNo) {
  var notifications = safeArray('tz_applicant_notifications').filter(function(item) {
    return !(item.type === 'license_generated' &&
      String(item.appId || '') === String(appId) &&
      String(item.licenseNo || '') === String(licenseNo));
  });

  notifications.unshift({
    id: 'NOTIF-LIC-' + licenseNo,
    type: 'license_generated',
    appId: appId,
    licenseNo: licenseNo,
    applicantName: app.applicantName || app.applicant || app.ownerName || '',
    applicantEmail: app.email || app.applicantEmail || app.applicantId || '',
    businessName: app.businessName || app.business || '',
    title: 'License Generated',
    message: 'Your Trade License ' + licenseNo + ' has been generated and is ready to download.',
    read: false,
    createdAt: new Date().toISOString()
  });

  saveArray('tz_applicant_notifications', notifications);
}

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

var DEMO_BUSINESS_NAMES = {
  'green valley restaurant': true,
  'singh electronics': true,
  'sharma healthcare': true
};

function getAppId(item) {
  return String(item && (item.appId || item.id || item.appRef || item.application_id || item.applicationId) || '').trim();
}

function isDemoApplication(item) {
  var businessName = normalizeText(item && (item.businessName || item.business_name || item.business || item.companyName));
  return !!DEMO_BUSINESS_NAMES[businessName];
}

function sameApp(item, appId) {
  var wanted = String(appId || '').trim();
  return [
    item && item.appId,
    item && item.id,
    item && item.appRef,
    item && item.application_id,
    item && item.applicationId,
    item && item.backendId
  ].some(function(value) {
    return String(value || '').trim() === wanted;
  });
}

function mergeByApplicationId(sources) {
  var byId = {};
  var order = [];

  sources.forEach(function(app) {
    if (!app) return;
    var id = getAppId(app);
    if (!id) return;

    if (!byId[id]) {
      byId[id] = {};
      order.push(id);
    }

    byId[id] = Object.assign({}, byId[id], app, {
      id: app.id || byId[id].id || id,
      appId: id,
      appRef: app.appRef || byId[id].appRef || id
    });
  });

  return order.map(function(id) { return byId[id]; });
}

function inspectionByApplication() {
  var byId = {};

  if (window.TRADEZO && Array.isArray(TRADEZO.inspections)) {
    TRADEZO.inspections.forEach(function(inspection) {
      var id = getAppId(inspection);
      if (id) byId[id] = inspection;
    });
  }

  safeArray('tz_inspection_reports').forEach(function(report) {
    var id = getAppId(report);
    if (id) byId[id] = Object.assign({}, byId[id] || {}, report);
  });

  return byId;
}

function findApplication(appId) {
  var sources = []
    .concat((window.TRADEZO && Array.isArray(TRADEZO.applications)) ? TRADEZO.applications : [])
    .concat(safeArray('tradezo_applications'))
    .concat(safeArray('applications'))
    .concat(safeArray('tz_submitted_apps'))
    .concat(safeArray('tz_inspection_reports'));

  var app = mergeByApplicationId(sources).find(function(app) {
    return sameApp(app, appId);
  }) || null;

  return app && !isDemoApplication(app) ? app : null;
}

function findInspection(appId) {
  return inspectionByApplication()[appId] || null;
}

function updateStoredApplications(appId, changes) {
  ['tradezo_applications', 'applications', 'tz_submitted_apps'].forEach(function(key) {
    var list = safeArray(key);
    var changed = false;
    list = list.map(function(app) {
      if (!sameApp(app, appId)) return app;
      changed = true;
      return Object.assign({}, app, changes);
    });
    if (changed) saveArray(key, list);
  });

  if (window.TRADEZO && Array.isArray(TRADEZO.applications)) {
    TRADEZO.applications.forEach(function(app) {
      if (sameApp(app, appId)) Object.assign(app, changes);
    });
  }
}

function issueLicense(app, licenseId, issueStr, expiryStr, officerName) {
  var appId = getAppId(app);
  localStorage.setItem('doAppStatus_' + appId, JSON.stringify({
    status: 'licensed',
    licenseNo: licenseId,
    updatedAt: new Date().toISOString()
  }));

  updateStoredApplications(appId, {
    status: 'License Issued',
    doReview: 'Approved',
    licenseNo: licenseId,
    licenseId: licenseId,
    licenseIssueDate: issueStr,
    licenseExpiryDate: expiryStr,
    issuedBy: officerName,
    updatedAt: new Date().toISOString()
  });

  var generatedLicenses = safeArray('tz_generated_licenses').filter(function(lic) {
    return String(lic.appId || '') !== String(appId);
  });
  generatedLicenses.unshift({
    id: licenseId,
    appId: appId,
    licenseNo: licenseId,
    businessName: app.businessName || app.business || '-',
    category: app.tradeCategory || app.category || app.licenseType || 'Trade License',
    status: 'Active',
    date: new Date().toISOString(),
    licenseIssueDate: issueStr,
    licenseExpiryDate: expiryStr,
    issuedBy: officerName
  });
  saveArray('tz_generated_licenses', generatedLicenses);
  createApplicantLicenseNotification(app, appId, licenseId);

  var backendId = Number(app.backendId || app.application_id || app.id);
  if (backendId && window.TRADEZO && typeof TRADEZO.syncApplicationToBackend === 'function') {
    TRADEZO.syncApplicationToBackend(Object.assign({}, app, { id: backendId, status: 'Approved' }), 'department_officer');
  }
  if (backendId && window.TRADEZO && typeof TRADEZO.createBackendLicense === 'function') {
    TRADEZO.createBackendLicense(backendId, 4);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var appId = sessionStorage.getItem('selectedAppDO');

  if (!appId) {
    alert('No application selected. Redirecting to authorization list...');
    window.location.href = 'index.html';
    return;
  }

  var app = findApplication(appId);
  if (!app) {
    alert('Application not found. Redirecting to authorization list...');
    window.location.href = 'index.html';
    return;
  }

  var inspection = findInspection(appId);
  var foResult = inspection ? inspection.result : app.inspectionResult;
  if (normalizeText(foResult) !== 'approved') {
    alert('Only field-officer-approved applications can be signed.');
    window.location.href = 'index.html';
    return;
  }

  var normalizedId = getAppId(app);
  var businessName = app.businessName || app.business || '-';
  var category = app.tradeCategory || app.category || app.licenseType || 'Trade License';
  var address = [app.shopAddress || app.address || '', app.city || ''].filter(Boolean).join(', ');

  document.getElementById('appIdDisplay').textContent = normalizedId;
  document.getElementById('docSerial').textContent = 'Serial No: ' + (app.appRef || normalizedId);
  document.getElementById('docLicensee').textContent = businessName;
  document.getElementById('docRegId').textContent = app.appRef || normalizedId;
  document.getElementById('docActivities').textContent =
    'Subject to the provisions of the regulatory framework, the licensee is authorized to conduct ' +
    category + ' operations' + (address ? ' at ' + address : '') + '.';

  var today = new Date();
  var expiry = new Date(today);
  expiry.setFullYear(expiry.getFullYear() + 1);
  var issueStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  var expiryStr = expiry.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  document.getElementById('docIssueDate').textContent = issueStr;
  document.getElementById('docExpiryDate').textContent = expiryStr;

  var foStatusEl = document.getElementById('foStatus');
  if (foStatusEl) foStatusEl.textContent = 'Completed - ' + (foResult || 'Approved');

  document.querySelectorAll('.auth-option').forEach(function(opt) {
    opt.addEventListener('click', function() {
      document.querySelectorAll('.auth-option').forEach(function(o) {
        o.classList.remove('selected');
        var chk = o.querySelector('.auth-check');
        if (chk) chk.remove();
      });
      opt.classList.add('selected');
      if (!opt.querySelector('.auth-check')) {
        var chk = document.createElement('div');
        chk.className = 'auth-check';
        chk.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        opt.appendChild(chk);
      }
    });
  });

  var signBtn = document.getElementById('signBtn');
  if (signBtn) {
    signBtn.addEventListener('click', function() {
      var selected = document.querySelector('.auth-option.selected');
      if (!selected) {
        alert('Please select an authorization method before signing.');
        return;
      }

      if (confirm('Confirm: Issue license for application ' + normalizedId + '?')) {
        var licenseId = 'LIC-' + Date.now().toString().slice(-6);
        var loggedInDO = {};
        try { loggedInDO = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch(e) {}
        issueLicense(app, licenseId, issueStr, expiryStr, loggedInDO.name || 'Department Officer');
        sessionStorage.setItem('issuedLicense', normalizedId);
        alert('License signed and issued successfully! License No: ' + licenseId);
        window.location.href = '../compliance/index.html';
      }
    });
  }
});
