var MOCK_USERS = [
  { id: 1, name: 'Ramesh', email: 'ramesh@tradezo.gov.in', password: 'TradeZo@123', role: 'municipal_commissioner', municipality_id: 'muni-hyd', phone: '9876500001' },
  { id: 2, name: 'Ravi', email: 'ravi@tradezo.gov.in', password: 'TradeZo@123', role: 'field officer', municipality_id: 'muni-hyd', phone: '9876500002', empId: 'FO-HYD-001' },
  { id: 3, name: 'Kumar', email: 'kumar@tradezo.gov.in', password: 'TradeZo@123', role: 'department officer', municipality_id: 'muni-hyd', phone: '9876500003', empId: 'DO-HYD-001' },
  { id: 4, name: 'Suraj', email: 'suraj@tradezo.gov.in', password: 'TradeZo@123', role: 'municipal_commissioner', municipality_id: 'muni-blr', phone: '9876500004' },
  { id: 5, name: 'Arjun', email: 'arjun@tradezo.gov.in', password: 'TradeZo@123', role: 'field officer', municipality_id: 'muni-blr', phone: '9876500005', empId: 'FO-BLR-001' },
  { id: 6, name: 'Naveen', email: 'naveen@tradezo.gov.in', password: 'TradeZo@123', role: 'department officer', municipality_id: 'muni-blr', phone: '9876500006', empId: 'DO-BLR-001' },
  { id: 7, name: 'Demo Citizen', email: 'applicant@tradezo.gov.in', password: 'TradeZo@123', role: 'applicant', municipality_id: 'muni-hyd', phone: '9876500007' }
];

// login is at: applicant_connected/connected/login/
var DASHBOARDS = {
  "applicant":          "../Applicant dashboard/index.html",
  "field officer":      "../../../fo_connected/fodashboard/index.html",
  "department officer": "../../../do_connected/dashboard/index.html",
  "municipal_commissioner": "../../../superuser/index.html"
};

var emailInput    = document.querySelector('input[type="text"]');
var passwordInput = document.querySelector('input[type="password"]');
var roleSelect    = document.querySelector('select');

function clearAllErrors() {
  var errorElements = document.querySelectorAll('.login-error');
  errorElements.forEach(function(el) { el.remove(); });
  var formInputs = document.querySelectorAll('input, select');
  formInputs.forEach(function(el) { el.style.borderColor = ''; });
}

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
    password: user.password || user.password_hash || (role === 'field officer' ? 'TradeZo@123' : ''),
    role: role,
    status: user.status || 'Active',
    empId: user.empId || user.id || '',
    municipality_id: user.municipality_id || 'muni-hyd'
  };
}

function getStoredLoginUsers() {
  var registered = safeJsonArray('registeredUsers').map(normalizeStoredUser);
  var superUserCreated = safeJsonArray('users')
    .map(normalizeStoredUser)
    .filter(function(user) { return user.role === 'field officer'; })
    .map(function(user) {
      user.password = user.password || 'TradeZo@123';
      return user;
    });

  return registered.concat(superUserCreated);
}

