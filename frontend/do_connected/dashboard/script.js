// DO dashboard/script.js
// Shows only applications approved by field officer inspection.

function safeArray(key) {
  try {
    var value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch(e) {
    return [];
  }
}

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function getAppId(item) {
  return item.appId || item.id || item.appRef || item.applicationId || '';
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getDoStatus(appId) {
  var stored = localStorage.getItem('doAppStatus_' + appId);
  if (!stored) return { status: 'pending', licenseNo: null };
  try { return JSON.parse(stored) || { status: 'pending', licenseNo: null }; }
  catch(e) { return { status: 'pending', licenseNo: null }; }
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

function isInspectionRecorded(app, inspections) {
  var id = getAppId(app);
  var inspection = inspections[id] || {};
  var raw = normalizeText(app.status || app.application_status);
  var inspectionResult = normalizeText(inspection.result || app.inspectionResult);

  return !!inspectionResult ||
    raw === 'inspection recorded' ||
    raw === 'inspection completed' ||
    raw === 'completed' ||
    raw === 'approved' ||
    raw === 'license issued' ||
    raw === 'licensed';
}

function isVerifiedForInspection(app) {
  var raw = normalizeText(app.status || app.application_status);
  return raw === 'verified' ||
    raw === 'documents verified' ||
    raw === 'scheduled' ||
    raw === 'inspection scheduled' ||
    raw === 'pending inspection';
}

function fieldOfficerStage(app, inspections) {
  if (isInspectionRecorded(app, inspections)) {
    return { label: 'Inspection Recorded', className: 'status-fo-approved' };
  }
  if (isVerifiedForInspection(app)) {
    return { label: 'Verified', className: 'status-pending' };
  }
  return null;
}

function departmentStatus(appId) {
  var state = getDoStatus(appId);
  var status = normalizeText(state.status);

  if (status === 'licensed' && state.licenseNo) {
    return { label: 'Licensed', className: 'status-licensed', licenseNo: state.licenseNo };
  }
  if (status === 'approved') return { label: 'Authorized', className: 'status-authorized' };
  if (status === 'rejected') return { label: 'Rejected', className: 'status-rejected' };
  return { label: 'Pending DO Review', className: 'status-pending' };
}

function loadApprovedApplications() {
  var inspections = inspectionByApplication();
  var sources = []
    .concat((window.TRADEZO && TRADEZO.applications) ? TRADEZO.applications : [])
    .concat(safeArray('tradezo_applications'))
    .concat(safeArray('applications'))
    .concat(safeArray('tz_submitted_apps'))
    .concat(safeArray('tz_inspection_reports'));

  return mergeByApplicationId(sources).map(function(app) {
    var id = getAppId(app);
    var foStage = fieldOfficerStage(app, inspections);
    if (!foStage) return null;
    return Object.assign({}, app, {
      appId: id,
      foStatus: foStage,
      doStatus: departmentStatus(id)
    });
  }).filter(function(app) {
    return !!app;
  }).map(function(app) {
    return app;
  });
}

function renderStats(apps) {
  var pending = 0;
  var authorized = 0;
  var rejected = 0;

  apps.forEach(function(app) {
    var label = app.doStatus.label;
    if (label === 'Authorized' || label === 'Licensed') authorized++;
    else if (label === 'Rejected') rejected++;
    else pending++;
  });

  var totalEl = document.getElementById('foApprovedCount');
  var pendingEl = document.getElementById('pendingCount');
  var authorizedEl = document.getElementById('authorizedCount');
  var rejectedEl = document.getElementById('rejectedCount');

  if (totalEl) totalEl.textContent = apps.length;
  if (pendingEl) pendingEl.textContent = pending;
  if (authorizedEl) authorizedEl.textContent = authorized;
  if (rejectedEl) rejectedEl.textContent = rejected;
}

function renderTable(apps) {
  var tbody = document.getElementById('applicationTableBody');
  var countText = document.getElementById('countText');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (countText) countText.textContent = 'Showing ' + apps.length + ' application(s)';

  if (!apps.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No field-officer-approved applications found.</td></tr>';
    return;
  }

  var freshApps = window.TRADEZO && typeof TRADEZO.sortFreshFirst === 'function'
    ? TRADEZO.sortFreshFirst(apps.slice())
    : apps.slice().reverse();

  freshApps.forEach(function(app) {
    var doStatus = app.doStatus;
    var doLabel = doStatus.licenseNo ? doStatus.label + ' - ' + doStatus.licenseNo : doStatus.label;

    tbody.innerHTML +=
      '<tr>' +
        '<td>' + escapeHtml(app.appId) + '</td>' +
        '<td>' + escapeHtml(app.applicantName || app.applicant || app.ownerName || '-') + '</td>' +
        '<td><strong>' + escapeHtml(app.businessName || app.business || '-') + '</strong><br><small>' + escapeHtml(app.tradeCategory || app.category || app.type || 'Trade License') + '</small></td>' +
        '<td><span class="status-badge ' + app.foStatus.className + '">' + escapeHtml(app.foStatus.label) + '</span></td>' +
        '<td><span class="status-badge ' + doStatus.className + '">' + escapeHtml(doLabel) + '</span></td>' +
        '<td>' + escapeHtml(app.submittedDate || app.date || app.submitted || '-') + '</td>' +
      '</tr>';
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var apps = loadApprovedApplications();

  renderStats(apps);
  renderTable(apps);

  var search = document.getElementById('searchApplications');
  if (search) {
    search.addEventListener('input', function() {
      var query = this.value.toLowerCase().trim();
      var filtered = apps.filter(function(app) {
        return [
          app.appId,
          app.applicantName,
          app.applicant,
          app.ownerName,
          app.businessName,
          app.business,
          app.tradeCategory,
          app.category,
          app.foStatus && app.foStatus.label,
          app.doStatus.label
        ].join(' ').toLowerCase().includes(query);
      });
      renderTable(filtered);
    });
  }
});
