// fo_connected/fodashboard/db.js
// Uses TRADEZO mock data from mockdata.js

document.addEventListener('DOMContentLoaded', function() {
  var user = TRADEZO.getLoggedInUser();

  // Set welcome name
  var welcomeEl = document.querySelector('.welcome-name, .user-name, b');
  if (welcomeEl && user.name) welcomeEl.textContent = user.name;

  // Fill stat cards
  var stats = TRADEZO.stats.fieldOfficer;
  var statEls = document.querySelectorAll('.stat-number, .stat-value, .count');
  if (statEls[0]) statEls[0].textContent = stats.applicationsSubmitted;
  if (statEls[1]) statEls[1].textContent = stats.pendingInspections;
  if (statEls[2]) statEls[2].textContent = stats.completedToday;
  if (statEls[3]) statEls[3].textContent = stats.slaAlerts;

  // Fill assigned inspections table
  var tbody = document.getElementById('tableBody');
  if (tbody) {
    tbody.innerHTML = '';
    TRADEZO.inspections.filter(function(i) { return i.status === 'Scheduled'; }).forEach(function(ins) {
      tbody.innerHTML += '<tr><td>' + ins.appId + '</td><td>' + ins.businessName + '</td><td>' + ins.address + '</td></tr>';
    });
  }
});