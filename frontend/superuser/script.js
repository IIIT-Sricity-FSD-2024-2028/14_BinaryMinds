// ============================================================
// script.js — Super User Panel
// Plain JavaScript — No libraries, no frameworks
// ============================================================
 
 
// ============================================================
// MOCK DATA — This acts as our fake database
// ============================================================
 
// List of officers in the system (Clean Initial State)
var defaultFieldOfficers = [];
var users = [];

// List of trade license applications (Clean Initial State)
var applications = [];

// List of issued licenses (Clean Initial State)
var licenses = [];

// Trade categories for System Settings
var categories = [
  { id: 1, name: "Retail",           desc: "Retail trade businesses selling goods directly to consumers",   status: "Active" },
  { id: 2, name: "Wholesale",        desc: "Wholesale trade businesses selling goods in bulk to retailers", status: "Active" },
  { id: 3, name: "Manufacturing",    desc: "Manufacturing businesses producing goods",                      status: "Active" },
  { id: 4, name: "Food & Beverages", desc: "Restaurants, cafes, and food service establishments",          status: "Active" },
  { id: 5, name: "Healthcare",       desc: "Medical and healthcare service providers",                      status: "Active" },
  { id: 6, name: "Construction",     desc: "Construction and building services",                            status: "Inactive" }
];

// Audit log — records every action done in the system
var auditLogs = [];

// Recent activity shown on dashboard
var activityLog = [];

// Default fee values (used when resetting)
var defaultFees = { new: 1200, renewal: 1000 };
var FIELD_OFFICER_DEFAULT_PASSWORD = 'TradeZo@123';
var API_BASE_URL = 'http://localhost:3000/api';
var backendApplications = [];
var backendApplicationsLoaded = false;
var backendApplicationsError = '';

function authenticatedHeaders(extra) {
  var token = sessionStorage.getItem('accessToken') || '';
  return Object.assign({}, extra || {}, token ? { Authorization: 'Bearer ' + token } : {});
}

function fetchBackendApplications() {
  if (!window.fetch) return Promise.resolve();

  return fetch(API_BASE_URL + '/applications', { headers: authenticatedHeaders() })
    .then(function(response) {
      return response.json().catch(function() { return null; }).then(function(payload) {
        if (!response.ok) {
          throw new Error((payload && payload.message) || ('Unable to load applications (' + response.status + ')'));
        }
        if (!payload || !Array.isArray(payload.data)) {
          throw new Error('The server returned an invalid application list.');
        }
        return payload;
      });
    })
    .then(function(payload) {
      backendApplications = payload.data;
      backendApplicationsLoaded = true;
      backendApplicationsError = '';
      refreshDynamicData();

      if (document.getElementById('page-dashboard') && document.getElementById('page-dashboard').classList.contains('active')) {
        renderDashboard();
      }
      if (document.getElementById('page-applications') && document.getElementById('page-applications').classList.contains('active')) {
        renderApplicationStats();
        renderApplications();
      }
    })
    .catch(function(error) {
      backendApplicationsLoaded = false;
      backendApplicationsError = error && error.message ? error.message : 'Unable to load applications.';
      if (document.getElementById('page-applications') && document.getElementById('page-applications').classList.contains('active')) {
        renderApplicationStats();
        renderApplications();
      }
    });
}

function fetchBackendUsers() {
  if (!window.fetch) return Promise.resolve();

  return fetch(API_BASE_URL + '/users', { headers: authenticatedHeaders() })
    .then(function(response) {
      if (!response.ok) throw new Error('Failed to load users');
      return response.json();
    })
    .then(function(payload) {
      var list = Array.isArray(payload) ? payload : (payload && payload.data) || [];
      var deletedEmails = getLocalJson('tz_deleted_officer_emails', []);
      users = list
        .filter(function(u) {
          var r = (u.role || '').toLowerCase().replace(/_/g, ' ');
          var isDeleted = deletedEmails.includes((u.email || '').toLowerCase());
          return !isDeleted && (r === 'field officer' || r === 'fo');
        })
        .map(function(u) {
          return {
            id: u.employee_id || ('FO-' + u.user_id),
            name: u.full_name,
            email: u.email,
            phone: u.phone,
            role: 'Field Officer',
            status: u.status || 'Active',
            empId: u.employee_id || ('FO-' + u.user_id),
            joinDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '2026-01-01',
            backendUserId: u.user_id,
            municipality_id: u.municipality_id
          };
        });

      departmentOfficers = list
        .filter(function(u) {
          var r = (u.role || '').toLowerCase().replace(/_/g, ' ');
          return r === 'department officer' || r === 'do';
        })
        .map(function(u) {
          return {
            id: u.employee_id || ('DO-' + u.user_id),
            name: u.full_name,
            email: u.email,
            phone: u.phone,
            department: u.department || 'Trade License Department',
            startDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '2026-01-01',
            backendUserId: u.user_id,
            municipality_id: u.municipality_id,
            status: u.status || 'Active'
          };
        });

      filteredUsers = users.slice();
      renderUsers();
      renderDepartmentOfficers();
      renderDashboard();
    })
    .catch(function(err) {
      console.warn('Backend users load:', err);
    });
}

function fetchBackendLicenses() {
  if (!window.fetch) return Promise.resolve();

  return fetch(API_BASE_URL + '/licenses', { headers: authenticatedHeaders() })
    .then(function(response) {
      if (!response.ok) throw new Error('Failed to load licenses');
      return response.json();
    })
    .then(function(payload) {
      var list = Array.isArray(payload) ? payload : (payload && payload.data) || [];
      licenses = list.map(function(l) {
        return {
          id: l.license_number,
          business: l.business_name || ('Business #' + l.application_id),
          owner: l.applicant_name || 'Applicant',
          category: l.trade_category || 'Trade',
          issueDate: l.issued_date ? new Date(l.issued_date).toLocaleDateString('en-IN') : 'N/A',
          expiryDate: l.expiry_date ? new Date(l.expiry_date).toLocaleDateString('en-IN') : 'N/A',
          status: l.status || 'Active'
        };
      });
      renderLicenses();
      renderDashboard();
    })
    .catch(function(err) {
      console.warn('Backend licenses load:', err);
    });
}

// Track which user or category is being edited
var editUserId = null;
var editUserEmail = null;
var editCatId  = null;
 
// How many rows to show per page
var rowsPerPage = 6;
 
// Current page numbers
var userPage  = 1;
var appPage   = 1;
var auditPage = 1;

function isFieldOfficerUser(user) {
  if (!user) return false;
  var name = (user.name || user.full_name || '').toLowerCase().trim();
  var email = (user.email || '').toLowerCase().trim();
  var isDepartmentOfficerAccount =
    name === 'anjali mehta' ||
    name === 'rahul gupta' ||
    email === 'admin@deptofficer.com' ||
    email === 'rahul@deptofficer.com';

  var roleStr = (user.role || '').toLowerCase().trim().replace(/_/g, ' ');
  return !isDepartmentOfficerAccount && (roleStr === 'field officer' || roleStr === 'fo' || (!user.role && email.includes('fieldofficer')));
}

function getLocalJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch(e) { return fallback; }
}

function mergeAuditLogEntry(entry) {
  if (!entry) return;
  var normalized = {
    time: entry.time || entry.timestamp || '',
    user: entry.user || entry.user_name || 'System',
    role: entry.role || 'Unknown',
    action: entry.action || 'Update',
    module: entry.module || 'System',
    desc: entry.desc || entry.description || 'Activity recorded',
    ip: entry.ip || entry.ip_address || '127.0.0.1'
  };
  var exists = auditLogs.some(function(existing) {
    return existing.time === normalized.time &&
      existing.user === normalized.user &&
      existing.action === normalized.action &&
      existing.desc === normalized.desc;
  });
  if (!exists) auditLogs.unshift(normalized);
}

function loadPersistedAuditLogs() {
  getLocalJson('tradezo_audit_logs', []).slice().reverse().forEach(function(log) {
    mergeAuditLogEntry(log);
  });
}

function fetchBackendAuditLogs() {
  if (!window.fetch) return Promise.resolve();
  return fetch(API_BASE_URL + '/audit-logs', { headers: authenticatedHeaders() })
    .then(function(response) {
      if (!response.ok) throw new Error('Failed to load backend audit logs');
      return response.json();
    })
    .then(function(payload) {
      var data = Array.isArray(payload) ? payload : (payload && payload.data) || [];
      data.forEach(function(log) {
        mergeAuditLogEntry({
          time: log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : '',
          user: log.user_name,
          role: log.role,
          action: log.action,
          module: log.module,
          desc: log.description,
          ip: log.ip_address
        });
      });
      localStorage.setItem('tradezo_audit_logs', JSON.stringify(auditLogs.slice(0, 200)));
      if (document.getElementById('page-audit') && document.getElementById('page-audit').classList.contains('active')) {
        filterAudit();
      }
    })
    .catch(function() {
      return null;
    });
}

function normalizeFieldOfficerForLogin(user) {
  var loggedIn = {};
  try { loggedIn = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch(e) {}
  var currentMuni = user.municipality_id || user.municipalityId || loggedIn.municipality_id || loggedIn.municipalityId || 'muni-hyd';

  return {
    id: user.id || user.backendUserId || user.user_id || user.empId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: 'field officer',
    password: user.password || user.password_hash || FIELD_OFFICER_DEFAULT_PASSWORD,
    status: user.status || 'Active',
    empId: user.empId || user.id,
    municipality_id: currentMuni,
    joinDate: user.joinDate
  };
}

function upsertByEmail(list, item) {
  var found = false;
  var next = list.map(function(existing) {
    if ((existing.email || '').toLowerCase() === (item.email || '').toLowerCase()) {
      found = true;
      return Object.assign({}, existing, item);
    }
    return existing;
  });
  if (!found) next.push(item);
  return next;
}

function uniqueFieldOfficers(list) {
  var byEmail = {};
  var allSources = (list || []).concat(window.TRADEZO && Array.isArray(TRADEZO.users) ? TRADEZO.users : []).concat(getLocalJson('users', [])).concat(getLocalJson('registeredUsers', []));
  allSources.filter(isFieldOfficerUser).forEach(function(user) {
    var email = (user.email || '').toLowerCase();
    if (!email) return;
    byEmail[email] = Object.assign({}, byEmail[email] || {}, user, {
      role: 'Field Officer',
      name: user.full_name || user.name || (byEmail[email] && byEmail[email].name) || 'Field Officer',
      id: user.user_id || user.id || (byEmail[email] && byEmail[email].id) || '',
      empId: user.employee_id || user.empId || user.id || (byEmail[email] && byEmail[email].empId) || ''
    });
  });
  return Object.keys(byEmail).map(function(email) { return byEmail[email]; });
}

function generateEmployeeId() {
  var loggedIn = {};
  try { loggedIn = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch(e) {}
  var muniId = String(loggedIn.municipality_id || loggedIn.municipalityId || 'muni-hyd').toLowerCase();
  var muniCode = muniId.replace(/^muni-?/i, '').toUpperCase() || 'HYD';
  var prefix = 'FO-' + muniCode + '-';

  var allKnownUsers = users
    .concat(getLocalJson('users', []))
    .concat(getLocalJson('registeredUsers', []));
  var maxId = 0;

  allKnownUsers.forEach(function(user) {
    var rawId = String(user.empId || user.employee_id || user.id || '').toUpperCase();
    if (rawId.indexOf(prefix) === 0) {
      var match = rawId.match(/(\d+)$/);
      if (match) {
        var value = parseInt(match[1], 10);
        if (!isNaN(value) && value > maxId) maxId = value;
      }
    }
  });

  return prefix + String(maxId + 1).padStart(3, '0');
}

function persistFieldOfficerCredentials(user) {
  var loginUser = normalizeFieldOfficerForLogin(user);

  var registered = getLocalJson('registeredUsers', []);
  registered = upsertByEmail(registered, loginUser);
  localStorage.setItem('registeredUsers', JSON.stringify(registered));

  var localUsers = getLocalJson('users', []).filter(isFieldOfficerUser);
  localUsers = upsertByEmail(localUsers, user);
  localStorage.setItem('users', JSON.stringify(localUsers));

  if (window.TRADEZO && window.TRADEZO.users) {
    window.TRADEZO.users = upsertByEmail(window.TRADEZO.users, loginUser);
  }
}

function removeFieldOfficerCredentials(user) {
  var email = (user.email || '').toLowerCase();
  var registered = getLocalJson('registeredUsers', []).filter(function(u) {
    return (u.email || '').toLowerCase() !== email;
  });
  localStorage.setItem('registeredUsers', JSON.stringify(registered));
  if (window.TRADEZO && Array.isArray(window.TRADEZO.users)) {
    window.TRADEZO.users = window.TRADEZO.users.filter(function(tu) {
      return (tu.email || '').toLowerCase() !== email;
    });
  }
}

function syncFieldOfficerToBackend(user) {
  if (!window.fetch) return Promise.resolve(false);

  var password = user.password || user.password_hash || FIELD_OFFICER_DEFAULT_PASSWORD;
  var digits = String(user.phone || '').replace(/\D/g, '');

  return fetch(API_BASE_URL + '/users', {
    method: 'POST',
    headers: authenticatedHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      full_name: user.name,
      email: (user.email || '').toLowerCase(),
      phone: digits,
      employee_id: user.empId || user.employee_id || user.id,
      password_hash: password,
      role: 'field_officer'
    })
  })
  .then(function(response) {
    if (!response.ok) throw new Error('Backend user sync failed');
    return response.json();
  })
  .then(function(created) {
    user.backendUserId = created.user_id;
    user.municipality_id = created.municipality_id;
    persistFieldOfficerCredentials(user);
    return true;
  })
  .catch(function() {
    return false;
  });
}

