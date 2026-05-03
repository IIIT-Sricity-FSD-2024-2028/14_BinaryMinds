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
  var btns = document.querySelectorAll('.export-btn');
  btns.forEach(function(btn) {
    if (btn.textContent.includes('Export Report')) {
      btn.addEventListener('click', function () {
        downloadCSV();
      });
    }
  });

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

/* Render Violated Licenses */
function renderViolations() {
  var tbody = document.querySelector('#violationTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  var suspended = [];
  try { suspended = JSON.parse(localStorage.getItem('tz_suspended_licenses') || '[]'); } catch(e){}

  // Mock an array of violations based strictly on TRADEZO active licenses
  var violations = [];
  if (window.TRADEZO && window.TRADEZO.licenses) {
    // Filter only those approved and in working condition (status: 'Active')
    var activeLicenses = window.TRADEZO.licenses.filter(function(lic) {
      return lic.status === 'Active';
    });
    
    var mockReasons = [
      'Failed Safety Audit (Pending Resolve)',
      'Multiple public complaints reported',
      'Operating without proper fire clearances'
    ];
    
    activeLicenses.forEach(function(lic, idx) {
      violations.push({
        id: lic.id,
        name: lic.businessName,
        sub: lic.category,
        reason: mockReasons[idx % mockReasons.length],
        date: lic.issueDate
      });
    });
  }
  
  // Check if these are already suspended
  var activeViolations = violations.filter(v => !suspended.includes(v.id));

  if (activeViolations.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#64748b;">No active violations found.</td></tr>';
    return;
  }

  activeViolations.forEach(function(v) {
    var tr = document.createElement('tr');
    tr.innerHTML = 
      '<td>' +
        '<div class="entity-icon" style="background:#fef2f2;color:#ef4444;font-size:18px;">&#9888;</div>' +
        '<div><div class="ename">' + v.name + '</div><div class="esub">' + v.sub + '</div></div>' +
      '</td>' +
      '<td>#' + v.id + '</td>' +
      '<td style="color:#ef4444;font-weight:500;">' + v.reason + '</td>' +
      '<td><button class="suspend-btn" onclick="suspendLicense(\'' + v.id + '\')">Suspend</button></td>';
    tbody.appendChild(tr);
  });
}

window.suspendLicense = function(id) {
  if (confirm('Are you sure you want to suspend license ' + id + '? This action is immediate.')) {
    var suspended = [];
    try { suspended = JSON.parse(localStorage.getItem('tz_suspended_licenses') || '[]'); } catch(e){}
    suspended.push(id);
    localStorage.setItem('tz_suspended_licenses', JSON.stringify(suspended));
    renderViolations();
  }
};

document.addEventListener('DOMContentLoaded', function() {
  renderViolations();
});
