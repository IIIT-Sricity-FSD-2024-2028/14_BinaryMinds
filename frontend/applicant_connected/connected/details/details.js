// Approve button clicked
function approve() {
  var confirmed = confirm('Are you sure you want to APPROVE this application?');
  if (confirmed) {
    alert('Application TL-2026-001 has been Approved successfully!');
    window.history.back();
  }
}

// Reject button clicked
function reject() {
  var reason = prompt('Enter rejection reason:');
  if (reason && reason.trim() !== '') {
    alert('Application TL-2026-001 has been Rejected.\nReason: ' + reason);
    window.history.back();
  } else if (reason !== null) {
    alert('Please enter a rejection reason.');
  }
}

// Logout
function logout() {
  localStorage.removeItem('loggedInUser');
  window.location.href = '../../index.html';
}