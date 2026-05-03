// DO worklist/script.js — uses TRADEZO mock data

// Removed state-clearing on reload to persist changes

// Shared state functions (same as authorization)
function getAppStatus(appId) {
  var data = localStorage.getItem('doAppStatus_' + appId);
  return data ? JSON.parse(data) : { status: 'pending', licenseNo: null };
}

function setAppStatus(appId, status, licenseNo) {
  localStorage.setItem('doAppStatus_' + appId, JSON.stringify({ status: status, licenseNo: licenseNo || null }));
}

document.addEventListener('DOMContentLoaded', function() {
  var tbody = document.querySelector('tbody');
  var searchInput = document.querySelector('.search-bar input, input[type="text"]');
  var paginationInfo = document.querySelector('.pagination span');

  // Function to render table
  function renderTable(applications) {
    if (!tbody) return;
    tbody.innerHTML = '';
    // Filter to show ONLY applications that have been inspected by the Field Officer
    applications = applications.filter(function(app) {
      var thisAppId = app.id || app.appRef;
      var hasInspection = false;
      
      // 1. Check direct mockdata result
      if (app.inspectionResult && app.inspectionResult !== 'Pending') hasInspection = true;
      
      // 2. Check mockdata.inspections array
      if (window.TRADEZO && window.TRADEZO.inspections) {
        var ins = window.TRADEZO.inspections.find(function(i) { return i.appId === thisAppId; });
        if (ins && ins.result && ins.result !== 'Pending') hasInspection = true;
      }
      
      // 3. Check dynamic localStorage inspections (created by FO)
      var lsInspections = [];
      try { lsInspections = JSON.parse(localStorage.getItem('tz_inspection_reports') || '[]'); } catch(e){}
      if (lsInspections.some(function(r) { return r.appId === thisAppId; })) hasInspection = true;
      
      return hasInspection;
    });

    // Sort applications by most recent
    applications.sort(function(a, b) {
      var dateA = new Date(a.submittedDate || 0);
      var dateB = new Date(b.submittedDate || 0);
      return dateB - dateA;
    });

    // Remove duplicates by business name, keeping the most recent
    var seen = new Set();
    var uniqueApps = applications.filter(function(app) {
      var key = app.businessName || app.applicantName || app.id || app.appRef;
      if (!key) return true; // keep if no key
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    uniqueApps.forEach(function(app) {
      var thisAppId = app.id || app.appRef;

      // Get DO action status from shared localStorage
      var appData = getAppStatus(thisAppId);
      var doStatus = appData.status;
      var licenseNo = appData.licenseNo;

      // Determine Status badge
      var statusBadge = '';
      if (doStatus === 'licensed' && licenseNo) {
        statusBadge = '<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Licensed</span>';
      } else if (doStatus === 'approved') {
        statusBadge = '<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Approved</span>';
      } else if (doStatus === 'rejected') {
        statusBadge = '<span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Rejected</span>';
      } else {
        statusBadge = '<span style="background:#fef3c7;color:#d97706;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Pending</span>';
      }

      // Determine Action
      var actionHtml = '';
      if (doStatus === 'licensed' && licenseNo) {
        actionHtml = '<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">' + licenseNo + '</span>';
      } else if (doStatus === 'approved') {
        actionHtml = '<button class="review-btn" data-id="' + thisAppId + '" style="background:#16a34a;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Authorized</button>';
      } else if (doStatus === 'rejected') {
        actionHtml = '<span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Rejected</span>';
      } else {
        actionHtml = '<button class="review-btn" data-id="' + thisAppId + '" style="background:#1E3A8A;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;">View Report</button>';
      }
      
      var row = document.createElement('tr');
      row.setAttribute('data-id', thisAppId);
      row.setAttribute('data-submitted', app.submittedDate);
      
      row.innerHTML =
        '<td style="color:#1E3A8A;font-weight:600;">' + thisAppId + '</td>' +
        '<td><strong>' + app.businessName + '</strong><br><small style="color:#64748b;">' + (app.tradeCategory || app.category) + '</small></td>' +
        '<td>' + app.submittedDate + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + actionHtml + '</td>';
      tbody.appendChild(row);
    });

    // Wire View Report buttons
    document.querySelectorAll('.review-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var appId = this.getAttribute('data-id');
        sessionStorage.setItem('selectedAppDO', appId);
        window.location.href = '../inspection-report/index.html';
      });
    });

    // Update pagination
    if (paginationInfo) {
      paginationInfo.textContent = 'Showing 1 to ' + applications.length + ' of ' + applications.length + ' applications';
    }
  }

  // Initial render
  renderTable(TRADEZO.applications);

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      var q = this.value.toLowerCase();
      document.querySelectorAll('tbody tr').forEach(function(row) {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  // Filter tabs
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      var filter = this.textContent.trim().toLowerCase();
      
      var filtered = TRADEZO.applications.filter(function(app) {
        if (filter === 'all applications') return true;
        if (filter === 'urgent') {
          // Urgent: Applications with older submission dates (submitted before Jan 2026)
          var dateStr = app.submittedDate;
          var date = new Date(dateStr);
          var cutoff = new Date('2026-01-01');
          return date < cutoff;
        }
        return true;
      });
      
      renderTable(filtered);
    });
  });
});
