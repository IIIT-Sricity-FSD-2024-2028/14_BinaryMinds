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

  /* Export button → CSV download */
  var exportBtn = document.querySelector('.export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      downloadCSV();
    });
  }

  /* Go Back → dashboard */
  var goBackBtn = document.querySelector('.go-back');
  if (goBackBtn) {
    goBackBtn.addEventListener('click', function () {
      window.location.href = '../dashboard/index.html';
    });
  }
});

function downloadCSV() {
  // Build CSV from TRADEZO licenses data
  var headers = ['License ID', 'Business Name', 'Owner Name', 'Category', 'Issue Date', 'Expiry Date', 'Status'];
  var rows = [];

  TRADEZO.licenses.forEach(function(lic) {
    rows.push([
      lic.id,
      lic.businessName,
      lic.ownerName,
      lic.category,
      lic.issueDate,
      lic.expiryDate,
      lic.status
    ]);
  });

  // Build CSV string
  var csv = headers.join(',') + '\n';
  rows.forEach(function(row) {
    var escaped = row.map(function(cell) {
      // Escape quotes and wrap in quotes if contains comma
      var str = String(cell).replace(/"/g, '""');
      if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1) {
        str = '"' + str + '"';
      }
      return str;
    });
    csv += escaped.join(',') + '\n';
  });

  // Create and trigger download
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  var url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'compliance_report_' + new Date().toISOString().slice(0, 10) + '.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
