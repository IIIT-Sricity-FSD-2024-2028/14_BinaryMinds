// DO worklist/script.js — uses TRADEZO mock data

// Clear sessionStorage on hard refresh to revert state
(function() {
  var nav = performance.getEntriesByType('navigation')[0];
  if (nav && nav.type === 'reload') {
    // Hard refresh detected - clear all doAppStatus keys
    Object.keys(sessionStorage).forEach(function(key) {
      if (key.startsWith('doAppStatus_') || key.startsWith('doRejectReason_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
})();

// Shared state functions (same as authorization)
function getAppStatus(appId) {
  var data = sessionStorage.getItem('doAppStatus_' + appId);
  return data ? JSON.parse(data) : { status: 'pending', licenseNo: null };
}

function setAppStatus(appId, status, licenseNo) {
  sessionStorage.setItem('doAppStatus_' + appId, JSON.stringify({ status: status, licenseNo: licenseNo || null }));
}

document.addEventListener('DOMContentLoaded', function() {
  var tbody = document.querySelector('tbody');
  var searchInput = document.querySelector('.search-bar input, input[type="text"]');
  var paginationInfo = document.querySelector('.pagination span');

  // Function to render table
  function renderTable(applications) {
    if (!tbody) return;
    tbody.innerHTML = '';
    
    applications.forEach(function(app) {
      // Get DO action status from shared sessionStorage
      var appData = getAppStatus(app.id);
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
        actionHtml = '<button class="review-btn" data-id="' + app.id + '" style="background:#16a34a;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Authorized</button>';
      } else if (doStatus === 'rejected') {
        actionHtml = '<span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Rejected</span>';
      } else {
        actionHtml = '<button class="review-btn" data-id="' + app.id + '" style="background:#1E3A8A;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;">View Report</button>';
      }
      
      var row = document.createElement('tr');
      row.setAttribute('data-id', app.id);
      row.setAttribute('data-submitted', app.submittedDate);
      
      row.innerHTML =
        '<td style="color:#1E3A8A;font-weight:600;">' + app.id + '</td>' +
        '<td><strong>' + app.businessName + '</strong><br><small style="color:#64748b;">' + app.tradeCategory + '</small></td>' +
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
