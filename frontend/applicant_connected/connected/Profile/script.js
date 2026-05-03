// Profile/script.js — fills page from session, saves edits back

document.addEventListener('DOMContentLoaded', function() {

  // 1. Get logged-in user
  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null'); } catch(e){}
  if (!user) { window.location.href = '../login/index.html'; return; }

  // 2. Also pull extra details from localStorage (phone, etc.)
  var extra = {};
  try { extra = JSON.parse(localStorage.getItem('user') || '{}'); } catch(e){}
  // Merge registered user if available
  var registered = [];
  try { registered = JSON.parse(localStorage.getItem('registeredUsers') || '[]'); } catch(e){}
  var regUser = registered.find(function(u){ return u.email && u.email.toLowerCase() === user.email.toLowerCase(); }) || {};

  var phone = regUser.phone || extra.phone || user.phone || '';

  // 3. Fill profile card — name, email, phone
  var nameEl  = document.querySelector('.profile-info h2');
  var emailEl = document.querySelector('.profile-info p:nth-child(2)');
  var phoneEl = document.querySelector('.profile-info p:nth-child(3)');
  if (nameEl)  nameEl.textContent  = user.name  || 'User';
  if (emailEl) emailEl.innerHTML   = '<i class="fa-solid fa-at"></i> ' + (user.email || '');
  if (phoneEl) phoneEl.innerHTML   = '<i class="fa-solid fa-phone"></i> ' + (phone ? '+91 ' + phone : 'Not provided');

  // 4. Fill detail grid — Aadhaar, Gender, DOB from application form if available
  var formData = {};
  try { formData = JSON.parse(sessionStorage.getItem('applicationForm') || '{}'); } catch(e){}

  var detailCells = document.querySelectorAll('.detail-grid > div p');
  if (detailCells[0]) detailCells[0].textContent = formData.aadhaar
    ? 'XXXX-XXXX-' + String(formData.aadhaar).slice(-4)
    : '—';
  if (detailCells[1]) detailCells[1].textContent = formData.gender || '—';
  // DOB and nationality stay as-is from HTML design

  // 5. Fill address from application form if available
  var addrEl = document.querySelector('.address-block p');
  if (addrEl && formData.shopAddress) {
    addrEl.innerHTML =
      (formData.shopAddress || '') + ',<br/>' +
      (formData.city ? formData.city + ', ' : '') +
      (formData.state || '') +
      (formData.pincode ? ' - ' + formData.pincode : '');
  }

  // 6. Activity — fill login line with actual name
  var actStrong = document.querySelector('.act-item:first-child .act-info strong');
  if (actStrong) actStrong.textContent = 'Login Successful';
  var actP = document.querySelector('.act-item:first-child .act-info p');
  if (actP) actP.textContent = 'Logged in as ' + user.name + ' (' + user.role + ')';

  // 7. Fill application ref in activity if available
  var appRef = sessionStorage.getItem('applicationRef') || '';
  if (appRef) {
    var appActP = document.querySelectorAll('.act-info p');
    if (appActP[1]) {
      appActP[1].textContent = 'Trade License Application ' + appRef;
    }
    if (appActP[2]) {
      appActP[2].textContent = '₹5,000 processed for application ' + appRef;
    }
  }

  // 8. Camera icon
  var cam = document.querySelector('.cam-icon');
  if (cam) cam.addEventListener('click', function() {
    alert('Photo upload feature coming soon!');
  });

  // 9. Nav active links
  document.querySelectorAll('nav a').forEach(function(link) {
    link.addEventListener('click', function() {
      document.querySelectorAll('nav a').forEach(function(a){ a.classList.remove('active'); });
      this.classList.add('active');
    });
  });
});

// Edit / Save toggle
var editMode = false;
function toggleEdit() {
  editMode = !editMode;
  var btn = document.querySelector('.btn-edit');

  if (editMode) {
    btn.innerHTML = '<i class="fa-solid fa-save"></i> Save Profile';
    btn.style.background = '#1a7a3f';
    document.querySelectorAll('.detail-grid p, .address-block p').forEach(function(p) {
      var val = p.textContent;
      p.innerHTML = '<input type="text" value="' + val + '" style="border:1px solid #ccc;border-radius:4px;padding:4px 8px;font-size:13px;width:100%"/>';
    });
  } else {
    btn.innerHTML = '<i class="fa-solid fa-pen"></i> Edit Profile';
    btn.style.background = '#1a3a8f';
    document.querySelectorAll('.detail-grid p, .address-block p').forEach(function(p) {
      var input = p.querySelector('input');
      if (input) p.textContent = input.value;
    });
    // Save name/phone edits back to session
    var user = null;
    try { user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null'); } catch(e){}
    if (user) {
      sessionStorage.setItem('loggedInUser', JSON.stringify(user));
    }
    alert('Profile updated successfully!');
  }
}
