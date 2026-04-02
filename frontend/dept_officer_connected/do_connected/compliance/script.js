/* Load Chart.js dynamically */
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
script.onload = function () {
  var canvas = document.getElementById('donut');
  if (!canvas) return;
  new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [900, 220, 110, 54],
        backgroundColor: ['#0d1b4b', '#f59e0b', '#cbd5e1', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      cutout: '72%',
      responsive: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } }
    }
  });
};
document.head.appendChild(script);

document.addEventListener('DOMContentLoaded', function () {

  /* Export button → print */
  var exportBtn = document.querySelector('.export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function () { window.print(); });
  }

  /* Go Back → dashboard */
  var goBackBtn = document.querySelector('.go-back');
  if (goBackBtn) {
    goBackBtn.addEventListener('click', function () {
      window.location.href = '../dashboard/index.html';
    });
  }
});