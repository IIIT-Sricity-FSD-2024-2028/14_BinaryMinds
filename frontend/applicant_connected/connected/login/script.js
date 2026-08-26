var MOCK_USERS = [
  { email:"rajesh@applicant.com",    password:"applicant123", role:"applicant",           name:"Rajesh Kumar" },
  { email:"priya@applicant.com",     password:"applicant123", role:"applicant",           name:"Priya Sharma" },
  { email:"myra@fieldofficer.com",   password:"field@123",    role:"field officer",       name:"Myra Singh" },
  { email:"vikram@fieldofficer.com", password:"field@123",    role:"field officer",       name:"Vikram Desai" },
  { email:"admin@deptofficer.com",   password:"dept123",      role:"department officer",  name:"Anjali Mehta" },
  { email:"rahul@deptofficer.com",   password:"dept123",      role:"department officer",  name:"Rahul Gupta" },
  { email:"admin@tradezo.gov.in",    password:"super123",     role:"superuser",           name:"Admin User" }
];

// login is at: applicant_connected/connected/login/
var DASHBOARDS = {
  "applicant":          "../Applicant dashboard/index.html",
  "field officer":      "../../../fo_connected/fodashboard/index.html",
  "department officer": "../../../do_connected/dashboard/index.html",
  "superuser":          "../../../superuser/index.html"
};

var emailInput    = document.querySelector('input[type="text"]');
var passwordInput = document.querySelector('input[type="password"]');
var roleSelect    = document.querySelector('select');

function safeJsonArray(key) {
  try {
    var value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch(e) {
    return [];
  }
}

function normalizeStoredUser(user) {
  var role = (user.role || '').toLowerCase().replace('_', ' ');
  return {
    id: user.id || user.user_id || user.empId || '',
    name: user.name || user.full_name || 'Field Officer',
    email: user.email || '',
    phone: user.phone || '',
    password: user.password || user.password_hash || (role === 'field officer' ? 'field@123' : ''),
    role: role,
    status: user.status || 'Active',
    empId: user.empId || user.id || ''
  };
}

function getStoredLoginUsers() {
  var registered = safeJsonArray('registeredUsers').map(normalizeStoredUser);
  var superUserCreated = safeJsonArray('users')
    .map(normalizeStoredUser)
    .filter(function(user) { return user.role === 'field officer'; })
    .map(function(user) {
      user.password = user.password || 'field@123';
      return user;
    });

  return registered.concat(superUserCreated);
}

function getBackendLoginUsers() {
  return Promise.resolve([]);
}

function formatAuditRole(role) {
  var normalized = String(role || '').toLowerCase().replace(/_/g, ' ').trim();
  if (normalized === 'superuser') return 'Super User';
  if (normalized === 'field officer') return 'Field Officer';
  if (normalized === 'department officer') return 'Department Officer';
  if (normalized === 'applicant') return 'Applicant';
  return normalized || 'Unknown';
}

function writeAuditLog(entry) {
  var existing = safeJsonArray('tradezo_audit_logs');
  existing.unshift(entry);
  localStorage.setItem('tradezo_audit_logs', JSON.stringify(existing.slice(0, 200)));

  if (!window.fetch) return Promise.resolve();
  return fetch('http://localhost:3000/api/audit-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_name: entry.user,
      role: entry.role,
      action: entry.action,
      module: entry.module,
      description: entry.desc,
      ip_address: entry.ip,
      source: 'frontend',
    }),
  }).catch(function() {
    return null;
  });
}

