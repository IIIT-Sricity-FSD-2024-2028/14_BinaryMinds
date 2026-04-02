(function() {
  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null'); } catch(e){}
  if (!user) { window.location.href = '../login/index.html'; return; }
  if (user.role && user.role.toLowerCase() !== 'applicant') {
    window.location.href = '../login/index.html';
  }
})();
