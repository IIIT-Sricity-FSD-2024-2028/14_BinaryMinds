// fo_connected/fodashboard/db.js
// Shows assigned applications with workflow statuses for the logged-in FO.

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

function firstValue() {
  for (var i = 0; i < arguments.length; i++) {
    var value = arguments[i];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
}

function uniqueNormalizedValues(item, fields) {
  var seen = {};
  var values = [];
  fields.forEach(function(field) {
    var value = normalizeText(item && item[field]);
    if (!value || seen[value]) return;
    seen[value] = true;
    values.push(value);
  });
  return values;
}

function getAppId(item) {
  return item.appId || item.id || item.appRef || item.applicationId || '';
}

var assignmentFields = [
  'assignedFO',
  'assignedOfficerId',
  'fieldOfficerId',
  'field_officer_id',
  'fieldOfficerEmail',
  'assignedEmail',
  'fieldOfficerName',
  'foName',
  'assignedTo',
  'assignedFieldOfficer',
  'fieldOfficer'
];

function parseTimestamp(value) {
  if (!value) return 0;
  var parsed = new Date(value);
  return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function assignmentTimestamp(item) {
  return Math.max(
    parseTimestamp(item && item.assignedAt),
    parseTimestamp(item && item.assignmentUpdatedAt),
    parseTimestamp(item && item.updatedAt),
    parseTimestamp(item && item.updated_at),
    parseTimestamp(item && item.lastUpdated)
  );
}

function hasAssignmentShape(item) {
  return assignmentFields.some(function(field) {
    return item && Object.prototype.hasOwnProperty.call(item, field);
  });
}

function hasNonBlankAssignment(item) {
  return identityValues(item).length > 0;
}

function chooseAssignmentSource(existing, incoming) {
  var existingHasShape = hasAssignmentShape(existing);
  var incomingHasShape = hasAssignmentShape(incoming);
  if (!existingHasShape && !incomingHasShape) return null;
  if (!existingHasShape) return incoming;
  if (!incomingHasShape) return existing;

  var existingHasAssignment = hasNonBlankAssignment(existing);
  var incomingHasAssignment = hasNonBlankAssignment(incoming);
  var existingTime = assignmentTimestamp(existing);
  var incomingTime = assignmentTimestamp(incoming);

  if (existingHasAssignment && incomingHasAssignment) {
    return incomingTime >= existingTime ? incoming : existing;
  }

  if (!existingHasAssignment && incomingHasAssignment) return incoming;

  if (existingHasAssignment && !incomingHasAssignment) {
    return incomingTime > existingTime ? incoming : existing;
  }

  return incomingTime >= existingTime ? incoming : existing;
}

function currentOfficer() {
  if (window.foCurrentOfficer) return window.foCurrentOfficer();
  try { return JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch(e) { return {}; }
}

function identityValues(item) {
  return [
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
  ].map(normalizeText).filter(function(value) {
    return value && value !== 'undefined' && value !== 'null' && value !== 'n/a';
  });
}

function applicationIdentityValues(item) {
  return [
    item && item.appId,
    item && item.id,
    item && item.appRef,
    item && item.applicationId,
    item && item.application_id,
    item && item.backendId
  ].map(normalizeText).filter(function(value) {
    return value && value !== 'undefined' && value !== 'null';
  });
}

function applicationFingerprints(item) {
  var owners = uniqueNormalizedValues(item, [
    'email', 'applicantEmail', 'ownerEmail', 'applicant_email', 'userEmail',
    'phone', 'applicant_phone', 'mobile',
    'aadhaar', 'aadhaar_number',
    'applicantName', 'applicant', 'fullName', 'full_name', 'ownerName', 'name'
  ]);
  var business = normalizeText(firstValue(
    item && item.businessName,
    item && item.business,
    item && item.business_name,
    item && item.companyName,
    item && item.tradeName
  ));

  if (!owners.length || !business) return [];
  return owners.map(function(owner) {
    return ['basic', owner, business].join('|');
  });
}

function mergeApplicationRecord(existing, incoming) {
  var merged = Object.assign({}, existing || {}, incoming || {});
  var assignmentSource = chooseAssignmentSource(existing, incoming);

  if (assignmentSource) {
    assignmentFields.forEach(function(field) {
      merged[field] = assignmentSource[field] || '';
    });
    merged.assignedAt = assignmentSource.assignedAt || merged.assignedAt || '';
    merged.updatedAt = assignmentSource.updatedAt || assignmentSource.updated_at || merged.updatedAt || '';
  }

  return Object.assign(merged, {
    id: (incoming && incoming.id) || (existing && existing.id) || getAppId(incoming) || getAppId(existing),
    appId: getAppId(incoming) || getAppId(existing),
    appRef: (incoming && incoming.appRef) || (existing && existing.appRef) || getAppId(incoming) || getAppId(existing)
  });
}

function isAssignedToCurrentOfficer(item) {
  if (window.foIsAssignedToCurrentOfficer) {
    return window.foIsAssignedToCurrentOfficer(item);
  }

  var values = identityValues(item);
  if (!values.length) return false;

  var officer = currentOfficer();
  var keys = [
    officer.id,
    officer.empId,
    officer.backendUserId,
    officer.name,
    officer.email
  ].map(normalizeText).filter(function(v) { return v.length > 0; });

  var validValues = values.filter(function(v) { return v.length > 0; });
  if (validValues.length === 0 || keys.length === 0) return false;

  return validValues.some(function(value) {
    return keys.some(function(key) {
      return value === key;
    });
  });
}

function reportsByApplication() {
  var byId = {};
  safeArray('tz_inspection_reports').forEach(function(report) {
    var id = getAppId(report);
    if (id) byId[id] = report;
  });
  return byId;
}

function mergeApplications(sources, reports) {
  var byId = {};
  var idIndex = {};
  var fingerprintIndex = {};
  var order = [];

  function remember(app, key) {
    applicationIdentityValues(app).forEach(function(id) {
      idIndex[id] = key;
    });
    applicationFingerprints(app).forEach(function(fingerprint) {
      fingerprintIndex[fingerprint] = key;
    });
  }

  function findKey(app) {
    var ids = applicationIdentityValues(app);
    for (var i = 0; i < ids.length; i++) {
      if (idIndex[ids[i]]) return idIndex[ids[i]];
    }
    var fingerprints = applicationFingerprints(app);
    for (var j = 0; j < fingerprints.length; j++) {
      if (fingerprintIndex[fingerprints[j]]) return fingerprintIndex[fingerprints[j]];
    }
    return getAppId(app);
  }

  sources.forEach(function(app) {
    if (!app) return;
    var id = getAppId(app);
    if (!id) return;
    var key = findKey(app);
    if (!byId[key]) {
      byId[key] = {};
      order.push(key);
    }
    byId[key] = mergeApplicationRecord(byId[key], app);
    remember(byId[key], key);
  });

  Object.keys(reports).forEach(function(id) {
    var key = findKey(reports[id] || { id: id, appId: id });
    if (!byId[key]) {
      byId[key] = { id: id, appId: id };
      order.push(key);
    }
    byId[key] = Object.assign({}, byId[key], reports[id], {
      id: byId[key].id || id,
      appId: id,
      dashboardStatus: 'Inspection Recorded'
    });
    remember(byId[key], key);
  });

  return order.map(function(id) { return byId[id]; });
}

function workflowStatus(app, reports) {
  var id = getAppId(app);
  var raw = normalizeText(app.status || app.application_status);

  if ((id && reports[id]) ||
      raw === 'inspection recorded' ||
      raw === 'inspection completed' ||
      raw === 'completed') {
    return 'Inspection Recorded';
  }

  if (raw === 'verified' ||
      raw === 'documents verified' ||
      raw === 'scheduled' ||
      raw === 'inspection scheduled' ||
      raw === 'pending inspection') {
    return 'Verified';
  }

  if (raw === 'rejected') return 'Rejected';
  if (raw === 'license issued' || raw === 'licensed' || raw === 'approved') return 'Inspection Recorded';

  return 'Assigned';
}

function statusClass(status) {
  var normalized = normalizeText(status);
  if (normalized === 'assigned') return 'status-assigned';
  if (normalized === 'verified') return 'status-verified';
  if (normalized === 'inspection recorded') return 'status-recorded';
  if (normalized === 'rejected') return 'status-rejected';
  return 'status-assigned';
}

function enrichForDashboard(apps, reports) {
  return apps.map(function(app) {
    var status = workflowStatus(app, reports);
    var addressParts = [
      firstValue(app.shopAddress, app.shop_address, app.address),
      app.city,
      app.district,
      app.state,
      app.pincode
    ].filter(function(value, index, arr) {
      var normalized = normalizeText(value);
      return normalized && arr.findIndex(function(item) { return normalizeText(item) === normalized; }) === index;
    });

    return Object.assign({}, app, {
      applicantName: firstValue(app.applicantName, app.applicant, app.ownerName, app.full_name, app.name, 'N/A'),
      businessName: firstValue(app.businessName, app.business, app.business_name, 'N/A'),
      tradeCategory: firstValue(app.tradeCategory, app.licenseType, app.category, app.businessType, app.business_type, 'N/A'),
      submittedDate: firstValue(app.submittedDate, app.submitted_at, app.date, app.createdAt, app.created_at, 'N/A'),
      phone: firstValue(app.phone, app.applicant_phone, app.mobile, app.contact, 'N/A'),
      email: firstValue(app.email, app.applicantEmail, 'N/A'),
      shopAddress: addressParts.length ? addressParts.join(', ') : firstValue(app.shopAddress, app.shop_address, app.address, 'N/A'),
      address: addressParts.length ? addressParts.join(', ') : firstValue(app.address, app.shopAddress, app.shop_address, 'N/A'),
      dashboardStatus: status,
      dashboardStatusClass: statusClass(status)
    });
  });
}

function getAssignedApplications() {
  var reports = reportsByApplication();
  var centralApps = (window.TRADEZO && TRADEZO.applications) ? TRADEZO.applications : [];
  var sources = centralApps
    .concat(safeArray('applications'))
    .concat(safeArray('tradezo_applications'))
    .concat(safeArray('tz_submitted_apps'))
    .concat(safeArray('tz_verification_queue'));
  var merged = mergeApplications(sources, reports);

  var apps = enrichForDashboard(merged.filter(function(app) {
    return isAssignedToCurrentOfficer(app);
  }), reports);

  return window.TRADEZO && typeof TRADEZO.sortFreshFirst === 'function'
    ? TRADEZO.sortFreshFirst(apps)
    : apps.reverse();
}

function renderStats(apps) {
  var cards = document.querySelectorAll('.cards .card h2');
  var assigned = apps.filter(function(app) { return app.dashboardStatus === 'Assigned'; }).length;
  var verified = apps.filter(function(app) { return app.dashboardStatus === 'Verified'; }).length;
  var recorded = apps.filter(function(app) { return app.dashboardStatus === 'Inspection Recorded'; }).length;

  // Dynamic SLA Calculation: Unverified (Assigned) for > 5 days
  var slaAlerts = apps.filter(function(app) {
    if (app.dashboardStatus !== 'Assigned') return false;
    var subDate = app.submittedDate || app.date || app.assignedDate;
    if (!subDate) return false;
    var parsedDate = new Date(subDate);
    if (isNaN(parsedDate.getTime())) return false;
    var diffDays = (new Date() - parsedDate) / (1000 * 60 * 60 * 24);
    return diffDays >= 5;
  }).length;

  if (cards[0]) cards[0].textContent = assigned;
  if (cards[1]) cards[1].textContent = verified;
  if (cards[2]) cards[2].textContent = recorded;
  if (cards[3]) cards[3].textContent = slaAlerts;

  var slaText = document.querySelector('.sla-text p');
  if (slaText) {
    if (slaAlerts === 0) {
      slaText.textContent = 'No applications approaching SLA deadline';
    } else {
      slaText.textContent = slaAlerts + ' application' + (slaAlerts === 1 ? '' : 's') + ' approaching SLA deadline';
    }
  }
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderAssignedTable(apps) {
  var tableBody = document.getElementById('applicationTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  if (apps.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5">No applications assigned to you yet.</td></tr>';
    return;
  }

  var freshApps = window.TRADEZO && typeof TRADEZO.sortFreshFirst === 'function'
    ? TRADEZO.sortFreshFirst(apps.slice())
    : apps.slice().reverse();

  freshApps.forEach(function(app) {
    var id = getAppId(app);
    tableBody.innerHTML +=
      '<tr>' +
        '<td>' + escapeHtml(id) + '</td>' +
        '<td>' + escapeHtml(app.applicantName || app.applicant || app.ownerName || '') + '</td>' +
        '<td>' + escapeHtml(app.businessName || app.business || '') + '</td>' +
        '<td><span class="status-badge ' + app.dashboardStatusClass + '">' + escapeHtml(app.dashboardStatus) + '</span></td>' +
        '<td>' + escapeHtml(app.submittedDate || app.date || app.submitted || '') + '</td>' +
      '</tr>';
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var officer = currentOfficer();
  var welcomeEl = document.querySelector('.welcome-name, .user-name, .user-info b');
  if (welcomeEl && officer.name) welcomeEl.textContent = officer.name;

  var apps = getAssignedApplications();
  renderStats(apps);
  renderAssignedTable(apps);

  var search = document.getElementById('search');
  if (search) {
    search.addEventListener('input', function() {
      var q = this.value.toLowerCase();
      var filtered = apps.filter(function(app) {
        return [
          getAppId(app),
          app.applicantName,
          app.applicant,
          app.businessName,
          app.business,
          app.shopAddress,
          app.address,
          app.dashboardStatus
        ].join(' ').toLowerCase().includes(q);
      });
      renderAssignedTable(filtered);
    });
  }
});
