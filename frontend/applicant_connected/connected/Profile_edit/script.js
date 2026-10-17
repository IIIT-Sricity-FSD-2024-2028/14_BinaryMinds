document.addEventListener('DOMContentLoaded', function () {
  var loggedIn = {};
  try { loggedIn = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch (error) {}
  var applications = window.TRADEZO && Array.isArray(TRADEZO.applications) ? TRADEZO.applications : [];
  var app = applications.find(function (item) {
    return String(item.applicant_id || '') === String(loggedIn.user_id || loggedIn.id || '') ||
      String(item.email || '').toLowerCase() === String(loggedIn.email || '').toLowerCase();
  }) || {};
  var address = app.shopAddress || app.address || '';
  if (address && app.city) address += ', ' + app.city;
  if (address && app.state) address += ', ' + app.state;
  if (address && app.pincode) address += ' - ' + app.pincode;

  document.getElementById('profName').value = loggedIn.full_name || loggedIn.name || app.applicantName || '';
  document.getElementById('profEmail').value = loggedIn.email || '';
  document.getElementById('profPhone').value = loggedIn.phone || app.phone || '';
  document.getElementById('profAddress').value = address;
  var aadhaar = app.aadhaar || '';
  document.getElementById('profAadhaar').value = aadhaar ? 'XXXX-XXXX-' + String(aadhaar).slice(-4) : '';
  document.getElementById('profGender').value = app.gender || '';

  var form = document.getElementById('editProfileForm');
  var button = form.querySelector('[type="submit"]');
  var message = document.getElementById('profileEditMessage');
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    var userId = loggedIn.user_id || loggedIn.id;
    var token = sessionStorage.getItem('accessToken') || '';
    if (!userId || !token) {
      message.textContent = 'Your session is incomplete. Please sign in again.';
      return;
    }

    button.disabled = true;
    message.textContent = 'Saving profile...';
    try {
      var response = await fetch('http://localhost:3000/api/users/' + encodeURIComponent(userId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          full_name: document.getElementById('profName').value.trim(),
          email: document.getElementById('profEmail').value.trim(),
          phone: document.getElementById('profPhone').value.trim()
        })
      });
      var payload = await response.json().catch(function () { return {}; });
      if (!response.ok) {
        throw new Error(Array.isArray(payload.message) ? payload.message.join(' ') : (payload.message || 'Unable to update profile.'));
      }

      loggedIn.user_id = payload.user_id;
      loggedIn.id = payload.user_id;
      loggedIn.full_name = payload.full_name;
      loggedIn.name = payload.full_name;
      loggedIn.email = payload.email;
      loggedIn.phone = payload.phone || '';
      sessionStorage.setItem('loggedInUser', JSON.stringify(loggedIn));
      localStorage.setItem('user', JSON.stringify({ name: payload.full_name, email: payload.email, phone: payload.phone || '' }));
      message.textContent = 'Profile updated successfully.';
    } catch (error) {
      message.textContent = error.message || 'Unable to update profile. Please try again.';
    } finally {
      button.disabled = false;
    }
  });
});
