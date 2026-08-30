// ============================================================
// script.js — Super User Panel
// Plain JavaScript — No libraries, no frameworks
// ============================================================
 
 
// ============================================================
// MOCK DATA — This acts as our fake database
// ============================================================
 
// List of officers in the system
var defaultFieldOfficers = [
  { id: 'FO-2026-042', name: 'Myra Singh', email: 'myra@fieldofficer.com', phone: '9876543221', role: 'Field Officer', status: 'Active', joinDate: '2025-10-15', empId: 'FO-2026-042' }
];
var users = defaultFieldOfficers.slice();
 
// List of trade license applications
var applications = [
  { id: "TL2026-001245", applicant: "Rajesh Kumar",  business: "Green Valley Restaurant", category: "Food & Beverages", date: "Feb 20, 2026", status: "Pending",      address: "123 Main St, Gurugram",  phone: "9876543210", email: "rajesh@example.com" },
  { id: "TL2026-001240", applicant: "Vikram Singh",  business: "Singh Electronics",       category: "Retail",           date: "Feb 18, 2026", status: "Under Review", address: "45 MG Road, Delhi",      phone: "9876543211", email: "vikram@example.com" },
  { id: "TL2026-001235", applicant: "Amit Patel",    business: "Patel Wholesale Hub",     category: "Wholesale",        date: "Feb 15, 2026", status: "Rejected",     address: "67 Ring Road, Ahmedabad",phone: "9876543212", email: "amit@example.com" },
  { id: "TL2026-001230", applicant: "Priya Sharma",  business: "Sharma Healthcare",       category: "Healthcare",       date: "Feb 12, 2026", status: "Approved",     address: "89 Park Street, Mumbai", phone: "9876543213", email: "priya@example.com" },
  { id: "TL2026-001225", applicant: "Sneha Reddy",   business: "Reddy Constructions",     category: "Manufacturing",    date: "Feb 10, 2026", status: "Approved",     address: "12 Lake View, Hyderabad",phone: "9876543214", email: "sneha@example.com" },
  { id: "TL2026-001220", applicant: "Meera Gupta",   business: "Gupta Retail Store",      category: "Retail",           date: "Feb 08, 2026", status: "Pending",      address: "34 Civil Lines, Jaipur", phone: "9876543215", email: "meera@example.com" },
  { id: "TL2026-001215", applicant: "Arjun Verma",   business: "Verma Foods",             category: "Food & Beverages", date: "Feb 05, 2026", status: "Under Review", address: "56 Sector 21, Noida",    phone: "9876543216", email: "arjun@example.com" },
  { id: "TL2026-001210", applicant: "Rohit Desai",   business: "Desai Manufacturing",     category: "Manufacturing",    date: "Feb 03, 2026", status: "Approved",     address: "78 MIDC, Pune",          phone: "9876543217", email: "rohit@example.com" },
  { id: "TL2026-001205", applicant: "Suresh Nair",   business: "Nair Wholesale",          category: "Wholesale",        date: "Jan 30, 2026", status: "Approved",     address: "90 Calicut Road, Kochi", phone: "9876543218", email: "suresh@example.com" },
  { id: "TL2026-001200", applicant: "Kavita Joshi",  business: "Joshi Medical Store",     category: "Healthcare",       date: "Jan 28, 2026", status: "Pending",      address: "11 Shivaji Nagar, Pune", phone: "9876543219", email: "kavita@example.com" }
];
 
