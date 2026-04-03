// payments/script.js — dynamic last payment date

(function() {
  function safeParse(value, fallback) {
    try { return JSON.parse(value); } catch (error) { return fallback; }
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getUser() {
    if (window.TRADEZO && typeof TRADEZO.getLoggedInUser === 'function') {
      return TRADEZO.getLoggedInUser() || {};
    }
    return safeParse(sessionStorage.getItem('loggedInUser') || 'null', {}) || {};
  }

  function getAllApps() {
    var apps = [];
    if (window.TRADEZO && Array.isArray(TRADEZO.applications)) {
      apps = apps.concat(TRADEZO.applications);
    }

    var saved = safeParse(localStorage.getItem('tz_submitted_apps') || '[]', []);
    if (Array.isArray(saved)) {
      saved.forEach(function(app) {
        var exists = apps.some(function(existing) {
          return existing.appRef === app.appRef || existing.id === app.id;
        });
        if (!exists) apps.push(app);
      });
    }

    return apps;
  }

  function belongsToUser(app, user) {
    if (!app) return false;
    if (user.email && normalize(app.email) === normalize(user.email)) return true;
    if (user.name && normalize(app.applicantName) === normalize(user.name)) return true;
    if (user.id && (normalize(app.userId) === normalize(user.id) || normalize(app.applicantId) === normalize(user.id))) return true;
    return false;
  }

  function parseDate(value) {
    if (!value) return null;
    var parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;

    var parts = String(value).replace(',', '').split(' ');
    if (parts.length >= 3) {
      var day = parts[0];
      var month = parts[1];
      var year = parts[2];
      var alt = new Date(month + ' ' + day + ' ' + year);
      if (!isNaN(alt.getTime())) return alt;
    }

    return null;
  }

  function formatDate(date) {
    if (!date) return '—';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function findLatestPaymentDate(user) {
    var apps = getAllApps().filter(function(app) {
      return belongsToUser(app, user);
    });

    if (!apps.length) return '—';

    var latest = null;
    apps.forEach(function(app) {
      var date = parseDate(app.submittedDate) || parseDate(app.paymentDate);
      if (!date) return;
      if (!latest || date > latest) latest = date;
    });

    return latest ? formatDate(latest) : '—';
  }

  function wireActions() {
    var printBtn = document.querySelector('.btn-print');
    if (printBtn) {
      printBtn.addEventListener('click', function() {
        window.print();
      });
    }

    var downloadLinks = document.querySelectorAll('.left-panel tbody a[href="#"]');
    downloadLinks.forEach(function(link) {
      link.addEventListener('click', function(event) {
        event.preventDefault();
        window.print();
      });
    });

    var receiptEyes = document.querySelectorAll('.receipts-section .fa-eye');
    receiptEyes.forEach(function(icon) {
      var row = icon.closest('tr');
      if (row) {
        row.style.cursor = 'pointer';
        row.addEventListener('click', function() {
          window.print();
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    var user = getUser();
    var el = document.getElementById('lastPaymentDate');
    if (el) {
      el.textContent = findLatestPaymentDate(user);
    }
    wireActions();
  });
})();
