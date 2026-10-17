(function () {
  var dashboards = {
    applicant: '../Applicant dashboard/index.html',
    field_officer: '../../../fo_connected/fodashboard/index.html',
    department_officer: '../../../do_connected/dashboard/index.html',
    municipal_commissioner: '../../../superuser/index.html'
  };
  var roles = {
    applicant: 'applicant',
    'field officer': 'field_officer',
    'department officer': 'department_officer',
    municipal_commissioner: 'municipal_commissioner'
  };

  function clearAllErrors() {
    document.querySelectorAll('.login-error').forEach(function (error) { error.remove(); });
    document.querySelectorAll('input, select').forEach(function (input) { input.style.borderColor = ''; });
  }

  function showError(element, message) {
    if (!element) return;
    element.style.borderColor = '#dc2626';
    var error = document.createElement('div');
    error.className = 'login-error';
    error.style.cssText = 'color:#dc2626;font-size:12px;margin-top:4px;';
    error.textContent = message;
    element.parentNode.insertBefore(error, element.nextSibling);
  }

  function clearApplicantDraftIfNeeded(nextEmail) {
    var draft = {};
    try { draft = JSON.parse(sessionStorage.getItem('applicationForm') || '{}'); } catch (error) {}
    var draftOwner = String(draft.ownerEmail || draft.email || '').toLowerCase();
    if (draftOwner && draftOwner === String(nextEmail || '').toLowerCase()) return;

    ['applicationForm', 'uploadedDocs', 'documentsUploaded', 'documentsUploadedCount', 'currentApplication', 'calculatedFeeString', 'backendApplicationId']
      .forEach(function (key) { sessionStorage.removeItem(key); });
    Object.keys(sessionStorage).forEach(function (key) {
      if (key.indexOf('upload_status') === 0 || key.indexOf('upload_error') === 0) sessionStorage.removeItem(key);
    });
  }

  window.handleLogin = async function () {
    clearAllErrors();
    var emailEl = document.getElementById('loginEmail');
    var passwordEl = document.getElementById('loginPassword');
    var roleEl = document.getElementById('roleSelect');
    var button = document.getElementById('loginBtn');
    var email = emailEl.value.trim();
    var password = passwordEl.value;
    var requestedRole = roles[roleEl.value];

    if (!email) return showError(emailEl, 'Email or phone number is required.');
    if (!password) return showError(passwordEl, 'Password is required.');
    if (!requestedRole) return showError(roleEl, 'Please select your role.');

    var originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Signing in...';
    try {
      var response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password, role: requestedRole })
      });
      var payload = await response.json().catch(function () { return {}; });
      if (!response.ok) {
        var message = Array.isArray(payload.message) ? payload.message.join(' ') : payload.message;
        throw new Error(message || 'Invalid email, password, or role.');
      }
      if (!payload.accessToken || !payload.user || payload.user.role !== requestedRole) {
        throw new Error('The server returned an invalid login response.');
      }

      var user = payload.user;
      var sessionUser = {
        id: user.user_id,
        user_id: user.user_id,
        name: user.full_name,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || '',
        employee_id: user.employee_id || '',
        empId: user.employee_id || '',
        role: user.role === 'field_officer' ? 'field officer' : (user.role === 'department_officer' ? 'department officer' : user.role),
        municipality_id: user.municipality_id || '',
        accessToken: payload.accessToken
      };
      clearApplicantDraftIfNeeded(user.email);
      sessionStorage.setItem('accessToken', payload.accessToken);
      sessionStorage.setItem('loggedInUser', JSON.stringify(sessionUser));
      sessionStorage.removeItem('applicationRef');
      if (user.role === 'applicant') {
        localStorage.setItem('user', JSON.stringify({ name: user.full_name, email: user.email, phone: user.phone || '' }));
      }

      button.textContent = 'Redirecting...';
      window.location.assign(dashboards[user.role]);
    } catch (error) {
      showError(emailEl, error.message || 'Unable to sign in. Check the server connection and try again.');
      button.disabled = false;
      button.textContent = originalText;
    }
  };

  window.quickFill = function (email, role) {
    clearAllErrors();
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = 'TradeZo@123';
    document.getElementById('roleSelect').value = role;
  };

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.isComposing) window.handleLogin();
  });
})();