// List of issued licenses
var licenses = [
  { id: "LIC2025-000892", business: "Sneha Fashion Store",   owner: "Sneha Reddy",    category: "Retail",           issueDate: "Jan 5, 2025",  expiryDate: "Jan 5, 2026",  status: "Expiring Soon" },
  { id: "LIC2025-000567", business: "Amit General Store",    owner: "Amit Patel",     category: "Wholesale",        issueDate: "Mar 12, 2025", expiryDate: "Mar 12, 2027", status: "Active" },
  { id: "LIC2024-000234", business: "Kumar Electronics",     owner: "Suresh Kumar",   category: "Retail",           issueDate: "Jun 1, 2024",  expiryDate: "Jun 1, 2026",  status: "Active" },
  { id: "LIC2024-000189", business: "Singh Pharmaceuticals", owner: "Harpreet Singh", category: "Healthcare",       issueDate: "Aug 20, 2024", expiryDate: "Aug 20, 2025", status: "Expiring Soon" },
  { id: "LIC2025-000678", business: "Sharma Cafe",           owner: "Neha Sharma",    category: "Food & Beverages", issueDate: "Feb 14, 2025", expiryDate: "Feb 14, 2027", status: "Active" },
  { id: "LIC2023-000045", business: "Patel Construction",    owner: "Ramesh Patel",   category: "Manufacturing",    issueDate: "Apr 3, 2023",  expiryDate: "Apr 3, 2025",  status: "Revoked" },
  { id: "LIC2025-000901", business: "Gupta Textiles",        owner: "Anjali Gupta",   category: "Retail",           issueDate: "Dec 10, 2025", expiryDate: "Dec 10, 2027", status: "Active" },
  { id: "LIC2026-001001", business: "Verma Bakery",          owner: "Arjun Verma",    category: "Food & Beverages", issueDate: "Jan 20, 2026", expiryDate: "Jan 20, 2028", status: "Active" },
  { id: "LIC2024-000310", business: "Reddy Pharma",          owner: "Sneha Reddy",    category: "Healthcare",       issueDate: "Sep 5, 2024",  expiryDate: "Sep 5, 2026",  status: "Active" },
  { id: "LIC2023-000089", business: "Tiwari Traders",        owner: "Manish Tiwari",  category: "Wholesale",        issueDate: "Nov 15, 2023", expiryDate: "Nov 15, 2025", status: "Expiring Soon" }
];
 
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
var auditLogs = [
  { time: "Mar 28, 2026 10:23 AM", user: "Admin User",   role: "Super User",         action: "Approve", module: "Applications", desc: "Approved application #TL2026-001230",       ip: "192.168.1.1" },
  { time: "Mar 28, 2026 09:12 AM", user: "Admin User",   role: "Super User",         action: "Create",  module: "Users",        desc: "Added new officer Manish Tiwari",           ip: "192.168.1.1" },
  { time: "Mar 28, 2026 08:55 AM", user: "Rajesh Kumar", role: "Field Officer",      action: "Login",   module: "System",       desc: "Login successful from Chrome",              ip: "192.168.1.23" },
  { time: "Mar 27, 2026 05:30 PM", user: "Admin User",   role: "Super User",         action: "Update",  module: "Settings",     desc: "Updated fee configuration",                ip: "192.168.1.1" },
  { time: "Mar 27, 2026 03:00 PM", user: "Admin User",   role: "Super User",         action: "Delete",  module: "Users",        desc: "Removed inactive officer account USR004",  ip: "192.168.1.1" },
  { time: "Mar 27, 2026 02:10 PM", user: "Sneha Reddy",  role: "Applicant",          action: "Create",  module: "Applications", desc: "Submitted new application #TL2026-001245", ip: "192.168.2.10" },
  { time: "Mar 27, 2026 01:30 PM", user: "Vikram Singh", role: "Field Officer",      action: "Update",  module: "Licenses",     desc: "Recorded inspection for LIC2025-000678",   ip: "192.168.1.23" },
  { time: "Mar 27, 2026 11:00 AM", user: "Admin User",   role: "Super User",         action: "Update",  module: "Licenses",     desc: "Revoked license LIC2023-000045",           ip: "192.168.1.1" }
];
 
// Recent activity shown on dashboard
var activityLog = [
  { user: "Rajesh Kumar",  action: "Applied for new Trade License - Application #TL2026-001245", time: "10 min ago" },
  { user: "Priya Sharma",  action: "Approved License Application #TL2026-001230",                time: "25 min ago" },
  { user: "Admin System",  action: "Generated monthly revenue report",                           time: "1 hr ago" },
  { user: "Amit Patel",    action: "Renewed existing license - License #TL2025-000567",          time: "2 hr ago" },
  { user: "Sneha Reddy",   action: "Updated business information for License #TL2025-000892",    time: "3 hr ago" },
  { user: "Vikram Singh",  action: "Submitted payment for Application #TL2026-001240",           time: "4 hr ago" },
  { user: "Admin User",    action: "Rejected incomplete application #TL2026-001235",             time: "5 hr ago" },
  { user: "Meera Gupta",   action: "Registered new user account",                               time: "6 hr ago" }
];
 