var departmentOfficers = [];

function parseDate(value) {
  var date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function toDateInputValue(date) {
  return date.toISOString().split('T')[0];
}

function addYears(date, years) {
  var copy = new Date(date.getTime());
  copy.setFullYear(copy.getFullYear() + years);
  return copy;
}

function formatDisplayDate(value) {
  var date = parseDate(value);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function parseActivityDate(value) {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  var parsed = new Date(value);
  if (!isNaN(parsed.getTime())) return parsed;

  var parts = String(value).replace(/,/g, '').split(/\s+/);
  if (parts.length >= 3) {
    var alt = new Date(parts[1] + ' ' + parts[0] + ' ' + parts[2] + (parts[3] ? ' ' + parts.slice(3).join(' ') : ''));
    if (!isNaN(alt.getTime())) return alt;
  }
  return null;
}

function formatActivityDate(value) {
  var date = parseActivityDate(value);
  if (!date) return value || 'Recently';
  var raw = String(value || '');
  var hasTime = raw.indexOf('T') !== -1 || /\d{1,2}:\d{2}/.test(raw) || date.getHours() || date.getMinutes();
  if (hasTime) {
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function activityTimestamp(value, fallbackRank) {
  var date = parseActivityDate(value);
  return date ? date.getTime() : (fallbackRank || 0);
}

function latestActivityValue(item, fields) {
  var latestValue = null;
  var latestTime = 0;
  fields.forEach(function(field) {
    var value = item && item[field];
    var date = parseActivityDate(value);
    if (date && date.getTime() > latestTime) {
      latestTime = date.getTime();
      latestValue = value;
    }
  });
  return latestValue;
}

function firstActivityValue(item, fields) {
  for (var i = 0; i < fields.length; i++) {
    var value = item && item[fields[i]];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
}

function normalizeActivityStatus(value) {
  return String(value || '').toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function activityId(item) {
  return String(firstActivityValue(item, ['appId', 'id', 'appRef', 'applicationId', 'application_id', 'backendId']) || '').trim();
}

function normalizedActivityId(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, '').trim();
}

function applicationIdentityValues(item) {
  var ids = [
    firstActivityValue(item, ['appId']),
    firstActivityValue(item, ['id']),
    firstActivityValue(item, ['appRef']),
    firstActivityValue(item, ['applicationId']),
    firstActivityValue(item, ['application_id']),
    firstActivityValue(item, ['backendId'])
  ];
  var seen = {};
  return ids.map(normalizedActivityId).filter(function(id) {
    if (!id || seen[id]) return false;
    seen[id] = true;
    return true;
  });
}

function normalizedApplicationText(value) {
  return String(value || '').toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function uniqueNormalizedValues(item, fields) {
  var seen = {};
  var values = [];
  fields.forEach(function(field) {
    var value = normalizedApplicationText(item && item[field]);
    if (!value || seen[value]) return;
    seen[value] = true;
    values.push(value);
  });
  return values;
}

function applicationFingerprints(item) {
  var owners = uniqueNormalizedValues(item, [
    'email', 'applicantEmail', 'ownerEmail', 'applicant_email', 'userEmail',
    'phone', 'applicant_phone', 'mobile',
    'aadhaar', 'aadhaar_number',
    'applicantName', 'applicant', 'fullName', 'full_name', 'ownerName', 'name'
  ]);
  var business = normalizedApplicationText(firstActivityValue(item, [
    'businessName', 'business', 'business_name', 'companyName', 'tradeName'
  ]));
  var address = normalizedApplicationText(firstActivityValue(item, [
    'shopAddress', 'shop_address', 'address'
  ]));
  var category = normalizedApplicationText(firstActivityValue(item, [
    'tradeCategory', 'category', 'businessType', 'business_type'
  ]));

  if (!owners.length || !business) return [];
  var seen = {};
  var fingerprints = [];

  owners.forEach(function(owner) {
    [
      ['exact', owner, business, address, category],
      ['address', owner, business, address],
      ['category', owner, business, category],
      ['basic', owner, business]
    ].forEach(function(parts) {
      var fingerprint = parts.join('|');
      if (seen[fingerprint]) return;
      seen[fingerprint] = true;
      fingerprints.push(fingerprint);
    });
  });

  return fingerprints;
}

function applicationFingerprint(item) {
  return applicationFingerprints(item)[0] || '';
}

function sharesApplicationIdentity(a, b) {
  var aIds = applicationIdentityValues(a);
  var bIds = applicationIdentityValues(b);
  if (aIds.some(function(id) { return bIds.indexOf(id) !== -1; })) return true;

  var aFingerprints = applicationFingerprints(a);
  var bFingerprints = applicationFingerprints(b);
  return aFingerprints.some(function(fingerprint) {
    return bFingerprints.indexOf(fingerprint) !== -1;
  });
}

function isBlankActivityValue(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function shouldReplaceApplicationId(currentValue, incomingValue) {
  if (isBlankActivityValue(incomingValue)) return false;
  if (isBlankActivityValue(currentValue)) return true;
  var current = String(currentValue).trim();
  var incoming = String(incomingValue).trim();
  var currentLooksTemporary = /^\d+$/.test(current) || /^APP-/i.test(current);
  var incomingLooksStable = !/^\d+$/.test(incoming) && !/^APP-/i.test(incoming);
  return currentLooksTemporary && incomingLooksStable;
}

function statusRank(status) {
  var map = {
    '': 0,
    pending: 1,
    submitted: 2,
    'pending review': 3,
    assigned: 4,
    verified: 5,
    'documents verified': 6,
    'inspection scheduled': 7,
    'inspection completed': 8,
    'department review': 9,
    approved: 10,
    rejected: 10,
    'license issued': 11
  };
  return map[normalizeActivityStatus(status)] || 1;
}

function mergeApplicationRecord(existing, incoming) {
  var merged = Object.assign({}, existing || {});
  Object.keys(incoming || {}).forEach(function(key) {
    var value = incoming[key];
    if (key === 'id' || key === 'appId' || key === 'appRef') {
      if (shouldReplaceApplicationId(merged[key], value)) merged[key] = value;
      return;
    }
    if (key === 'status') {
      if (statusRank(value) >= statusRank(merged.status)) merged.status = value;
      return;
    }
    if (!isBlankActivityValue(value)) merged[key] = value;
    else if (merged[key] === undefined) merged[key] = value;
  });
  return merged;
}

function isLiveApplicationRecord(item) {
  if (!item) return false;
  if (window.TRADEZO && typeof window.TRADEZO.isDemoRecord === 'function' && window.TRADEZO.isDemoRecord(item)) {
    return false;
  }
  return !!activityId(item);
}

function isAllowedApplicationApplicant(item) {
  return !!item;
}

function isUnassignedApplication(app) {
  return !firstActivityValue(app, [
    'fieldOfficerEmail',
    'assignedEmail',
    'emailAssignedTo',
    'fieldOfficerName',
    'foName',
    'assignedTo',
    'fieldOfficerId',
    'field_officer_id',
    'assignedFO',
    'assignedOfficerId'
  ]);
}

function applicationStatusLabel(value) {
  var normalized = String(value || '').toLowerCase().replace(/_/g, ' ').trim();
  var labels = {
    submitted: 'Submitted',
    assigned: 'Assigned',
    verified: 'Verified',
    'documents uploaded': 'Documents Verified',
    'inspection scheduled': 'Inspection Scheduled',
    'inspection completed': 'Inspection Completed',
    'department review': 'Department Review',
    approved: 'Approved',
    rejected: 'Rejected'
  };
  return labels[normalized] || value || 'Pending';
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function addRecentActivity(list, user, action, time, rank) {
  var eventKey = [user || '', action || '', time || '', rank || ''].join('|').toLowerCase();
  if (list.some(function(item) { return item.eventKey === eventKey; })) return;
  list.push({
    eventKey: eventKey,
    user: user || 'System',
    action: action || 'Updated system activity',
    time: formatActivityDate(time),
    rawTime: time,
    rank: rank || 0
  });
}

function addApplicationActivity(activities, app, index) {
  var appId = activityId(app) || 'N/A';
  var applicant = firstActivityValue(app, ['applicant', 'applicantName', 'ownerName', 'full_name', 'name']) || 'Applicant';
  var business = firstActivityValue(app, ['business', 'businessName', 'business_name', 'companyName']);
  var submittedTime = firstActivityValue(app, ['createdAt', 'created_at', 'updatedAt', 'updated_at', 'submittedDate', 'submitted_at', 'dateSubmitted', 'submissionDate', 'date']);
  var updatedTime = latestActivityValue(app, [
    'updatedDate', 'updatedAt', 'updated_at', 'lastUpdated', 'reviewDate',
    'approvedDate', 'docsVerifiedDate', 'licenseIssueDate'
  ]);
  var appLabel = ' ' + appId + (business ? ' for ' + business : '');

  addRecentActivity(
    activities,
    applicant,
    'Submitted application' + appLabel,
    submittedTime || updatedTime,
    1000 - index
  );

  if (normalizeActivityStatus(app.paymentStatus) === 'paid' || app.paymentRef) {
    addRecentActivity(
      activities,
      applicant,
      'Payment completed for application ' + appId,
      firstActivityValue(app, ['paymentDate', 'paidAt', 'updatedAt', 'updated_at']) || submittedTime,
      1100 - index
    );
  }

  if (Array.isArray(app.docs) && app.docs.length) {
    addRecentActivity(
      activities,
      applicant,
      'Documents uploaded for application ' + appId,
      firstActivityValue(app, ['docsUploadedAt', 'updatedAt', 'updated_at']) || submittedTime,
      1150 - index
    );
  }

  var status = app.status || '';
  var normalizedStatus = normalizeActivityStatus(status);
  if (status && normalizedStatus !== 'pending' && normalizedStatus !== 'submitted') {
    addRecentActivity(
      activities,
      applicant,
      'Application ' + appId + ' status changed to ' + status,
      updatedTime || submittedTime,
      1200 - index
    );
  }

  if (app.inspectionDate) {
    addRecentActivity(
      activities,
      firstActivityValue(app, ['foName', 'fieldOfficerName', 'assignedFO', 'assignedTo']) || 'Field Officer',
      'Inspection scheduled for application ' + appId,
      firstActivityValue(app, ['inspectionScheduledAt', 'updatedAt', 'updated_at']) || app.inspectionDate,
      1250 - index
    );
  }

  if (app.doReview && normalizeActivityStatus(app.doReview) !== 'pending') {
    addRecentActivity(
      activities,
      firstActivityValue(app, ['issuedBy', 'reviewedBy']) || 'Department Officer',
      'Department review ' + String(app.doReview).toLowerCase() + ' for application ' + appId,
      updatedTime || firstActivityValue(app, ['reviewDate', 'updatedAt', 'updated_at']) || submittedTime,
      1300 - index
    );
  }
}

function liveApplicationLookup() {
  var byId = {};
  function remember(app) {
    var id = activityId(app);
    if (!id) return;
    byId[id] = Object.assign({}, byId[id] || {}, app);
  }

  applications.forEach(remember);
  getLocalJson('tz_submitted_apps', []).forEach(remember);
  getLocalJson('applications', []).forEach(remember);
  getLocalJson('tradezo_applications', []).forEach(remember);
  if (window.TRADEZO && Array.isArray(window.TRADEZO.applications)) {
    window.TRADEZO.applications.forEach(remember);
  }
  return byId;
}

function findFieldOfficerByEmail(email) {
  var wanted = String(email || '').toLowerCase().trim();
  if (!wanted) return null;
  return uniqueFieldOfficers(users).find(function(user) {
    return String(user.email || '').toLowerCase().trim() === wanted;
  }) || null;
}

function getAssignableFieldOfficers() {
  var loggedInSu = {};
  try { loggedInSu = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch(e) {}
  var suMuniId = String(loggedInSu.municipality_id || loggedInSu.municipalityId || '').toLowerCase().trim();

  return uniqueFieldOfficers(users).filter(function(officer) {
    if (!suMuniId) return true;
    var officerMuni = String(officer.municipality_id || officer.municipalityId || '').toLowerCase().trim();
    if (!officerMuni) return true;
    return officerMuni === suMuniId;
  }).slice().sort(function(a, b) {
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

function resolveAssignedOfficer(app) {
  if (!app) return null;
  var officerEmail = String(firstActivityValue(app, ['fieldOfficerEmail', 'assignedEmail', 'emailAssignedTo']) || '').toLowerCase().trim();
  var officerId = String(firstActivityValue(app, ['assignedOfficerId', 'fieldOfficerId', 'field_officer_id', 'assignedFO']) || '').toLowerCase().trim();
  var officerName = String(firstActivityValue(app, ['fieldOfficerName', 'foName', 'assignedTo']) || '').toLowerCase().trim();

  var officers = getAssignableFieldOfficers();
  return officers.find(function(o) {
    var oEmail = String(o.email || '').toLowerCase().trim();
    var oId = String(o.id || o.backendUserId || o.user_id || '').toLowerCase().trim();
    var oEmpId = String(o.empId || o.employee_id || '').toLowerCase().trim();
    var oName = String(o.name || o.full_name || '').toLowerCase().trim();

    if (officerEmail && oEmail === officerEmail) return true;
    if (officerId && (oId === officerId || oEmpId === officerId || oEmail === officerId || oName === officerId)) return true;
    if (officerName && (oName === officerName || oEmail === officerName)) return true;
    return false;
  }) || null;
}

function assignmentSelectHtml(app) {
  var assignedOfficer = resolveAssignedOfficer(app);
  var assignedEmail = assignedOfficer ? String(assignedOfficer.email || '').toLowerCase().trim() : '';

  var options = ['<option value="">Unassigned</option>'];
  getAssignableFieldOfficers().forEach(function(officer) {
    var email = String(officer.email || '').toLowerCase().trim();
    var selected = (assignedOfficer && email === assignedEmail) ? ' selected' : '';
    options.push('<option value="' + escapeHtml(officer.email || '') + '"' + selected + '>' + escapeHtml(officer.name || officer.full_name || officer.email || 'Field Officer') + '</option>');
  });
  return '<select class="assign-select" onchange="assignApplication(\'' + escapeHtml(app.id) + '\', this.value)">' + options.join('') + '</select>';
}

function getStoredActivitiesFromLiveSources() {
  var activities = [];
  var appById = liveApplicationLookup();

  getLocalJson('tz_verification_queue', []).forEach(function(item, index) {
    var appId = activityId(item);
    addRecentActivity(
      activities,
      item.applicant || 'Field Officer',
      'Application ' + appId + ' queued for document verification',
      item.createdAt || item.updatedAt || item.submitted || item.submittedDate || item.date,
      800 - index
    );
  });

  getLocalJson('tz_verification_history', []).forEach(function(item, index) {
    var appId = activityId(item);
    addRecentActivity(
      activities,
      'Field Officer',
      'Document verification ' + String(item.decision || 'updated').toLowerCase() + ' for application ' + appId,
      item.decidedOn || item.updatedAt || item.date,
      1350 - index
    );
  });

  var inspectionSources = []
    .concat(window.TRADEZO && Array.isArray(window.TRADEZO.inspections) ? window.TRADEZO.inspections : [])
    .concat(getLocalJson('tz_inspection_reports', []));
  inspectionSources.forEach(function(report, index) {
    var appId = activityId(report);
    if (!appId) return;
    addRecentActivity(
      activities,
      report.foName || report.fieldOfficerName || report.assignedFO || 'Field Officer',
      'Inspection recorded for application ' + appId + (report.result ? ' - ' + report.result : ''),
      report.submittedDate || report.updatedAt || report.updated_at || report.date || report.inspectionDate,
      1400 - index
    );
  });

  getLocalJson('tz_generated_licenses', []).forEach(function(lic, index) {
    var appId = activityId(lic);
    addRecentActivity(
      activities,
      lic.issuedBy || 'Department Officer',
      'License ' + (lic.licenseNo || lic.licenseId || lic.id || 'issued') + ' generated for application ' + appId,
      lic.date || lic.updatedAt || lic.licenseIssueDate || lic.issueDate,
      1500 - index
    );
  });

  Object.keys(localStorage).forEach(function(key, index) {
    if (key.indexOf('doAppStatus_') !== 0) return;
    var appId = key.replace('doAppStatus_', '');
    var status = {};
    try { status = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) {}
    var app = appById[appId] || {};
    var label = status.licenseNo
      ? 'License ' + status.licenseNo + ' issued for application ' + appId
      : 'Department status changed to ' + (status.status || 'updated') + ' for application ' + appId;
    addRecentActivity(
      activities,
      app.issuedBy || app.reviewedBy || 'Department Officer',
      label,
      status.updatedAt || app.updatedAt || app.updated_at || app.licenseIssueDate || app.reviewDate,
      1450 - index
    );
  });

  getLocalJson('helpdesk_tickets', []).forEach(function(ticket, index) {
    addRecentActivity(
      activities,
      ticket.name || ticket.email || 'Applicant',
      'Helpdesk ticket raised' + (ticket.subject ? ': ' + ticket.subject : ''),
      ticket.createdAt || ticket.date,
      700 - index
    );
  });

  var applicantProfile = getLocalJson('applicant_profile_data', {});
  if (applicantProfile && applicantProfile.updatedAt) {
    addRecentActivity(
      activities,
      applicantProfile.fullName || applicantProfile.name || 'Applicant',
      'Applicant profile updated',
      applicantProfile.updatedAt,
      650
    );
  }

  var foProfile = getLocalJson('fo_profile_data', {});
  if (foProfile && foProfile.updatedAt) {
    addRecentActivity(
      activities,
      foProfile.name || 'Field Officer',
      'Field officer profile updated',
      foProfile.updatedAt,
      640
    );
  }

  return activities;
}

function buildDashboardActivity() {
  var activities = [];

  applications.forEach(function(app, index) {
    addApplicationActivity(activities, app, index);
  });

  getStoredActivitiesFromLiveSources().forEach(function(item, index) {
    addRecentActivity(
      activities,
      item.user,
      item.action,
      item.time,
      item.rank || (900 - index)
    );
  });

  licenses.forEach(function(lic, index) {
    var licId = lic.id || lic.licenseNo || lic.licenseId || 'N/A';
    addRecentActivity(
      activities,
      lic.owner || lic.ownerName || 'Department Officer',
      'License issued ' + licId + (lic.business ? ' for ' + lic.business : ''),
      latestActivityValue(lic, ['updatedDate', 'updatedAt', 'issueDate', 'licenseIssueDate', 'createdAt']) || lic.issueDate || lic.licenseIssueDate,
      140 - index
    );
  });

  users.forEach(function(user, index) {
    addRecentActivity(
      activities,
      user.name || 'Field Officer',
      'Field officer account ' + (user.status || 'Active').toLowerCase(),
      latestActivityValue(user, ['updatedDate', 'updatedAt', 'createdAt', 'joinDate']) || user.joinDate || user.createdAt,
      60 - index
    );
  });

  auditLogs.forEach(function(log, index) {
    addRecentActivity(
      activities,
      log.user,
      log.action + ' in ' + log.module + ': ' + log.desc,
      log.time,
      1800 - index
    );
  });

  activities.sort(function(a, b) {
    var byTime = activityTimestamp(b.rawTime, b.rank) - activityTimestamp(a.rawTime, a.rank);
    return byTime || ((b.rank || 0) - (a.rank || 0));
  });

  return activities.slice(0, 8);
}

function generateDepartmentOfficerId() {
  var loggedIn = {};
  try { loggedIn = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch(e) {}
  var muniId = String(loggedIn.municipality_id || loggedIn.municipalityId || 'muni-hyd').toLowerCase();
  var muniCode = muniId.replace(/^muni-?/i, '').toUpperCase() || 'HYD';
  var prefix = 'DO-' + muniCode + '-';

  var maxNum = 0;
  (departmentOfficers || []).forEach(function(officer) {
    var rawId = String(officer.id || officer.empId || '').toUpperCase();
    if (rawId.indexOf(prefix) === 0) {
      var match = rawId.match(/(\d+)$/);
      if (match) {
        var val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxNum) maxNum = val;
      }
    }
  });

  return prefix + String(maxNum + 1).padStart(3, '0');
}

function renderDepartmentOfficers() {
  var emptyCard = document.getElementById('do-empty-card');
  var detailCard = document.getElementById('do-detail-card');
  var actionBtn = document.getElementById('btn-do-action');
  if (!emptyCard || !detailCard) return;

  var activeDO = (departmentOfficers && departmentOfficers.length) ? departmentOfficers[departmentOfficers.length - 1] : null;

  if (!activeDO) {
    detailCard.style.display = 'none';
    emptyCard.style.display = 'block';
    if (actionBtn) actionBtn.textContent = '+ Add Department Officer';
    return;
  }

  emptyCard.style.display = 'none';
  detailCard.style.display = 'block';
  if (actionBtn) actionBtn.textContent = '⟳ Replace Department Officer';

  var nameEl = document.getElementById('do-name');
  var emailEl = document.getElementById('do-email');
  var phoneEl = document.getElementById('do-phone');
  var empidEl = document.getElementById('do-empid');
  var deptEl = document.getElementById('do-department');
  var statusEl = document.getElementById('do-status');

  if (nameEl) nameEl.textContent = activeDO.name || '—';
  if (emailEl) emailEl.textContent = activeDO.email || '—';
  if (phoneEl) phoneEl.textContent = activeDO.phone || '—';
  if (empidEl) empidEl.textContent = activeDO.empId || activeDO.id || '—';
  if (deptEl) deptEl.textContent = activeDO.department || 'Trade License Department';
  if (statusEl) {
    statusEl.textContent = activeDO.status || 'Active';
    statusEl.className = 'badge ' + ((activeDO.status || 'Active').toLowerCase() === 'active' ? 'badge-green' : 'badge-red');
  }
}

function openDepartmentOfficerModal() {
  var activeDO = (departmentOfficers && departmentOfficers.length) ? departmentOfficers[departmentOfficers.length - 1] : null;
  var isReplacing = !!activeDO;

  var titleEl = document.getElementById('modal-dept-title');
  var subEl = document.getElementById('modal-dept-sub');
  var btnEl = document.getElementById('btn-save-department-officer');
  var noteEl = document.getElementById('dept-modal-note');

  if (isReplacing) {
    if (titleEl) titleEl.textContent = 'Replace Department Officer';
    if (subEl) subEl.textContent = 'Replace current active Department Officer (' + activeDO.name + ') with a new officer';
    if (btnEl) btnEl.textContent = 'Replace Department Officer';
    if (noteEl) noteEl.innerHTML = '<strong>Note:</strong> Replacing will deactivate the current officer (<strong>' + activeDO.name + '</strong>) and assign the new officer as the single active Department Officer for this municipality.';
  } else {
    if (titleEl) titleEl.textContent = 'Add Department Officer';
    if (subEl) subEl.textContent = 'Enter the details for this municipality\'s single active Department Officer';
    if (btnEl) btnEl.textContent = 'Add Department Officer';
    if (noteEl) noteEl.innerHTML = '<strong>Rule:</strong> Exactly one active Department Officer is assigned per municipality.';
  }

  clearFields(['dept-name', 'dept-email', 'dept-phone']);
  clearErrors(['err-dept-name', 'err-dept-email', 'err-dept-phone', 'err-dept-empid', 'err-dept-department', 'err-dept-password']);

  var empidInput = document.getElementById('dept-empid');
  if (empidInput) empidInput.value = generateDepartmentOfficerId();

  var deptInput = document.getElementById('dept-department');
  if (deptInput) deptInput.value = activeDO ? (activeDO.department || 'Trade License Department') : 'Trade License Department';

  var passInput = document.getElementById('dept-password');
  if (passInput) passInput.value = 'TradeZo@123';

  openModal('modal-department-officer');
}

function saveDepartmentOfficer() {
  var name = getVal('dept-name');
  var email = getVal('dept-email');
  var phone = getVal('dept-phone');
  var empId = getVal('dept-empid') || generateDepartmentOfficerId();
  var department = getVal('dept-department') || 'Trade License Department';
  var password = getVal('dept-password') || 'TradeZo@123';
  var valid = true;

  clearErrors(['err-dept-name', 'err-dept-email', 'err-dept-phone', 'err-dept-empid', 'err-dept-department', 'err-dept-password']);

  if (!name || name.trim().length < 3) {
    showErr('err-dept-name', 'Full name must be at least 3 characters.');
    valid = false;
  }
  if (!email) {
    showErr('err-dept-email', 'Email is required.');
    valid = false;
  } else if (!validEmail(email)) {
    showErr('err-dept-email', 'Enter a valid email address.');
    valid = false;
  }
  var digits = (phone || '').replace(/\D/g, '');
  if (!phone || digits.length < 10) {
    showErr('err-dept-phone', 'Enter a valid 10-digit phone number.');
    valid = false;
  }
  if (!password || password.length < 6) {
    showErr('err-dept-password', 'Password must be at least 6 characters long.');
    valid = false;
  }

  if (!valid) return;

  var activeDO = (departmentOfficers && departmentOfficers.length) ? departmentOfficers[departmentOfficers.length - 1] : null;
  var isReplacing = !!activeDO;

  var saveBtn = document.getElementById('btn-save-department-officer');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }

  fetch(API_BASE_URL + '/users/department-officer' + (isReplacing ? '/replace' : ''), {
    method: 'POST',
    headers: authenticatedHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      full_name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: digits,
      employee_id: empId.trim(),
      department: department.trim(),
      password: password.trim(),
      replace: isReplacing
    })
  })
  .then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) {
        throw new Error((data && (data.message || data.error)) || 'Failed to save Department Officer');
      }
      return data;
    });
  })
  .then(function(createdUser) {
    closeModal('modal-department-officer');
    showToast((isReplacing ? 'Department Officer replaced successfully!' : 'Department Officer added successfully!') + ' (' + createdUser.email + ')');
    addAuditLog(isReplacing ? 'Replace' : 'Create', 'Users', (isReplacing ? 'Replaced' : 'Created') + ' Department Officer ' + createdUser.email);
    return fetchBackendUsers();
  })
  .catch(function(err) {
    var msg = (err && err.message) ? err.message : 'Failed to save Department Officer.';
    if (msg.toLowerCase().includes('email')) {
      showErr('err-dept-email', msg);
    } else if (msg.toLowerCase().includes('phone')) {
      showErr('err-dept-phone', msg);
    } else if (msg.toLowerCase().includes('employee')) {
      showErr('err-dept-empid', msg);
    } else {
      showToast('Error: ' + msg);
    }
  })
  .finally(function() {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = isReplacing ? 'Replace Department Officer' : 'Save Department Officer';
    }
  });
}
 
// Override with dynamic live data from shared system
function refreshDynamicData() {
  function safeParse(val, fb) { try { return JSON.parse(val) || fb; } catch(e) { return fb; } }
  
  // 1. DYNAMIC USERS
  var deletedEmails = safeParse(localStorage.getItem('tz_deleted_officer_emails'), []);
  var sysUsers = window.TRADEZO && window.TRADEZO.users ? window.TRADEZO.users : [];
  var localUsers = safeParse(localStorage.getItem('users'), []);
  var registeredUsers = safeParse(localStorage.getItem('registeredUsers'), []);
  localUsers = localUsers.filter(isFieldOfficerUser);
  localStorage.setItem('users', JSON.stringify(localUsers));

  var allUsers = defaultFieldOfficers.filter(function(dfo) {
    return !deletedEmails.includes((dfo.email || '').toLowerCase());
  });

  if (Array.isArray(users)) {
    users.forEach(function(u) {
      if (!allUsers.find(function(existing) { return (existing.email || '').toLowerCase() === (u.email || '').toLowerCase(); })) {
        allUsers.push(u);
      }
    });
  }

  registeredUsers.forEach(function(ru) {
     if(!allUsers.find(function(u) { return (u.email || '').toLowerCase() === (ru.email || '').toLowerCase(); })) allUsers.push(ru);
  });
  localUsers.forEach(function(lu) { 
     if(!allUsers.find(function(u) { return (u.email || '').toLowerCase() === (lu.email || '').toLowerCase(); })) allUsers.push(lu);
  });
  sysUsers.forEach(function(su) {
     if(!allUsers.find(function(u) { return (u.email || '').toLowerCase() === (su.email || '').toLowerCase(); })) allUsers.push(su);
  });
  
  var officerUsers = allUsers.filter(function(u) {
     return isFieldOfficerUser(u) && !deletedEmails.includes((u.email || '').toLowerCase());
  });

  if (officerUsers.length > 0) {
    users = officerUsers.map(function(u, i) {
      return {
        id: u.id || u.empId || ('FO-' + (i + 1)),
        name: u.name || u.full_name || 'Unknown',
        email: u.email || 'N/A',
        phone: u.phone || 'N/A',
        role: 'Field Officer',
        status: u.status || 'Active',
        empId: u.empId || u.employee_id || u.id || ('FO-' + (i + 1)),
        joinDate: u.joinDate || u.createdAt || u.created_at || '2025-10-15',
        createdAt: u.createdAt || u.created_at || '',
        updatedAt: u.updatedAt || u.updated_at || u.lastUpdated || '',
        backendUserId: u.backendUserId || u.user_id,
        municipality_id: u.municipality_id
      };
    });
    users = uniqueFieldOfficers(users);
    users.sort(function(a, b) {
      return activityTimestamp(latestActivityValue(b, ['updatedAt', 'createdAt', 'joinDate']), 0) -
             activityTimestamp(latestActivityValue(a, ['updatedAt', 'createdAt', 'joinDate']), 0);
    });
  }

  // 2. DYNAMIC APPLICATIONS
  var sysApps = window.TRADEZO && window.TRADEZO.applications ? window.TRADEZO.applications : [];
  var localApps = safeParse(localStorage.getItem('tz_submitted_apps'), []);
  var legacyApps = safeParse(localStorage.getItem('applications'), []);
  var tradezoApps = safeParse(localStorage.getItem('tradezo_applications'), []);
  var allApps = [];
  var appIdIndex = {};
  var appFingerprintIndex = {};

  function indexApplication(app, index) {
    applicationIdentityValues(app).forEach(function(id) {
      appIdIndex[id] = index;
    });
    applicationFingerprints(app).forEach(function(fingerprint) {
      appFingerprintIndex[fingerprint] = index;
    });
  }

  function findExistingApplicationIndex(app) {
    var ids = applicationIdentityValues(app);
    for (var i = 0; i < ids.length; i++) {
      if (appIdIndex[ids[i]] !== undefined) return appIdIndex[ids[i]];
    }
    var fingerprints = applicationFingerprints(app);
    for (var j = 0; j < fingerprints.length; j++) {
      if (appFingerprintIndex[fingerprints[j]] !== undefined) {
        return appFingerprintIndex[fingerprints[j]];
      }
    }
    return -1;
  }

   var loggedInSu = {};
   try { loggedInSu = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch(e){}
   var suMuniId = loggedInSu.municipality_id || loggedInSu.municipalityId || '';

   var applicationSources = backendApplicationsLoaded
     ? backendApplications
     : sysApps.concat(localApps).concat(legacyApps).concat(tradezoApps);

   if (suMuniId && window.TRADEZO && typeof TRADEZO.isAllowedForTenant === 'function') {
     applicationSources = applicationSources.filter(function(app) {
       return TRADEZO.isAllowedForTenant(app, suMuniId);
     });
   }

   applicationSources.forEach(function(la) {
     if (!isLiveApplicationRecord(la)) return;
     if (!isAllowedApplicationApplicant(la)) return;
     var existingIndex = findExistingApplicationIndex(la);
     if (existingIndex === -1) {
       allApps.push(la);
       indexApplication(la, allApps.length - 1);
     } else {
       allApps[existingIndex] = mergeApplicationRecord(allApps[existingIndex], la);
       indexApplication(allApps[existingIndex], existingIndex);
     }
  });
  applications = [];
  if (allApps.length > 0) {
    applications = allApps.map(function(a) {
      var submittedDate = a.submittedDate || a.submitted_at || a.date || a.createdAt || a.created_at || '';
      return {
        id: a.application_ref || a.application_id || a.id || a.appId || a.appRef || 'N/A',
        applicant: a.applicantName || a.applicant || a.fullName || a.full_name || a.ownerName || a.name || 'Unknown',
        business: a.businessName || a.business || a.business_name || 'N/A',
        category: a.tradeCategory || a.category || a.businessType || a.business_type || 'N/A',
        date: submittedDate,
        submittedDate: submittedDate,
        updatedDate: a.updatedDate || a.updatedAt || a.updated_at || a.lastUpdated || a.reviewDate || a.approvedDate || '',
        createdAt: a.createdAt || a.created_at || '',
        status: applicationStatusLabel(a.status || a.application_status || 'Pending'),
        paymentStatus: a.paymentStatus || '',
        paymentRef: a.paymentRef || '',
        paymentDate: a.paymentDate || '',
        docs: a.docs || [],
        inspectionDate: a.inspectionDate || '',
        inspectionTime: a.inspectionTime || '',
        inspectionScheduledAt: a.inspectionScheduledAt || '',
        backendId: a.application_id || a.backendId || a.id || null,
        application_id: a.application_id || a.backendId || a.id || null,
        assignedOfficerId: a.assignedOfficerId || a.assignedFO || a.fieldOfficerId || '',
        assignedFO: a.assignedFO || a.assignedOfficerId || '',
        fieldOfficerId: a.fieldOfficerId || a.field_officer_id || a.assignedOfficerId || '',
        fieldOfficerEmail: a.fieldOfficerEmail || a.assignedEmail || '',
        fieldOfficerName: a.fieldOfficerName || a.foName || a.assignedTo || '',
        doReview: a.doReview || '',
        reviewDate: a.reviewDate || '',
        approvedDate: a.approvedDate || '',
        licenseIssueDate: a.licenseIssueDate || '',
        issuedBy: a.issuedBy || '',
        address: a.shopAddress || a.shop_address || a.address || 'N/A',
        phone: a.phone || a.applicant_phone || 'N/A',
        applicant_id: a.applicant_id || a.applicantId || null,
        email: a.email || a.applicant_email || a.applicantEmail || (function() {
          var allUsers = (users || []).concat(window.TRADEZO && Array.isArray(TRADEZO.users) ? TRADEZO.users : []).concat(getLocalJson('users', [])).concat(getLocalJson('registeredUsers', []));
          var targetId = a.applicant_id || a.applicantId;
          if (targetId) {
            var u = allUsers.find(function(user) { return String(user.id || user.user_id || user.backendUserId) === String(targetId); });
            if (u && u.email) return u.email;
          }
          var applicantName = a.applicantName || a.applicant || a.fullName || a.full_name || '';
          if (applicantName) {
            var uByName = allUsers.find(function(user) { return (user.name || user.full_name || '').toLowerCase() === applicantName.toLowerCase(); });
            if (uByName && uByName.email) return uByName.email;
          }
          return 'N/A';
        })()
      };
    });
    applications.sort(function(a, b) {
      return activityTimestamp(latestActivityValue(b, ['updatedDate', 'createdAt', 'submittedDate', 'date']), 0) -
             activityTimestamp(latestActivityValue(a, ['updatedDate', 'createdAt', 'submittedDate', 'date']), 0);
    });
    filteredApps = applications.slice();
  } else {
    filteredApps = [];
  }

  // 3. DYNAMIC LICENSES
  var sysLics = window.TRADEZO && window.TRADEZO.licenses ? window.TRADEZO.licenses : [];
  var localLics = safeParse(localStorage.getItem('tz_generated_licenses'), []);
  var allLics = sysLics.slice();
  localLics.forEach(function(ll) {
     if(!allLics.find(function(l) { return l.id === ll.id; })) allLics.push(ll);
  });
  if (allLics.length > 0) {
    licenses = allLics.map(function(l) {
      var issueDate = l.issueDate || l.licenseIssueDate || l.issued_date || l.createdAt || l.created_at || '';
      return {
        id: l.licenseNo || l.licenseId || l.id || 'N/A',
        business: l.businessName || l.business || 'N/A',
        owner: l.ownerName || l.applicantName || l.owner || 'N/A',
        category: typeof l.tradeCategory === 'string' ? l.tradeCategory : (typeof l.category === 'string' ? l.category : 'N/A'),
        issueDate: issueDate,
        licenseIssueDate: issueDate,
        updatedDate: l.updatedDate || l.updatedAt || l.updated_at || l.lastUpdated || '',
        createdAt: l.createdAt || l.created_at || '',
        expiryDate: l.expiryDate || new Date().toLocaleDateString(),
        status: l.status || 'Active'
      };
    });
    licenses.sort(function(a, b) {
      return activityTimestamp(latestActivityValue(b, ['updatedDate', 'createdAt', 'issueDate', 'licenseIssueDate']), 0) -
             activityTimestamp(latestActivityValue(a, ['updatedDate', 'createdAt', 'issueDate', 'licenseIssueDate']), 0);
    });
  }

  loadPersistedAuditLogs();
  filteredUsers = uniqueFieldOfficers(users);
  filteredApps = applications.slice();
  filteredAudit = auditLogs.slice();
}

refreshDynamicData();

// Filtered arrays — updated on search/filter
users = uniqueFieldOfficers(users);
var filteredUsers = users.slice();
var filteredApps  = applications.slice();
var filteredAudit = auditLogs.slice();
 
 
// ============================================================
// NAVIGATION — Switch between sidebar pages
// ============================================================
 
function showPage(pageName, clickedLink) {
  refreshDynamicData();
 
  // Hide all pages
  var allPages = document.querySelectorAll('.page');
  for (var i = 0; i < allPages.length; i++) {
    allPages[i].classList.remove('active');
  }
 
  // Remove active from all nav links
  var allLinks = document.querySelectorAll('.nav-link');
  for (var j = 0; j < allLinks.length; j++) {
    allLinks[j].classList.remove('active');
  }
 
  // Show selected page
  document.getElementById('page-' + pageName).classList.add('active');
 
  // Highlight clicked nav link
  if (clickedLink) {
    clickedLink.classList.add('active');
  }
 
  // Load data for the selected page
  if (pageName === 'dashboard')       { renderDashboard(); fetchBackendApplications(); fetchBackendUsers(); }
  if (pageName === 'user-management') { renderUsers(); fetchBackendUsers(); }
  if (pageName === 'department-officers') { renderDepartmentOfficers(); fetchBackendUsers(); }
  if (pageName === 'applications')    { renderApplicationStats(); renderApplications(); fetchBackendApplications(); }
  
  if (pageName === 'settings')        renderCategories();
  if (pageName === 'audit')           { loadPersistedAuditLogs(); filterAudit(); fetchBackendAuditLogs(); }
}
 
 
// ============================================================
// DASHBOARD
// ============================================================
 
function renderDashboard() {
  refreshDynamicData();
  var tbody = document.getElementById('activity-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var totalUsersEl = document.getElementById('dashboard-total-users');
  var pendingAppsEl = document.getElementById('dashboard-pending-apps');
  var issuedLicensesEl = document.getElementById('dashboard-issued-licenses');
  if (totalUsersEl) totalUsersEl.textContent = users.length + departmentOfficers.length;
  if (pendingAppsEl) {
    pendingAppsEl.textContent = applications.filter(function(app) {
      var status = (app.status || '').toLowerCase();
      return status === 'pending' || status === 'submitted' || status === 'under review' || status === 'pending review';
    }).length;
  }
  if (issuedLicensesEl) issuedLicensesEl.textContent = licenses.length;

  activityLog = buildDashboardActivity();

  if (!activityLog.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="3">No recent activity found.</td></tr>';
    return;
  }

  for (var i = 0; i < activityLog.length; i++) {
    var item    = activityLog[i];
    var initial = (item.user || 'S').charAt(0);
 
    tbody.innerHTML +=
      '<tr>' +
        '<td><span class="avatar-circle">' + initial + '</span> ' + item.user + '</td>' +
        '<td>' + item.action + '</td>' +
        '<td>' + item.time + '</td>' +
      '</tr>';
  }
}
 
 
// ============================================================
// FIELD OFFICER MANAGEMENT
// ============================================================
 
function renderUsers() {
  var tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '';

  users = uniqueFieldOfficers(users);
  filteredUsers = uniqueFieldOfficers(filteredUsers);
  if ((userPage - 1) * rowsPerPage >= filteredUsers.length) userPage = 1;
 
  // Get rows for the current page
  var start    = (userPage - 1) * rowsPerPage;
  var end      = start + rowsPerPage;
  var pageData = filteredUsers.slice(start, end);
 
  if (pageData.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No users found.</td></tr>';
  } else {
    for (var i = 0; i < pageData.length; i++) {
      var u       = pageData[i];
      var initial = u.name.charAt(0);
 
      var roleBadge = 'badge-blue';
 
      var statBadge = u.status === 'Active' ? 'badge-green' : 'badge-grey';
 
      tbody.innerHTML +=
        '<tr>' +
          '<td>' + u.id + '</td>' +
          '<td><div class="name-cell"><span class="avatar-circle">' + initial + '</span>' + u.name + '</div></td>' +
          '<td>' + u.email + '</td>' +
          '<td><span class="badge ' + roleBadge + '">' + u.role + '</span></td>' +
          '<td><span class="badge ' + statBadge + '">' + u.status + '</span></td>' +
          '<td>' +
            '<div class="action-btns">' +
              '<button class="btn-sm btn-edit"   onclick="openEditModalByEmail(\'' + encodeURIComponent(u.email) + '\')">&#9998; Edit</button>' +
              '<button class="btn-sm btn-delete" onclick="deleteUser(\'' + encodeURIComponent(u.id || u.empId || u.email) + '\')">&#128465; Delete</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
    }
  }
 
  // Update summary counts
  document.getElementById('total-users').textContent   = filteredUsers.length;
  document.getElementById('active-users').textContent  = filteredUsers.filter(function(u) { return u.status === 'Active'; }).length;
  document.getElementById('officer-count').textContent = filteredUsers.length;
 
  renderPagination('users-pagination', filteredUsers.length, userPage, function(p) {
    userPage = p;
    renderUsers();
  });
}
 
function searchUsers(searchValue) {
  var q = searchValue.toLowerCase();
  users = uniqueFieldOfficers(users);
  filteredUsers = users.filter(function(u) {
    return u.name.toLowerCase().includes(q)  ||
           u.email.toLowerCase().includes(q) ||
           u.id.toLowerCase().includes(q)    ||
           u.role.toLowerCase().includes(q);
  });
  userPage = 1;
  renderUsers();
}
 
function openAddModal() {
  clearFields(['add-name', 'add-email', 'add-phone', 'add-password', 'add-role', 'add-status', 'add-date']);
  var roleEl = document.getElementById('add-role');
  if (roleEl) roleEl.value = 'Field Officer';
  var passEl = document.getElementById('add-password');
  if (passEl) passEl.value = FIELD_OFFICER_DEFAULT_PASSWORD;
  var statEl = document.getElementById('add-status');
  if (statEl) statEl.value = 'Active';
  var dateEl = document.getElementById('add-date');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];

  clearErrors(['err-add-name', 'err-add-email', 'err-add-phone', 'err-add-password', 'err-add-role', 'err-add-status', 'err-add-date']);
  openModal('modal-add');
}
 
async function addOfficer() {
  var name   = getVal('add-name');
  var email  = getVal('add-email');
  var phone  = getVal('add-phone');
  var passEl = document.getElementById('add-password');
  var password = (passEl ? passEl.value : '').trim() || FIELD_OFFICER_DEFAULT_PASSWORD;
  var role   = 'Field Officer';
  var status = getVal('add-status') || 'Active';
  var date   = getVal('add-date');
  var valid  = true;
 
  clearErrors(['err-add-name', 'err-add-email', 'err-add-phone', 'err-add-password', 'err-add-role', 'err-add-status', 'err-add-date']);
 
  // Name validation
  if (!name || /^0+$/.test(name)) {
    showErr('err-add-name', /^0+$/.test(name) ? 'Invalid input.' : 'Full name is required.'); valid = false;
  } else if (name.length < 3) {
    showErr('err-add-name', 'Name must be at least 3 characters.'); valid = false;
  }
 
  // Email validation
  if (!email) {
    showErr('err-add-email', 'Email is required.'); valid = false;
  } else if (!validEmail(email)) {
    showErr('err-add-email', 'Enter a valid email address.'); valid = false;
  } else if (users.find(function(u) { return (u.email || '').toLowerCase() === email.toLowerCase(); })) {
    showErr('err-add-email', 'This email already exists in the system.'); valid = false;
  }
 
  // Phone validation
  var digits = phone.replace(/\D/g, '');
  if (!phone || /^0+$/.test(digits)) {
    showErr('err-add-phone', 'Phone number is required.'); valid = false;
  } else if (digits.length !== 10) {
    showErr('err-add-phone', 'Enter a valid 10-digit phone number.'); valid = false;
  }

  // Password validation
  if (!password || password.length < 6) {
    showErr('err-add-password', 'Password must be at least 6 characters.'); valid = false;
  }
 
  if (!status) { showErr('err-add-status', 'Please select a status.'); valid = false; }
  if (!date) { showErr('err-add-date', 'Joining date is required.'); valid = false; }
 
  if (!valid) return;

  var saveBtn = document.getElementById('btn-save-officer');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Adding...';
  }

  try {
    var response = await fetch(API_BASE_URL + '/users', {
      method: 'POST',
      headers: authenticatedHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        full_name: name,
        email: email.toLowerCase(),
        phone: digits,
        password_hash: password,
        role: 'field_officer'
      })
    });

    var result = await response.json().catch(function() { return {}; });

    if (!response.ok) {
      if (response.status === 401) {
        showErr('err-add-email', 'Session expired. Please sign out and sign in again.');
        showToast('Your session has expired. Please sign out and log back in.');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Add Field Officer';
        }
        return;
      }
      var msg = Array.isArray(result.message) ? result.message[0] : (result.message || 'Failed to create officer on server.');
      if (msg.toLowerCase().includes('email')) {
        showErr('err-add-email', msg);
      } else if (msg.toLowerCase().includes('phone')) {
        showErr('err-add-phone', msg);
      } else {
        showErr('err-add-email', msg);
      }
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Add Field Officer';
      }
      return;
    }

    var createdUser = result;
    var generatedEmpId = createdUser.employee_id || ('FO-' + createdUser.user_id);
    var newUserObj = {
      id: generatedEmpId,
      name: createdUser.full_name || name,
      email: createdUser.email || email.toLowerCase(),
      phone: createdUser.phone || digits,
      role: 'Field Officer',
      status: status,
      empId: generatedEmpId,
      joinDate: date,
      backendUserId: createdUser.user_id,
      municipality_id: createdUser.municipality_id,
      password: password,
      password_hash: password
    };

    users.push(newUserObj);
    filteredUsers = users.slice();
    persistFieldOfficerCredentials(newUserObj);

    addAuditLog('Create', 'Users', 'Added new officer ' + name + ' (' + generatedEmpId + ')');
    closeModal('modal-add');
    renderUsers();
    showToast('Field Officer added successfully. Employee ID: ' + generatedEmpId);

    await fetchBackendUsers();
  } catch (err) {
    console.error('Officer creation error:', err);
    showErr('err-add-email', 'Network error connecting to backend server.');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Add Field Officer';
    }
  }
}
 
