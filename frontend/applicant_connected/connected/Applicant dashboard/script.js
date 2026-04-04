// Applicant dashboard/script.js — dynamic per-user dashboard state

(function() {
  var CURRENCY = '₹2,100';

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function getLoggedInUser() {
    var sessionUser = safeJsonParse(sessionStorage.getItem('loggedInUser') || 'null', null);
    if (!sessionUser || !sessionUser.email) {
      var localUser = safeJsonParse(localStorage.getItem('user') || 'null', null);
      if (localUser && localUser.email) {
        sessionUser = {
          name: localUser.name || 'Applicant',
          email: localUser.email,
          role: 'applicant'
        };
        sessionStorage.setItem('loggedInUser', JSON.stringify(sessionUser));
      }
    }

    if (window.TRADEZO && typeof TRADEZO.getLoggedInUser === 'function') {
      return TRADEZO.getLoggedInUser() || {};
    }
    return sessionUser || {};
  }

  function getAllApplications() {
    var apps = [];
    if (window.TRADEZO && Array.isArray(TRADEZO.applications)) {
      apps = JSON.parse(JSON.stringify(TRADEZO.applications));
    }

    var saved = safeJsonParse(localStorage.getItem('tz_submitted_apps') || '[]', []);
    var globalSaved = safeJsonParse(localStorage.getItem('applications') || '[]', []);
    var generatedLics = safeJsonParse(localStorage.getItem('tz_generated_licenses') || '[]', []);
    
    // Merge the arrays, OVERRIDING existing entries with newer local storage states
    var combined = saved.concat(globalSaved);

    if (Array.isArray(combined)) {
      combined.forEach(function(app) {
        var existing = apps.find(function(ex) {
          return ex.appRef === app.id || ex.id === app.id || ex.id === app.appRef;
        });
        if (existing) {
          Object.assign(existing, app);
        } else {
          apps.push(app);
        }
      });
    }

    // Explicitly apply generated licenses to override status globally
    if (Array.isArray(generatedLics)) {
      generatedLics.forEach(function(lic) {
          var existing = apps.find(function(ex) {
             return ex.appRef === lic.appId || ex.id === lic.appId;
          });
          if (existing) {
             existing.status = 'License Issued';
             existing.licenseNo = lic.licenseNo;
             existing.licenseId = lic.licenseNo;
             if (lic.licenseIssueDate) existing.licenseIssueDate = lic.licenseIssueDate;
             if (lic.licenseExpiryDate) existing.licenseExpiryDate = lic.licenseExpiryDate;
          }
      });
    }

    return apps;
  }

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function findApplicationForUser(user) {
    var appRef = sessionStorage.getItem('applicationRef') || '';
    var apps = getAllApplications();
    var matches = [];

    function belongsToUser(app) {
      if (!app) return false;
      if (user.email && normalizeText(app.email) === normalizeText(user.email)) return true;
      if (user.name && normalizeText(app.applicantName) === normalizeText(user.name)) return true;
      if (user.id && (normalizeText(app.userId) === normalizeText(user.id) || normalizeText(app.applicantId) === normalizeText(user.id))) return true;
      return false;
    }

    if (appRef) {
      matches = apps.filter(function(app) {
        return (app.appRef === appRef || app.id === appRef);
      });
      if (matches.length) return matches[matches.length - 1];
    }

    if (!matches.length && user.email) {
      matches = apps.filter(function(app) {
        return normalizeText(app.email) === normalizeText(user.email);
      });
    }

    if (!matches.length && user.name) {
      matches = apps.filter(function(app) {
        return normalizeText(app.applicantName) === normalizeText(user.name);
      });
    }

    if (!matches.length && user.id) {
      matches = apps.filter(function(app) {
        return normalizeText(app.userId) === normalizeText(user.id) || normalizeText(app.applicantId) === normalizeText(user.id);
      });
    }

    return matches.length ? matches[matches.length - 1] : null;
  }

  function statusLabel(app) {
    if (!app) return 'Not Started';
    var text = app.status || 'Submitted';
    var lower = text.toLowerCase();
    if (lower === 'approved' || lower === 'license issued' || lower === 'licensed') {
      return 'License Generated';
    }
    return text;
  }

  function statusColor(app) {
    var lbl = statusLabel(app);
    if (lbl === 'License Generated') return '#10b981';
    if (window.TRADEZO && typeof TRADEZO.statusColor === 'function') {
      return TRADEZO.statusColor(app.status || lbl);
    }
    return '#6b7280';
  }

  function isApproved(app) {
    return !!(app && (normalizeText(app.status) === 'approved' || normalizeText(app.status) === 'license issued' || normalizeText(app.status) === 'licensed' || app.licenseId || app.licenseNo));
  }

  function isSubmitted(app) {
    if (!app) return false;
    var status = normalizeText(app.status);
    return status === 'submitted' || status === 'under verification' || status === 'documents verified' || status === 'inspection scheduled' || status === 'inspection completed' || status === 'under review' || status === 'review done';
  }

  function buildActionButton(label, href) {
    return '<button type="button" onclick="window.location.href=\'' + href + '\'">' + label + '</button>';
  }

  function setText(el, value) {
    if (el) el.textContent = value;
  }

  function setStatusRow(app) {
    var table = document.getElementById('appStatusTable');
    if (!table) return;

    var statusCard = table.closest('.card');
    if (statusCard) {
      statusCard.style.display = '';
    }
    
    var actions = document.getElementById('appActions');

    if (!app) {
      table.style.display = 'none';
      if (actions) {
        actions.innerHTML = '<p style="color:#64748b; font-size:14px;">You have no active applications. Click "Apply License" to get started.</p>';
      }
      return;
    }

    table.style.display = '';

    var row = table.querySelectorAll('tr')[1];
    if (!row) return;

    var cells = row.querySelectorAll('td');
    var businessName = app.businessName || 'Application in progress';
    var statusText = statusLabel(app).toUpperCase();
    var dateText = app.submittedDate || app.updatedDate || '—';

    if (cells[0]) cells[0].textContent = app.id || app.appRef || '—';
    if (cells[1]) cells[1].textContent = businessName;
    if (cells[2]) {
      cells[2].innerHTML = '<span class="badge" style="background:' + statusColor(app) + ';color:#fff;padding:4px 12px;border-radius:12px;font-size:11px;font-weight:700;">' + statusText + '</span>';
    }
    if (cells[3]) cells[3].textContent = dateText;

    if (actions) {
      actions.innerHTML = '<button type="button" onclick="window.location.href=\'../payments/index.html\'">Payment Details</button>';
    }
  }

  function setLicenseCard(app) {
    var grid = document.querySelector('.grid');
    if (!grid) return;

    var cards = grid.querySelectorAll('.card');
    var card = cards[1];
    if (!card) return;

    var title = card.querySelector('h3');
    var paragraphs = card.querySelectorAll('p');
    var button = card.querySelector('button');

    grid.style.display = '';

    if (!app) {
      if (title) title.textContent = 'Apply for New License';
      if (paragraphs[0]) paragraphs[0].innerHTML = 'Begin your registration to obtain a valid trade license.';
      if (paragraphs[1]) paragraphs[1].innerHTML = '';
      if (paragraphs[2]) paragraphs[2].innerHTML = '';
      
      var p3 = card.querySelectorAll('p')[3];
      if (p3) p3.innerHTML = '';
      
      if (button) {
        button.textContent = 'Apply License';
        button.onclick = function() { window.location.href = '../apply_license/apply_license.html'; };
      }
      return;
    }

    if (title) {
      title.textContent = isApproved(app) ? 'My Current License' : 'My Application & Fees';
    }

    if (isApproved(app)) {
      if (paragraphs[0]) paragraphs[0].innerHTML = '<b>License No:</b> ' + (app.licenseId || app.licenseNo || 'Pending issue');
      if (paragraphs[1]) paragraphs[1].innerHTML = '<b>Business:</b> ' + (app.businessName || '—');
      
      var validStr = '';
      if (app.licenseIssueDate && app.licenseExpiryDate) {
         validStr = app.licenseIssueDate + ' - ' + app.licenseExpiryDate;
      } else {
         var d = new Date();
         var e = new Date();
         e.setFullYear(d.getFullYear() + 1);
         validStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' - ' + e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      if (paragraphs[2]) paragraphs[2].innerHTML = '<b>Valid:</b> ' + validStr;
      
      if (button) {
        button.textContent = 'Download License';
        button.onclick = function() { window.location.href = '../download/index.html'; };
      }
      return;
    }

    if (paragraphs[0]) paragraphs[0].innerHTML = '<b>Application ID:</b> ' + (app.id || app.appRef || '—');
    if (paragraphs[1]) paragraphs[1].innerHTML = '<b>Applicant:</b> ' + (app.applicantName || '—');
    if (paragraphs[2]) paragraphs[2].innerHTML = '<b>Fee:</b> ' + (app.paymentAmount || CURRENCY) + ' (' + (app.paymentStatus || 'Paid') + ')';
    
    var p3 = card.querySelectorAll('p')[3];
    if (!p3) {
      p3 = document.createElement('p');
      card.insertBefore(p3, button);
    }
    p3.innerHTML = '<b>Status:</b> ' + statusLabel(app);
    if (button) {
      button.textContent = 'Track Application';
      button.onclick = function() {
        window.location.href = '../Track Application Status/index.html';
      };
    }
  }


  function updateNavigation(app) {
    var downloadLink = document.querySelector('.navbar a[href*="download/index.html"]');
    if (downloadLink) {
      downloadLink.href = isApproved(app) ? '../download/index.html' : '../Track Application Status/index.html';
    }

    var reviewLink = document.querySelector('.sidebar p[onclick*="application_review"], .sidebar p:nth-of-type(3)');
    if (reviewLink) {
      reviewLink.onclick = function() {
        window.location.href = app ? '../Track Application Status/index.html' : '../apply_license/apply_license.html';
      };
      reviewLink.style.cursor = 'pointer';
      reviewLink.textContent = app ? 'Application Review' : 'Apply License';
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('applicationRef');
    window.location.href = '../landing page/index.html';
  }

  function init() {
    var user = getLoggedInUser();
    var app = findApplicationForUser(user);

    var welcomeEl = document.getElementById('welcomeText');
    if (welcomeEl) {
      var displayName = (app && app.applicantName) ? app.applicantName : (user.name || 'Applicant');
      welcomeEl.textContent = 'Welcome, ' + displayName;
    }

    var subtitle = document.querySelector('.welcome p');
    if (subtitle) {
      if (app && app.id) {
        subtitle.textContent = 'Applicant ID: ' + app.id;
      } else if (user.email) {
        subtitle.textContent = 'Applicant ID: ' + (user.id || user.email);
      } else {
        subtitle.textContent = 'Track your application and complete pending steps.';
      }
      // Force inline style to ensure absolute visibility overrides
      subtitle.style.color = '#ffffff';
      subtitle.style.fontWeight = '700';
      subtitle.style.fontSize = '15px';
      subtitle.style.opacity = '1';
      subtitle.style.textShadow = '0px 1px 3px rgba(0,0,0,0.4)';
    }

    setStatusRow(app);
    setLicenseCard(app);
    updateNavigation(app);

    window.handleLogout = handleLogout;
    window.goPayment = function() {
      window.location.href = '../paynow/index.html';
    };
  }

  document.addEventListener('DOMContentLoaded', init);
})();
