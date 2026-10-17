(function () {
  var form = document.getElementById('registrationForm');
  var message = document.getElementById('registrationMessage');
  var button = form && form.querySelector('.btn-register');
  if (!form || !button) return;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    message.textContent = '';
    message.style.color = '#b91c1c';

    var fullName = document.getElementById('fullName');
    var email = document.getElementById('email');
    var phone = document.getElementById('phone');
    var password = document.getElementById('password');
    var confirmPassword = document.getElementById('confirmPassword');
    var terms = document.getElementById('terms');

    if (!form.reportValidity()) return;
    if (password.value !== confirmPassword.value) {
      confirmPassword.setCustomValidity('Passwords do not match.');
      confirmPassword.reportValidity();
      confirmPassword.setCustomValidity('');
      return;
    }
    if (!terms.checked) {
      message.textContent = 'Please agree to the Terms & Conditions to create an account.';
      terms.focus();
      return;
    }

    button.disabled = true;
    var originalText = button.textContent;
    button.textContent = 'Registering...';

    try {
      var response = await fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.value.trim(),
          email: email.value.trim(),
          phone: phone.value.trim(),
          password: password.value
        })
      });
      var payload = await response.json().catch(function () { return {}; });
      if (!response.ok) {
        var errorMessage = Array.isArray(payload.message)
          ? payload.message.join(' ')
          : (payload.message || 'Registration failed. Please try again.');
        throw new Error(errorMessage);
      }

      message.style.color = '#047857';
      message.textContent = 'Account created. Redirecting to login...';
      form.reset();
      window.location.href = '../login/index.html';
    } catch (error) {
      message.textContent = error.message || 'Unable to register. Check your connection and try again.';
      button.disabled = false;
      button.textContent = originalText;
    }
  });
})();
