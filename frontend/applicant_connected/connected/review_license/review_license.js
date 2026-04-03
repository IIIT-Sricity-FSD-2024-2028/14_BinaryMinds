// review_license.js — dynamic renew license flow for approved licenses

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

  function findApprovedLicense(user) {
    var apps = getAllApps().filter(function(app) {
      return belongsToUser(app, user) && (normalize(app.status) === 'approved' || app.licenseId);
    });

    if (apps.length) return apps[apps.length - 1];

    if (window.TRADEZO && Array.isArray(TRADEZO.licenses)) {
      var license = TRADEZO.licenses.find(function(item) {
        return user.name && normalize(item.ownerName) === normalize(user.name);
      });
      if (license) return license;
    }

    return null;
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value || '—';
  }

  function parseDate(value) {
    if (!value) return null;
    var parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
    return null;
  }

  function formatDate(date) {
    if (!date) return '—';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function addYears(date, years) {
    var next = new Date(date.getTime());
    next.setFullYear(next.getFullYear() + years);
    return next;
  }

  function calculateFee(years) {
    var base = 1500;
    return '₹' + (base * years).toLocaleString('en-IN');
  }

  function updateProposedExpiry(expiryDate, years) {
    var proposed = expiryDate ? addYears(expiryDate, years) : null;
    setText('proposedExpiry', formatDate(proposed));
    setText('renewalFee', calculateFee(years));
  }

  function showFile(inputId, nameId) {
    var input = document.getElementById(inputId);
    var name = document.getElementById(nameId);
    if (!input || !name || !input.files.length) return;
    name.textContent = input.files[0].name;
  }

  function submitForm(license) {
    var renewalPeriod = document.getElementById('renewalPeriod');
    var licenseCategory = document.getElementById('licenseCategory');
    var shopArea = document.getElementById('shopArea');
    var err1 = document.getElementById('err1');
    var err2 = document.getElementById('err2');
    var err3 = document.getElementById('err3');

    var valid = true;

    if (!renewalPeriod || !renewalPeriod.value) {
      if (err1) err1.classList.add('show');
      valid = false;
    } else if (err1) {
      err1.classList.remove('show');
    }

    if (!licenseCategory || !licenseCategory.value) {
      if (err2) err2.classList.add('show');
      valid = false;
    } else if (err2) {
      err2.classList.remove('show');
    }

    if (!shopArea || !shopArea.value || Number(shopArea.value) <= 0) {
      if (err3) err3.classList.add('show');
      shopArea.classList.add('invalid-field');
      valid = false;
    } else {
      if (err3) err3.classList.remove('show');
      shopArea.classList.remove('invalid-field');
    }

    var filesValid = ['file1', 'file2', 'file3'].every(function(id) {
      var input = document.getElementById(id);
      return input && input.files && input.files.length;
    });

    if (!filesValid) {
      alert('Please upload all required documents before submitting.');
      valid = false;
    }

    if (!valid) return;

    var successMsg = document.getElementById('successMsg');
    if (successMsg) successMsg.style.display = 'block';

    var renewalStatus = document.getElementById('renewalStatus');
    if (renewalStatus) {
      renewalStatus.textContent = 'Submitted';
    }

    var renewalId = 'RN-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    setText('renewalId', renewalId);

    var appRef = license && (license.appId || license.id || license.licenseId || license.appRef);
    if (appRef) {
      sessionStorage.setItem('applicationRef', appRef);
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    var user = getUser();
    if (!user || !user.email) {
      window.location.href = '../login/index.html';
      return;
    }

    var license = findApprovedLicense(user);
    var page = document.querySelector('.page');

    if (!license) {
      if (page) {
        page.innerHTML =
          '<h1>Renew Trade License</h1>' +
          '<p class="subtitle">You can renew only after a license is issued.</p>' +
          '<div class="card" style="text-align:center;padding:40px 20px;">' +
          '<div style="font-size:48px;margin-bottom:12px;">📄</div>' +
          '<h3 style="color:#1E3A8A;margin-bottom:8px;">No Active License Found</h3>' +
          '<p style="color:#64748b;margin-bottom:20px;">Once your license is approved, you can renew it here.</p>' +
          '<button class="renew-btn" onclick="window.location.href=\'../Track Application Status/index.html\'">Track Application</button>' +
          '</div>';
      }
      return;
    }

    var issueDate = parseDate(license.licenseIssueDate || license.issueDate);
    var expiryDate = parseDate(license.licenseExpiryDate || license.expiryDate);

    setText('licenseNumber', license.licenseId || license.id || '—');
    setText('licenseId', license.licenseId || license.id || '—');
    setText('businessName', license.businessName || license.tradeName || '—');
    setText('licenseStatus', (license.status || 'Active'));
    setText('issueDate', formatDate(issueDate));
    setText('expiryDate', formatDate(expiryDate));
    setText('renewalId', 'RN-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000));
    setText('submittedAt', formatDate(new Date()));

    var renewalPeriod = document.getElementById('renewalPeriod');
    if (renewalPeriod) {
      var years = Number(renewalPeriod.value.replace('year', '')) || 1;
      updateProposedExpiry(expiryDate || new Date(), years);
      renewalPeriod.addEventListener('change', function() {
        var nextYears = Number(renewalPeriod.value.replace('year', '')) || 1;
        updateProposedExpiry(expiryDate || new Date(), nextYears);
      });
    }

    var licenseCategory = document.getElementById('licenseCategory');
    if (licenseCategory && license.tradeCategory) {
      var options = Array.from(licenseCategory.options);
      var match = options.find(function(option) {
        return normalize(option.text) === normalize(license.tradeCategory);
      });
      if (match) licenseCategory.value = match.value;
    }

    var shopArea = document.getElementById('shopArea');
    if (shopArea && license.shopArea) shopArea.value = license.shopArea;

    ['file1', 'file2', 'file3'].forEach(function(id, index) {
      var input = document.getElementById(id);
      var nameId = 'name' + (index + 1);
      if (input) {
        input.addEventListener('change', function() {
          showFile(id, nameId);
        });
      }
    });

    var renewBtn = document.querySelector('.renew-btn');
    if (renewBtn) {
      renewBtn.addEventListener('click', function() {
        submitForm(license);
      });
    }
  });
})();