function formatAuditRole(role) {
  var normalized = String(role || '').toLowerCase().replace(/_/g, ' ').trim();
  if (normalized === 'municipal commissioner') return 'Municipal Commissioner (Admin)';
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

async function handleLogin() {
  clearAllErrors();
  var emailEl = document.getElementById('loginEmail') || document.querySelector('input[type="text"]');
  var passEl = document.getElementById('loginPassword') || document.querySelector('input[type="password"]');
  var roleEl = document.getElementById('roleSelect') || document.querySelector('select');
  var btn = document.getElementById('loginBtn') || document.querySelector('button');

  var email    = (emailEl ? emailEl.value : '').trim();
  var password = (passEl ? passEl.value : '').trim();
  var role     = (roleEl ? roleEl.value : '');

  if (!email)    { showError(emailEl || emailInput, 'Email is required.');       return; }
  if (!password) { showError(passEl || passwordInput, 'Password is required.'); return; }
  if (!role)     { showError(roleEl || roleSelect, 'Please select your role.'); return; }

  var backendRole = {
    'applicant': 'applicant',
    'field officer': 'field_officer',
    'department officer': 'department_officer',
    'municipal_commissioner': 'municipal_commissioner'
  }[role.toLowerCase()];

  if (btn) {
    btn.textContent = 'Signing in...';
    btn.disabled = true;
  }

  // 1. Try Backend Authentication First
  try {
    var loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password, role: backendRole })
    });
    var loginPayload = await loginResponse.json().catch(function() { return {}; });
    
    if (loginResponse.ok && loginPayload.accessToken && loginPayload.user) {
      var canonicalRole = {
        applicant: 'applicant',
        field_officer: 'field officer',
        department_officer: 'department officer',
        municipal_commissioner: 'municipal_commissioner'
      }[String(loginPayload.user.role || '').toLowerCase()] || '';

      if (canonicalRole === role.toLowerCase()) {
        var dashboard = DASHBOARDS[canonicalRole];
        if (dashboard) {
          sessionStorage.setItem('accessToken', loginPayload.accessToken);
          sessionStorage.setItem('loggedInUser', JSON.stringify({
            id: loginPayload.user.user_id,
            name: loginPayload.user.full_name,
            email: loginPayload.user.email,
            phone: loginPayload.user.phone || '',
            role: canonicalRole,
            municipality_id: loginPayload.user.municipality_id || '',
            accessToken: loginPayload.accessToken
          }));
          
          if (canonicalRole === 'applicant') {
            localStorage.setItem('user', JSON.stringify({
              name: loginPayload.user.full_name,
              email: loginPayload.user.email,
              phone: loginPayload.user.phone || ''
            }));
          }

          clearApplicantDraftIfNeeded(loginPayload.user.email);
          sessionStorage.removeItem('applicationRef');
          sessionStorage.setItem('applicantLastLoginAt', new Date().toISOString());

          var auditEntry = {
            time: new Date().toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }),
            user: loginPayload.user.full_name,
            role: formatAuditRole(canonicalRole),
            action: 'Login',
            module: 'Authentication',
            desc: 'Login successful (API)',
            ip: '127.0.0.1'
          };
          writeAuditLog(auditEntry);

          if (btn) btn.textContent = 'Redirecting...';
          window.location.assign(dashboard);
          return;
        }
      }
    } else if (loginResponse.status === 400 || loginResponse.status === 401 || loginResponse.status === 404) {
      if (btn) { btn.textContent = 'Login'; btn.disabled = false; }
      showError(passEl || passwordInput, loginPayload.message || 'Invalid email, password, or role.');
      return;
    }
  } catch (netErr) {
    console.warn('Backend unavailable, trying offline demo authentication...', netErr);
  }

  // 2. Offline / Standalone Mock Authentication Fallback
  var deletedEmails = safeJsonArray('deletedUserEmails');
  var activeMockUsers = MOCK_USERS.filter(function(u) {
    return deletedEmails.indexOf((u.email || '').toLowerCase()) === -1;
  });
  
  var allUsers = activeMockUsers.concat(getStoredLoginUsers());

  var emailMatch = allUsers.find(function(u) { return u.email.toLowerCase() === email.toLowerCase(); });
  if (!emailMatch) {
    if (btn) { btn.textContent = 'Login'; btn.disabled = false; }
    showError(emailInput, 'No account found with this email.');
    return;
  }

  var passMatch = allUsers.find(function(u) {
    return u.email.toLowerCase() === email.toLowerCase() && u.password === password;
  });
  if (!passMatch) {
    if (btn) { btn.textContent = 'Login'; btn.disabled = false; }
    showError(passwordInput, 'Incorrect password.');
    return;
  }

  var fullMatch = allUsers.find(function(u) {
    return u.email.toLowerCase() === email.toLowerCase() &&
           u.password === password &&
           u.role.toLowerCase() === role.toLowerCase();
  });
  if (!fullMatch) {
    if (btn) { btn.textContent = 'Login'; btn.disabled = false; }
    showError(roleSelect, 'Wrong role selected. Your role is: ' + passMatch.role);
    return;
  }

  clearApplicantDraftIfNeeded(fullMatch.email);
  sessionStorage.removeItem('applicationRef');
  Object.keys(sessionStorage).forEach(function(key) {
    if (key.indexOf('notifsRead_') === 0) sessionStorage.removeItem(key);
  });
  sessionStorage.setItem('applicantLastLoginAt', new Date().toISOString());
  sessionStorage.setItem('accessToken', 'mock-token-' + (fullMatch.role || 'user'));
  sessionStorage.setItem('loggedInUser', JSON.stringify({
    id: fullMatch.id || 1,
    empId: fullMatch.empId || fullMatch.id || '',
    name: fullMatch.name,
    email: fullMatch.email,
    phone: fullMatch.phone || '',
    role: fullMatch.role,
    municipality_id: fullMatch.municipality_id || '',
    accessToken: 'mock-token-' + (fullMatch.role || 'user')
  }));

  if (fullMatch.role && fullMatch.role.toLowerCase() === 'applicant') {
    localStorage.setItem('user', JSON.stringify({
      name: fullMatch.name,
      email: fullMatch.email,
      phone: fullMatch.phone || ''
    }));
  }

  var dashboardPath = DASHBOARDS[fullMatch.role.toLowerCase()];
  if (!dashboardPath) {
    if (btn) { btn.textContent = 'Login'; btn.disabled = false; }
    showError(roleSelect, 'No dashboard is available for this role.');
    return;
  }

  if (btn) { btn.textContent = 'Redirecting...'; btn.disabled = true; }

  var auditEntry = {
    time: new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }),
    user: fullMatch.name,
    role: formatAuditRole(fullMatch.role),
    action: 'Login',
    module: 'Authentication',
    desc: 'Login successful (Offline Demo)',
    ip: '127.0.0.1'
  };
  writeAuditLog(auditEntry);
  window.location.assign(dashboardPath);
}

