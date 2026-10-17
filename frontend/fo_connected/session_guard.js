(function () {
  document.documentElement.style.visibility = 'hidden';
  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null'); } catch (error) {}
  var token = sessionStorage.getItem('accessToken') || '';
  var role = String(user && user.role || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (!user || !user.email || !token || !['field_officer', 'fieldofficer'].includes(role)) {
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    window.location.href = '../../applicant_connected/connected/login/index.html';
    return;
  }

  fetch('http://localhost:3000/api/users/me', { headers: { Authorization: 'Bearer ' + token } })
    .then(function (response) {
      if (!response.ok) throw new Error('Session expired');
      return response.json();
    })
    .then(function (profile) {
      if (!profile || profile.role !== 'field_officer') throw new Error('Invalid role');
      document.documentElement.style.visibility = '';
    })
    .catch(function () {
      sessionStorage.removeItem('loggedInUser');
      sessionStorage.removeItem('accessToken');
      window.location.href = '../../applicant_connected/connected/login/index.html';
    });
})();
