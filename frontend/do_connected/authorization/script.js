// DO authorization/script.js
// Final authorization is driven by live/backend storage and FO inspection reports.

var currentAppId = null;
var authorizationApps = [];
var DEMO_BUSINESS_NAMES = {
  'green valley restaurant': true,
  'singh electronics': true,
  'sharma healthcare': true
};

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

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getAppStatus(appId) {
  var data = localStorage.getItem('doAppStatus_' + appId);
  if (!data) return { status: 'pending', licenseNo: null };
  try {
    return JSON.parse(data) || { status: 'pending', licenseNo: null };
  } catch(e) {
    return { status: 'pending', licenseNo: null };
  }
}

function setAppStatus(appId, status, licenseNo) {
  localStorage.setItem('doAppStatus_' + appId, JSON.stringify({
    status: status,
    licenseNo: licenseNo || null
  }));
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

function foResultForApp(app, inspections) {
  var id = getAppId(app);
  var inspection = inspections[id] || {};
  return inspection.result || app.inspectionResult || '';
}

function isFieldOfficerApproved(app, inspections) {
  return normalizeText(foResultForApp(app, inspections)) === 'approved';
}

function normalizeApplication(app, inspections) {
  var id = getAppId(app);
  var inspection = inspections[id] || {};

  return Object.assign({}, app, {
    id: id,
    appId: id,
    appRef: app.appRef || id,
    businessName: app.businessName || app.business || '-',
    applicantName: app.applicantName || app.applicant || app.ownerName || '-',
    tradeCategory: app.tradeCategory || app.category || app.licenseType || app.type || 'Trade License',
    submittedDate: app.submittedDate || app.submitted || app.date || '-',
    foResult: inspection.result || app.inspectionResult || 'Approved',
    inspection: inspection
  });
}

function loadAuthorizationApplications() {
  var inspections = inspectionByApplication();
  var sources = []
    .concat((window.TRADEZO && Array.isArray(TRADEZO.applications)) ? TRADEZO.applications : [])
    .concat(safeArray('tradezo_applications'))
    .concat(safeArray('applications'))
    .concat(safeArray('tz_submitted_apps'))
    .concat(safeArray('tz_inspection_reports'));

  var apps = mergeByApplicationId(sources).filter(function(app) {
    if (isDemoApplication(app)) return false;
    return isFieldOfficerApproved(app, inspections);
  }).map(function(app) {
    return normalizeApplication(app, inspections);
  });

  if (window.TRADEZO && typeof TRADEZO.sortFreshFirst === 'function') {
    return TRADEZO.sortFreshFirst(apps);
  }
  return apps.reverse();
}

function findAuthorizationApp(appId) {
  var app = authorizationApps.find(function(item) {
    return sameApp(item, appId);
  });
  if (app) return app;

  var inspections = inspectionByApplication();
  var app = mergeByApplicationId(
    []
      .concat((window.TRADEZO && Array.isArray(TRADEZO.applications)) ? TRADEZO.applications : [])
      .concat(safeArray('tradezo_applications'))
      .concat(safeArray('applications'))
      .concat(safeArray('tz_submitted_apps'))
      .concat(safeArray('tz_inspection_reports'))
  ).find(function(item) {
    return sameApp(item, appId);
  });

  if (app && isDemoApplication(app)) return normalizeApplication({ id: appId, appId: appId }, inspections);
  return normalizeApplication(app || { id: appId, appId: appId }, inspections);
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

function syncBackendStatus(appId, status) {
  var app = findAuthorizationApp(appId);
  var backendId = Number(app && (app.backendId || app.application_id || app.id));
  if (backendId && window.TRADEZO && typeof TRADEZO.syncApplicationToBackend === 'function') {
    TRADEZO.syncApplicationToBackend(Object.assign({}, app, { id: backendId, status: status }), 'department_officer');
  }
}

function openModal(id) {
  var modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  var modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

window.closeModal = closeModal;

function appInfoHtml(app, includeFoResult) {
  var html =
    '<p><strong>Application ID:</strong> ' + escapeHtml(app.appId) + '</p>' +
    '<p><strong>Business:</strong> ' + escapeHtml(app.businessName) + '</p>' +
    '<p><strong>Category:</strong> ' + escapeHtml(app.tradeCategory) + '</p>';
  if (includeFoResult) {
    html += '<p><strong>FO Result:</strong> ' + escapeHtml(app.foResult) + '</p>';
  }
  return html;
}

function showApproveModal(appId) {
  currentAppId = appId;
  var app = findAuthorizationApp(appId);

  document.getElementById('approveDesc').textContent = 'Are you sure you want to approve this application?';
  document.getElementById('approveInfo').innerHTML = appInfoHtml(app, true);
  openModal('approveModal');
}

function showRejectModal(appId) {
  currentAppId = appId;
  var app = findAuthorizationApp(appId);

  document.getElementById('rejectDesc').textContent = 'Please provide a reason for rejecting this application.';
  document.getElementById('rejectInfo').innerHTML = appInfoHtml(app, false);
  document.getElementById('rejectReason').value = '';
  openModal('rejectModal');
}

function showLicenseModal(appId) {
  currentAppId = appId;
  var app = findAuthorizationApp(appId);

  document.getElementById('licenseDesc').textContent = 'Ready to generate the official trade license?';
  document.getElementById('licenseInfo').innerHTML = appInfoHtml(app, false);
  openModal('licenseModal');
}

window.showApproveModal = showApproveModal;
window.showRejectModal = showRejectModal;
window.showLicenseModal = showLicenseModal;

function confirmApprove() {
  if (!currentAppId) return;
  var app = findAuthorizationApp(currentAppId);

  setAppStatus(currentAppId, 'approved', null);
  updateStoredApplications(currentAppId, {
    status: 'Department Approved',
    doReview: 'Approved',
    updatedAt: new Date().toISOString()
  });
  syncBackendStatus(currentAppId, 'Department Review');

  closeModal('approveModal');
  document.getElementById('successTitle').textContent = 'Application Approved!';
  document.getElementById('successDesc').innerHTML =
    '<strong>' + escapeHtml(app.businessName) + '</strong> has been approved.<br>Click "Generate License" to issue the license.';
  openModal('successModal');

  renderTable();
}

function confirmReject() {
  if (!currentAppId) return;
  var app = findAuthorizationApp(currentAppId);
  var reasonEl = document.getElementById('rejectReason');
  var reason = reasonEl.value.trim();

  if (!reason) {
    reasonEl.style.borderColor = '#dc2626';
    reasonEl.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.1)';
    return;
  }

  reasonEl.style.borderColor = '';
  reasonEl.style.boxShadow = '';

  setAppStatus(currentAppId, 'rejected', null);
  localStorage.setItem('doRejectReason_' + currentAppId, reason);
  updateStoredApplications(currentAppId, {
    status: 'Rejected',
    doReview: 'Rejected',
    rejectionReason: reason,
    updatedAt: new Date().toISOString()
  });
  syncBackendStatus(currentAppId, 'Rejected');

  closeModal('rejectModal');
  document.getElementById('successTitle').textContent = 'Application Rejected';
  document.getElementById('successDesc').innerHTML =
    '<strong>' + escapeHtml(app.businessName) + '</strong> has been rejected.<br>Reason: ' + escapeHtml(reason);
  openModal('successModal');

  renderTable();
}

function confirmGenerateLicense() {
  if (!currentAppId) return;
  var app = findAuthorizationApp(currentAppId);
  var licenseId = 'LIC-' + Date.now().toString().slice(-6);

  var issueDate = new Date();
  var expiryDate = new Date(issueDate);
  expiryDate.setFullYear(issueDate.getFullYear() + 1);
  var issueStr = issueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  var expiryStr = expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  var loggedInDO = {};
  try { loggedInDO = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch(e) {}
  var doName = loggedInDO.name || 'Department Officer';

  setAppStatus(currentAppId, 'licensed', licenseId);
  updateStoredApplications(currentAppId, {
    status: 'License Issued',
    doReview: 'Approved',
    licenseNo: licenseId,
    licenseId: licenseId,
    licenseIssueDate: issueStr,
    licenseExpiryDate: expiryStr,
    issuedBy: doName,
    updatedAt: new Date().toISOString()
  });
  syncBackendStatus(currentAppId, 'Approved');

  var backendId = Number(app && (app.backendId || app.application_id || app.id));
  if (backendId && window.TRADEZO && typeof TRADEZO.createBackendLicense === 'function') {
    TRADEZO.createBackendLicense(backendId, loggedInDO.backendUserId || loggedInDO.user_id || 4);
  }

  var generatedLicenses = safeArray('tz_generated_licenses');
  generatedLicenses = generatedLicenses.filter(function(lic) {
    return String(lic.appId || '') !== String(currentAppId) && String(lic.licenseNo || '') !== licenseId;
  });
  generatedLicenses.unshift({
    id: licenseId,
    appId: currentAppId,
    licenseNo: licenseId,
    businessName: app.businessName,
    category: app.tradeCategory,
    status: 'Active',
    date: new Date().toISOString(),
    licenseIssueDate: issueStr,
    licenseExpiryDate: expiryStr,
    issuedBy: doName
  });
  saveArray('tz_generated_licenses', generatedLicenses);
  createApplicantLicenseNotification(app, currentAppId, licenseId);

  closeModal('licenseModal');
  document.getElementById('licenseSuccessInfo').innerHTML =
    '<p><strong>License No:</strong> ' + escapeHtml(licenseId) + '</p>' +
    '<p><strong>Business:</strong> ' + escapeHtml(app.businessName) + '</p>' +
    '<p><strong>Category:</strong> ' + escapeHtml(app.tradeCategory) + '</p>';
  openModal('licenseSuccessModal');

  renderTable();
}

function statusBadgeHtml(state) {
  var status = normalizeText(state.status);
  if (status === 'licensed' && state.licenseNo) {
    return '<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Licensed</span>';
  }
  if (status === 'approved') {
    return '<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Approved</span>';
  }
  if (status === 'rejected') {
    return '<span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Rejected</span>';
  }
  return '<span style="background:#fef3c7;color:#d97706;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Pending</span>';
}

function actionHtml(appId, state) {
  var status = normalizeText(state.status);
  if (status === 'licensed' && state.licenseNo) {
    return '<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">License: ' + escapeHtml(state.licenseNo) + '</span>';
  }
  if (status === 'approved') {
    return '<button class="generate-btn" onclick="showLicenseModal(\'' + escapeHtml(appId) + '\')" style="background:#16a34a;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Generate License</button>';
  }
  if (status === 'rejected') {
    return '<span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Rejected</span>';
  }
  return '<button class="approve-btn" onclick="showApproveModal(\'' + escapeHtml(appId) + '\')" style="background:#16a34a;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;margin-right:6px;">Approve</button>' +
    '<button class="reject-btn" onclick="showRejectModal(\'' + escapeHtml(appId) + '\')" style="background:#dc2626;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Reject</button>';
}

function renderTable(data) {
  var tbody = document.querySelector('tbody');
  if (!tbody) return;

  authorizationApps = data || loadAuthorizationApplications();
  tbody.innerHTML = '';

  if (!authorizationApps.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:30px;">No field-officer-approved applications are ready for final authorization.</td></tr>';
    return;
  }

  authorizationApps.forEach(function(app) {
    var appId = app.appId;
    var state = getAppStatus(appId);
    var row = document.createElement('tr');
    row.setAttribute('data-id', appId);
    row.innerHTML =
      '<td style="color:#1E3A8A;font-weight:600;">' + escapeHtml(appId) + '</td>' +
      '<td><strong>' + escapeHtml(app.businessName) + '</strong><br><small style="color:#64748b;">' + escapeHtml(app.tradeCategory) + '</small></td>' +
      '<td>' + statusBadgeHtml(state) + '</td>' +
      '<td>' + actionHtml(appId, state) + '</td>';
    tbody.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var searchInput = document.querySelector('.search-bar input');
  var approveBtn = document.getElementById('confirmApproveBtn');
  var rejectBtn = document.getElementById('confirmRejectBtn');
  var licenseBtn = document.getElementById('confirmLicenseBtn');

  if (approveBtn) approveBtn.addEventListener('click', confirmApprove);
  if (rejectBtn) rejectBtn.addEventListener('click', confirmReject);
  if (licenseBtn) licenseBtn.addEventListener('click', confirmGenerateLicense);

  document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  renderTable();

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      var q = this.value.toLowerCase().trim();
      var filtered = loadAuthorizationApplications().filter(function(app) {
        return [
          app.appId,
          app.businessName,
          app.tradeCategory,
          app.applicantName,
          getAppStatus(app.appId).status
        ].join(' ').toLowerCase().includes(q);
      });
      renderTable(filtered);
    });
  }
});