async function handleLogin() {
  var email    = emailInput.value.trim();
  var password = passwordInput.value.trim();
  var role     = roleSelect.value;

  clearAllErrors();
  if (!email)    { showError(emailInput, 'Email is required.');       return; }
  if (!password) { showError(passwordInput, 'Password is required.'); return; }
  if (!role)     { showError(roleSelect, 'Please select your role.'); return; }

  var backendRole = {
    'applicant': 'applicant',
    'field officer': 'field_officer',
    'department officer': 'department_officer',
    'superuser': 'super_user'
  }[role.toLowerCase()];

  try {
    var loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password, role: backendRole })
    });
    var loginPayload = await loginResponse.json().catch(function() { return {}; });
    if (!loginResponse.ok || !loginPayload.accessToken || !loginPayload.user) {
      showError(passwordInput, 'Invalid email, password, or role.');
      return;
    }

    var canonicalRole = {
      applicant: 'applicant',
      field_officer: 'field officer',
      department_officer: 'department officer',
      super_user: 'superuser'
    }[String(loginPayload.user.role || '').toLowerCase()] || '';
    if (canonicalRole !== role.toLowerCase()) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('loggedInUser');
      showError(roleSelect, 'Wrong role selected.');
      return;
    }

    var dashboard = DASHBOARDS[canonicalRole];
    if (!dashboard) { showError(roleSelect, 'No dashboard is available for this role.'); return; }
    sessionStorage.setItem('accessToken', loginPayload.accessToken);
    sessionStorage.setItem('loggedInUser', JSON.stringify({
      id: loginPayload.user.user_id,
      name: loginPayload.user.full_name,
      email: loginPayload.user.email,
      phone: loginPayload.user.phone || '',
      role: canonicalRole,
      accessToken: loginPayload.accessToken
    }));
    window.location.assign(dashboard);
    return;
  } catch (error) {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('loggedInUser');
    showError(passwordInput, 'Unable to sign in. Please try again.');
    return;
  }

  // Include applicant registrations and Super User-created field officers from localStorage
  var backendUsers = await getBackendLoginUsers();
  
  // Filter out any mock users that were explicitly deleted by Super User
  var deletedEmails = safeJsonArray('deletedUserEmails');
  var activeMockUsers = MOCK_USERS.filter(function(u) {
    return deletedEmails.indexOf((u.email || '').toLowerCase()) === -1;
  });
  
  var allUsers = activeMockUsers.concat(getStoredLoginUsers(), backendUsers);

  var emailMatch = allUsers.find(function(u) { return u.email.toLowerCase() === email.toLowerCase(); });
  if (!emailMatch) { showError(emailInput, 'No account found with this email.'); return; }

  var passMatch = allUsers.find(function(u) {
    return u.email.toLowerCase() === email.toLowerCase() && u.password === password;
  });
  if (!passMatch) { showError(passwordInput, 'Incorrect password.'); return; }

  var fullMatch = allUsers.find(function(u) {
    return u.email.toLowerCase() === email.toLowerCase() &&
           u.password === password &&
           u.role.toLowerCase() === role.toLowerCase();
  });
  if (!fullMatch) { showError(roleSelect, 'Wrong role selected. Your role is: ' + passMatch.role); return; }

  function clearApplicantDraftIfNeeded(nextEmail) {
    var draft = {};
    try { draft = JSON.parse(sessionStorage.getItem('applicationForm') || '{}'); } catch(e) {}
    var draftOwner = (draft.ownerEmail || draft.email || '').toLowerCase();
    var loginEmail = (nextEmail || '').toLowerCase();
    if (draftOwner && draftOwner === loginEmail) return;

    [
      'applicationForm',
      'uploadedDocs',
      'documentsUploaded',
      'documentsUploadedCount',
      'currentApplication',
      'calculatedFeeString'
    ].forEach(function(key) { sessionStorage.removeItem(key); });

    Object.keys(sessionStorage).forEach(function(key) {
      if (key.indexOf('upload_status') === 0 || key.indexOf('upload_error') === 0) {
        sessionStorage.removeItem(key);
      }
    });
  }

  clearApplicantDraftIfNeeded(fullMatch.email);
  sessionStorage.removeItem('applicationRef');
  Object.keys(sessionStorage).forEach(function(key) {
    if (key.indexOf('notifsRead_') === 0) sessionStorage.removeItem(key);
  });
  sessionStorage.setItem('applicantLastLoginAt', new Date().toISOString());
  sessionStorage.setItem('loggedInUser', JSON.stringify({
    id: fullMatch.id || '',
    empId: fullMatch.empId || fullMatch.id || '',
    name: fullMatch.name,
    email: fullMatch.email,
    phone: fullMatch.phone || '',
    role: fullMatch.role
  }));

  if (fullMatch.role && fullMatch.role.toLowerCase() === 'applicant') {
    localStorage.setItem('user', JSON.stringify({
      name: fullMatch.name,
      email: fullMatch.email,
      phone: fullMatch.phone || ''
    }));
  }

  // Resolve the destination while the validated role is still in scope. This
  // prevents a delayed callback from falling back to the current login URL.
  var dashboardPath = DASHBOARDS[fullMatch.role.toLowerCase()];
  if (!dashboardPath) {
    showError(roleSelect, 'No dashboard is available for this role.');
    return;
  }

  var btn = document.querySelector('button');
  if (btn) { btn.textContent = 'Redirecting...'; btn.disabled = true; }

  var auditEntry = {
    time: new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    user: fullMatch.name,
    role: formatAuditRole(fullMatch.role),
    action: 'Login',
    module: 'Authentication',
    desc: 'Login successful',
    ip: '127.0.0.1'
  };
  writeAuditLog(auditEntry);
  window.location.assign(dashboardPath);
}

function showError(el, msg) {
  el.style.borderColor = '#dc2626';
  var err = document.createElement('div');
  err.className = 'login-error';
  err.style.cssText = 'color:#dc2626;font-size:12px;margin-top:4px;';
  err.textContent = '⚠ ' + msg;
  el.parentNode.insertBefore(err, el.nextSibling);
}

function clearAllErrors() {
  document.querySelectorAll('.login-error').forEach(function(e) { e.remove(); });
  [emailInput, passwordInput, roleSelect].forEach(function(el) { if(el) el.style.borderColor=''; });
}

document.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleLogin(); });
