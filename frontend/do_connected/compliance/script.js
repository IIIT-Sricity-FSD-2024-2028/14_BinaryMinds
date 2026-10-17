// Generated Licenses page

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
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fetchDepartmentData(path, token) {
  return fetch(TRADEZO.API_BASE + path, {
    cache: 'no-store',
    headers: { Authorization: 'Bearer ' + token }
  }).then(function(response) {
    return response.text().then(function(text) {
      var body = null;
      try { body = text ? JSON.parse(text) : null; } catch (e) {}
      if (!response.ok) {
        var message = body && body.message;
        if (Array.isArray(message)) message = message.join(' ');
        throw new Error(message || ('Request failed (' + response.status + ')'));
      }
      return body;
    });
  });
}

function unwrapDepartmentData(response) {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  return [];
}

function normalizeLicense(raw, applicationsById) {
  var applicationId = String(raw.application_id == null ? '' : raw.application_id);
  var app = applicationsById[applicationId] || {};
  var issueDate = raw.issued_date || '';
  var status = String(raw.status || 'UNKNOWN');
  var statusLabels = {
    active: 'Active',
    expired: 'Expired',
    suspended: 'Suspended',
    revoked: 'Revoked'
  };

  return {
    appId: app.application_ref || (applicationId ? 'APP-' + applicationId : '-'),
    applicantName: app.full_name || '-',
    licenseNo: raw.license_number || '-',
    businessName: app.business_name || '-',
    category: app.trade_category || app.business_type || '-',
    issueDate: issueDate,
    expiryDate: raw.expiry_date || '',
    status: statusLabels[status.toLowerCase()] || status,
    sortDate: issueDate ? new Date(issueDate) : new Date(0)
  };
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
    var date = new Date(lic.issueDate);
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

  if (countText) countText.textContent = 'Showing ' + licenses.length + ' license(s)';
  if (!licenses.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No generated licenses found.</td></tr>';
    return;
  }

  tbody.innerHTML = licenses.map(function(lic) {
    return '<tr>' +
      '<td>' + escapeHtml(lic.appId) + '</td>' +
      '<td>' + escapeHtml(lic.applicantName) + '</td>' +
      '<td class="license-no">' + escapeHtml(lic.licenseNo) + '</td>' +
      '<td>' + escapeHtml(lic.businessName) + '</td>' +
      '<td>' + escapeHtml(lic.category) + '</td>' +
      '<td>' + escapeHtml(formatDate(lic.issueDate)) + '</td>' +
      '<td>' + escapeHtml(formatDate(lic.expiryDate)) + '</td>' +
      '<td><span class="status-badge">' + escapeHtml(lic.status) + '</span></td>' +
      '</tr>';
  }).join('');
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

  var blobUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  var link = document.createElement('a');
  link.href = blobUrl;
  link.download = 'generated_licenses_' + new Date().toISOString().slice(0, 10) + '.csv';
  link.click();
  URL.revokeObjectURL(blobUrl);
}

document.addEventListener('DOMContentLoaded', function() {
  var token = sessionStorage.getItem('accessToken');
  var tbody = document.getElementById('licensesBody');
  var countText = document.getElementById('countText');
  var search = document.getElementById('searchInput');
  var exportBtn = document.getElementById('exportLicenses');
  var licenses = [];
  var visibleLicenses = [];

  ['totalLicenses', 'activeLicenses', 'todayLicenses'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = '—';
  });
  if (countText) countText.textContent = 'Loading licenses...';
  if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="empty-row">Loading generated licenses...</td></tr>';

  function showLoadError(error) {
    var message = error && error.message;
    if (message === 'Failed to fetch' || message === 'NetworkError when attempting to fetch resource.') {
      message = 'The TradeZo API could not be reached. Check that the backend is running and try again.';
    }
    ['totalLicenses', 'activeLicenses', 'todayLicenses'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    if (countText) countText.textContent = 'Unable to load licenses';
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="empty-row" style="color:#b91c1c;">Failed to load generated licenses: ' + escapeHtml(message || 'Please try again.') + '</td></tr>';
  }

  if (!token) {
    showLoadError(new Error('Department Officer session is missing. Please sign in again.'));
    return;
  }

  Promise.all([
    fetchDepartmentData('/licenses', token),
    fetchDepartmentData('/applications', token)
  ]).then(function(responses) {
    var applicationsById = {};
    unwrapDepartmentData(responses[1]).forEach(function(app) {
      applicationsById[String(app.application_id)] = app;
    });
    licenses = unwrapDepartmentData(responses[0]).map(function(license) {
      return normalizeLicense(license, applicationsById);
    }).filter(function(license) {
      return license.licenseNo !== '-';
    }).sort(function(a, b) {
      return b.sortDate - a.sortDate;
    });
    visibleLicenses = licenses.slice();
    renderStats(licenses);
    renderTable(visibleLicenses);
  }).catch(showLoadError);

  if (search) {
    search.addEventListener('input', function() {
      var query = this.value.toLowerCase().trim();
      visibleLicenses = licenses.filter(function(lic) {
        return [lic.licenseNo, lic.appId, lic.businessName, lic.category, lic.applicantName]
          .join(' ').toLowerCase().includes(query);
      });
      renderTable(visibleLicenses);
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      exportLicenses(visibleLicenses);
    });
  }
});
