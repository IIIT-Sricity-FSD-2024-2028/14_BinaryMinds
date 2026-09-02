// Helper: show error under a field
function showError(input, message) {
  clearError(input);
  input.style.borderColor = '#e53935';
  var error = document.createElement('span');
  error.className = 'error-msg';
  error.style.cssText = 'color:#e53935;font-size:11px;margin-top:4px;display:block;';
  error.innerText = message;
  input.parentElement.appendChild(error);
}

function clearError(input) {
  input.style.borderColor = '#ccc';
  var existing = input.parentElement.querySelector('.error-msg');
  if (existing) existing.remove();
}

// Clear errors while typing
document.querySelectorAll('input').forEach(function(input) {
  input.addEventListener('input', function() { clearError(input); });
});

// Register button click
document.querySelector('.btn-register').addEventListener('click', async function() {
  var inputs   = document.querySelectorAll('input');
  var name     = inputs[0];
  var email    = inputs[1];
  var phone    = inputs[2];
  var password = inputs[3];
  var confirm  = inputs[4];
  var terms    = document.getElementById('terms');
  var valid    = true;

  // Full Name
  if (!name.value.trim()) {
    showError(name, 'Full name is required.'); valid = false;
  } else if (name.value.trim().length < 3) {
    showError(name, 'Name must be at least 3 characters.'); valid = false;
  }

  // Email
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim()) {
    showError(email, 'Email address is required.'); valid = false;
  } else if (!emailPattern.test(email.value.trim())) {
    showError(email, 'Enter a valid email address.'); valid = false;
  } else {
    // Check if email already registered
    var existing = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    var duplicate = existing.find(function(u) {
      return u.email.toLowerCase() === email.value.trim().toLowerCase();
    });
    if (duplicate) { showError(email, 'This email is already registered.'); valid = false; }
  }

  // Phone
  var phoneVal = phone.value.trim();
  if (!phoneVal) {
    showError(phone, 'Phone number is required.'); valid = false;
  } else if (!/^\d{10}$/.test(phoneVal)) {
    showError(phone, 'Enter a valid 10-digit phone number.'); valid = false;
  } else if (/^0{10}$/.test(phoneVal)) {
    showError(phone, 'Phone number cannot be all zeros.'); valid = false;
  }

  // Password
  if (!password.value) {
    showError(password, 'Password is required.'); valid = false;
  } else if (password.value.length < 6) {
    showError(password, 'Password must be at least 6 characters.'); valid = false;
  }

  // Confirm Password
  if (!confirm.value) {
    showError(confirm, 'Please confirm your password.'); valid = false;
  } else if (confirm.value !== password.value) {
    showError(confirm, 'Passwords do not match.'); valid = false;
  }

  // Terms
  if (!terms.checked) {
    var termsLabel = terms.parentElement;
    if (!termsLabel.querySelector('.error-msg')) {
      var err = document.createElement('span');
      err.className = 'error-msg';
      err.style.cssText = 'color:#e53935;font-size:11px;display:block;margin-top:4px;';
      err.innerText = 'You must agree to the Terms & Conditions.';
      termsLabel.appendChild(err);
    }
    valid = false;
  } else {
    var existingErr = terms.parentElement.querySelector('.error-msg');
    if (existingErr) existingErr.remove();
  }

  var btn = document.querySelector('.btn-register');
  var originalBtnText = btn ? btn.innerText : 'Register';
  if (btn) {
    btn.innerText = 'Registering...';
    btn.disabled = true;
  }

  var registeredUser = null;
  try {
    var response = await fetch('http://localhost:3000/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: name.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        password: password.value
      })
    });

    if (response.ok) {
      var data = await response.json();
      registeredUser = {
        id: data.user_id || Date.now(),
        user_id: data.user_id || Date.now(),
        name: data.full_name || name.value.trim(),
        full_name: data.full_name || name.value.trim(),
        email: data.email || email.value.trim(),
        phone: data.phone || phone.value.trim(),
        password: password.value,
        role: 'applicant',
        municipality_id: data.municipality_id || undefined,
        created_at: data.created_at || new Date().toISOString()
      };
    } else {
      var error = await response.json().catch(function() { return {}; });
      var errMsg = Array.isArray(error.message) ? error.message[0] : (error.message || 'Registration failed.');
      if (errMsg.toLowerCase().includes('email')) {
        showError(email, errMsg);
      } else if (errMsg.toLowerCase().includes('phone')) {
        showError(phone, errMsg);
      } else {
        showError(email, errMsg);
      }
      if (btn) {
        btn.innerText = originalBtnText;
        btn.disabled = false;
      }
      return;
    }
  } catch (error) {
    console.warn('Backend server unreachable, creating local applicant profile...', error);
    // Offline / Local fallback registration
    registeredUser = {
      id: Date.now(),
      user_id: Date.now(),
      name: name.value.trim(),
      full_name: name.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      password: password.value,
      role: 'applicant',
      municipality_id: undefined,
      created_at: new Date().toISOString()
    };
  }

  // Persist into localStorage registeredUsers
  if (registeredUser) {
    var existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    var filtered = existingUsers.filter(function(u) {
      return (u.email || '').toLowerCase() !== registeredUser.email.toLowerCase();
    });
    filtered.push(registeredUser);
    localStorage.setItem('registeredUsers', JSON.stringify(filtered));
  }

  alert('Account registered successfully! You can now login with your email and password.');
  window.location.href = '../login/index.html';
});
