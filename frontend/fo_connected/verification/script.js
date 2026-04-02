// fo_connected/verification/script.js
// Uses TRADEZO mock data

document.addEventListener('DOMContentLoaded', function() {
  var data = TRADEZO.verifications;
  var cards = document.getElementById('verificationCards') || document.querySelector('.cards-container');
  if (!cards) return;

  cards.innerHTML = '';
  data.forEach(function(app) {
    var color = TRADEZO.statusColor(app.status);
    cards.innerHTML +=
      '<div class="card" style="background:#fff;border-radius:10px;padding:20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">' +
        '<h3 style="margin-bottom:8px;color:#1E3A8A;">' + app.businessName + '</h3>' +
        '<p style="font-size:13px;color:#64748b;">📋 ' + app.appId + ' &nbsp;|&nbsp; 👤 ' + app.applicant + '</p>' +
        '<p style="font-size:13px;color:#64748b;margin-top:4px;">📍 ' + app.address + '</p>' +
        '<p style="margin-top:8px;"><span style="background:' + color + ';color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">' + app.status + '</span></p>' +
        '<button onclick="viewDetails(\'' + app.appId + '\')" style="margin-top:12px;background:#1E3A8A;color:#fff;border:none;padding:8px 18px;border-radius:7px;cursor:pointer;font-size:13px;font-weight:600;">View Details</button>' +
      '</div>';
  });
});

function viewDetails(appId) {
  sessionStorage.setItem('selectedApp', appId);
  window.location.href = '../detail/index.html';
}

function searchCards() {
  var input = (document.getElementById('searchInput') || {}).value || '';
  input = input.toLowerCase();
  var cardEls = document.querySelectorAll('.card');
  var count = 0;
  cardEls.forEach(function(card) {
    var text = card.textContent.toLowerCase();
    var show = text.includes(input);
    card.style.display = show ? '' : 'none';
    if (show) count++;
  });
  var countEl = document.getElementById('countText');
  if (countEl) countEl.textContent = 'Showing ' + count + ' application(s)';
}