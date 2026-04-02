// DO dashboard/script.js — uses TRADEZO mock data
document.addEventListener('DOMContentLoaded', function() {
  var user   = TRADEZO.getLoggedInUser();
  var stats  = TRADEZO.stats.deptOfficer;

  // Welcome message
  var nameEl = document.querySelector('.welcome-name, .officer-name, h1');
  if (nameEl && user.name) nameEl.textContent = 'Welcome, ' + user.name + '!';

  // Stats cards
  var statCards = document.querySelectorAll('.stat-value, .stat-number, .count-big');
  if (statCards[0]) statCards[0].textContent = stats.pendingApplications.toLocaleString();
  if (statCards[1]) statCards[1].textContent = stats.licensesIssued.toLocaleString();
  if (statCards[2]) statCards[2].textContent = stats.slaCompliance;

  // Chart
  var ctx = document.getElementById('chart');
  if (ctx && window.Chart) {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ label: 'Applications',
          data: [850, 620, 1250, 510, 1420, 320, 440],
          borderColor: '#0d1b4b', backgroundColor: 'rgba(13,27,75,0.08)',
          borderWidth: 2, tension: 0.4, fill: true }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }
});