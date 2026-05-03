document.addEventListener('DOMContentLoaded', function() {
  /* Load user name from session */
  var user = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
  var nameEl = document.querySelector('.profile-name, .officer-name, h2.name');
  if (nameEl && user && user.name) nameEl.textContent = user.name;

  /* Edit Profile btn → allow editing (simple toggle) */
  var editBtn = document.querySelector('.edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', function() {
      var inputs = document.querySelectorAll('.profile-form input, .profile-field input');
      inputs.forEach(function(inp) {
        inp.disabled = !inp.disabled;
      });
      this.textContent = this.textContent.includes('Edit') ? 'Save Profile' : 'Edit Profile';
    });
  }
});

/* Navigate function used in profile HTML onclick */
function navigate(path) {
  window.location.href = path;
}
