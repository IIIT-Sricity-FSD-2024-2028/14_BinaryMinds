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
  if (!window.fetch) return Promise.resolve([]);

  return fetch('http://localhost:3000/api/users', {
    headers: { role: 'department_officer' }
  })
  .then(function(response) {
    if (!response.ok) return [];
    return response.json();
  })
  .then(function(users) {
    if (!Array.isArray(users)) return [];
    return users.map(normalizeStoredUser);
  })
  .catch(function() {
    return [];
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

  // Include applicant registrations and Super User-created field officers from localStorage
  var backendUsers = await getBackendLoginUsers();
  var allUsers = MOCK_USERS.concat(getStoredLoginUsers(), backendUsers);

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

  sessionStorage.setItem('loggedInUser', JSON.stringify({
    id: fullMatch.id || '',
    empId: fullMatch.empId || fullMatch.id || '',
    name: fullMatch.name,
    email: fullMatch.email,
    phone: fullMatch.phone || '',
    role: fullMatch.role
  }));

  var btn = document.querySelector('button');
  if (btn) { btn.textContent = 'Redirecting...'; btn.disabled = true; }

  setTimeout(function() {
    window.location.href = DASHBOARDS[fullMatch.role.toLowerCase()];
  }, 800);
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