function openEditModal(userId) {
  var user = users.find(function(u) { return u.id === userId; });
  if (!user) return;
  openEditModalForUser(user);
}

function openEditModalByEmail(encodedEmail) {
  var email = decodeURIComponent(encodedEmail || '').toLowerCase();
  var user = users.find(function(u) { return (u.email || '').toLowerCase() === email; });
  if (!user) return;
  openEditModalForUser(user);
}
 
function openEditModalForUser(user) {
  editUserId = user.id;
  editUserEmail = user.email;
  document.getElementById('edit-id').value     = user.id;
  document.getElementById('edit-name').value   = user.name;
  document.getElementById('edit-email').value  = user.email;
  document.getElementById('edit-phone').value  = user.phone;
  document.getElementById('edit-role').value   = 'Field Officer';
  document.getElementById('edit-status').value = user.status;
  document.getElementById('edit-empid').value  = user.empId;
  document.getElementById('edit-date').value   = user.joinDate;
 
  clearErrors(['err-edit-name', 'err-edit-email', 'err-edit-phone', 'err-edit-role', 'err-edit-date']);
  openModal('modal-edit');
}
 
function saveEdit() {
  var previousUser = users.find(function(u) {
    return u.id === editUserId || (editUserEmail && (u.email || '').toLowerCase() === editUserEmail.toLowerCase());
  });
  var name   = getVal('edit-name');
  var email  = getVal('edit-email');
  var phone  = getVal('edit-phone');
  var role   = 'Field Officer';
  var status = getVal('edit-status');
  var date   = getVal('edit-date');
  var valid  = true;
 
  clearErrors(['err-edit-name', 'err-edit-email', 'err-edit-phone', 'err-edit-role', 'err-edit-date']);
 
  if (!name || /^0+$/.test(name)) {
    showErr('err-edit-name', /^0+$/.test(name) ? 'Invalid input.' : 'Full name is required.'); valid = false;
  } else if (name.length < 3) {
    showErr('err-edit-name', 'Name must be at least 3 characters.'); valid = false;
  }
 
  if (!email) {
    showErr('err-edit-email', 'Email is required.'); valid = false;
  } else if (!validEmail(email)) {
    showErr('err-edit-email', 'Enter a valid email address.'); valid = false;
  } else {
    var duplicate = users.find(function(u) {
      return u.email === email && u.id !== editUserId && (!editUserEmail || u.email.toLowerCase() !== editUserEmail.toLowerCase());
    });
    if (duplicate) { showErr('err-edit-email', 'This email is already used by another officer.'); valid = false; }
  }
 
  if (!phone || /^0+$/.test(phone)) {
    showErr('err-edit-phone', /^0+$/.test(phone) ? 'Invalid input.' : 'Phone number is required.'); valid = false;
  } else if (!validPhone(phone)) {
    showErr('err-edit-phone', 'Enter a valid 10-digit phone number.'); valid = false;
  }
 
  if (!date) { showErr('err-edit-date', 'Joining date is required.'); valid = false; }
 
  if (!valid) return;

  if (previousUser && previousUser.email.toLowerCase() !== email.toLowerCase()) {
    removeFieldOfficerCredentials(previousUser);
  }
 
  // Update user in array
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === editUserId || (editUserEmail && (users[i].email || '').toLowerCase() === editUserEmail.toLowerCase())) {
      users[i].name     = name;
      users[i].email    = email;
      users[i].phone    = phone;
      users[i].role     = role;
      users[i].status   = status;
      users[i].joinDate = date;
      persistFieldOfficerCredentials(users[i]);
      break;
    }
  }

  // Persist dynamically
  var localUsers = getLocalJson('users', []);
  var foundLocal = false;
  for (var j = 0; j < localUsers.length; j++) {
    if (localUsers[j].id === editUserId || (editUserEmail && (localUsers[j].email || '').toLowerCase() === editUserEmail.toLowerCase())) {
      localUsers[j].name = name; localUsers[j].email = email;
      localUsers[j].phone = phone; localUsers[j].role = role;
      localUsers[j].status = status; localUsers[j].joinDate = date;
      localUsers[j].empId = localUsers[j].empId || getVal('edit-empid');
      foundLocal = true; break;
    }
  }
  if (!foundLocal) localUsers.push({ id: editUserId, name: name, email: email, phone: phone, role: role, status: status, empId: getVal('edit-empid'), joinDate: date });
  localStorage.setItem('users', JSON.stringify(localUsers));
 
  filteredUsers = users.slice();
  editUserEmail = email;
  addAuditLog('Update', 'Users', 'Updated officer details for ' + name);
  closeModal('modal-edit');
  renderUsers();
  showToast('Field officer details updated successfully!');
}
 
