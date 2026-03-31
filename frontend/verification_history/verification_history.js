// Mock data — all rejected applications
var rejected = [
  {
    biz: "Tech Solutions Ltd",
    person: "Sarah Johnson",
    appId: "TL-2024-0156",
    submitted: "Feb 15, 2024",
    rejectedOn: "Feb 20, 2024",
    reason: "Business Affidavit document is incomplete and Aadhar card copy is unclear.",
    boxColor: "box-red"
  },
  {
    biz: "Fresh Bites Restaurant",
    person: "Michael Chen",
    appId: "TL-2024-0142",
    submitted: "Feb 10, 2024",
    rejectedOn: "Feb 16, 2024",
    reason: "Aadhar card number does not match the name provided in application form.",
    boxColor: "box-orange"
  },
  {
    biz: "Elite Fitness Center",
    person: "David Martinez",
    appId: "TL-2024-0128",
    submitted: "Feb 5, 2024",
    rejectedOn: "Feb 10, 2024",
    reason: "Passport document is blurred and Business Affidavit is incomplete.",
    boxColor: "box-yellow"
  }
];

// Show count in red badge
document.getElementById('rejectedCount').textContent = rejected.length + ' Rejected';

// Build and show each card
var list = document.getElementById('cardsList');

rejected.forEach(function(item) {
  list.innerHTML += `
    <div class="card">
      <div class="card-biz">🏢 ${item.biz}</div>
      <div class="card-person">👤 ${item.person}</div>
      <div class="card-meta">
        <div><div class="meta-label">Application ID</div><div class="meta-value">📄 ${item.appId}</div></div>
        <div><div class="meta-label">Submitted Date</div><div class="meta-value">📅 ${item.submitted}</div></div>
        <div><div class="meta-label">Rejection Date</div><div class="meta-value red">🗓 ${item.rejectedOn}</div></div>
      </div>
      <div class="reject-box ${item.boxColor}">
        <strong>📋 Rejection Reason:</strong>
        ${item.reason}
      </div>
    </div>`;
});

// Logout function
function logout() {
  localStorage.removeItem('loggedInUser');
  window.location.href = '../../index.html';
}