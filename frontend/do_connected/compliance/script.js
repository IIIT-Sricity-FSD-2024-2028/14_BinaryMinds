// Generated Licenses page

function safeArray(key) {
  try {
    var value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch(e) {
    return [];
  }
}

function getAppId(item) {
  return item.appId || item.id || item.appRef || item.applicationId || '';
}

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function isDemoRecord(item) {
  if (window.TRADEZO && typeof TRADEZO.isDemoRecord === 'function') {
    return TRADEZO.isDemoRecord(item);
  }
  var demoNames = {
    'green valley restaurant': true,
    'singh electronics': true,
    'sharma healthcare': true,
    'tech hub electronics': true
  };
  return !!demoNames[normalizeText(item && (item.businessName || item.business || item.business_name))];
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return '-';
  var date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function findApplication(appId) {
  var sources = []
    .concat((window.TRADEZO && TRADEZO.applications) ? TRADEZO.applications : [])
    .concat(safeArray('tradezo_applications'))
    .concat(safeArray('applications'))
    .concat(safeArray('tz_submitted_apps'));

  return sources.find(function(app) {
    return getAppId(app) === appId || app.appRef === appId;
  }) || null;
}

function normalizeLicense(raw) {
  var appId = raw.appId || raw.applicationId || '';
  var app = appId ? findApplication(appId) : null;
  var issueDate = raw.licenseIssueDate || raw.issueDate || raw.date || '';

  return {
    appId: appId || '-',
    applicantName: raw.applicantName || raw.applicant || raw.ownerName || (app ? (app.applicantName || app.applicant || app.ownerName || app.full_name) : '') || '-',
    licenseNo: raw.licenseNo || raw.id || raw.licenseId || '-',
    businessName: raw.businessName || raw.business || (app ? app.businessName : '') || 'Unknown Business',
    category: raw.category || raw.tradeCategory || (app ? (app.tradeCategory || app.category) : '') || '-',
    issueDate: issueDate,
    expiryDate: raw.licenseExpiryDate || raw.expiryDate || '',
    status: raw.status || 'Active',
    sortDate: new Date(issueDate || raw.date || 0)
  };
}

function collectDoStatusLicenses(storage) {
  var licenses = [];
  for (var i = 0; i < storage.length; i++) {
    var key = storage.key(i);
    if (!key || key.indexOf('doAppStatus_') !== 0) continue;

    var state = null;
    try { state = JSON.parse(storage.getItem(key) || 'null'); } catch(e) {}
    if (!state || state.status !== 'licensed' || !state.licenseNo) continue;

    var appId = key.replace('doAppStatus_', '');
    var app = findApplication(appId);
    licenses.push(normalizeLicense({
      appId: appId,
      licenseNo: state.licenseNo,
      businessName: app ? app.businessName : 'Unknown Business',
      category: app ? (app.tradeCategory || app.category) : '-',
      status: 'Active',
      date: new Date().toISOString()
    }));
  }
  return licenses;
}

function getGeneratedLicenses() {
  var licenses = [];

  if (window.TRADEZO && Array.isArray(TRADEZO.licenses)) {
    TRADEZO.licenses.forEach(function(lic) {
      licenses.push(normalizeLicense(lic));
    });
  }

  safeArray('tz_generated_licenses').forEach(function(lic) {
    licenses.push(normalizeLicense(lic));
  });

  licenses = licenses
    .concat(collectDoStatusLicenses(localStorage))
    .concat(collectDoStatusLicenses(sessionStorage));

  var loggedInUser = null;
  try { loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null'); } catch(e){}
  var currentMuniId = (loggedInUser && (loggedInUser.municipality_id || loggedInUser.municipalityId)) || '';

  var seen = {};
  licenses = licenses.filter(function(lic) {
    if (isDemoRecord(lic)) return false;
    if (!lic.licenseNo || lic.licenseNo === '-') return false;
    if (currentMuniId && window.TRADEZO && typeof TRADEZO.isAllowedForTenant === 'function') {
      var app = lic.appId ? findApplication(lic.appId) : null;
      if (!TRADEZO.isAllowedForTenant(lic, currentMuniId) && (!app || !TRADEZO.isAllowedForTenant(app, currentMuniId))) {
        return false;
      }
    }
    if (seen[lic.licenseNo]) return false;
    seen[lic.licenseNo] = true;
    return true;
  });

  licenses.sort(function(a, b) {
    return b.sortDate - a.sortDate;
  });

  return licenses;
}

function renderStats(licenses) {
  var today = new Date().toDateString();
  var totalEl = document.getElementById('totalLicenses');
  var activeEl = document.getElementById('activeLicenses');
  var todayEl = document.getElementById('todayLicenses');

  var active = licenses.filter(function(lic) {
    return String(lic.status || '').toLowerCase() === 'active';
  }).length;

  var generatedToday = licenses.filter(function(lic) {
    var date = new Date(lic.issueDate || lic.sortDate);
    return !isNaN(date.getTime()) && date.toDateString() === today;
  }).length;

  if (totalEl) totalEl.textContent = licenses.length;
  if (activeEl) activeEl.textContent = active;
  if (todayEl) todayEl.textContent = generatedToday;
}

function renderTable(licenses) {
  var tbody = document.getElementById('licensesBody');
  var countText = document.getElementById('countText');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (countText) countText.textContent = 'Showing ' + licenses.length + ' license(s)';

  if (!licenses.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No generated licenses found.</td></tr>';
    return;
  }

  licenses.forEach(function(lic) {
    tbody.innerHTML +=
      '<tr>' +
        '<td>' + escapeHtml(lic.appId) + '</td>' +
        '<td>' + escapeHtml(lic.applicantName) + '</td>' +
        '<td class="license-no">' + escapeHtml(lic.licenseNo) + '</td>' +
        '<td>' + escapeHtml(lic.businessName) + '</td>' +
        '<td>' + escapeHtml(lic.category) + '</td>' +
        '<td>' + escapeHtml(formatDate(lic.issueDate)) + '</td>' +
        '<td>' + escapeHtml(formatDate(lic.expiryDate)) + '</td>' +
        '<td><span class="status-badge">' + escapeHtml(lic.status || 'Active') + '</span></td>' +
      '</tr>';
  });
}

function exportLicenses(licenses) {
  var headers = ['Application ID', 'Applicant Name', 'License Number', 'Business Name', 'Category', 'Issue Date', 'Expiry Date', 'Status'];
  var rows = licenses.map(function(lic) {
    return [lic.appId, lic.applicantName, lic.licenseNo, lic.businessName, lic.category, formatDate(lic.issueDate), formatDate(lic.expiryDate), lic.status];
  });

  var csv = [headers].concat(rows).map(function(row) {
    return row.map(function(cell) {
      return '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"';
    }).join(',');
  }).join('\n');

  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'generated_licenses_' + new Date().toISOString().slice(0, 10) + '.csv';
  link.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', function() {
  var licenses = getGeneratedLicenses();
  renderStats(licenses);
  renderTable(licenses);

  var search = document.getElementById('searchInput');
  if (search) {
    search.addEventListener('input', function() {
      var query = this.value.toLowerCase().trim();
      var filtered = licenses.filter(function(lic) {
        return [
          lic.appId,
          lic.applicantName,
          lic.licenseNo,
          lic.businessName,
          lic.category,
          lic.status
        ].join(' ').toLowerCase().includes(query);
      });
      renderTable(filtered);
    });
  }

  var exportBtn = document.getElementById('exportLicenses');
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      exportLicenses(licenses);
    });
  }
});
