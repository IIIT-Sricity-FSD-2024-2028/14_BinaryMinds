/* =====================================================
   fo_nav.js — Field Officer shared navigation
   ===================================================== */

var FO_PAGES = {
  dashboard:          '../fodashboard/index.html',
  verification:       '../verification/index.html',
  detail:             '../detail/index.html',
  scheduleInspection: '../scheduleinspection/index.html',
  startInspection:    '../start inspection/index.html',
  recordInspection:   '../recordinspection/index.html',
  inspectionHistory:  '../inspectionhistory/index.html',
  verificationHistory:'../verificationhistory/index.html',
  profile:            '../profile/index.html',
  sla:                '../sla/index.html',
  login: '../../applicant_connected/connected/login/index.html'
};

function foNav(page) {
  if (FO_PAGES[page]) window.location.href = FO_PAGES[page];
}

function foLogout() {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.clear();
    localStorage.removeItem('loggedInUser');
    window.location.href = FO_PAGES.login;
  }
}

/* Auto-wire sidebar <li> items on every page */
document.addEventListener('DOMContentLoaded', function () {
  var liItems = document.querySelectorAll('.sidebar li, .sidebar ul li');
  liItems.forEach(function (li) {
    var text = li.textContent.trim().toLowerCase();
    li.style.cursor = 'pointer';

    if (text.includes('dashboard'))            { li.onclick = function(){ foNav('dashboard'); }; }
    if (text.includes('verification history')) { li.onclick = function(){ foNav('verificationHistory'); }; }
    else if (text.includes('verification'))    { li.onclick = function(){ foNav('verification'); }; }
    if (text.includes('record inspection'))    { li.onclick = function(){ foNav('recordInspection'); }; }
    if (text.includes('inspection history'))   { li.onclick = function(){ foNav('inspectionHistory'); }; }
    if (text.includes('profile'))              { li.onclick = function(){ foNav('profile'); }; }
    if (text.includes('logout'))               { li.onclick = function(){ foLogout(); }; }
    if (text.includes('sla'))                  { li.onclick = function(){ foNav('sla'); }; }
  });

  /* Also wire logout icon/button if present */
  var logoutIcon = document.querySelector('.logout-icon, [alt="logout"], img[src*="logout"]');
  if (logoutIcon) {
    logoutIcon.style.cursor = 'pointer';
    logoutIcon.onclick = function(){ foLogout(); };
  }
});
