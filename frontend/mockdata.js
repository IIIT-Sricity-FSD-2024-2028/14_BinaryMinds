// ============================================================
// mockdata.js — TradeZo Central Data Hub
// Include this file in ANY page: <script src="path/to/mockdata.js"></script>
// All actors share this same data — dynamic data flows via localStorage
// ============================================================

var TRADEZO = {};

// ============================================================
// 1. USERS — Empty; populated dynamically via login/registration
// ============================================================
TRADEZO.users = [];

// ============================================================
// 2. APPLICATIONS — Empty; populated dynamically via Apply License flow
// ============================================================
TRADEZO.applications = [];

// ============================================================
// 3. LICENSES — Empty; populated dynamically via DO portal
// ============================================================
TRADEZO.licenses = [];

// ============================================================
// 4. INSPECTIONS — Empty; populated dynamically via FO portal
// ============================================================
TRADEZO.inspections = [];

// ============================================================
// 5. VERIFICATIONS — Empty; populated dynamically via FO portal
// ============================================================
TRADEZO.verifications = [];

// ============================================================
// 6. AUDIT LOG — Empty; populated dynamically by system actions
// ============================================================
TRADEZO.auditLog = [];

// ============================================================
// 7. DASHBOARD STATS — Initial zeros, updated dynamically
// ============================================================
TRADEZO.stats = {
  applicant: {
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    licenseActive: 0
  },
  fieldOfficer: {
    applicationsSubmitted: 0,
    pendingInspections: 0,
    completedToday: 0,
    slaAlerts: 0
  },
  deptOfficer: {
    pendingApplications: 0,
    licensesIssued: 0,
    slaCompliance: '0 / 0'
  },
  superUser: {
    totalUsers: 0,
    pendingApplications: 0,
    issuedLicenses: 0
  }
};

TRADEZO.freshDateFields = [
  'updatedAt', 'updated_at', 'lastUpdated', 'last_updated',
  'createdAt', 'created_at', 'submitted_at', 'submittedDate',
  'dateSubmitted', 'submissionDate', 'paymentDate', 'inspectionDate',
  'decidedOn', 'date', 'issueDate', 'licenseIssueDate'
];

TRADEZO.parseFreshDate = function(value) {
  if (!value) return 0;
  if (value instanceof Date) return isNaN(value.getTime()) ? 0 : value.getTime();
  if (typeof value === 'number') return value > 10000000000 ? value : 0;

  var text = String(value).trim();
  var lower = text.toLowerCase();
  if (!text || text === 'â€”' || lower === 'n/a' || lower === 'pending') return 0;

  var parsed = new Date(text);
  if (!isNaN(parsed.getTime())) return parsed.getTime();

  var parts = text.replace(/,/g, '').split(/\s+/);
  if (parts.length >= 3) {
    var alt = new Date(parts[1] + ' ' + parts[0] + ' ' + parts[2]);
    if (!isNaN(alt.getTime())) return alt.getTime();
  }

  return 0;
};

TRADEZO.freshness = function(item) {
  if (!item) return 0;
  var latest = 0;
  TRADEZO.freshDateFields.forEach(function(field) {
    latest = Math.max(latest, TRADEZO.parseFreshDate(item[field]));
  });
  return latest;
};

TRADEZO.sortFreshFirst = function(list) {
  if (!Array.isArray(list)) return [];
  return list.sort(function(a, b) {
    return TRADEZO.freshness(b) - TRADEZO.freshness(a);
  });
};

TRADEZO.demoBusinessNames = {
  'green valley restaurant': true,
  'singh electronics': true,
  'sharma healthcare': true,
  'tech hub electronics': true
};

TRADEZO.normalizeText = function(value) {
  return String(value || '').toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
};

TRADEZO.itemId = function(item) {
  return String(item && (item.appId || item.id || item.appRef || item.application_id || item.applicationId) || '').trim();
};

TRADEZO.isPlainNumericId = function(value) {
  return /^\d+$/.test(String(value || '').trim());
};

TRADEZO.formatApplicationId = function(sequence, dateValue) {
  var yearDate = dateValue ? new Date(dateValue) : new Date();
  var year = isNaN(yearDate.getTime()) ? new Date().getFullYear() : yearDate.getFullYear();
  var number = parseInt(sequence, 10);
  if (isNaN(number) || number < 1) number = 1;
  return 'TL-' + year + '-' + String(number).padStart(6, '0');
};

