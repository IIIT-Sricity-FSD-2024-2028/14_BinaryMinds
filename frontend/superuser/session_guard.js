(function () {
  var user = null;
  try {
    user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
  } catch (error) {
    user = null;
  }

  var role = String(user && user.role || '').toLowerCase();
  if (!user || typeof user.name !== 'string' || !user.name.trim() || typeof user.email !== 'string' || !user.email.trim() || typeof user.role !== 'string' || !user.role.trim() || typeof user.accessToken !== 'string' || !user.accessToken.trim() || role !== 'superuser') {
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    window.location.href = '../applicant_connected/connected/login/index.html';
  }
})();
