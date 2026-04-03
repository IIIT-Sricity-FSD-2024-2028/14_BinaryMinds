function loadVerificationHistory() {
  var history = [];
  try { history = JSON.parse(localStorage.getItem('tz_verification_history') || '[]'); } catch(e){ history = []; }
  if (!Array.isArray(history)) history = [];
  return history;
}

document.addEventListener('DOMContentLoaded', function() {
  var history = loadVerificationHistory();
  var rejected = history.filter(function(item){ return item.decision === 'Rejected'; });
  var approved = history.filter(function(item){ return item.decision === 'Approved'; });

  var countEl = document.getElementById('rejectedCount');
  if (countEl) countEl.textContent = rejected.length + ' Rejected';
  var approvedCountEl = document.getElementById('approvedCount');
  if (approvedCountEl) approvedCountEl.textContent = approved.length + ' Approved';

  var list = document.getElementById('cardsList');
  if (!list) return;
  list.innerHTML = '';

  if (!history.length) {
    list.innerHTML =
      '<div class="card" style="text-align:center;padding:28px 20px;">' +
      '<div style="font-size:40px;margin-bottom:10px;">📄</div>' +
      '<div style="color:#64748b;">No verification history yet.</div>' +
      '</div>';
    return;
  }

  history.slice().reverse().forEach(function(item) {
    var isRejected = item.decision === 'Rejected';
    var boxColor = isRejected ? 'box-red' : 'box-green';
    list.innerHTML +=
      '<div class="card">' +
        '<div class="card-biz">🏢 ' + (item.businessName || '—') + '</div>' +
        '<div class="card-person">👤 ' + (item.applicant || '—') + '</div>' +
        '<div class="card-meta">' +
          '<div><div class="meta-label">Application ID</div><div class="meta-value">📄 ' + item.appId + '</div></div>' +
          '<div><div class="meta-label">Submitted Date</div><div class="meta-value">📅 ' + (item.submitted || '—') + '</div></div>' +
          '<div><div class="meta-label">Decision Date</div><div class="meta-value ' + (isRejected ? 'red' : 'green') + '">🗓 ' + (item.decidedOn || '—') + '</div></div>' +
        '</div>' +
        '<div class="reject-box ' + boxColor + '" style="display:flex; justify-content:space-between; align-items:center;">' +
          '<div><strong>📋 Decision:</strong> ' + item.decision + (item.reason ? ' — ' + item.reason : '') + '</div>' +
          '<button class="view-btn" data-id="' + item.appId + '" style="padding: 6px 12px; background: #2f5bea; color: white; border: none; border-radius: 6px; cursor: pointer;">View Details</button>' +
        '</div>' +
      '</div>';
  });

  document.querySelectorAll('.view-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      sessionStorage.setItem('selectedApp', this.getAttribute('data-id'));
      window.location.href = '../detail/index.html?readonly=true';
    });
  });
});


function logout() {
  sessionStorage.clear();
  localStorage.removeItem('loggedInUser');
  window.location.href = '../login/index.html';
}