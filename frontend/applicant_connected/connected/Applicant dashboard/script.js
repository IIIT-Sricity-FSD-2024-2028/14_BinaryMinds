// Applicant dashboard/script.js — state-based, uses TRADEZO + localStorage

window.addEventListener('DOMContentLoaded', function() {
  var user = TRADEZO.getLoggedInUser();

  // Welcome name
  var welcomeEl = document.getElementById('welcomeText');
  if (welcomeEl) welcomeEl.textContent = user.name ? 'Welcome, ' + user.name : 'Welcome';

  // Find this user's application
  var appRef = sessionStorage.getItem('applicationRef') || '';
  var hasApplied = localStorage.getItem('hasApplied') === 'true';

  var app = null;
  if (appRef) {
    app = TRADEZO.applications.find(function(a){ return a.appRef === appRef || a.id === appRef; }) || null;
  }
  if (!app && user.email) {
    app = TRADEZO.applications.find(function(a){
      return a.email && a.email.toLowerCase() === user.email.toLowerCase();
    }) || null;
  }
  if (!app && user.name) {
    app = TRADEZO.applications.find(function(a){
      return a.applicantName && a.applicantName.toLowerCase() === user.name.toLowerCase();
    }) || null;
  }

  var statusTable = document.getElementById('appStatusTable');
  var noAppMsg    = document.getElementById('noAppMsg');

  // ---- NEW USER: no application ----
  if (!app && !hasApplied) {
    if (statusTable) statusTable.style.display = 'none';
    if (noAppMsg)    noAppMsg.style.display    = 'block';
    // Also hide the license and tasks sections
    var gridEl = document.querySelector('.grid');
    if (gridEl) gridEl.style.display = 'none';
    var tasksEl = document.querySelector('.card:last-of-type');
    if (tasksEl) tasksEl.style.display = 'none';
    return;
  }

  // ---- HAS APPLICATION: show status ----
  if (noAppMsg) noAppMsg.style.display = 'none';

  if (app && statusTable) {
    statusTable.style.display = 'table';
    var tbody   = statusTable.querySelector('tbody') || statusTable;
    var color   = TRADEZO.statusColor(app.status);
    var dataRow = null;
    tbody.querySelectorAll('tr').forEach(function(r){ if (r.querySelector('td')) dataRow = r; });
    if (dataRow) {
      var cells = dataRow.querySelectorAll('td');
      if (cells[0]) cells[0].textContent = app.id || app.appRef;
      if (cells[1]) cells[1].textContent = app.businessName;
      if (cells[2]) cells[2].innerHTML =
        '<span class="badge" style="background:' + color + ';color:#fff;padding:4px 12px;border-radius:12px;font-size:11px;font-weight:700;">' +
        app.status.toUpperCase() + '</span>';
      if (cells[3]) cells[3].textContent = app.submittedDate;
    }
  }

  // Show/hide license card
  var gridEl = document.querySelector('.grid');
  if (gridEl) {
    var cards = gridEl.querySelectorAll('.card');
    if (app && (app.status === 'Approved') && app.licenseId) {
      if (cards[1]) cards[1].style.display = '';
    } else {
      if (cards[1]) cards[1].style.display = 'none';
    }
  }
});

function handleLogout() {
  sessionStorage.clear();
  localStorage.removeItem('user');
  window.location.href = '../login/index.html';
}

function goPayment() {
  window.location.href = '../paynow/index.html';
}