TRADEZO.applicationSequence = function(value) {
  var text = String(value || '').trim();
  if (!text) return 0;
  if (TRADEZO.isPlainNumericId(text)) return parseInt(text, 10) || 0;

  var match = text.match(/(?:TL|APP)[-\s]?\d{4}[-\s]?(\d+)$/i);
  if (match) return parseInt(match[1], 10) || 0;

  var digits = text.replace(/\D/g, '');
  return digits ? (parseInt(digits.slice(-6), 10) || 0) : 0;
};

TRADEZO.normalizeApplicationRef = function(app, fallbackSequence) {
  app = app || {};
  var existing = app.appRef || app.appId || app.id;
  if (existing && !TRADEZO.isPlainNumericId(existing)) return String(existing).trim();

  var sequence = app.application_id || app.backendId || app.applicationId || existing || fallbackSequence;
  return TRADEZO.formatApplicationId(sequence, app.submitted_at || app.submittedDate || app.date);
};

TRADEZO.generateApplicationId = function(extraLists) {
  var lists = [
    TRADEZO.applications,
    TRADEZO.licenses,
    TRADEZO.inspections
  ];
  if (Array.isArray(extraLists)) lists = lists.concat(extraLists);

  ['tz_submitted_apps', 'applications', 'tradezo_applications', 'tz_verification_queue'].forEach(function(key) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(value)) lists.push(value);
    } catch(e) {}
  });

  var max = 0;
  lists.forEach(function(list) {
    if (!Array.isArray(list)) return;
    list.forEach(function(item) {
      max = Math.max(
        max,
        TRADEZO.applicationSequence(item && item.id),
        TRADEZO.applicationSequence(item && item.appId),
        TRADEZO.applicationSequence(item && item.appRef),
        TRADEZO.applicationSequence(item && item.application_id),
        TRADEZO.applicationSequence(item && item.applicationId)
      );
    });
  });

  return TRADEZO.formatApplicationId(max + 1);
};

TRADEZO.isDemoRecord = function(item) {
  if (!item) return false;
  var businessName = TRADEZO.normalizeText(item.businessName || item.business_name || item.business || item.companyName);
  return !!TRADEZO.demoBusinessNames[businessName];
};

TRADEZO.removeEvaluationDemoData = function() {
  var storageKeys = [
    'tz_submitted_apps',
    'applications',
    'tradezo_applications',
    'tz_inspection_reports',
    'tz_verification_history',
    'tz_verification_queue',
    'tz_generated_licenses'
  ];
  var demoIds = {};

  function readArray(key) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch(e) {
      return [];
    }
  }

  storageKeys.forEach(function(key) {
    readArray(key).forEach(function(item) {
      if (TRADEZO.isDemoRecord(item)) {
        var id = TRADEZO.itemId(item);
        if (id) demoIds[id] = true;
      }
    });
  });

  storageKeys.forEach(function(key) {
    var current = readArray(key);
    var filtered = current.filter(function(item) {
      var id = TRADEZO.itemId(item);
      return !TRADEZO.isDemoRecord(item) && !(id && demoIds[id]);
    });
    if (filtered.length !== current.length) {
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  });

  Object.keys(localStorage).forEach(function(key) {
    if (key.indexOf('doAppStatus_') !== 0 && key.indexOf('doRejectReason_') !== 0) return;
    var appId = key.replace('doAppStatus_', '').replace('doRejectReason_', '');
    if (demoIds[appId]) localStorage.removeItem(key);
  });

  Object.keys(sessionStorage).forEach(function(key) {
    if (key.indexOf('doAppStatus_') !== 0 && key.indexOf('doRejectReason_') !== 0) return;
    var appId = key.replace('doAppStatus_', '').replace('doRejectReason_', '');
    if (demoIds[appId]) sessionStorage.removeItem(key);
  });
};

TRADEZO.removeEvaluationDemoData();

// ============================================================
// HELPER FUNCTIONS — Use anywhere to get data
// ============================================================

// Get an application by ID
TRADEZO.getApplication = function(id) {
  return TRADEZO.applications.find(function(a) {
    return String(a.id) === String(id) ||
      String(a.appId) === String(id) ||
      String(a.appRef) === String(id) ||
      String(a.backendId) === String(id) ||
      String(a.application_id) === String(id);
  }) || null;
};

