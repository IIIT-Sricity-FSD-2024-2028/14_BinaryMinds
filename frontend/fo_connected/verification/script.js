// fo_connected/verification/script.js
// Uses TRADEZO mock data + localStorage decisions

function loadVerificationHistory() {
  var history = [];
  try { history = JSON.parse(localStorage.getItem('tz_verification_history') || '[]'); } catch(e){ history = []; }
  if (!Array.isArray(history)) history = [];
  return history;
}

  function loadSubmittedApplications() {
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]'); } catch(e){ saved = []; }
    if (!Array.isArray(saved)) saved = [];

    return saved.map(function(app) {
      return {
        appId: app.id || app.appRef || '—',
        businessName: app.businessName || '—',
        applicant: app.applicantName || '—',
        category: app.tradeCategory || app.category || '—',
        address: (app.shopAddress ? app.shopAddress + (app.city ? ', ' + app.city : '') : app.address || '—'),
        submitted: app.submittedDate || '—',
        status: app.status || 'Pending Review'
      };
    });
  }

  function loadVerificationQueue() {
    var queue = [];
    try { queue = JSON.parse(localStorage.getItem('tz_verification_queue') || '[]'); } catch(e){ queue = []; }
    if (!Array.isArray(queue)) queue = [];
    return queue;
  }

function renderVerificationCards(data) {
  var cards = document.getElementById('cardsGrid') || document.getElementById('verificationCards') || document.querySelector('.cards-container');
  if (!cards) return;

  cards.innerHTML = '';
  data.forEach(function(app) {
    var color = TRADEZO.statusColor(app.status);
    cards.innerHTML +=
      '<div class="card">' +
        '<div class="card-top"></div>' +
        '<div class="card-body">' +
          '<h3>' + app.businessName + '</h3>' +
          '<p class="app-id">' + app.appId + '</p>' +
          '<p><span class="ci">📄</span> ' + app.category + '</p>' +
          '<p><span class="ci">📍</span> ' + app.address + '</p>' +
          '<p><span class="ci">📅</span> ' + app.submitted + '</p>' +
          '<p style="margin-top:6px;"><span style="background:' + color + ';color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">' + app.status + '</span></p>' +
          '<button onclick="viewDetails(\'' + app.appId + '\')">👁 View Details</button>' +
        '</div>' +
      '</div>';
  });

  var countEl = document.getElementById('countText');
  if (countEl) countEl.textContent = 'Showing ' + data.length + ' application(s)';
}

document.addEventListener('DOMContentLoaded', function() {
  var history = loadVerificationHistory();
  var decidedIds = history.map(function(item){ return item.appId; });

  var data = (TRADEZO && TRADEZO.verifications) ? TRADEZO.verifications.map(function(app) {
    return {
      appId: app.appId,
      businessName: app.businessName,
      applicant: app.applicant,
      category: app.category,
      address: app.address,
      submitted: app.submitted,
      status: app.status
    };
  }) : [];


    var submitted = loadSubmittedApplications();
    submitted.forEach(function(app) {
      var exists = data.some(function(item){ return item.appId === app.appId; });
      if (!exists) data.push(app);
    });

    var queue = loadVerificationQueue();
    queue.forEach(function(app) {
      var exists = data.some(function(item){ return item.appId === app.appId; });
      if (!exists) data.push(app);
    });

    data = data.filter(function(app) {
      return (app.status || '').toLowerCase() === 'pending review';
    });

  data = data.filter(function(app) {
    var status = (app.status || '').toLowerCase();
    var isDecided = decidedIds.indexOf(app.appId) !== -1;
    return !isDecided && status !== 'approved' && status !== 'rejected';
  });
  renderVerificationCards(data);

  var searchEl = document.getElementById('searchInput');
  if (searchEl) {
    searchEl.addEventListener('input', function() {
      var input = this.value.toLowerCase();
      var filtered = data.filter(function(app) {
        return (app.businessName || '').toLowerCase().includes(input) || (app.appId || '').toLowerCase().includes(input);
      });
      renderVerificationCards(filtered);
    });
  }
});

function viewDetails(appId) {
  sessionStorage.setItem('selectedApp', appId);
  window.location.href = '../detail/index.html';
}

function searchCards() {
  var input = (document.getElementById('searchInput') || {}).value || '';
  input = input.toLowerCase();
  var cardEls = document.querySelectorAll('.cards-grid .card');
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
function loadVerificationApps() {
    let applications = JSON.parse(localStorage.getItem("applications")) || [];

    let container = document.getElementById("verificationList");
    container.innerHTML = "";

    applications.forEach(app => {
        let card = `
            <div class="app-card">
                <h4>${app.applicantName}</h4>
                <p>ID: ${app.id}</p>
                <p>Type: ${app.licenseType}</p>
                <p>Status: ${app.status}</p>
                <button onclick="approveApp('${app.id}')">Approve</button>
                <button onclick="rejectApp('${app.id}')">Reject</button>
            </div>
        `;
        container.innerHTML += card;
    });
}

function approveApp(id) {
    let applications = JSON.parse(localStorage.getItem("applications")) || [];

    applications = applications.map(app => {
        if (app.id === id) app.status = "Approved";
        return app;
    });

    localStorage.setItem("applications", JSON.stringify(applications));
    loadVerificationApps();
}

function rejectApp(id) {
    let applications = JSON.parse(localStorage.getItem("applications")) || [];

    applications = applications.map(app => {
        if (app.id === id) app.status = "Rejected";
        return app;
    });

    localStorage.setItem("applications", JSON.stringify(applications));
    loadVerificationApps();
}

loadVerificationApps();