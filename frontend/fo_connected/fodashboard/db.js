// fo_connected/fodashboard/db.js
// Shows only the applications assigned to the logged-in field officer.

function safeArray(key) {
  try {
    var value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch(e) {
    return [];
  }
}

function currentOfficer() {
  if (window.foCurrentOfficer) return window.foCurrentOfficer();
  try { return JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch(e) { return {}; }
}

function isAssignedToCurrentOfficer(item) {
  if (window.foIsAssignedToCurrentOfficer) return window.foIsAssignedToCurrentOfficer(item);
  var officer = currentOfficer();
  return [item.assignedFO, item.foName, item.fieldOfficerEmail]
    .filter(Boolean)
    .map(function(value) { return String(value).toLowerCase(); })
    .indexOf(String(officer.email || officer.name || officer.id || '').toLowerCase()) !== -1;
}

function getAssignedApplications() {
  var centralApps = (window.TRADEZO && TRADEZO.applications) ? TRADEZO.applications : [];
  var localApps = safeArray('applications').concat(safeArray('tz_submitted_apps'));
  var merged = centralApps.concat(localApps);
  var seen = {};

  return merged.filter(function(app) {
    var id = app.id || app.appRef || '';
    if (!id || seen[id]) return false;
    seen[id] = true;
    return isAssignedToCurrentOfficer(app);
  });
}

function renderStats(apps) {
  var cards = document.querySelectorAll('.cards .card h2');
  var pending = apps.filter(function(app) {
    var status = String(app.status || '').toLowerCase();
    return status === 'scheduled' || status === 'pending inspection' || status === 'under verification' || status === 'pending';
  }).length;
  var completed = apps.filter(function(app) {
    var status = String(app.status || '').toLowerCase();
    return status === 'inspection completed' || status === 'inspection recorded' || status === 'completed' || status === 'approved';
  }).length;

  if (cards[0]) cards[0].textContent = apps.length;
  if (cards[1]) cards[1].textContent = pending;
  if (cards[2]) cards[2].textContent = completed;
  if (cards[3]) cards[3].textContent = pending > 0 ? Math.min(pending, 2) : 0;
}

function renderAssignedTable(apps) {
  var tableBody = document.getElementById('applicationTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  if (apps.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5">No applications assigned to you yet.</td></tr>';
    return;
  }

  apps.slice().reverse().forEach(function(app) {
    tableBody.innerHTML +=
      '<tr>' +
        '<td>' + (app.id || app.appRef || '') + '</td>' +
        '<td>' + (app.applicantName || app.applicant || app.ownerName || '') + '</td>' +
        '<td>' + (app.businessName || app.business || '') + '</td>' +
        '<td>' + (app.status || '') + '</td>' +
        '<td>' + (app.submittedDate || app.date || '') + '</td>' +
      '</tr>';
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var officer = currentOfficer();
  var welcomeEl = document.querySelector('.welcome-name, .user-name, .user-info b');
  if (welcomeEl && officer.name) welcomeEl.textContent = officer.name;

  var apps = getAssignedApplications();
  renderStats(apps);
  renderAssignedTable(apps);

  var search = document.getElementById('search');
  if (search) {
    search.addEventListener('input', function() {
      var q = this.value.toLowerCase();
      var filtered = apps.filter(function(app) {
        return [
          app.id, app.appRef, app.applicantName, app.businessName, app.shopAddress, app.address
        ].join(' ').toLowerCase().includes(q);
      });
      renderAssignedTable(filtered);
    });
  }
});