// Get a license by ID
TRADEZO.getLicense = function(id) {
  return TRADEZO.licenses.find(function(l) { return l.id === id; }) || null;
};

// Get all applications for an applicant
TRADEZO.getApplicantApps = function(applicantId) {
  return TRADEZO.applications.filter(function(a) { return a.applicantId === applicantId; });
};

// Get applications assigned to a field officer
TRADEZO.getFOApplications = function(foId) {
  return TRADEZO.applications.filter(function(a) { return a.assignedFO === foId; });
};

// Get inspections for a field officer
TRADEZO.getFOInspections = function(foId) {
  var foUser = TRADEZO.users.find(function(u) { return u.id === foId; });
  var foName = foUser ? foUser.name : '';
  return TRADEZO.inspections.filter(function(i) {
    return i.assignedFO === foName || i.assignedFO === foId;
  });
};

// Get badge color for a status
TRADEZO.statusColor = function(status) {
  var map = {
    'Approved': '#16a34a', 'Active': '#16a34a', 'Completed': '#16a34a',
    'Rejected': '#dc2626', 'Expired': '#dc2626',
    'Under Verification': '#f59e0b', 'Pending': '#f59e0b', 'Pending Review': '#f59e0b',
    'Under Review': '#3b82f6', 'In Progress': '#3b82f6', 'Scheduled': '#3b82f6',
    'Expiring Soon': '#f97316', 'Submitted': '#3b82f6',
    'License Issued': '#16a34a', 'Licensed': '#16a34a'
  };
  return map[status] || '#6b7280';
};

// Get logged in user from session
TRADEZO.getLoggedInUser = function() {
  try {
    var u = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
    return u || {};
  } catch(e) { return {}; }
};

console.log('✅ TradeZo Data Hub loaded — ready for dynamic data');

// ============================================================
// PERSISTENCE — Load user-submitted apps from localStorage
// BACKEND API ADAPTER - keeps the existing UI shape unchanged
TRADEZO.API_BASE = 'http://localhost:3000/api';
TRADEZO.backendLoaded = false;

TRADEZO.roleFor = function(role) {
  var normalized = String(role || '').toLowerCase().replace(/\s+/g, '_');
  var map = {
    superuser: 'superuser',
    super_user: 'superuser',
    department_officer: 'department_officer',
    field_officer: 'officer',
    officer: 'officer',
    applicant: 'applicant'
  };
  return map[normalized] || 'department_officer';
};

TRADEZO.backendRequest = function(method, path, body, role, sync) {
  var url = TRADEZO.API_BASE + path;
  var accessToken = sessionStorage.getItem('accessToken') || '';
  if (sync) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url, false);
      if (accessToken) xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      if (body !== undefined && body !== null) xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(body !== undefined && body !== null ? JSON.stringify(body) : null);
      if (xhr.status >= 200 && xhr.status < 300) return JSON.parse(xhr.responseText || 'null');
    } catch(e) {
      console.warn('Backend unavailable for', method, path, e.message);
    }
    return null;
  }

  var options = {
    method: method,
    headers: accessToken ? { Authorization: 'Bearer ' + accessToken } : {}
  };
  if (body !== undefined && body !== null) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  return fetch(url, options).then(function(res) {
    return res.text().then(function(text) {
      var parsed = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(parsed && parsed.message ? parsed.message : ('Request failed: ' + res.status));
      return parsed;
    });
  });
};

TRADEZO.unwrap = function(response) {
  if (!response) return [];
  return Array.isArray(response) ? response : (response.data || []);
};

TRADEZO.statusToUi = function(status) {
  var map = {
    submitted: 'Pending Review',
    assigned: 'Assigned',
    verified: 'Verified',
    documents_uploaded: 'Documents Verified',
    inspection_scheduled: 'Inspection Scheduled',
    inspection_completed: 'Inspection Completed',
    department_review: 'Department Review',
    approved: 'Approved',
    rejected: 'Rejected'
  };
  return map[String(status || '').toLowerCase()] || status || 'Pending Review';
};

TRADEZO.statusToBackend = function(status) {
  var normalized = String(status || '').toLowerCase().replace(/\s+/g, '_');
  var map = {
    pending: 'submitted',
    pending_review: 'submitted',
    submitted: 'submitted',
    assigned: 'assigned',
    verified: 'verified',
    documents_verified: 'documents_uploaded',
    inspection_scheduled: 'inspection_scheduled',
    inspection_completed: 'inspection_completed',
    inspection_recorded: 'inspection_completed',
    department_review: 'department_review',
    approved: 'approved',
    license_issued: 'approved',
    rejected: 'rejected'
  };
  return map[normalized] || normalized;
};