function deleteUser(userId) {
  var lookupId = decodeURIComponent(userId || '').trim();
  var user = users.find(function(u) {
    return u.id === userId ||
      u.id === lookupId ||
      (u.empId && (u.empId === userId || u.empId === lookupId)) ||
      (u.backendUserId && (String(u.backendUserId) === String(userId) || String(u.backendUserId) === String(lookupId))) ||
      (u.email && (u.email.toLowerCase() === userId.toLowerCase() || u.email.toLowerCase() === lookupId.toLowerCase()));
  });
  if (!user) {
    showToast('Cannot find selected officer. Please refresh the page.');
    return;
  }

  if (!confirm('Are you sure you want to delete "' + user.name + '"? This cannot be undone.')) return;

  // The backend DELETE /api/users/:id requires the numeric user_id, not the employee_id string.
  var backendId = user.backendUserId || user.user_id || (typeof user.id === 'number' ? user.id : (parseInt(user.id, 10) || null));
  if (!backendId) {
    showToast('Cannot delete: backend user ID is missing. Please refresh the page and try again.');
    return;
  }

  // Disable the delete button to prevent double-clicks
  var deleteBtn = document.querySelector('button[onclick*="' + userId + '"]') ||
                  document.querySelector('button[onclick*="' + encodeURIComponent(userId) + '"]');
  if (deleteBtn) { deleteBtn.disabled = true; deleteBtn.textContent = 'Deleting...'; }

  fetch(API_BASE_URL + '/users/' + backendId, {
    method: 'DELETE',
    headers: authenticatedHeaders()
  })
  .then(function(response) {
    return response.json().catch(function() { return {}; }).then(function(payload) {
      if (!response.ok) {
        var msg = (payload && payload.message) ? payload.message : ('Delete failed (' + response.status + ')');
        throw new Error(Array.isArray(msg) ? msg[0] : msg);
      }
      return payload;
    });
  })
  .then(function() {
    // Backend confirmed deletion — now clean up local state
    var deletedEmails = getLocalJson('tz_deleted_officer_emails', []);
    if (user.email && !deletedEmails.includes(user.email.toLowerCase())) {
      deletedEmails.push(user.email.toLowerCase());
      localStorage.setItem('tz_deleted_officer_emails', JSON.stringify(deletedEmails));
    }

    users = users.filter(function(u) {
      var isTarget = (u.id && (u.id === userId || u.id === lookupId)) ||
        (u.empId && (u.empId === userId || u.empId === lookupId)) ||
        (u.backendUserId && String(u.backendUserId) === String(backendId)) ||
        (user.email && (u.email || '').toLowerCase() === user.email.toLowerCase());
      return !isTarget;
    });
    filteredUsers = users.slice();
    removeFieldOfficerCredentials(user);

    var localUsers = getLocalJson('users', []);
    localUsers = localUsers.filter(function(lu) {
      return (lu.id !== userId && lu.id !== lookupId) &&
        (user.email ? (lu.email || '').toLowerCase() !== user.email.toLowerCase() : true);
    });
    localStorage.setItem('users', JSON.stringify(localUsers));

    if (window.TRADEZO && Array.isArray(window.TRADEZO.users)) {
      window.TRADEZO.users = window.TRADEZO.users.filter(function(tu) {
        return user.email ? (tu.email || '').toLowerCase() !== user.email.toLowerCase() : true;
      });
    }

    addAuditLog('Delete', 'Users', 'Deleted officer ' + user.name);
    renderUsers();
    showToast('Field officer "' + user.name + '" deleted successfully.');

    // Re-fetch from backend to confirm and keep UI in sync
    fetchBackendUsers();
  })
  .catch(function(err) {
    // Backend call failed — do NOT remove from UI
    var msg = (err && err.message) ? err.message : 'Delete failed. Please try again.';
    showToast('Error: ' + msg);
    if (deleteBtn) { deleteBtn.disabled = false; deleteBtn.textContent = '\uD83D\uDDD1 Delete'; }
    renderUsers(); // re-render to restore any accidental UI changes
  });
}
 
 
// ============================================================
// APPLICATIONS OVERVIEW
// ============================================================
 
