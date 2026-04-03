// fo_connected/inspectionhistory/in.js
function loadHistoryData() {
  var base = TRADEZO ? TRADEZO.inspections.filter(function(i){ return i.status === 'Completed'; }) : [];
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem('tz_inspection_reports') || '[]'); } catch(e){ saved = []; }
  if (!Array.isArray(saved)) saved = [];

  saved.forEach(function(report) {
    var exists = base.some(function(item){ return item.appId === report.appId; });
    if (!exists) {
      base.push({
        appId: report.appId,
        businessName: report.businessName,
        type: report.type,
        date: report.date,
        result: report.result,
        status: 'Completed'
      });
    }
  });

  return base;
}

function renderTable(data) {
  var table     = document.getElementById('historyTable');
  var countText = document.getElementById('countText');
  if (!table) return;

  table.innerHTML = '';
  if (countText) countText.innerText = 'Showing ' + data.length + ' inspection(s)';

  data.forEach(function(item) {
    var statusClass = item.result === 'Approved' ? 'approved' : 'rejected';
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + item.appId + '</td>' +
      '<td>' + item.businessName + '</td>' +
      '<td>' + item.type + '</td>' +
      '<td>' + item.date + '</td>' +
      '<td><span class="status ' + statusClass + '">' + item.result + '</span></td>' +
      '<td>' + item.date + '</td>' +
      '<td><button class="view-btn" data-id="' + item.appId + '">View Report</button></td>';
    table.appendChild(tr);
  });

  document.querySelectorAll('.view-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      sessionStorage.setItem('selectedApp', this.getAttribute('data-id'));
      window.location.href = '../inspection_report/index.html';
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var historyData = loadHistoryData().reverse();
  renderTable(historyData);
  var searchEl = document.getElementById('searchInput');
  if (searchEl) {
    searchEl.addEventListener('input', function() {
      var val = this.value.toLowerCase();
      var filtered = historyData.filter(function(i) {
        return i.businessName.toLowerCase().includes(val) || i.appId.toLowerCase().includes(val);
      });
      renderTable(filtered);
    });
  }
});