// Default fee values (used when resetting)
var defaultFees = { new: 1200, renewal: 1000 };
var FIELD_OFFICER_DEFAULT_PASSWORD = 'field@123';
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
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: 'field officer',
    password: FIELD_OFFICER_DEFAULT_PASSWORD,
    status: user.status || 'Active',
    empId: user.empId,
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
  list.filter(isFieldOfficerUser).forEach(function(user) {
    var email = (user.email || '').toLowerCase();
    if (!email) return;
    byEmail[email] = Object.assign({}, byEmail[email] || {}, user, {
      role: 'Field Officer',
      empId: user.empId || user.id || (byEmail[email] && byEmail[email].empId) || ''
    });
  });
  return Object.keys(byEmail).map(function(email) { return byEmail[email]; });
}

function generateEmployeeId() {
  var allKnownUsers = users
    .concat(getLocalJson('users', []))
    .concat(getLocalJson('registeredUsers', []));
  var maxId = 0;

  allKnownUsers.forEach(function(user) {
    var rawId = String(user.empId || user.employee_id || user.id || '');
    var match = rawId.match(/(?:EMP|FO)-?(\d+)/i);
    if (match) {
      var value = parseInt(match[1], 10);
      if (!isNaN(value) && value > maxId) maxId = value;
    }
  });

  return 'EMP-' + String(maxId + 1).padStart(5, '0');
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
}

function syncFieldOfficerToBackend(user) {
  if (!window.fetch) return Promise.resolve(false);

  return fetch(API_BASE_URL + '/users', {
    method: 'POST',
    headers: authenticatedHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      full_name: user.name,
      email: user.email,
      phone: user.phone,
      employee_id: user.empId || user.employee_id || user.id,
      password_hash: FIELD_OFFICER_DEFAULT_PASSWORD,
      role: 'field_officer'
    })
  })
  .then(function(response) {
    if (!response.ok) throw new Error('Backend user sync failed');
    return response.json();
  })
  .then(function(created) {
    user.backendUserId = created.user_id;
    persistFieldOfficerCredentials(user);
    return true;
  })
  .catch(function() {
    return false;
  });
}

var managedDepartments = [
  'Commerce Department',
  'Industry Department',
  'Trade License Department'
];