function renderApplicationStats() {
  refreshDynamicData();
  document.getElementById('app-total').textContent    = applications.length;
  document.getElementById('app-pending').textContent  = applications.filter(function(a) { return a.status !== 'Approved' && a.status !== 'Rejected'; }).length;
  document.getElementById('app-approved').textContent = applications.filter(function(a) { return a.status === 'Approved'; }).length;
  document.getElementById('app-rejected').textContent = applications.filter(function(a) { return a.status === 'Rejected'; }).length;
}

function updateApplicationAssignmentInList(list, appId, officer, nowIso) {
  if (!Array.isArray(list)) return list;
  var targetApp = applications.find(function(app) { return activityId(app) === appId; }) ||
    filteredApps.find(function(app) { return activityId(app) === appId; }) ||
    { id: appId, appId: appId, appRef: appId };
  return list.map(function(app) {
    if (activityId(app) !== appId && !sharesApplicationIdentity(app, targetApp)) return app;
    return Object.assign({}, app, {
      assignedFO: officer ? (officer.empId || officer.id || '') : '',
      assignedOfficerId: officer ? (officer.empId || officer.id || '') : '',
      fieldOfficerId: officer ? (officer.empId || officer.id || '') : '',
      field_officer_id: officer ? (officer.backendUserId || officer.id || '') : '',
      fieldOfficerEmail: officer ? (officer.email || '') : '',
      assignedEmail: officer ? (officer.email || '') : '',
      fieldOfficerName: officer ? (officer.name || '') : '',
      foName: officer ? (officer.name || '') : '',
      assignedTo: officer ? (officer.name || '') : '',
      assignedAt: officer ? nowIso : '',
      updatedAt: nowIso
    });
  });
}

