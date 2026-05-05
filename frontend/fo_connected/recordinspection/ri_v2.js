// fo_connected/recordinspection/ri.js
// Shows verified and inspection-scheduled applications assigned to the current FO.

var systemRecordInspectionApps = [];

function safeArray(key) {
  try {
    var value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch(e) {
    return [];
  }
}

function normalizeStatus(status) {
  return String(status || '').toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function isRecordableStatus(status) {
  var s = normalizeStatus(status);
  return s === 'verified' ||
    s === 'documents verified' ||
    s === 'scheduled' ||
    s === 'inspection scheduled' ||
    s === 'pending inspection';
}

function isTerminalStatus(status) {
  var s = normalizeStatus(status);
  return s === 'completed' ||
    s === 'inspection completed' ||
    s === 'inspection recorded' ||
    s === 'approved' ||
    s === 'rejected' ||
    s === 'license issued' ||
    s === 'licensed';
}

function getAppId(item) {
  return item.appId || item.id || item.appRef || item.applicationId || '';
}

function normalizeIdentity(value) {
  return String(value || '').toLowerCase().trim();
}

function isAssignedToVisibleOfficer(item) {
  var assignmentValues = [
    item.assignedFO,
    item.foName,
    item.fieldOfficer,
    item.fieldOfficerName,
    item.fieldOfficerId,
    item.field_officer_id,
    item.assignedFieldOfficer,
    item.assignedTo,
    item.assignedEmail,
    item.fieldOfficerEmail
  ].filter(Boolean).map(normalizeIdentity);

  if (!assignmentValues.length) return false;
  if (window.foIsAssignedToCurrentOfficer) {
      return window.foIsAssignedToCurrentOfficer(item);
  }

  var officer = window.foCurrentOfficer ? window.foCurrentOfficer() : {};
  var officerValues = [
    officer.id,
    officer.empId,
    officer.backendUserId,
    officer.name,
    officer.email
  ].map(normalizeIdentity).filter(function(v) { return v.length > 0; });

  var validAssignments = assignmentValues.filter(function(v) { return v.length > 0; });
  if (validAssignments.length === 0 || officerValues.length === 0) return false;

  return validAssignments.some(function(assigned) {
    return officerValues.some(function(officerValue) {
      return assigned === officerValue;
    });
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

function displayValue(value) {
  return escapeHtml(value || '-');
}

function mergeByApplicationId(sources) {
  var byId = {};
  var order = [];

  sources.forEach(function(item) {
    if (!item) return;
    var id = getAppId(item);
    if (!id) return;
    if (!byId[id]) {
      byId[id] = {};
      order.push(id);
    }
    var previous = byId[id];
    var merged = Object.assign({}, previous, item, {
      id: item.id || byId[id].id || id,
      appId: id,
      appRef: item.appRef || byId[id].appRef || id
    });

    if (isRecordableStatus(previous.status) && !isRecordableStatus(item.status) && !isTerminalStatus(item.status)) {
      merged.status = previous.status;
    }

    if (!item.inspectionDate && previous.inspectionDate) merged.inspectionDate = previous.inspectionDate;
    if (!item.inspectionTime && previous.inspectionTime) merged.inspectionTime = previous.inspectionTime;
    if (!item.date && previous.date) merged.date = previous.date;
    if (!item.time && previous.time) merged.time = previous.time;

    byId[id] = merged;
  });

  return order.map(function(id) { return byId[id]; });
}

function toInspectionCard(app) {
  var id = getAppId(app);
  var addressParts = [
    app.shopAddress || app.address || '',
    app.city || '',
    app.district || '',
    app.state || ''
  ].filter(Boolean);

  return {
    appId: id,
    businessName: app.businessName || app.business || 'Business Name N/A',
    type: app.tradeCategory || app.licenseType || app.category || app.type || 'Trade License',
    ownerName: app.applicantName || app.ownerName || app.applicant || 'Applicant N/A',
    address: addressParts.length ? addressParts.join(', ') : 'Address N/A',
    status: app.status || 'Verified',
    inspectionDate: app.inspectionDate || app.date || '',
    inspectionTime: app.inspectionTime || app.time || '',
    submittedDate: app.submittedDate || app.dateSubmitted || app.createdAt || '',
    phone: app.phone || app.mobile || app.contact || '',
    email: app.email || ''
  };
}

function isCompletedInspection(appId) {
  return safeArray('tz_inspection_reports').some(function(report) {
    return getAppId(report) === appId;
  });
}

function actionForStatus(status) {
  var s = normalizeStatus(status);
  if (s === 'verified' || s === 'documents verified') {
    return {
      label: 'Schedule Inspection',
      target: '../scheduleinspection/index.html'
    };
  }
  return {
    label: 'Start Inspection',
    target: '../start inspection/index.html'
  };
}

function statusClass(status) {
  var s = normalizeStatus(status);
  if (s === 'verified' || s === 'documents verified') return 'verified';
  if (s === 'scheduled' || s === 'inspection scheduled') return 'scheduled';
  return 'pending';
}

function detailRow(label, value) {
  if (!value) return '';
  return '<p class="info"><span class="info-label">' + label + '</span><span>' + displayValue(value) + '</span></p>';
}

function setSessionForApplication(item) {
  sessionStorage.setItem('selectedApp', item.appId);
  sessionStorage.setItem('approvedApp', item.appId);
  sessionStorage.setItem('businessName', item.businessName);
  sessionStorage.setItem('tradeCategory', item.type);
  sessionStorage.setItem('address', item.address);
  sessionStorage.setItem('ownerName', item.ownerName);
  if (item.inspectionDate) sessionStorage.setItem('inspectionDate', item.inspectionDate);
  if (item.inspectionTime) sessionStorage.setItem('inspectionTime', item.inspectionTime);
}

function renderEmpty(container) {
  container.innerHTML =
    '<div class="empty-state">' +
      '<h3>No inspections ready</h3>' +
      '<p>Verified and inspection scheduled applications assigned to you will appear here.</p>' +
    '</div>';
}

function renderCards(data) {
  var container = document.getElementById('inspectionCards');
  var countText = document.getElementById('countText');
  if (!container) return;

  container.innerHTML = '';
  if (countText) countText.textContent = 'Showing ' + data.length + ' inspection(s)';

  if (!data.length) {
    renderEmpty(container);
    return;
  }

  data.forEach(function(item) {
    var card = document.createElement('div');
    var action = actionForStatus(item.status);
    var scheduleText = item.inspectionDate ?
      item.inspectionDate + (item.inspectionTime ? ' at ' + item.inspectionTime : '') :
      'Not scheduled yet';

    card.className = 'inspection-card blue';
    card.innerHTML =
      '<div class="card-heading">' +
        '<div>' +
          '<h3>' + displayValue(item.businessName) + '</h3>' +
          '<small>' + displayValue(item.appId) + '</small>' +
        '</div>' +
        '<span class="status-pill ' + statusClass(item.status) + '">' + displayValue(item.status) + '</span>' +
      '</div>' +
      '<div class="details-grid">' +
        detailRow('Applicant', item.ownerName) +
        detailRow('Trade Type', item.type) +
        detailRow('Address', item.address) +
        detailRow('Scheduled', scheduleText) +
        detailRow('Submitted', item.submittedDate) +
        detailRow('Phone', item.phone) +
        detailRow('Email', item.email) +
      '</div>' +
      '<button class="start-btn" data-id="' + escapeHtml(item.appId) + '">' + action.label + '</button>';
    container.appendChild(card);
  });

  document.querySelectorAll('.start-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var appId = this.getAttribute('data-id');
      var item = data.find(function(app) { return app.appId === appId; });
      var action = actionForStatus(item ? item.status : '');
      if (item) setSessionForApplication(item);
      window.location.href = action.target;
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var container = document.getElementById('inspectionCards');
  if (!container) return;

  var sources = []
    .concat(systemRecordInspectionApps)
    .concat((window.TRADEZO && TRADEZO.inspections) ? TRADEZO.inspections : [])
    .concat((window.TRADEZO && TRADEZO.applications) ? TRADEZO.applications : [])
    .concat(safeArray('applications'))
    .concat(safeArray('tz_submitted_apps'));

  var data = mergeByApplicationId(sources).filter(function(app) {
    var id = getAppId(app);
    return id &&
      isRecordableStatus(app.status) &&
      !isCompletedInspection(id) &&
      isAssignedToVisibleOfficer(app);
  }).map(toInspectionCard);

  data = window.TRADEZO && typeof TRADEZO.sortFreshFirst === 'function'
    ? TRADEZO.sortFreshFirst(data)
    : data.reverse();
  renderCards(data);

  var searchEl = document.getElementById('searchInspection');
  if (searchEl) {
    searchEl.addEventListener('input', function() {
      var val = this.value.toLowerCase().trim();
      var filtered = data.filter(function(item) {
        return [
          item.businessName,
          item.appId,
          item.ownerName,
          item.type,
          item.address,
          item.status
        ].join(' ').toLowerCase().includes(val);
      });
      renderCards(filtered);
    });
  }
});
