// fo_connected/detail/detail_v2.js
// Loads the selected application and keeps approve/reject decisions in sync.

(function() {
  var selectedApp = null;

  function safeArray(key) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch(e) {
      return [];
    }
  }

  function saveArray(key, value) {
    localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
  }

  function createApplicantNotification(app, type, title, message, extra) {
    var notifications = safeArray('tz_applicant_notifications').filter(function(item) {
      return !(item.type === type && normalizeId(item.appId) === normalizeId(app.id));
    });

    notifications.unshift(Object.assign({
      id: 'NOTIF-' + type + '-' + app.id,
      type: type,
      appId: app.id,
      applicantName: app.applicantName || '',
      applicantEmail: app.email || '',
      businessName: app.businessName || '',
      title: title,
      message: message,
      createdAt: new Date().toISOString()
    }, extra || {}));

    saveArray('tz_applicant_notifications', notifications);
  }

  function normalizeId(value) {
    return String(value || '').trim();
  }

  function appIdOf(app) {
    return normalizeId(app && (app.id || app.appId || app.appRef || app.application_id || app.applicationId));
  }

  function selectedAppId() {
    return normalizeId(sessionStorage.getItem('selectedApp') || '');
  }

  function sameApp(app, id) {
    var wanted = normalizeId(id);
    return [
      app && app.id,
      app && app.appId,
      app && app.appRef,
      app && app.application_id,
      app && app.applicationId,
      app && app.backendId
    ].some(function(value) {
      return normalizeId(value) === wanted;
    });
  }

  function firstMatch(list, id) {
    return (list || []).find(function(app) {
      return sameApp(app, id);
    }) || null;
  }

  function getAllSources(appId) {
    var sources = [];
    if (window.TRADEZO) {
      if (typeof TRADEZO.getApplication === 'function') {
        var direct = TRADEZO.getApplication(appId);
        if (direct) sources.push(direct);
      }
      if (Array.isArray(TRADEZO.applications)) {
        sources = sources.concat(TRADEZO.applications.filter(function(app) {
          return sameApp(app, appId);
        }));
      }
    }
    sources.push(firstMatch(safeArray('tz_submitted_apps'), appId));
    sources.push(firstMatch(safeArray('applications'), appId));
    return sources.filter(Boolean);
  }

  function mergedApplication(appId) {
    var sources = getAllSources(appId);
    if (!sources.length) return null;
    return sources.reduce(function(acc, item) {
      return Object.assign(acc, item);
    }, {});
  }

  function normalizeApplication(raw, fallbackId) {
    if (!raw) return null;
    var id = appIdOf(raw) || fallbackId;
    return {
      id: id,
      appId: id,
      appRef: raw.appRef || id,
      backendId: raw.backendId || raw.application_id || Number(id) || null,
      businessName: raw.businessName || raw.business_name || raw.business || 'N/A',
      applicantName: raw.applicantName || raw.full_name || raw.applicant || raw.ownerName || 'N/A',
      tradeCategory: raw.tradeCategory || raw.trade_category || raw.licenseType || raw.category || raw.businessType || 'N/A',
      shopAddress: raw.shopAddress || raw.shop_address || raw.address || 'N/A',
      city: raw.city || '',
      district: raw.district || 'N/A',
      state: raw.state || 'N/A',
      pincode: raw.pincode || 'N/A',
      shopArea: raw.shopArea || raw.shop_area || 'N/A',
      aadhaar: raw.aadhaar || raw.aadhaar_number || 'N/A',
      gender: raw.gender || 'N/A',
      fatherName: raw.fatherName || raw.father_name || 'N/A',
      motherName: raw.motherName || raw.mother_name || 'N/A',
      status: raw.status || raw.application_status || 'Pending',
      submittedDate: raw.submittedDate || raw.submitted_at || raw.date || 'N/A',
      phone: raw.phone || raw.applicant_phone || raw.contact || 'N/A',
      email: raw.email || 'N/A',
      documents: raw.documents || raw.docs || {}
    };
  }

  function loadSelectedApplication() {
    var appId = selectedAppId();
    return normalizeApplication(mergedApplication(appId), appId);
  }

  function displayValue(value) {
    return value == null || value === '' ? '-' : String(value);
  }

  function escapeHtml(value) {
    return displayValue(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fill(selectors, value) {
    selectors.forEach(function(sel) {
      var el = document.querySelector(sel);
      if (el) el.textContent = displayValue(value);
    });
  }

  function docInfo(docs, keys, defaultName) {
    var found = null;
    keys.some(function(key) {
      if (docs && docs[key]) {
        found = docs[key];
        return true;
      }
      return false;
    });

    if (!found) {
      return { name: 'Uploaded (' + defaultName + ')', size: '' };
    }
    if (typeof found === 'string') return { name: found, size: '' };
    return {
      name: found.name || found.fileName || found.filename || found.title || 'Uploaded (' + defaultName + ')',
      size: found.size || found.fileSize || ''
    };
  }

  function setDoc(fileId, metaId, doc, submittedDate) {
    var fileEl = document.getElementById(fileId);
    var metaEl = document.getElementById(metaId);
    if (!fileEl || !metaEl || !doc) return false;

    fileEl.textContent = doc.name;
    metaEl.textContent = [doc.size, submittedDate && submittedDate !== 'N/A' ? 'Uploaded ' + submittedDate : 'Uploaded']
      .filter(Boolean)
      .join(' - ');
    return true;
  }

  function renderDocuments(app) {
    var docs = app.documents || {};
    
    // Safety check: if docs is empty, forcefully pull directly from tz_submitted_apps
    // This prevents issues where mergedApplication() overwrites docs with an empty object
    if (Object.keys(docs).length === 0) {
      try {
        var tzApps = JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]');
        var originalApp = tzApps.find(function(a) { 
          return String(a.id) === String(app.id) || String(a.appId) === String(app.id) || String(a.appRef) === String(app.id); 
        });
        if (originalApp && (originalApp.docs || originalApp.documents)) {
          docs = originalApp.docs || originalApp.documents;
        }
      } catch(e) { console.warn('Could not pull raw docs:', e); }
    }

    var count = 0;
    if (setDoc('doc1File', 'doc1Meta', docInfo(docs, ['aadhaar', 'aadhaarCard', 'identityProof', 'status1'], 'Aadhaar'), app.submittedDate)) count++;
    if (setDoc('doc2File', 'doc2Meta', docInfo(docs, ['addressProof', 'businessAddressProof', 'shopAddressProof', 'status2'], 'Address Proof'), app.submittedDate)) count++;
    if (setDoc('doc3File', 'doc3Meta', docInfo(docs, ['shopPhoto', 'shopFrontView', 'shopImage', 'status3'], 'Shop Photo'), app.submittedDate)) count++;

    var viewBtn = document.querySelector('.view-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', function() {
        if (!count) {
          alert('No uploaded document details are available for this application.');
          return;
        }
        alert('Uploaded documents are listed on this page.');
      });
    }
  }

  function renderApplication(app) {
    if (!app) {
      fill(['#appId'], selectedAppId());
      return;
    }

    fill(['.app-id', '#appId', '.application-id'], app.id);
    fill(['.business-name', '#bizName'], app.businessName);
    fill(['.applicant-name', '#appName'], app.applicantName);
    fill(['.trade-category', '#category'], app.tradeCategory);
    fill(['.app-address', '#address'], app.shopAddress);
    fill(['.app-status', '#status'], app.status);
    fill(['.submitted-date', '#submittedDate'], app.submittedDate);
    fill(['.phone', '#contact'], app.phone);
    fill(['.email', '#email'], app.email);
    fill(['#city'], app.city);
    fill(['#district'], app.district);
    fill(['#state'], app.state);
    fill(['#pincode'], app.pincode);
    fill(['#shopArea'], app.shopArea);
    fill(['#aadhaar'], app.aadhaar);
    fill(['#gender'], app.gender);
    fill(['#fatherName'], app.fatherName);
    fill(['#motherName'], app.motherName);
    renderDocuments(app);
  }

  function updateStoredApplications(key, appId, changes) {
    var list = safeArray(key);
    var found = false;
    list = list.map(function(app) {
      if (!sameApp(app, appId)) return app;
      found = true;
      return Object.assign({}, app, changes);
    });
    saveArray(key, list);
    return found ? firstMatch(list, appId) : null;
  }

  function updateMemoryApplications(appId, changes) {
    var found = null;
    if (window.TRADEZO && Array.isArray(TRADEZO.applications)) {
      TRADEZO.applications.forEach(function(app) {
        if (sameApp(app, appId)) {
          Object.assign(app, changes);
          found = app;
        }
      });
    }
    return found;
  }

  function updateApplicationDecision(appId, status, extra) {
    var changes = Object.assign({
      status: status,
      updatedAt: new Date().toISOString()
    }, extra || {});

    var memoryApp = updateMemoryApplications(appId, changes);
    var submittedApp = updateStoredApplications('tz_submitted_apps', appId, changes);
    var legacyApp = updateStoredApplications('applications', appId, changes);
    return normalizeApplication(Object.assign({}, selectedApp || {}, memoryApp || {}, submittedApp || {}, legacyApp || {}, changes), appId);
  }

  function syncBackend(app, status) {
    var backendId = Number(app && (app.backendId || app.application_id || app.id));
    if (backendId && window.TRADEZO && typeof TRADEZO.syncApplicationToBackend === 'function') {
      TRADEZO.syncApplicationToBackend(Object.assign({}, app || {}, { status: status }), 'officer');
    }
  }

  function decisionRecord(app, decision, reason) {
    var nowIso = new Date().toISOString();
    return {
      appId: app.id,
      businessName: app.businessName || '',
      applicant: app.applicantName || '',
      submitted: app.submittedDate || '',
      decision: decision,
      decidedOn: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      updatedAt: nowIso,
      reason: reason || ''
    };
  }

  function saveDecisionHistory(app, decision, reason) {
    var history = safeArray('tz_verification_history');
    history = history.filter(function(item) {
      return normalizeId(item.appId) !== normalizeId(app.id);
    });
    history.unshift(decisionRecord(app, decision, reason));
    saveArray('tz_verification_history', history);
  }

  function setInspectionSession(app) {
    sessionStorage.setItem('selectedApp', app.id);
    sessionStorage.setItem('businessName', app.businessName || 'N/A');
    sessionStorage.setItem('ownerName', app.applicantName || 'N/A');
    sessionStorage.setItem('tradeCategory', app.tradeCategory || 'N/A');
    sessionStorage.setItem('address', app.shopAddress || 'N/A');
  }

  window.approve = function() {
    var appId = selectedAppId();
    var app = updateApplicationDecision(appId, 'Verified');

    selectedApp = app;
    syncBackend(app, 'Verified');
    saveDecisionHistory(app, 'Approved', 'All documents verified');
    createApplicantNotification(
      app,
      'application_verified',
      'Application Verified',
      'Your application <b>' + escapeHtml(app.id) + '</b> has been verified by the field officer and moved to inspection scheduling.'
    );
    setInspectionSession(app);
    showVerifiedPopup(app.id);
  };

  window.reject = function() {
    var appId = selectedAppId();
    var reason = prompt('Enter rejection reason:');
    if (!reason || !reason.trim()) return;

    var trimmedReason = reason.trim();
    var app = updateApplicationDecision(appId, 'Rejected', { rejectionReason: trimmedReason });

    selectedApp = app;
    syncBackend(app, 'Rejected');
    saveDecisionHistory(app, 'Rejected', trimmedReason);

    alert('Application ' + app.id + ' has been rejected.\nReason: ' + trimmedReason);
    window.location.href = '../verification/index.html';
  };

  function showVerifiedPopup(appId) {
    if (!document.getElementById('_veri_styles')) {
      var s = document.createElement('style');
      s.id = '_veri_styles';
      s.textContent =
        '@keyframes _fadeIn{from{opacity:0}to{opacity:1}}' +
        '@keyframes _popIn{from{opacity:0;transform:scale(0.75)}to{opacity:1;transform:scale(1)}}';
      document.head.appendChild(s);
    }

    var overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed', 'inset:0',
      'background:rgba(15,23,42,0.55)',
      'z-index:9999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'animation:_fadeIn .25s ease'
    ].join(';');

    var card = document.createElement('div');
    card.style.cssText = [
      'background:#ffffff',
      'border-radius:22px',
      'padding:44px 48px 40px',
      'max-width:420px', 'width:92%',
      'text-align:center',
      'box-shadow:0 24px 72px rgba(0,0,0,0.22)',
      'animation:_popIn .35s cubic-bezier(0.34,1.56,0.64,1)'
    ].join(';');

    card.innerHTML =
      '<div style="width:82px;height:82px;border-radius:50%;' +
        'background:#f0fdf4;' +
        'display:flex;align-items:center;justify-content:center;' +
        'font-size:40px;margin:0 auto 22px;border:3px solid #16a34a22;">' +
        '&#10004;' +
      '</div>' +
      '<h2 style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:8px;">' +
        'Verification Successful!' +
      '</h2>' +
      '<p style="font-size:14px;color:#64748b;line-height:1.65;margin-bottom:26px;">' +
        'Application <b>' + escapeHtml(appId) + '</b> has been verified and moved to Pending Inspection.' +
      '</p>' +
      '<button id="_popup_ok" style="' +
        'width:100%;padding:14px;border:none;border-radius:12px;cursor:pointer;' +
        'background:linear-gradient(135deg,#2f5bea,#4a90e2);' +
        'color:#fff;font-size:15px;font-weight:700;letter-spacing:0.3px;' +
        'box-shadow:0 4px 14px rgba(47,91,234,.35);' +
        'transition:opacity .2s;">' +
        'Schedule Inspection &rarr;' +
      '</button>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    var okBtn = document.getElementById('_popup_ok');
    okBtn.addEventListener('mouseenter', function() { this.style.opacity = '0.88'; });
    okBtn.addEventListener('mouseleave', function() { this.style.opacity = '1'; });
    okBtn.addEventListener('click', function() {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity .25s';
      setTimeout(function() {
        if (overlay.parentNode) overlay.remove();
        window.location.href = '../scheduleinspection/index.html';
      }, 260);
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    selectedApp = loadSelectedApplication();
    renderApplication(selectedApp);

    if (window.location.search.indexOf('readonly=true') !== -1) {
      var actionBtns = document.querySelector('.action-btns');
      if (actionBtns) actionBtns.style.display = 'none';
    }
  });
})();
