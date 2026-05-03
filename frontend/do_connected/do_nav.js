/* =====================================================
   do_nav.js — Department Officer shared navigation
   ===================================================== */

var DO_PAGES = {
  dashboard:     '../dashboard/index.html',
  worklist:      '../worklist/index.html',
  review:        '../review/index.html',
  authorization: '../authorization/index.html',
  compliance:    '../compliance/index.html',
  inspection:    '../inspection-report/index.html',
  login: '../../applicant_connected/connected/login/index.html'
};

function doNav(page) {
  if (DO_PAGES[page]) window.location.href = DO_PAGES[page];
}

function doLogout() {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.clear();
    localStorage.removeItem('loggedInUser');
    window.location.href = DO_PAGES.login;
  }
}

/* Auto-wire ALL sidebar nav items on every page */
document.addEventListener('DOMContentLoaded', function () {

  /* Wire sidebar nav-item divs (dashboard page style) */
  document.querySelectorAll('.nav-item, .nav').forEach(function (item) {
    var text = item.textContent.trim().toLowerCase();
    item.style.cursor = 'pointer';

    if (text.includes('dashboard'))            item.addEventListener('click', function(){ doNav('dashboard'); });
    if (text.includes('worklist'))             item.addEventListener('click', function(){ doNav('worklist'); });
    if (text.includes('final authorization') || text.includes('authorization'))
                                               item.addEventListener('click', function(){ doNav('authorization'); });
    if (text.includes('compliance') || text.includes('reports'))
                                               item.addEventListener('click', function(){ doNav('compliance'); });
  });

  /* Wire sidebar anchor nav-items (worklist page style) */
  document.querySelectorAll('.sidebar nav a.nav-item, aside nav a').forEach(function(link) {
    var text = link.textContent.trim().toLowerCase();
    link.style.cursor = 'pointer';

    if (text.includes('dashboard'))     { link.href = DO_PAGES.dashboard; }
    if (text.includes('worklist'))      { link.href = DO_PAGES.worklist; }
    if (text.includes('authorization')) { link.href = DO_PAGES.authorization; }
    if (text.includes('compliance') || text.includes('reports'))
                                        { link.href = DO_PAGES.compliance; }
  });

  /* Wire ALL logout buttons */
  document.querySelectorAll('.logout-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      doLogout();
    });
  });

  /* Load username from session */
  var user = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
  var nameEl = document.querySelector('.user-name, .officer-name, .welcome-name');
  if (nameEl && user && user.name) nameEl.textContent = user.name;
});