function assignmentChangesForOfficer(officer, nowIso) {
  return {
    assignedFO: officer ? (officer.empId || officer.id || '') : '',
    assignedOfficerId: officer ? (officer.empId || officer.id || '') : '',
    fieldOfficerId: officer ? (officer.empId || officer.id || '') : '',
    field_officer_id: officer ? (officer.backendUserId || officer.id || '') : '',
    fieldOfficerEmail: officer ? (officer.email || '') : '',
    assignedEmail: officer ? (officer.email || '') : '',
    fieldOfficerName: officer ? (officer.name || '') : '',
    foName: officer ? (officer.name || '') : '',
    assignedTo: officer ? (officer.name || '') : '',
    assignedAt: officer ? nowIso : '',
    updatedAt: nowIso
  };
}

function persistAssignedApplicationRecord(key, appId, officer, nowIso, fallbackApp) {
  var list = getLocalJson(key, []);
  var found = false;
  var changes = assignmentChangesForOfficer(officer, nowIso);
  var targetApp = fallbackApp || applications.find(function(app) { return activityId(app) === appId; }) || { id: appId, appId: appId, appRef: appId };
  list = list.map(function(app) {
    if (activityId(app) !== appId && !sharesApplicationIdentity(app, targetApp)) return app;
    found = true;
    return Object.assign({}, app, changes);
  });
  if (!found && fallbackApp) {
    list.unshift(Object.assign({}, fallbackApp, changes));
  }
  localStorage.setItem(key, JSON.stringify(list));
}

