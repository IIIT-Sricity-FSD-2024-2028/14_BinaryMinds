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
  var data = localStorage.getItem('doAppStatus_' + appId);
  if (!data) return { status: 'pending', licenseNo: null };
  try {
    return JSON.parse(data) || { status: 'pending', licenseNo: null };
  } catch(e) {
    return { status: 'pending', licenseNo: null };
  }
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
    return { label: 'Inspection Recorded', className: 'recorded' };
  }
  if (isVerifiedForInspection(app)) {
    return { label: 'Verified', className: 'verified' };
  }
  return null;
}

function loadWorklistApplications() {
  var inspections = inspectionByApplication();
  var sources = []
    .concat((window.TRADEZO && Array.isArray(TRADEZO.applications)) ? TRADEZO.applications : [])
    .concat(safeArray('tradezo_applications'))
    .concat(safeArray('applications'))
    .concat(safeArray('tz_submitted_apps'))
    .concat(safeArray('tz_inspection_reports'));

  var apps = mergeByApplicationId(sources).map(function(app) {
    var appId = getAppId(app);
    var foStage = fieldOfficerStage(app, inspections);
    if (!foStage) return null;

    return {
      appId: appId,
      businessName: app.businessName || app.business || 'N/A',
      tradeCategory: app.tradeCategory || app.category || app.licenseType || 'Trade License',
      applicantName: app.applicantName || app.applicant || app.ownerName || 'N/A',
      submittedDate: app.submittedDate || app.submitted_at || app.date || app.createdAt || '',
      updatedDate: app.updatedDate || app.updatedAt || app.reviewDate || app.approvedDate || '',
      foStatus: foStage,
      doStatus: getDoStatus(appId)
    };
  }).filter(function(app) {
    return !!app;
  });

  return window.TRADEZO && typeof TRADEZO.sortFreshFirst === 'function'
    ? TRADEZO.sortFreshFirst(apps)
    : apps.reverse();
}

function stagePriority(app) {
  if (app.foStatus.label === 'Inspection Recorded') return 0;
  return 1;
}

document.addEventListener('DOMContentLoaded', function() {
  var tbody = document.querySelector('tbody');
  var searchInput = document.querySelector('.search-bar input, input[type="text"]');
  var paginationInfo = document.querySelector('.pagination span');
  var filterButtons = document.querySelectorAll('.filter-btn');
  var allApps = loadWorklistApplications();
  var currentFilter = 'all applications';

  function statusBadge(app) {
    var doStatus = normalizeText(app.doStatus.status);

    if (doStatus === 'licensed' && app.doStatus.licenseNo) {
      return '<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Licensed</span>';
    }
    if (doStatus === 'approved') {
      return '<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Authorized</span>';
    }
    if (doStatus === 'rejected') {
      return '<span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Rejected</span>';
    }
    if (app.foStatus.label === 'Inspection Recorded') {
      return '<span style="background:#dbeafe;color:#1d4ed8;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Inspection Recorded</span>';
    }
    return '<span style="background:#fef3c7;color:#d97706;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Verified</span>';
  }

  function actionHtml(app) {
    var doStatus = normalizeText(app.doStatus.status);

    if (doStatus === 'licensed' && app.doStatus.licenseNo) {
      return '<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">' + escapeHtml(app.doStatus.licenseNo) + '</span>';
    }
    if (doStatus === 'approved') {
      return '<button class="review-btn" data-id="' + escapeHtml(app.appId) + '" style="background:#16a34a;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Authorized</button>';
    }
    if (doStatus === 'rejected') {
      return '<span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Rejected</span>';
    }
    if (app.foStatus.label === 'Inspection Recorded') {
      return '<button class="review-btn" data-id="' + escapeHtml(app.appId) + '" style="background:#1E3A8A;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Review Application</button>';
    }
    return '<span style="background:#e0f2fe;color:#0369a1;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Awaiting Inspection</span>';
  }

  function applyFilters(applications) {
    var q = searchInput ? searchInput.value.toLowerCase().trim() : '';

    var filtered = applications.filter(function(app) {
      if (currentFilter === 'urgent') {
        if (app.foStatus.label !== 'Inspection Recorded') return false;
      }

      if (!q) return true;
      return [
        app.appId,
        app.businessName,
        app.tradeCategory,
        app.applicantName,
        app.foStatus.label
      ].join(' ').toLowerCase().includes(q);
    });

    filtered.sort(function(a, b) {
      var priority = stagePriority(a) - stagePriority(b);
      if (priority !== 0) return priority;
      var dateA = new Date(a.updatedDate || a.submittedDate || 0).getTime();
      var dateB = new Date(b.updatedDate || b.submittedDate || 0).getTime();
      return dateB - dateA;
    });

    return filtered;
  }

  function renderTable(applications) {
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!applications.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No verified or inspection-recorded applications found.</td></tr>';
    } else {
      applications.forEach(function(app) {
        var row = document.createElement('tr');
        row.setAttribute('data-id', app.appId);
        row.innerHTML =
          '<td style="color:#1E3A8A;font-weight:600;">' + escapeHtml(app.appId) + '</td>' +
          '<td><strong>' + escapeHtml(app.businessName) + '</strong><br><small style="color:#64748b;">' + escapeHtml(app.tradeCategory) + '</small></td>' +
          '<td>' + escapeHtml(app.submittedDate || '-') + '</td>' +
          '<td>' + statusBadge(app) + '</td>' +
          '<td>' + actionHtml(app) + '</td>';
        tbody.appendChild(row);
      });
    }

    document.querySelectorAll('.review-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var appId = this.getAttribute('data-id');
        sessionStorage.setItem('selectedAppDO', appId);
        window.location.href = '../inspection-report/index.html';
      });
    });

    if (paginationInfo) {
      paginationInfo.textContent = 'Showing 1 to ' + applications.length + ' of ' + applications.length + ' applications';
    }
  }

  function refresh() {
    allApps = loadWorklistApplications();
    renderTable(applyFilters(allApps));
  }

  refresh();

  if (searchInput) {
    searchInput.addEventListener('input', refresh);
  }

  filterButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterButtons.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.textContent.trim().toLowerCase();
      refresh();
    });
  });
});
