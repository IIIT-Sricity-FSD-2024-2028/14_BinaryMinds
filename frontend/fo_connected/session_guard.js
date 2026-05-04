(function() {
  function safeParse(value) {
    try { return JSON.parse(value); } catch (error) { return null; }
  }

  var user = safeParse(sessionStorage.getItem('loggedInUser') || 'null');
  if (!user) return;

  var role = (user.role || '').toLowerCase();
  var isFieldOfficer = role === 'field officer' || role === 'fieldofficer';
  if (role && !isFieldOfficer) {
    window.location.href = '../../applicant_connected/connected/login/index.html';
  }
})();
