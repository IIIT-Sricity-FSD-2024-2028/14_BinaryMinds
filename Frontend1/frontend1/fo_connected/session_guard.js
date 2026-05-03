(function() {
  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null'); } catch(e){}
  if (!user) { window.location.href = '../../applicant_connected/connected/login/index.html'; return; }
  if (user.role && user.role.toLowerCase() !== 'field officer') {
    window.location.href = '../../applicant_connected/connected/login/index.html';
  }
})();
