// payments/script.js — dynamic last payment date

(function() {
  function safeParse(value, fallback) {
    try { return JSON.parse(value); } catch (error) { return fallback; }
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getDynamicFeeFallback() {
    var feeString = '₹2100';
    try {
       var fees = JSON.parse(localStorage.getItem('tradezo_fees'));
       if (fees && fees.new) {
          var val = parseInt(fees.new, 10);
          val = val + (val * 0.05);
          feeString = '₹' + Math.floor(val); 
       }
    } catch(e) {}
    return feeString;
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

  function findLatestPaymentAmount(user) {
    var apps = getAllApps().filter(function(app) {
      return belongsToUser(app, user) && (normalize(app.paymentStatus) === 'paid' || normalize(app.paymentStatus) === 'success');
    });

    if (!apps.length) return getDynamicFeeFallback();

    var latestApp = null;
    var latestDate = null;
    apps.forEach(function(app) {
      var date = parseDate(app.submittedDate) || parseDate(app.paymentDate);
      if (!date) return;
      if (!latestDate || date > latestDate) {
         latestDate = date;
         latestApp = app;
      }
    });

    return latestApp && latestApp.paymentAmount ? latestApp.paymentAmount : getDynamicFeeFallback();
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

  function renderTransactions(apps) {
    var tbody = document.querySelector('.left-panel tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!apps || apps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No payment transactions found.</td></tr>';
      return;
    }

    apps.forEach(function(app) {
      var txnId = app.paymentRef || ('TXN-' + Math.floor(Math.random() * 100000000));
      var pDate = normalize(app.status) === 'pending payment' ? 'Pending' : (app.paymentDate || app.submittedDate || new Date().toLocaleDateString('en-IN'));
      var amount = app.paymentAmount || getDynamicFeeFallback();
      var method = app.paymentMethod || 'UPI';
      
      var isSuccess = normalize(app.paymentStatus) === 'paid' || normalize(app.paymentStatus) === 'success';
      var statusBadge = isSuccess ? '<span class="badge success">Success</span>' : '<span class="badge failed">Failed or Pending</span>';
      
      var actionHtml = isSuccess 
          ? '<a href="#" class="print-receipt"><i class="fa-solid fa-download"></i> Download Receipt</a>' 
          : '<a href="../paynow/index.html"><i class="fa-solid fa-rotate-right"></i> Retry Payment</a>';
      
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + txnId + '</td><td>' + pDate + '</td><td>' + amount + '</td><td>' + method + '</td><td>' + statusBadge + '</td><td>' + actionHtml + '</td>';
      tbody.appendChild(tr);
    });
  }

  function renderReceipts(apps) {
    var tbody = document.querySelector('.receipts-section tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    var paidApps = apps.filter(function(app) {
      return normalize(app.paymentStatus) === 'paid' || normalize(app.paymentStatus) === 'success';
    });

    if (paidApps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No receipts available.</td></tr>';
      return;
    }

    paidApps.forEach(function(app) {
      var receiptId = 'RC-' + (app.paymentRef ? String(app.paymentRef).slice(-4) : Math.floor(Math.random() * 10000));
      var pDate = app.paymentDate || app.submittedDate || new Date().toLocaleDateString('en-IN');
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + receiptId + '</td><td>' + pDate + '</td><td><span class="dot green"></span> Generated</td><td><i class="fa-regular fa-eye receipt-view" style="cursor:pointer;"></i></td>';
      tbody.appendChild(tr);
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    var user = getUser();
    var apps = getAllApps().filter(function(app) {
      return belongsToUser(app, user);
    });

    var el = document.getElementById('lastPaymentDate');
    if (el) el.textContent = findLatestPaymentDate(user);

    var elAmount = document.getElementById('lastSuccessfulPayment');
    if (elAmount) elAmount.textContent = findLatestPaymentAmount(user);

    renderTransactions(apps);
    renderReceipts(apps);

    wireActions();
    
    // Wire dynamic links that were just added
    document.querySelectorAll('.print-receipt, .receipt-view').forEach(function(btn) {
       btn.addEventListener('click', function(e) { e.preventDefault(); window.print(); });
    });
  });
})();