function assignApplication(appId, officerEmail) {
  var officer = officerEmail ? findFieldOfficerByEmail(officerEmail) : null;
  var nowIso = new Date().toISOString();
  var currentApp = applications.find(function(app) { return activityId(app) === appId; }) || null;

  applications = updateApplicationAssignmentInList(applications, appId, officer, nowIso);
  filteredApps = updateApplicationAssignmentInList(filteredApps, appId, officer, nowIso);

  ['applications', 'tz_submitted_apps', 'tradezo_applications'].forEach(function(key) {
    persistAssignedApplicationRecord(key, appId, officer, nowIso, currentApp);
  });

  var queueFound = false;
  var queue = getLocalJson('tz_verification_queue', []).map(function(item) {
    if (activityId(item) !== appId && !sharesApplicationIdentity(item, currentApp || { id: appId, appId: appId, appRef: appId })) return item;
    queueFound = true;
    return Object.assign({}, item, assignmentChangesForOfficer(officer, nowIso));
  });
  if (!queueFound && currentApp) {
    queue.unshift(Object.assign({
      appId: currentApp.id,
      businessName: currentApp.business,
      applicant: currentApp.applicant,
      category: currentApp.category,
      address: currentApp.address,
      submitted: currentApp.submittedDate || currentApp.date || '',
      status: currentApp.status || 'Pending Review'
    }, assignmentChangesForOfficer(officer, nowIso)));
  }
  localStorage.setItem('tz_verification_queue', JSON.stringify(queue));

  if (window.TRADEZO && Array.isArray(window.TRADEZO.applications)) {
    window.TRADEZO.applications = updateApplicationAssignmentInList(window.TRADEZO.applications, appId, officer, nowIso);
  }

  // Persist to backend API
  var numericId = null;
  if (currentApp) {
    numericId = currentApp.backendId || currentApp.application_id || currentApp.numericId;
  }
  if (!numericId && typeof TRADEZO !== 'undefined' && TRADEZO.extractNumericId) {
    numericId = TRADEZO.extractNumericId(appId);
  }
  if (!numericId) {
    var rawDigits = String(appId).replace(/^TL-\d+-0*/i, '').replace(/^TL-0*/i, '').replace(/^TL-/i, '');
    if (/^\d+$/.test(rawDigits)) numericId = parseInt(rawDigits, 10);
  }

  if (numericId && window.TRADEZO && typeof TRADEZO.backendRequest === 'function') {
    var officerIdParam = officer ? (officer.backendUserId || officer.user_id || officer.id) : null;
    if (officerIdParam && !isNaN(Number(officerIdParam))) {
      officerIdParam = Number(officerIdParam);
    }
    TRADEZO.backendRequest('PATCH', '/applications/' + numericId + '/assign', {
      officerId: officerIdParam
    }, 'super_user').catch(function(err) {
      console.warn('Backend assign error:', err.message);
    });
  }

  addAuditLog(
    'Update',
    'Applications',
    (officer ? ('Assigned application ' + appId + ' to ' + officer.name) : ('Cleared field officer assignment for application ' + appId))
  );

  filteredApps = applications.slice();
  renderApplicationStats();
  renderApplications();
  showToast(officer ? ('Assigned to ' + officer.name + '.') : 'Field officer assignment cleared.');
}

function renderApplicationStats() {
  var totalEl = document.getElementById('app-total');
  var pendingEl = document.getElementById('app-pending');
  var approvedEl = document.getElementById('app-approved');
  var rejectedEl = document.getElementById('app-rejected');

  if (totalEl) totalEl.textContent = applications.length;
  if (pendingEl) {
    pendingEl.textContent = applications.filter(function(app) {
      var s = (app.status || '').toLowerCase();
      return s === 'pending' || s === 'submitted' || s === 'pending review' || s === 'under review';
    }).length;
  }
  if (approvedEl) {
    approvedEl.textContent = applications.filter(function(app) {
      return (app.status || '').toLowerCase() === 'approved';
    }).length;
  }
  if (rejectedEl) {
    rejectedEl.textContent = applications.filter(function(app) {
      return (app.status || '').toLowerCase() === 'rejected';
    }).length;
  }

  var catFilter = document.getElementById('app-category-filter');
  if (catFilter) {
    var selected = catFilter.value;
    var uniqueCats = [];
    applications.forEach(function(app) {
      if (app.category && app.category !== 'N/A' && uniqueCats.indexOf(app.category) === -1) {
        uniqueCats.push(app.category);
      }
    });
    catFilter.innerHTML = '<option value="">All Categories</option>' + uniqueCats.map(function(c) {
      return '<option value="' + escapeHtml(c) + '"' + (selected === c ? ' selected' : '') + '>' + escapeHtml(c) + '</option>';
    }).join('');
  }
}

function renderApplications() {
  var tbody = document.getElementById('apps-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (backendApplicationsError) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Unable to load applications: ' + escapeHtml(backendApplicationsError) + '</td></tr>';
    var pag = document.getElementById('apps-pagination');
    if (pag) pag.innerHTML = '';
    return;
  }

  if (!filteredApps || !filteredApps.length) {
    filteredApps = applications.slice();
  }

  var start    = (appPage - 1) * rowsPerPage;
  var pageData = filteredApps.slice(start, start + rowsPerPage);

  if (pageData.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No applications found.</td></tr>';
  } else {
    for (var i = 0; i < pageData.length; i++) {
      var a     = pageData[i];
      tbody.innerHTML +=
        '<tr>' +
          '<td>' + a.id + '</td>' +
          '<td>' + a.applicant + '</td>' +
          '<td>' + a.business + '</td>' +
          '<td>' + a.category + '</td>' +
          '<td>' + a.date + '</td>' +
          '<td>' + assignmentSelectHtml(a) + '</td>' +
          '<td><button class="btn-sm btn-view" onclick="viewApplication(\'' + a.id + '\')">&#128065; View</button></td>' +
        '</tr>';
    }
  }

  renderPagination('apps-pagination', filteredApps.length, appPage, function(p) {
    appPage = p;
    renderApplications();
  });
}
 
function filterApplications() {
  var search   = document.getElementById('app-search').value.toLowerCase();
  var status   = document.getElementById('app-status-filter').value;
  var category = document.getElementById('app-category-filter').value;
 
  filteredApps = applications.filter(function(a) {
    var matchSearch   = !search   || a.id.toLowerCase().includes(search) || a.applicant.toLowerCase().includes(search) || a.business.toLowerCase().includes(search);
    var matchStatus   = !status   || a.status === status;
    var matchCategory = !category || a.category === category;
    return matchSearch && matchStatus && matchCategory;
  });
 
  appPage = 1;
  renderApplications();
}
 
function viewApplication(appId) {
  var app = applications.find(function(a) { return a.id === appId; });
  if (!app) return;

  var applicantEmail = app.email;
  if (!applicantEmail || applicantEmail === 'N/A') {
    var allUsers = (users || []).concat(window.TRADEZO && Array.isArray(TRADEZO.users) ? TRADEZO.users : []).concat(getLocalJson('users', [])).concat(getLocalJson('registeredUsers', []));
    var targetId = app.applicant_id || app.applicantId || app.backendApplicantId;
    if (targetId) {
      var u = allUsers.find(function(user) { return String(user.id || user.user_id || user.backendUserId) === String(targetId); });
      if (u && u.email) applicantEmail = u.email;
    }
    if (!applicantEmail || applicantEmail === 'N/A') {
      var applicantName = app.applicant || app.applicantName || '';
      if (applicantName) {
        var uByName = allUsers.find(function(user) { return (user.name || user.full_name || '').toLowerCase() === applicantName.toLowerCase(); });
        if (uByName && uByName.email) applicantEmail = uByName.email;
      }
    }
  }
  if (!applicantEmail) applicantEmail = 'N/A';
 
  var badge = getAppBadge(app.status);
  document.getElementById('view-app-body').innerHTML =
    '<div class="detail-grid">' +
      '<div class="detail-item"><label>Application ID</label><p>' + app.id + '</p></div>' +
      '<div class="detail-item"><label>Status</label><p><span class="badge ' + badge + '">' + app.status + '</span></p></div>' +
      '<div class="detail-item"><label>Applicant Name</label><p>' + app.applicant + '</p></div>' +
      '<div class="detail-item"><label>Business Name</label><p>' + app.business + '</p></div>' +
      '<div class="detail-item"><label>Trade Category</label><p>' + app.category + '</p></div>' +
      '<div class="detail-item"><label>Submitted Date</label><p>' + app.date + '</p></div>' +
      '<div class="detail-item"><label>Phone</label><p>' + (app.phone || 'N/A') + '</p></div>' +
      '<div class="detail-item"><label>Email</label><p>' + applicantEmail + '</p></div>' +
      '<div class="detail-item" style="grid-column:1/-1"><label>Address</label><p>' + (app.address || 'N/A') + '</p></div>' +
    '</div>';
 
  openModal('modal-view-app');
}
 
function getAppBadge(status) {
  if (status === 'Approved')     return 'badge-green';
  if (status === 'Rejected')     return 'badge-red';
  if (status === 'Under Review') return 'badge-blue';
  return 'badge-orange';
}
 
 
// ============================================================
// SYSTEM SETTINGS — Trade Categories
// ============================================================
 
function renderCategories() {
  var list = document.getElementById('categories-list');
  list.innerHTML = '';
 
  if (categories.length === 0) {
    list.innerHTML = '<p style="color:#94a3b8; padding:20px; text-align:center;">No categories yet.</p>';
    return;
  }
 
  for (var i = 0; i < categories.length; i++) {
    var cat         = categories[i];
    var statusBadge = cat.status === 'Active' ? 'badge-green' : 'badge-grey';
    var toggleBtn   = cat.status === 'Active'
      ? '<button class="btn-deactivate" onclick="toggleCategory(' + cat.id + ')">Deactivate</button>'
      : '<button class="btn-activate"   onclick="toggleCategory(' + cat.id + ')">Activate</button>';
 
    list.innerHTML +=
      '<div class="category-row">' +
        '<div class="cat-left">' +
          '<div class="cat-name">' + cat.name + ' <span class="badge ' + statusBadge + '">' + cat.status + '</span></div>' +
          '<div class="cat-desc">' + cat.desc + '</div>' +
        '</div>' +
        '<div class="cat-right">' +
          toggleBtn +
          '<button class="btn-sm btn-edit"   onclick="openEditCategoryModal(' + cat.id + ')">&#9998;</button>' +
          '<button class="btn-sm btn-delete" onclick="deleteCategory(' + cat.id + ')">&#128465;</button>' +
        '</div>' +
      '</div>';
  }
}
 
function openCategoryModal() {
  editCatId = null;
  document.getElementById('cat-modal-title').textContent = 'Add Trade Category';
  document.getElementById('cat-edit-id').value = '';
  document.getElementById('cat-name').value    = '';
  document.getElementById('cat-desc').value    = '';
  document.getElementById('cat-status').value  = 'Active';
  clearErrors(['err-cat-name', 'err-cat-desc']);
  openModal('modal-category');
}
 
function openEditCategoryModal(catId) {
  var cat = categories.find(function(c) { return c.id === catId; });
  if (!cat) return;
 
  editCatId = catId;
  document.getElementById('cat-modal-title').textContent = 'Edit Trade Category';
  document.getElementById('cat-edit-id').value = cat.id;
  document.getElementById('cat-name').value    = cat.name;
  document.getElementById('cat-desc').value    = cat.desc;
  document.getElementById('cat-status').value  = cat.status;
  clearErrors(['err-cat-name', 'err-cat-desc']);
  openModal('modal-category');
}
 
function saveCategory() {
  var name   = getVal('cat-name');
  var desc   = getVal('cat-desc');
  var status = getVal('cat-status');
  var valid  = true;
 
  clearErrors(['err-cat-name', 'err-cat-desc']);
 
  if (!name)          { showErr('err-cat-name', 'Category name is required.'); valid = false; }
  else if (name.length < 2) { showErr('err-cat-name', 'Name must be at least 2 characters.'); valid = false; }
 
  if (!desc)          { showErr('err-cat-desc', 'Description is required.'); valid = false; }
  else if (desc.length < 5) { showErr('err-cat-desc', 'Description must be at least 5 characters.'); valid = false; }
 
  if (!valid) return;
 
  if (editCatId) {
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].id === editCatId) {
        categories[i].name   = name;
        categories[i].desc   = desc;
        categories[i].status = status;
        break;
      }
    }
    addAuditLog('Update', 'Settings', 'Updated trade category: ' + name);
    showToast('Category updated successfully!');
  } else {
    var maxId = 0;
    for (var j = 0; j < categories.length; j++) {
      if (categories[j].id > maxId) maxId = categories[j].id;
    }
    categories.push({ id: maxId + 1, name: name, desc: desc, status: status });
    addAuditLog('Create', 'Settings', 'Added new trade category: ' + name);
    showToast('Category "' + name + '" added successfully!');
  }
 
  closeModal('modal-category');
  renderCategories();
}
 
