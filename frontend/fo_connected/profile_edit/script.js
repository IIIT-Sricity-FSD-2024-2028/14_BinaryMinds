document.addEventListener('DOMContentLoaded', function() {
  var stored = {};
  try {
      stored = JSON.parse(localStorage.getItem('fo_profile_data')) || {};
  } catch(e) {}

  if (stored.name) document.getElementById('profName').value = stored.name;
  if (stored.email) document.getElementById('profEmail').value = stored.email;
  if (stored.phone) document.getElementById('profPhone').value = stored.phone;
  if (stored.dept) document.getElementById('profDept').value = stored.dept;
  if (stored.location) document.getElementById('profLocation').value = stored.location;
  if (stored.role) document.getElementById('profRole').value = stored.role;

  var form = document.getElementById('editProfileForm');
  form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      var dataToSave = {
          name: document.getElementById('profName').value,
          email: document.getElementById('profEmail').value,
          phone: document.getElementById('profPhone').value,
          dept: document.getElementById('profDept').value,
          location: document.getElementById('profLocation').value,
          role: document.getElementById('profRole').value
      };

      localStorage.setItem('fo_profile_data', JSON.stringify(dataToSave));
      
      alert('Profile updated successfully!');
      window.location.href = '../profile/index.html';
  });
});