function showError(el, msg) {
  if (!el) return;
  el.style.borderColor = '#dc2626';
  var err = document.createElement('div');
  err.className = 'login-error';
  err.style.cssText = 'color:#dc2626;font-size:12px;margin-top:4px;';
  err.textContent = '⚠ ' + msg;
  el.parentNode.insertBefore(err, el.nextSibling);
}

function quickFill(email, role, autoLogin, password) {
  clearAllErrors();
  var emailField = document.getElementById('loginEmail') || document.querySelector('input[type="text"]');
  var passField  = document.getElementById('loginPassword') || document.querySelector('input[type="password"]');
  var roleField  = document.getElementById('roleSelect') || document.querySelector('select');
  
  if (emailField) emailField.value = email;
  if (passField)  passField.value  = password || 'TradeZo@123';
  if (roleField) {
    roleField.value = role;
    roleField.dispatchEvent(new Event('change'));
  }
  
  // Highlight active demo card
  document.querySelectorAll('.officer-demo-card').forEach(function(card) {
    card.classList.remove('active-demo-card');
  });
  var matchingCard = document.querySelector('[data-email="' + email.toLowerCase() + '"]');
  if (matchingCard) {
    matchingCard.classList.add('active-demo-card');
  }

  if (autoLogin) {
    handleLogin();
  }
}
window.quickFill = quickFill;

function copyCredential(text, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  var success = function() {
    showCopyToast('Copied: ' + text);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(success).catch(function() {
      fallbackCopy(text, success);
    });
  } else {
    fallbackCopy(text, success);
  }
}
window.copyCredential = copyCredential;

function fallbackCopy(text, callback) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    if (callback) callback();
  } catch (err) {
    showCopyToast('Credential: ' + text);
  }
  document.body.removeChild(ta);
}

function showCopyToast(msg) {
  var existing = document.getElementById('demo-copy-toast');
  if (existing) existing.remove();
  
  var toast = document.createElement('div');
  toast.id = 'demo-copy-toast';
  toast.textContent = msg;
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1E3A8A;color:#ffffff;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;transition:opacity 0.2s ease;';
  document.body.appendChild(toast);
  
  setTimeout(function() {
    toast.style.opacity = '0';
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 250);
  }, 1800);
}

function filterDemoOfficers(filter, tabBtn) {
  document.querySelectorAll('.demo-tab-btn').forEach(function(b) {
    b.classList.remove('active-tab');
  });
  if (tabBtn) tabBtn.classList.add('active-tab');
  
  var cards = document.querySelectorAll('.officer-demo-card');
  cards.forEach(function(card) {
    var muni = card.getAttribute('data-muni') || '';
    var role = card.getAttribute('data-role') || '';
    if (filter === 'all' || muni === filter || role === filter) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}
window.filterDemoOfficers = filterDemoOfficers;

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') handleLogin();
});