TRADEZO.toUiApplication = function(app) {
  if (!app) return app;
  var displayId = TRADEZO.normalizeApplicationRef(app);
  var backendId = app.application_id || app.backendId || (TRADEZO.isPlainNumericId(app.id) ? Number(app.id) : null);
  return Object.assign({}, app, {
    id: displayId,
    appId: displayId,
    appRef: displayId,
    backendId: backendId,
    applicantId: app.applicant_id,
    applicantName: app.full_name || app.applicantName || app.applicant || '',
    applicant: app.full_name || app.applicant || app.applicantName || '',
    ownerName: app.full_name || app.ownerName || app.applicantName || '',
    businessName: app.business_name || app.businessName || app.business || '',
    business: app.business_name || app.business || app.businessName || '',
    businessType: app.business_type || app.businessType || '',
    tradeCategory: app.trade_category || app.tradeCategory || app.category || app.business_type || '',
    category: app.trade_category || app.category || app.business_type || '',
    shopAddress: app.shop_address || app.shopAddress || app.address || '',
    address: app.shop_address || app.address || app.shopAddress || '',
    phone: app.applicant_phone || app.phone || '',
    aadhaar: app.aadhaar_number || app.aadhaar || '',
    fatherName: app.father_name || app.fatherName || '',
    submittedDate: app.submitted_at || app.submittedDate || app.date || '',
    date: app.submitted_at || app.date || app.submittedDate || '',
    status: TRADEZO.statusToUi(app.application_status || app.status),
    assignedFO: app.assignedOfficerId || app.assignedFO || '',
    fieldOfficerId: app.assignedOfficerId || app.fieldOfficerId || app.field_officer_id || '',
    paymentStatus: app.paymentDone ? 'Paid' : (app.paymentStatus || 'Pending')
  });
};

TRADEZO.toUiLicense = function(lic) {
  if (!lic) return lic;
  return Object.assign({}, lic, {
    id: lic.license_number || lic.licenseNo || lic.id || lic.license_id,
    licenseNo: lic.license_number || lic.licenseNo || lic.id,
    licenseId: lic.license_number || lic.licenseId || lic.id,
    appId: lic.application_id != null ? String(lic.application_id) : (lic.appId || ''),
    status: lic.status || 'Active',
    issueDate: lic.issued_date || lic.issueDate || lic.licenseIssueDate || '',
    licenseIssueDate: lic.issued_date || lic.licenseIssueDate || '',
    expiryDate: lic.expiry_date || lic.expiryDate || lic.licenseExpiryDate || '',
    licenseExpiryDate: lic.expiry_date || lic.licenseExpiryDate || ''
  });
};

TRADEZO.toUiInspection = function(insp) {
  if (!insp) return insp;
  return Object.assign({}, insp, {
    id: insp.inspection_id || insp.id,
    appId: insp.application_id ? String(insp.application_id) : (insp.appId || ''),
    assignedFO: insp.field_officer_id || insp.assignedFO || '',
    fieldOfficerId: insp.field_officer_id || insp.fieldOfficerId || '',
    date: insp.completed_date || insp.scheduled_date || insp.date || '',
    inspectionDate: insp.scheduled_date || insp.inspectionDate || '',
    submittedDate: insp.completed_date || insp.submittedDate || '',
    status: insp.status === 'COMPLETED' ? 'Completed' : (insp.status || 'Pending'),
    result: insp.status === 'FAILED' ? 'Rejected' : (insp.status === 'COMPLETED' ? 'Approved' : (insp.result || 'Pending')),
    notes: insp.notes || ''
  });
};

TRADEZO.toUiUser = function(user) {
  if (!user) return user;
  return Object.assign({}, user, {
    id: user.user_id || user.id,
    name: user.full_name || user.name,
    email: user.email,
    phone: user.phone,
    empId: user.employee_id || user.empId,
    role: user.role
  });
};

TRADEZO.normalizeStoredApplicationIds = function() {
  ['tz_submitted_apps', 'applications', 'tradezo_applications'].forEach(function(key) {
    try {
      var list = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(list)) return;
      var normalized = list.map(TRADEZO.toUiApplication);
      localStorage.setItem(key, JSON.stringify(normalized));
    } catch(e) {}
  });
};

