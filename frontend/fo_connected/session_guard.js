(function() {
  function safeParse(value) {
    try { return JSON.parse(value); } catch (error) { return null; }
  }

  var user = safeParse(sessionStorage.getItem('loggedInUser') || 'null');
  if (!user || typeof user.name !== 'string' || !user.name.trim() || typeof user.email !== 'string' || !user.email.trim() || typeof user.role !== 'string' || !user.role.trim() || typeof user.accessToken !== 'string' || !user.accessToken.trim()) {
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    window.location.href = '../../applicant_connected/connected/login/index.html';
    return;
  }

  var role = (user.role || '').toLowerCase();
  var isFieldOfficer = role === 'field officer' || role === 'fieldofficer' || role === 'field_officer';
  if (!isFieldOfficer) {
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    window.location.href = '../../applicant_connected/connected/login/index.html';
  }
})();