function toggleCategory(catId) {
  for (var i = 0; i < categories.length; i++) {
    if (categories[i].id === catId) {
      categories[i].status = (categories[i].status === 'Active') ? 'Inactive' : 'Active';
      addAuditLog('Update', 'Settings', 'Changed category "' + categories[i].name + '" to ' + categories[i].status);
      showToast('Category status updated.');
      break;
    }
  }
  renderCategories();
}
 
function deleteCategory(catId) {
  var cat = categories.find(function(c) { return c.id === catId; });
  if (!cat) return;
  if (!confirm('Delete category "' + cat.name + '"?')) return;
 
  categories = categories.filter(function(c) { return c.id !== catId; });
  addAuditLog('Delete', 'Settings', 'Deleted trade category: ' + cat.name);
  renderCategories();
  showToast('Category deleted.');
}
 
// Fee Configuration
function saveFees() {
  var newFee     = parseInt(document.getElementById('fee-new').value);
  var renewalFee = parseInt(document.getElementById('fee-renewal').value);
 
  if (isNaN(newFee) || newFee < 0)     { showToast('Please enter a valid New Application Fee.'); return; }
  if (isNaN(renewalFee) || renewalFee < 0) { showToast('Please enter a valid Renewal Fee.'); return; }
 
  document.getElementById('display-fee-new').textContent     = '\u20B9' + newFee.toLocaleString('en-IN');
  document.getElementById('display-fee-renewal').textContent = '\u20B9' + renewalFee.toLocaleString('en-IN');
  
  // Track dynamically across application portal
  localStorage.setItem('tradezo_fees', JSON.stringify({ new: newFee, renewal: renewalFee }));

  addAuditLog('Update', 'Settings', 'Updated fee configuration');
  showToast('Fee configuration saved successfully!');
}
 
function resetFees() {
  document.getElementById('fee-new').value     = defaultFees.new;
  document.getElementById('fee-renewal').value = defaultFees.renewal;
  showToast('Fees reset to default values.');
}
 
// Settings Modals
function saveNotifications() {
  addAuditLog('Update', 'Settings', 'Updated notification settings');
  closeModal('modal-notifications');
  showToast('Notification settings saved!');
}
 
function saveSecurity() {
  var timeout  = parseInt(document.getElementById('sec-timeout').value);
  var attempts = parseInt(document.getElementById('sec-attempts').value);
  var passLen  = parseInt(document.getElementById('sec-passlen').value);
 
  if (isNaN(timeout)  || timeout < 5)  { showToast('Session timeout must be at least 5 minutes.'); return; }
  if (isNaN(attempts) || attempts < 3) { showToast('Login attempts must be at least 3.'); return; }
  if (isNaN(passLen)  || passLen < 6)  { showToast('Password length must be at least 6.'); return; }
 
  addAuditLog('Update', 'Settings', 'Updated security settings');
  closeModal('modal-security');
  showToast('Security settings saved!');
}
 
function saveBackup() {
  addAuditLog('Update', 'Settings', 'Updated backup settings');
  closeModal('modal-backup');
  showToast('Backup settings saved!');
}
 
function triggerManualBackup() {
  showToast('Manual backup started...');
  addAuditLog('Create', 'Settings', 'Triggered manual system backup');
  setTimeout(function() { showToast('Backup completed successfully!'); }, 3000);
}
 
 
// ============================================================
// AUDIT LOGS
// ============================================================
 
function renderAudit() {
  var tbody = document.getElementById('audit-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
 
  var start    = (auditPage - 1) * rowsPerPage;
  var pageData = filteredAudit.slice(start, start + rowsPerPage);
 
  if (pageData.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No logs found.</td></tr>';
  } else {
    for (var i = 0; i < pageData.length; i++) {
      var log = pageData[i];
      var actionStr = String(log.action || 'Info');
      var actionClass = 'action-' + actionStr.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      tbody.innerHTML +=
        '<tr>' +
          '<td>' + (log.time || '') + '</td>' +
          '<td>' + (log.user || '') + '</td>' +
          '<td>' + (log.role || '') + '</td>' +
          '<td><span class="action-badge ' + actionClass + '">' + actionStr + '</span></td>' +
          '<td>' + (log.module || '') + '</td>' +
          '<td>' + (log.desc || log.description || '') + '</td>' +
        '</tr>';
    }
  }
 
  renderPagination('audit-pagination', filteredAudit.length, auditPage, function(p) {
    auditPage = p;
    renderAudit();
  });
}
 
function filterAudit() {
  var searchInput = document.getElementById('audit-search');
  var roleSelect  = document.getElementById('audit-role-filter');

  var search = searchInput ? searchInput.value.toLowerCase().trim() : '';
  var selectedRole = roleSelect ? roleSelect.value.toLowerCase().trim() : '';

  filteredAudit = auditLogs.filter(function(log) {
    var userText   = String(log.user || '').toLowerCase();
    var descText   = String(log.desc || log.description || '').toLowerCase();
    var moduleText = String(log.module || '').toLowerCase();
    var actionText = String(log.action || '').toLowerCase();
    var ipText     = String(log.ip || log.ip_address || '').toLowerCase();
    var roleText   = String(log.role || '').toLowerCase();

    var matchSearch = !search ||
      userText.includes(search) ||
      descText.includes(search) ||
      moduleText.includes(search) ||
      actionText.includes(search) ||
      ipText.includes(search) ||
      roleText.includes(search);

    var matchRole = true;
    if (selectedRole) {
      var normLogRole = roleText.replace(/[\s_-]+/g, '');
      var normSelected = selectedRole.replace(/[\s_-]+/g, '');

      if (normSelected === 'municipalcommissioner' || normSelected === 'superuser') {
        matchRole = normLogRole === 'municipalcommissioner' || normLogRole === 'superuser';
      } else if (normSelected === 'fieldofficer') {
        matchRole = normLogRole === 'fieldofficer' || normLogRole === 'fo';
      } else if (normSelected === 'departmentofficer') {
        matchRole = normLogRole === 'departmentofficer' || normLogRole === 'do';
      } else if (normSelected === 'applicant') {
        matchRole = normLogRole === 'applicant';
      } else {
        matchRole = normLogRole === normSelected || normLogRole.includes(normSelected);
      }
    }

    return matchSearch && matchRole;
  });

  auditPage = 1;
  renderAudit();
}
 
function exportAuditCSV() {
  var header = 'Timestamp,User Name,Role,Action,Module,Description';
  var rows   = filteredAudit.map(function(log) {
    return [log.time, log.user, log.role, log.action, log.module, '"' + (log.desc || log.description || '') + '"'].join(',');
  });
 
  var csvContent = header + '\n' + rows.join('\n');
  var blob       = new Blob([csvContent], { type: 'text/csv' });
  var url        = URL.createObjectURL(blob);
  var link       = document.createElement('a');
  link.href      = url;
  link.download  = 'audit_logs.csv';
  link.click();
  URL.revokeObjectURL(url);
  showToast('Audit logs exported as CSV!');
}
 
// Add a new entry to audit log automatically on every action
function addAuditLog(action, module, description) {
  var now     = new Date();
  var timeStr = now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) +
                ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
 
  auditLogs.unshift({
    time: timeStr, user: 'Admin User', role: 'Super User',
    action: action, module: module, desc: description, ip: '192.168.1.1'
  });
 
  filteredAudit = auditLogs.slice();
  localStorage.setItem('tradezo_audit_logs', JSON.stringify(auditLogs.slice(0, 100)));
  if (document.getElementById('page-dashboard') && document.getElementById('page-dashboard').classList.contains('active')) {
    renderDashboard();
  }
}
 
 
// ============================================================
// PAGINATION
// ============================================================
 
function renderPagination(containerId, totalItems, currentPage, onPageChange) {
  var container  = document.getElementById(containerId);
  var totalPages = Math.ceil(totalItems / rowsPerPage);
  container.innerHTML = '';
 
  if (totalPages <= 1) return;
 
  // Prev button
  var prevBtn       = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerHTML = '\u2039 Prev';
  prevBtn.disabled  = (currentPage === 1);
  prevBtn.onclick   = function() { onPageChange(currentPage - 1); };
  container.appendChild(prevBtn);
 
  // Page number buttons
  for (var i = 1; i <= totalPages; i++) {
    (function(pageNum) {
      var btn         = document.createElement('button');
      btn.className   = 'page-btn' + (pageNum === currentPage ? ' active-page' : '');
      btn.textContent = pageNum;
      btn.onclick     = function() { onPageChange(pageNum); };
      container.appendChild(btn);
    })(i);
  }
 
  // Next button
  var nextBtn       = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerHTML = 'Next \u203a';
  nextBtn.disabled  = (currentPage === totalPages);
  nextBtn.onclick   = function() { onPageChange(currentPage + 1); };
  container.appendChild(nextBtn);
}
 
 
// ============================================================
// MODAL HELPERS
// ============================================================
 
function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}
 
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}
 
// Close modal when clicking outside it
window.addEventListener('click', function(event) {
  var modals = document.querySelectorAll('.modal-overlay');
  for (var i = 0; i < modals.length; i++) {
    if (event.target === modals[i]) {
      modals[i].classList.remove('show');
    }
  }
});
 
 
// ============================================================
// TOAST NOTIFICATION
// ============================================================
 
function showToast(message) {
  var toast         = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 3000);
}
 
 
// ============================================================
// SIGN OUT
// ============================================================
 
function signOut() {
  if (confirm('Are you sure you want to sign out?')) {
    sessionStorage.clear();
    showToast('Signing out...');
    setTimeout(function() { window.location.href = '../applicant_connected/connected/login/index.html'; }, 1500);
  }
}
 
 
// ============================================================
// FORM HELPERS
// ============================================================
 
function getVal(id) {
  return document.getElementById(id).value.trim();
}
 
function showErr(id, message) {
  var el = document.getElementById(id);
  if (el) el.textContent = message;
  var field = document.getElementById(id.replace('err-', ''));
  if (field) field.classList.add('input-error');
}
 
function clearErrors(idList) {
  for (var i = 0; i < idList.length; i++) {
    var el = document.getElementById(idList[i]);
    if (el) el.textContent = '';
    var field = document.getElementById(idList[i].replace('err-', ''));
    if (field) field.classList.remove('input-error');
  }
}
 
function clearFields(idList) {
  for (var i = 0; i < idList.length; i++) {
    var el = document.getElementById(idList[i]);
    if (el) el.value = '';
  }
}
 
function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
 
function validPhone(phone) {
  var digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}
 
 
// ============================================================
// TENANT / MUNICIPALITY BRANDING
// ============================================================

function applyTenantBranding() {
  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null'); } catch(e){}
  var muniId = (user && (user.municipality_id || user.municipalityId)) || 'muni-hyd';
  var muni = (window.TRADEZO && typeof TRADEZO.getMunicipality === 'function')
    ? TRADEZO.getMunicipality(muniId)
    : { name: 'Greater Hyderabad Municipal Corporation (GHMC)' };

  var subTitles = document.querySelectorAll('.logo-sub, .gov-sub, .page-sub, .hierarchy-eyebrow');
  subTitles.forEach(function(el) {
    if (el.classList.contains('hierarchy-eyebrow')) {
      el.textContent = muni.name;
    } else {
      el.textContent = muni.name + ' \u2013 Trade License Management System';
    }
  });

  var roleEl = document.querySelector('.hierarchy-role');
  if (roleEl && user && user.name) {
    roleEl.textContent = 'Municipal Head: ' + user.name;
  }

  var emailEl = document.querySelector('.user-email');
  if (emailEl && user && user.email) {
    emailEl.textContent = user.email;
  }

  var nameEl = document.querySelector('.user-name');
  if (nameEl && user && user.name) {
    nameEl.textContent = user.name + ' (Admin)';
  }
}

// ============================================================
// RUN ON PAGE LOAD
// ============================================================
 
window.onload = function() {
  applyTenantBranding();
  renderDashboard();
  fetchBackendUsers();
  fetchBackendApplications();
  fetchBackendLicenses();
  fetchBackendAuditLogs();
};