var departmentOfficers = getLocalJson('departmentOfficers', [
  {
    id: 'DO-001',
    name: 'Anjali Mehta',
    email: 'admin@deptofficer.com',
    phone: '9876543230',
    department: 'Commerce Department',
    startDate: '2023-04-01'
  },
  {
    id: 'DO-002',
    name: 'Rahul Gupta',
    email: 'rahul@deptofficer.com',
    phone: '9876543231',
    department: 'Industry Department',
    startDate: '2018-03-31'
  }
]);

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
  return uniqueFieldOfficers(users).slice().sort(function(a, b) {
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

function assignmentSelectHtml(app) {
  var currentEmail = String(firstActivityValue(app, ['fieldOfficerEmail', 'assignedEmail', 'emailAssignedTo']) || '').toLowerCase().trim();
  var options = ['<option value="">Unassigned</option>'];
  getAssignableFieldOfficers().forEach(function(officer) {
    var email = String(officer.email || '').toLowerCase().trim();
    var selected = email && email === currentEmail ? ' selected' : '';
    options.push('<option value="' + escapeHtml(officer.email || '') + '"' + selected + '>' + escapeHtml(officer.name || officer.email || 'Field Officer') + '</option>');
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

function getDepartmentOfficerEndDate(officer) {
  var start = parseDate(officer.startDate);
  if (!start) return null;
  return addYears(start, 5);
}

function getDepartmentOfficerStatus(officer) {
  var end = getDepartmentOfficerEndDate(officer);
  if (!end) return 'Invalid';
  return new Date() <= end ? 'Active' : 'Expired';
}

function getCurrentDepartmentOfficer(department) {
  var officers = departmentOfficers
    .filter(function(officer) { return officer.department === department; })
    .sort(function(a, b) {
      return (parseDate(b.startDate) || 0) - (parseDate(a.startDate) || 0);
    });
  return officers[0] || null;
}

function getEligibleDepartmentsForNewOfficer() {
  return managedDepartments.filter(function(department) {
    var current = getCurrentDepartmentOfficer(department);
    return !current || getDepartmentOfficerStatus(current) === 'Expired';
  });
}

function persistDepartmentOfficers() {
  localStorage.setItem('departmentOfficers', JSON.stringify(departmentOfficers));
}

function syncDepartmentOfficerToBackend(officer) {
  if (!window.fetch) return Promise.resolve(false);

  return fetch(API_BASE_URL + '/users', {
    method: 'POST',
    headers: authenticatedHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      full_name: officer.name,
      email: officer.email,
      phone: officer.phone,
      employee_id: officer.id,
      password_hash: 'dept@123',
      role: 'department_officer'
    })
  })
  .then(function(response) {
    if (!response.ok) throw new Error('Backend department officer sync failed');
    return response.json();
  })
  .then(function(created) {
    officer.backendUserId = created.user_id;
    persistDepartmentOfficers();
    return true;
  })
  .catch(function() {
    return false;
  });
}

function renderDepartmentOfficers() {
  var tbody = document.getElementById('department-officers-tbody');
  var message = document.getElementById('department-officer-message');
  var button = document.getElementById('btn-add-department-officer');
  if (!tbody || !message || !button) return;

  tbody.innerHTML = '';
  managedDepartments.forEach(function(department) {
    var officer = getCurrentDepartmentOfficer(department);
    if (!officer) {
      tbody.innerHTML +=
        '<tr>' +
          '<td>No officer assigned</td>' +
          '<td>' + department + '</td>' +
          '<td>N/A</td>' +
          '<td>N/A</td>' +
          '<td><span class="badge badge-orange">Vacant</span></td>' +
        '</tr>';
      return;
    }

    var status = getDepartmentOfficerStatus(officer);
    var badge = status === 'Active' ? 'badge-green' : 'badge-red';
    var endDate = getDepartmentOfficerEndDate(officer);
    tbody.innerHTML +=
      '<tr>' +
        '<td>' + officer.name + '</td>' +
        '<td>' + officer.department + '</td>' +
        '<td>' + formatDisplayDate(officer.startDate) + '</td>' +
        '<td>' + (endDate ? formatDisplayDate(toDateInputValue(endDate)) : 'N/A') + '</td>' +
        '<td><span class="badge ' + badge + '">' + status + '</span></td>' +
      '</tr>';
  });

  var eligible = getEligibleDepartmentsForNewOfficer();
  button.disabled = eligible.length === 0;
  if (eligible.length === 0) {
    message.innerHTML = '<strong>Add disabled:</strong> Every department already has an active Department Officer. A new officer can be added only after the current 5-year term expires.';
  } else {
    message.innerHTML = '<strong>Eligible department(s):</strong> ' + eligible.join(', ') + '. You can add a new Department Officer for these department(s).';
  }
}

function openDepartmentOfficerModal() {
  var eligible = getEligibleDepartmentsForNewOfficer();
  if (eligible.length === 0) {
    showToast('No department is eligible for a new officer yet.');
    return;
  }

  clearFields(['dept-name', 'dept-email', 'dept-phone', 'dept-start']);
  clearErrors(['err-dept-name', 'err-dept-email', 'err-dept-phone', 'err-dept-department', 'err-dept-start']);
  var select = document.getElementById('dept-department');
  select.innerHTML = eligible.map(function(department) {
    return '<option value="' + department + '">' + department + '</option>';
  }).join('');
  document.getElementById('dept-start').value = toDateInputValue(new Date());
  openModal('modal-department-officer');
}

function generateDepartmentOfficerId() {
  var maxId = 0;
  departmentOfficers.forEach(function(officer) {
    var match = String(officer.id || '').match(/DO-(\d+)/i);
    if (match) {
      var value = parseInt(match[1], 10);
      if (!isNaN(value) && value > maxId) maxId = value;
    }
  });
  return 'DO-' + String(maxId + 1).padStart(3, '0');
}

function addDepartmentOfficer() {
  var name = getVal('dept-name');
  var email = getVal('dept-email');
  var phone = getVal('dept-phone');
  var department = getVal('dept-department');
  var startDate = getVal('dept-start');
  var valid = true;

  clearErrors(['err-dept-name', 'err-dept-email', 'err-dept-phone', 'err-dept-department', 'err-dept-start']);

  if (!name || name.length < 3) { showErr('err-dept-name', 'Full name must be at least 3 characters.'); valid = false; }
  if (!email) { showErr('err-dept-email', 'Email is required.'); valid = false; }
  else if (!validEmail(email)) { showErr('err-dept-email', 'Enter a valid email address.'); valid = false; }
  else if (departmentOfficers.some(function(officer) { return officer.email.toLowerCase() === email.toLowerCase(); })) {
    showErr('err-dept-email', 'This email already exists for a Department Officer.'); valid = false;
  }
  if (!phone || !validPhone(phone)) { showErr('err-dept-phone', 'Enter a valid 10-digit phone number.'); valid = false; }
  if (!department) { showErr('err-dept-department', 'Select a department.'); valid = false; }
  if (!startDate || !parseDate(startDate)) { showErr('err-dept-start', 'Start date is required.'); valid = false; }

  var current = getCurrentDepartmentOfficer(department);
  if (current && getDepartmentOfficerStatus(current) === 'Active') {
    showErr('err-dept-department', 'This department already has an active officer.'); valid = false;
  }

  if (!valid) return;

  var officer = {
    id: generateDepartmentOfficerId(),
    name: name,
    email: email,
    phone: phone,
    department: department,
    startDate: startDate
  };

  departmentOfficers.push(officer);
  persistDepartmentOfficers();
  addAuditLog('Create', 'Users', 'Added department officer ' + name + ' for ' + department);
  closeModal('modal-department-officer');
  renderDepartmentOfficers();
  showToast('Department Officer ' + name + ' created for ' + department + '.');

  syncDepartmentOfficerToBackend(officer).then(function(synced) {
    if (synced) showToast('Department Officer synced to backend.');
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
        updatedAt: u.updatedAt || u.updated_at || u.lastUpdated || ''
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

   var applicationSources = backendApplicationsLoaded
     ? backendApplications
     : sysApps.concat(localApps).concat(legacyApps).concat(tradezoApps);
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
        email: a.email || a.applicantEmail || 'N/A'
      };
    });
    applications.sort(function(a, b) {
      return activityTimestamp(latestActivityValue(b, ['updatedDate', 'createdAt', 'submittedDate', 'date']), 0) -
             activityTimestamp(latestActivityValue(a, ['updatedDate', 'createdAt', 'submittedDate', 'date']), 0);
    });
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
  if (pageName === 'dashboard')       renderDashboard();
  if (pageName === 'user-management') renderUsers();
  if (pageName === 'department-officers') renderDepartmentOfficers();
  if (pageName === 'applications')    { renderApplicationStats(); renderApplications(); }
  
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
              '<button class="btn-sm btn-delete" onclick="deleteUser(\'' + u.id + '\')">&#128465; Delete</button>' +
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
  clearFields(['add-name', 'add-email', 'add-phone', 'add-role', 'add-status', 'add-date']);
  document.getElementById('add-role').value = 'Field Officer';
  clearErrors(['err-add-name', 'err-add-email', 'err-add-phone', 'err-add-role', 'err-add-status', 'err-add-date']);
  openModal('modal-add');
}
 
function addOfficer() {
  var name   = getVal('add-name');
  var email  = getVal('add-email');
  var phone  = getVal('add-phone');
  var role   = 'Field Officer';
  var status = getVal('add-status');
  var empId  = generateEmployeeId();
  var date   = getVal('add-date');
  var valid  = true;
 
  clearErrors(['err-add-name', 'err-add-email', 'err-add-phone', 'err-add-role', 'err-add-status', 'err-add-date']);
 
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
  } else if (users.find(function(u) { return u.email === email; })) {
    showErr('err-add-email', 'This email already exists in the system.'); valid = false;
  }
 
  // Phone validation
  if (!phone || /^0+$/.test(phone)) {
    showErr('err-add-phone', /^0+$/.test(phone) ? 'Invalid input.' : 'Phone number is required.'); valid = false;
  } else if (!validPhone(phone)) {
    showErr('err-add-phone', 'Enter a valid 10-digit phone number.'); valid = false;
  }
 
  if (!status) { showErr('err-add-status', 'Please select a status.'); valid = false; }
 
  if (!date) { showErr('err-add-date', 'Joining date is required.'); valid = false; }
 
  if (!valid) return;
 
  // Add the new officer
  var newId = empId;
  var newUserObj = { id: newId, name: name, email: email, phone: phone, role: role, status: status, empId: empId, joinDate: date };
  users.push(newUserObj);
  filteredUsers = users.slice();
  persistFieldOfficerCredentials(newUserObj);
 
  addAuditLog('Create', 'Users', 'Added new officer ' + name);
  closeModal('modal-add');
  renderUsers();
  showToast('Field officer ' + name + ' created with ID ' + empId + '. Login: ' + email + ' / ' + FIELD_OFFICER_DEFAULT_PASSWORD);

  syncFieldOfficerToBackend(newUserObj).then(function(synced) {
    if (synced) {
      showToast('Field officer synced to backend and login credentials are active.');
    } else {
      showToast('Login credentials are active locally. Start backend to sync API users.');
    }
  });
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
  var user = users.find(function(u) { return u.id === userId; });
  if (!user) return;
 
  if (!confirm('Are you sure you want to delete "' + user.name + '"? This cannot be undone.')) return;
 
  var deletedEmails = getLocalJson('tz_deleted_officer_emails', []);
  if (user.email && !deletedEmails.includes(user.email.toLowerCase())) {
    deletedEmails.push(user.email.toLowerCase());
    localStorage.setItem('tz_deleted_officer_emails', JSON.stringify(deletedEmails));
  }

  users = users.filter(function(u) { return u.id !== userId; });
  filteredUsers = users.slice();
  removeFieldOfficerCredentials(user);
  
  // Persist dynamically
  var localUsers = getLocalJson('users', []);
  localUsers = localUsers.filter(function(lu) { return lu.id !== userId && (lu.email || '').toLowerCase() !== (user.email || '').toLowerCase(); });
  localStorage.setItem('users', JSON.stringify(localUsers));

  addAuditLog('Delete', 'Users', 'Deleted officer ' + user.name);
  renderUsers();
  showToast('Field officer deleted successfully.');
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
 
function renderApplications() {
  var tbody    = document.getElementById('apps-tbody');
  tbody.innerHTML = '';

  if (backendApplicationsError) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Unable to load applications: ' + escapeHtml(backendApplicationsError) + '</td></tr>';
    document.getElementById('apps-pagination').innerHTML = '';
    return;
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
 
  var badge = getAppBadge(app.status);
  document.getElementById('view-app-body').innerHTML =
    '<div class="detail-grid">' +
      '<div class="detail-item"><label>Application ID</label><p>' + app.id + '</p></div>' +
      '<div class="detail-item"><label>Status</label><p><span class="badge ' + badge + '">' + app.status + '</span></p></div>' +
      '<div class="detail-item"><label>Applicant Name</label><p>' + app.applicant + '</p></div>' +
      '<div class="detail-item"><label>Business Name</label><p>' + app.business + '</p></div>' +
      '<div class="detail-item"><label>Trade Category</label><p>' + app.category + '</p></div>' +
      '<div class="detail-item"><label>Submitted Date</label><p>' + app.date + '</p></div>' +
      '<div class="detail-item"><label>Phone</label><p>' + app.phone + '</p></div>' +
      '<div class="detail-item"><label>Email</label><p>' + app.email + '</p></div>' +
      '<div class="detail-item" style="grid-column:1/-1"><label>Address</label><p>' + app.address + '</p></div>' +
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
// RUN ON PAGE LOAD
// ============================================================
 
window.onload = function() {
  renderDashboard();
  fetchBackendAuditLogs();
  fetchBackendApplications();
};