TRADEZO.hydrateFromBackend = function() {
  var apps = TRADEZO.backendRequest('GET', '/applications', null, 'department_officer', true);
  if (!apps) return false;
  TRADEZO.applications = TRADEZO.unwrap(apps).map(TRADEZO.toUiApplication);

  var licenses = TRADEZO.backendRequest('GET', '/licenses', null, 'department_officer', true);
  if (licenses) {
    TRADEZO.licenses = TRADEZO.unwrap(licenses).map(TRADEZO.toUiLicense);
    TRADEZO.licenses.forEach(function(lic) {
      var app = TRADEZO.applications.find(function(item) { return String(item.id) === String(lic.appId); });
      if (app) {
        lic.businessName = lic.businessName || app.businessName;
        lic.category = lic.category || app.tradeCategory || app.category;
        lic.ownerName = lic.ownerName || app.applicantName;
      }
    });
  }

  var inspections = TRADEZO.backendRequest('GET', '/inspections', null, 'department_officer', true);
  if (inspections) TRADEZO.inspections = TRADEZO.unwrap(inspections).map(TRADEZO.toUiInspection);

  var users = TRADEZO.backendRequest('GET', '/users', null, 'department_officer', true);
  if (users) TRADEZO.users = TRADEZO.unwrap(users).map(TRADEZO.toUiUser);

  TRADEZO.backendLoaded = true;
  return true;
};

TRADEZO.syncApplicationToBackend = function(app, role) {
  if (!app) return Promise.resolve(null);
  var backendId = Number(app.backendId || app.application_id || app.id);
  var status = app.application_status || (app.status ? TRADEZO.statusToBackend(app.status) : null);
  if (backendId && status) {
    return TRADEZO.backendRequest('PATCH', '/applications/' + backendId, { application_status: status }, role || 'officer')
      .catch(function(err) { console.warn('Could not update backend application:', err.message); return null; });
  }
  return TRADEZO.backendRequest('POST', '/applications', {
    applicantName: app.applicantName || app.full_name || app.applicant || app.ownerName || 'Applicant',
    businessName: app.businessName || app.business_name || app.business || '',
    tradeCategory: app.tradeCategory || app.trade_category || app.category || app.businessType || '',
    shopAddress: app.shopAddress || app.shop_address || app.address || '',
    phone: app.phone || app.applicant_phone || ''
  }, role || 'applicant').catch(function(err) {
    console.warn('Could not create backend application:', err.message);
    return null;
  });
};

TRADEZO.createBackendLicense = function(appId, issuedBy) {
  var numericAppId = Number(appId);
  if (!numericAppId) return Promise.resolve(null);
  var expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);
  return TRADEZO.backendRequest('POST', '/licenses', {
    application_id: numericAppId,
    issued_by: issuedBy || 1,
    expiry_date: expiry.toISOString()
  }, 'department_officer').catch(function(err) {
    console.warn('Could not create backend license:', err.message);
    return null;
  });
};

TRADEZO.hydrateFromBackend();
TRADEZO.normalizeStoredApplicationIds();

