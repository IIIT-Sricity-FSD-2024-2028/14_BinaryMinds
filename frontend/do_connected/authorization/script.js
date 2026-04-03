// DO authorization/script.js — uses TRADEZO mock data
var currentAppId = null;

// Clear sessionStorage on hard refresh to revert state
window.addEventListener('beforeunload', function() {
  sessionStorage.setItem('doLastPage', window.location.href);
});

// On page load - clear state if it's a hard refresh
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

// Shared state functions (same as worklist)
function getAppStatus(appId) {
  var data = sessionStorage.getItem('doAppStatus_' + appId);
  return data ? JSON.parse(data) : { status: 'pending', licenseNo: null };
}

function setAppStatus(appId, status, licenseNo) {
  sessionStorage.setItem('doAppStatus_' + appId, JSON.stringify({ status: status, licenseNo: licenseNo || null }));
}

// Modal helper functions
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Show approve modal
function showApproveModal(appId) {
  currentAppId = appId;
  var app = TRADEZO.getApplication(appId);
  var inspection = TRADEZO.inspections.find(function(ins) { return ins.appId === appId; });
  
  document.getElementById('approveDesc').textContent = 'Are you sure you want to approve this application?';
  document.getElementById('approveInfo').innerHTML = 
    '<p><strong>Application ID:</strong> ' + appId + '</p>' +
    '<p><strong>Business:</strong> ' + app.businessName + '</p>' +
    '<p><strong>Category:</strong> ' + app.tradeCategory + '</p>' +
    '<p><strong>FO Result:</strong> ' + (inspection ? inspection.result : 'Pending') + '</p>';
  
  openModal('approveModal');
}

// Show reject modal
function showRejectModal(appId) {
  currentAppId = appId;
  var app = TRADEZO.getApplication(appId);
  
  document.getElementById('rejectDesc').textContent = 'Please provide a reason for rejecting this application.';
  document.getElementById('rejectInfo').innerHTML = 
    '<p><strong>Application ID:</strong> ' + appId + '</p>' +
    '<p><strong>Business:</strong> ' + app.businessName + '</p>' +
    '<p><strong>Category:</strong> ' + app.tradeCategory + '</p>';
  document.getElementById('rejectReason').value = '';
  
  openModal('rejectModal');
}

// Show license modal
function showLicenseModal(appId) {
  currentAppId = appId;
  var app = TRADEZO.getApplication(appId);
  
  document.getElementById('licenseDesc').textContent = 'Ready to generate the official trade license?';
  document.getElementById('licenseInfo').innerHTML = 
    '<p><strong>Application ID:</strong> ' + appId + '</p>' +
    '<p><strong>Business:</strong> ' + app.businessName + '</p>' +
    '<p><strong>Category:</strong> ' + app.tradeCategory + '</p>';
  
  openModal('licenseModal');
}

// Confirm approve action
function confirmApprove() {
  if (!currentAppId) return;
  var app = TRADEZO.getApplication(currentAppId);
  
  setAppStatus(currentAppId, 'approved', null);
  
  closeModal('approveModal');
  
  // Show success modal
  document.getElementById('successTitle').textContent = 'Application Approved!';
  document.getElementById('successDesc').innerHTML = 
    '<strong>' + app.businessName + '</strong> has been approved.<br>Click "Generate License" to issue the license.';
  openModal('successModal');
  
  renderTable();
}

// Confirm reject action
function confirmReject() {
  if (!currentAppId) return;
  var app = TRADEZO.getApplication(currentAppId);
  var reason = document.getElementById('rejectReason').value.trim();
  
  if (!reason) {
    document.getElementById('rejectReason').style.borderColor = '#dc2626';
    document.getElementById('rejectReason').style.boxShadow = '0 0 0 3px rgba(220,38,38,0.1)';
    return;
  }
  
  setAppStatus(currentAppId, 'rejected', null);
  sessionStorage.setItem('doRejectReason_' + currentAppId, reason);
  
  closeModal('rejectModal');
  
  // Show success modal
  document.getElementById('successTitle').textContent = 'Application Rejected';
  document.getElementById('successDesc').innerHTML = 
    '<strong>' + app.businessName + '</strong> has been rejected.<br>Reason: ' + reason;
  openModal('successModal');
  
  renderTable();
}

