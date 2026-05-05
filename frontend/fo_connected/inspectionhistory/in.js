// fo_connected/inspectionhistory/in.js
function loadHistoryData() {
  var base = window.TRADEZO && Array.isArray(TRADEZO.inspections)
    ? TRADEZO.inspections.filter(function(i){ return isCompleted(i.status); })
    : [];
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem('tz_inspection_reports') || '[]'); } catch(e){ saved = []; }
  if (!Array.isArray(saved)) saved = [];

  function clean(val) {
    if (val == null) return '';
    var text = String(val).trim();
    var lower = text.toLowerCase();
    if (!text || lower === 'undefined' || lower === 'null' || lower === 'n/a' || text === '-' || text === '—') return '';
    return text;
  }

  function firstValue() {
    for (var i = 0; i < arguments.length; i++) {
      var value = clean(arguments[i]);
      if (value) return value;
    }
    return 'N/A';
  }

  function appIdOf(item) {
    if (!item) return '';
    return clean(item.appId) ||
      clean(item.id) ||
      clean(item.appRef) ||
      clean(item.applicationId) ||
      clean(item.application_id);
  }

  function isCompleted(status) {
    var normalized = clean(status).toLowerCase().replace(/[_-]/g, ' ');
    return normalized === 'completed' || normalized === 'inspection completed' || normalized === 'inspection recorded';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeArray(key) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch(e) {
      return [];
    }
  }

  function findByAppId(list, id) {
    return list.find(function(item) {
      return String(appIdOf(item)) === String(id);
    }) || {};
  }

  var apps = []
    .concat(window.TRADEZO && Array.isArray(TRADEZO.applications) ? TRADEZO.applications : [])
    .concat(safeArray('tz_submitted_apps'))
    .concat(safeArray('applications'))
    .concat(safeArray('tradezo_applications'));

  function normalizeInspection(item) {
    var id = appIdOf(item);
    var report = findByAppId(saved, id);
    var app = findByAppId(apps, id);
    var merged = Object.assign({}, app, item, report);

    return {
      appId: id,
      businessName: firstValue(merged.businessName, merged.business_name, merged.business, app.businessName),
      type: firstValue(
        merged.type,
        merged.tradeCategory,
        merged.trade_category,
        merged.category,
        merged.licenseType,
        merged.businessType,
        merged.business_type
      ),
      date: firstValue(
        merged.inspectionDate,
        merged.date,
        merged.scheduledDate,
        merged.scheduled_date,
        merged.completedDate,
        merged.completed_date
      ),
      submittedDate: firstValue(merged.submittedDate, merged.completedDate, merged.completed_date, merged.date),
      result: firstValue(
        merged.result,
        merged.inspectionResult,
        isCompleted(merged.status) ? 'Approved' : merged.status
      ),
      status: 'Completed'
    };
  }

  saved.forEach(function(report) {
    var reportId = appIdOf(report);
    var exists = base.some(function(item){ return String(appIdOf(item)) === String(reportId); });
    if (!exists) {
      base.push(report);
    }
  });

  base = base
    .map(normalizeInspection)
    .filter(function(item) { return clean(item.appId); });

  window.escapeInspectionHistoryHtml = escapeHtml;

  return window.TRADEZO && typeof TRADEZO.sortFreshFirst === 'function'
    ? TRADEZO.sortFreshFirst(base)
    : base;
}

function renderTable(data) {
  var table     = document.getElementById('historyTable');
  var countText = document.getElementById('countText');
  if (!table) return;

  table.innerHTML = '';
  if (countText) countText.innerText = 'Showing ' + data.length + ' inspection(s)';

  data.forEach(function(item) {
    var statusClass = String(item.result || '').toLowerCase() === 'rejected' ? 'rejected' : 'approved';
    var esc = window.escapeInspectionHistoryHtml || function(v) { return v; };
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + esc(item.appId) + '</td>' +
      '<td>' + esc(item.businessName) + '</td>' +
      '<td>' + esc(item.type) + '</td>' +
      '<td>' + esc(item.date) + '</td>' +
      '<td><span class="status ' + statusClass + '">' + esc(item.result) + '</span></td>' +
      '<td>' + esc(item.submittedDate) + '</td>' +
      '<td><button class="view-btn" data-id="' + esc(item.appId) + '">View Report</button></td>';
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
  var historyData = loadHistoryData();
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