// So all pages find dynamically-added apps after page refresh
// ============================================================
(function() {
  if (TRADEZO.backendLoaded) {
    TRADEZO.sortFreshFirst(TRADEZO.applications);
    TRADEZO.sortFreshFirst(TRADEZO.licenses);
    TRADEZO.sortFreshFirst(TRADEZO.inspections);
    TRADEZO.sortFreshFirst(TRADEZO.verifications);
    TRADEZO.sortFreshFirst(TRADEZO.auditLog);
    TRADEZO.stats.superUser.totalUsers = TRADEZO.users.length;
    TRADEZO.stats.superUser.pendingApplications = TRADEZO.applications.filter(function(a){
      var s = (a.status || '').toLowerCase();
      return s === 'pending' || s === 'submitted' || s === 'pending review' || s === 'under verification';
    }).length;
    TRADEZO.stats.superUser.issuedLicenses = TRADEZO.licenses.length;
    console.log('Loaded from backend API - ' + TRADEZO.applications.length + ' applications, ' + TRADEZO.licenses.length + ' licenses, ' + TRADEZO.users.length + ' users');
    return;
  }

  // Load submitted applications
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]'); } catch(e){}
  saved = saved.map(TRADEZO.toUiApplication);
  localStorage.setItem('tz_submitted_apps', JSON.stringify(saved));
  saved.forEach(function(newApp) {
    var exists = TRADEZO.applications.some(function(a){ return a.appRef === newApp.appRef || a.id === newApp.id; });
    if (!exists) TRADEZO.applications.push(newApp);
  });

  // Load legacy 'applications' key
  var legacy = [];
  try { legacy = JSON.parse(localStorage.getItem('applications') || '[]'); } catch(e){}
  legacy = legacy.map(TRADEZO.toUiApplication);
  localStorage.setItem('applications', JSON.stringify(legacy));
  legacy.forEach(function(app) {
    var exists = TRADEZO.applications.some(function(a){ return a.appRef === app.appRef || a.id === app.id; });
    if (!exists) TRADEZO.applications.push(app);
  });

  // Load generated licenses
  var lics = [];
  try { lics = JSON.parse(localStorage.getItem('tz_generated_licenses') || '[]'); } catch(e){}
  lics.forEach(function(lic) {
    var exists = TRADEZO.licenses.some(function(l){ return l.id === lic.id || l.id === lic.licenseNo; });
    if (!exists) TRADEZO.licenses.push(lic);
    // Also update the matching application's status
    var app = TRADEZO.applications.find(function(a){ return a.id === lic.appId || a.appRef === lic.appId; });
    if (app) {
      app.status = 'License Issued';
      app.licenseNo = lic.licenseNo || lic.id;
      app.licenseId = lic.licenseNo || lic.id;
    }
  });

  // Load registered users
  var regUsers = [];
  try { regUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]'); } catch(e){}
  regUsers.forEach(function(u) {
    var exists = TRADEZO.users.some(function(eu){ return eu.email === u.email; });
    if (!exists) TRADEZO.users.push(u);
  });

  // Load super-user-created users
  var suUsers = [];
  try { suUsers = JSON.parse(localStorage.getItem('users') || '[]'); } catch(e){}
  suUsers.forEach(function(u) {
    var exists = TRADEZO.users.some(function(eu){ return eu.email === u.email; });
    if (!exists) TRADEZO.users.push(u);
  });

  // Load inspection reports
  var reports = [];
  try { reports = JSON.parse(localStorage.getItem('tz_inspection_reports') || '[]'); } catch(e){}
  reports.forEach(function(r) {
    var exists = TRADEZO.inspections.some(function(i){ return i.appId === r.appId; });
    if (!exists) {
      TRADEZO.inspections.push({
        id: r.id || ('INS-' + r.appId),
        appId: r.appId,
        businessName: r.businessName || '',
        type: r.type || r.tradeCategory || r.category || '',
        tradeCategory: r.tradeCategory || r.type || r.category || '',
        ownerName: r.ownerName || r.applicantName || '',
        address: r.address || r.shopAddress || '',
        assignedFO: r.foName || '',
        date: r.inspectionDate || r.date || '',
        inspectionDate: r.inspectionDate || r.date || '',
        submittedDate: r.submittedDate || r.date || '',
        time: r.inspectionTime || '',
        status: 'Completed',
        result: r.result || 'Completed',
        notes: r.notes || ''
      });
    }
  });

  // Keep newest records first everywhere the shared data hub is used.
  TRADEZO.sortFreshFirst(TRADEZO.applications);
  TRADEZO.sortFreshFirst(TRADEZO.licenses);
  TRADEZO.sortFreshFirst(TRADEZO.inspections);
  TRADEZO.sortFreshFirst(TRADEZO.verifications);
  TRADEZO.sortFreshFirst(TRADEZO.auditLog);

  // Update stats dynamically
  TRADEZO.stats.superUser.totalUsers = TRADEZO.users.length;
  TRADEZO.stats.superUser.pendingApplications = TRADEZO.applications.filter(function(a){
    var s = (a.status || '').toLowerCase();
    return s === 'pending' || s === 'submitted' || s === 'under verification';
  }).length;
  TRADEZO.stats.superUser.issuedLicenses = TRADEZO.licenses.length;

  if (TRADEZO.applications.length || TRADEZO.licenses.length || TRADEZO.users.length) {
    console.log('📦 Loaded from storage — ' + TRADEZO.applications.length + ' applications, ' + TRADEZO.licenses.length + ' licenses, ' + TRADEZO.users.length + ' users');
  }
})();