// Confirm generate license action
function confirmGenerateLicense() {
  if (!currentAppId) return;
  var app = TRADEZO.getApplication(currentAppId);
  var licenseId = 'LIC-' + Date.now().toString().slice(-6);
  
  setAppStatus(currentAppId, 'licensed', licenseId);
  
  closeModal('licenseModal');
  
  // Show license success modal
  document.getElementById('licenseSuccessInfo').innerHTML = 
    '<p><strong>License No:</strong> ' + licenseId + '</p>' +
    '<p><strong>Business:</strong> ' + app.businessName + '</p>' +
    '<p><strong>Category:</strong> ' + app.tradeCategory + '</p>';
  openModal('licenseSuccessModal');
  
  renderTable();
}

// Function to render table
function renderTable() {
  var tbody = document.querySelector('tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  TRADEZO.applications.forEach(function(app) {
    // Find inspection for this app
    var inspection = TRADEZO.inspections.find(function(ins) { return ins.appId === app.id; });
    var foResult = inspection ? inspection.result : app.inspectionResult;

    // Check DO action status from shared sessionStorage
    var appData = getAppStatus(app.id);
    var doStatus = appData.status;
    var licenseNo = appData.licenseNo;

    // Determine Status column display
    var statusBadge = '';
    if (doStatus === 'licensed' && licenseNo) {
      statusBadge = '<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Licensed</span>';
    } else if (doStatus === 'approved') {
      statusBadge = '<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Approved</span>';
    } else if (doStatus === 'rejected') {
      statusBadge = '<span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Rejected</span>';
    } else if (foResult === 'Rejected') {
      statusBadge = '<span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">FO Rejected</span>';
    } else {
      // Pending or FO Approved - both show as Pending for DO
      statusBadge = '<span style="background:#fef3c7;color:#d97706;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Pending</span>';
    }

    // Determine Action column - must match Status
    var actionHtml = '';
    if (statusBadge.includes('Pending')) {
      // Status = Pending → Show Approve/Reject
      actionHtml = '<button class="approve-btn" onclick="showApproveModal(\'' + app.id + '\')" style="background:#16a34a;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;margin-right:6px;">Approve</button>' +
                   '<button class="reject-btn" onclick="showRejectModal(\'' + app.id + '\')" style="background:#dc2626;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Reject</button>';
    } else if (statusBadge.includes('Approved')) {
      // Status = Approved → Show Generate License
      actionHtml = '<button class="generate-btn" onclick="showLicenseModal(\'' + app.id + '\')" style="background:#16a34a;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Generate License</button>';
    } else if (statusBadge.includes('Licensed')) {
      // Status = Licensed → Show License Number
      actionHtml = '<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">License: ' + licenseNo + '</span>';
    } else if (statusBadge.includes('Rejected')) {
      // Status = Rejected → Show Rejected
      actionHtml = '<span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Rejected</span>';
    } else {
      // Fallback
      actionHtml = '<span style="color:#94a3b8;font-size:13px;">-</span>';
    }

    var row = document.createElement('tr');
    row.setAttribute('data-id', app.id);
    
    row.innerHTML =
      '<td style="color:#1E3A8A;font-weight:600;">' + app.id + '</td>' +
      '<td><strong>' + app.businessName + '</strong><br><small style="color:#64748b;">' + app.tradeCategory + '</small></td>' +
      '<td>' + statusBadge + '</td>' +
      '<td>' + actionHtml + '</td>';
    tbody.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var searchInput = document.querySelector('.search-bar input');

  // Wire modal confirm buttons
  document.getElementById('confirmApproveBtn').addEventListener('click', confirmApprove);
  document.getElementById('confirmRejectBtn').addEventListener('click', confirmReject);
  document.getElementById('confirmLicenseBtn').addEventListener('click', confirmGenerateLicense);

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // Initial render
  renderTable();

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      var q = this.value.toLowerCase();
      document.querySelectorAll('tbody tr').forEach(function(row) {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }
});
