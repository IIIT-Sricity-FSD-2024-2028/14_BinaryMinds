document.addEventListener('DOMContentLoaded', function () {

  /* ── 1. Populate business info from sessionStorage ── */
  var appId    = sessionStorage.getItem('selectedApp')   || '';
  var bizName  = sessionStorage.getItem('businessName')  || '';
  var owner    = sessionStorage.getItem('ownerName')     || '';
  var category = sessionStorage.getItem('tradeCategory') || '';
  var address  = sessionStorage.getItem('address')       || '';

  function safeArray(key) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch(e) {
      return [];
    }
  }

  function clean(val) {
    if (val == null) return '';
    var text = String(val).trim();
    var lower = text.toLowerCase();
    if (!text || lower === 'undefined' || lower === 'null' || lower === 'n/a' || text === '-' || text === '—') return '';
    return text;
  }

  function firstValue() {
    for (var i = 0; i < arguments.length; i++) {
      var value = clean(arguments[i]);
      if (value) return value;
    }
    return '';
  }

  function appIdOf(item) {
    if (!item) return '';
    return firstValue(item.appId, item.id, item.appRef, item.applicationId, item.application_id);
  }

  function findStoredApplication(id) {
    var sources = []
      .concat(window.TRADEZO && Array.isArray(TRADEZO.applications) ? TRADEZO.applications : [])
      .concat(safeArray('tz_submitted_apps'))
      .concat(safeArray('applications'))
      .concat(safeArray('tradezo_applications'));

    return sources.find(function(item) {
      return String(appIdOf(item)) === String(id);
    }) || {};
  }

  var storedApp = findStoredApplication(appId);
  bizName = firstValue(bizName, storedApp.businessName, storedApp.business_name, storedApp.business) || bizName;
  owner = firstValue(owner, storedApp.ownerName, storedApp.applicantName, storedApp.full_name, storedApp.applicant) || owner;
  category = firstValue(
    category,
    storedApp.tradeCategory,
    storedApp.trade_category,
    storedApp.category,
    storedApp.licenseType,
    storedApp.businessType,
    storedApp.business_type
  ) || category;
  address = firstValue(address, storedApp.shopAddress, storedApp.shop_address, storedApp.address) || address;

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  setText('appId', appId);
  setText('bizName', bizName);
  setText('ownerName', owner);
  setText('tradeCategory', category);
  setText('address', address);

  /* ── 2. Default date = today ── */
  var dateInput = document.getElementById('inspDate');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  /* ── 3. File upload counter ── */
  var fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      var label = document.querySelector('.upload-box p');
      if (label) label.textContent = this.files.length + ' file(s) selected';
    });
  }

  /* ── 4. Submit handler ── */
  var submitBtn = document.querySelector('.submit-btn');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', function () {
    var inspDate   = (document.getElementById('inspDate')   || {}).value || '';
    var inspResult = (document.getElementById('inspResult') || {}).value || '';
    var inspNotes  = (document.getElementById('inspNotes')  || {}).value || '';

    /* Validation */
    if (!inspDate) {
      showInlineError('Please select an inspection date.');
      return;
    }
    if (!inspResult) {
      showInlineError('Please select an inspection result (Approved / Rejected).');
      return;
    }
    if (!inspNotes || inspNotes.trim().length < 10) {
      showInlineError('Please enter detailed inspection notes (at least 10 characters).');
      return;
    }

    if (!appId) {
      showInlineError('No application selected for inspection.');
      return;
    }

    var nowIso = new Date().toISOString();

    /* Persist to sessionStorage */
    sessionStorage.setItem('inspectionSubmitted', appId);
    sessionStorage.setItem('inspectionResult',    inspResult);
    sessionStorage.setItem('inspectionDate',      inspDate);
    sessionStorage.setItem('inspectionNotes',     inspNotes.trim());

    /* Persist report to localStorage for Inspection History */
    var reports = [];
    try { reports = JSON.parse(localStorage.getItem('tz_inspection_reports') || '[]'); } catch(e){ reports = []; }
    var report = {
      appId: appId,
      businessName: bizName,
      type: category,
      tradeCategory: category,
      address: address,
      ownerName: owner,
      date: inspDate,
      inspectionDate: inspDate,
      result: inspResult,
      notes: inspNotes.trim(),
      submittedDate: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
      updatedAt: nowIso,
      createdAt: nowIso
    };
    reports = reports.filter(function(r){ return r.appId !== appId; });
    reports.unshift(report);
    localStorage.setItem('tz_inspection_reports', JSON.stringify(reports));

    /* Update mock inspection status in memory */
    if (window.TRADEZO && Array.isArray(TRADEZO.inspections)) {
      TRADEZO.inspections.forEach(function(item) {
        if (item.appId === appId) {
          item.status = 'Completed';
          item.result = inspResult;
          item.date = inspDate;
          item.notes = inspNotes.trim();
        }
      });
    }

    /* Update the main applications LocalStorage */
    let applications = [];
    try { applications = JSON.parse(localStorage.getItem('applications') || '[]'); } catch(e){}
    applications.forEach(function(a) {
        if (a.id === appId) {
            a.status = (inspResult === 'Rejected') ? 'Rejected' : 'Inspection Recorded';
            a.updatedAt = nowIso;
            if (inspResult === 'Rejected') {
                a.rejectionReason = 'Rejected during Field Inspection. Remarks: ' + inspNotes.trim();
            }
        }
    });
    localStorage.setItem('applications', JSON.stringify(applications));

    /* Update tz_submitted_apps for global sync */
    let tzApps = [];
    try { tzApps = JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]'); } catch(e){}
    tzApps.forEach(function(a) {
        if (a.id === appId || a.appRef === appId) {
            a.status = (inspResult === 'Rejected') ? 'Rejected' : 'Inspection Recorded';
            a.updatedAt = nowIso;
            if (inspResult === 'Rejected') {
                a.rejectionReason = 'Rejected during Field Inspection. Remarks: ' + inspNotes.trim();
            }
        }
    });
    localStorage.setItem('tz_submitted_apps', JSON.stringify(tzApps));

    /* Show the success popup */
    showSubmitPopup(appId, bizName, inspResult);
  });
});

/* ───────────────────────────────────────────────
   Inline validation error (styled, auto-removes)
─────────────────────────────────────────────── */
function showInlineError(msg) {
  var old = document.getElementById('_insp_err');
  if (old) old.remove();

  var div = document.createElement('div');
  div.id  = '_insp_err';
  div.style.cssText = [
    'background:#fff1f0',
    'border:1.5px solid #fca5a5',
    'color:#dc2626',
    'border-radius:10px',
    'padding:11px 16px',
    'margin-top:14px',
    'font-size:13px',
    'font-weight:600',
    'display:flex',
    'align-items:center',
    'gap:8px',
    'animation:_fadeIn .25s ease'
  ].join(';');
  div.innerHTML = '&#9888;&#65039; ' + msg;

  var btn = document.querySelector('.submit-btn');
  if (btn && btn.parentNode) btn.parentNode.insertBefore(div, btn);

  setTimeout(function () { if (div.parentNode) div.remove(); }, 4500);
}

/* ───────────────────────────────────────────────
   Success popup modal
─────────────────────────────────────────────── */
function showSubmitPopup(appId, bizName, result) {

  /* Inject keyframe animations once */
  if (!document.getElementById('_insp_styles')) {
    var s = document.createElement('style');
    s.id  = '_insp_styles';
    s.textContent =
      '@keyframes _fadeIn { from{opacity:0} to{opacity:1} }' +
      '@keyframes _popIn  { from{opacity:0;transform:scale(0.75)} to{opacity:1;transform:scale(1)} }';
    document.head.appendChild(s);
  }

  var isApproved = (result === 'Approved');
  var accent     = isApproved ? '#16a34a' : '#dc2626';
  var lightBg    = isApproved ? '#f0fdf4' : '#fff1f0';
  var emoji      = isApproved ? '✅' : '❌';
  var resultLabel= isApproved ? 'Approved' : 'Rejected';

  /* Overlay */
  var overlay = document.createElement('div');
  overlay.id  = '_submit_overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0',
    'background:rgba(15,23,42,0.55)',
    'z-index:9999',
    'display:flex', 'align-items:center', 'justify-content:center',
    'animation:_fadeIn .25s ease'
  ].join(';');

  /* Card */
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
    /* Icon ring */
    '<div style="width:82px;height:82px;border-radius:50%;' +
      'background:' + lightBg + ';' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-size:40px;margin:0 auto 22px;border:3px solid ' + accent + '22;">' +
      emoji +
    '</div>' +

    /* Heading */
    '<h2 style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:8px;">' +
      'Inspection Submitted!' +
    '</h2>' +

    /* Sub-text */
    '<p style="font-size:14px;color:#64748b;line-height:1.65;margin-bottom:26px;">' +
      'Your field inspection report has been recorded successfully.' +
    '</p>' +

    /* Details pill box */
    '<div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;' +
      'padding:18px 22px;margin-bottom:28px;text-align:left;">' +

      '<div style="display:flex;justify-content:space-between;align-items:center;' +
        'padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid #e2e8f0;font-size:13px;">' +
        '<span style="color:#64748b;font-weight:500;">Application ID</span>' +
        '<b style="color:#0f172a;">' + appId + '</b>' +
      '</div>' +

      '<div style="display:flex;justify-content:space-between;align-items:center;' +
        'padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid #e2e8f0;font-size:13px;">' +
        '<span style="color:#64748b;font-weight:500;">Business Name</span>' +
        '<b style="color:#0f172a;">' + bizName + '</b>' +
      '</div>' +

      '<div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">' +
        '<span style="color:#64748b;font-weight:500;">Result</span>' +
        '<span style="background:' + lightBg + ';color:' + accent + ';' +
          'font-weight:700;padding:4px 14px;border-radius:20px;font-size:12px;">' +
          emoji + ' ' + resultLabel +
        '</span>' +
      '</div>' +

    '</div>' +

    /* CTA button */
    '<button id="_popup_ok" style="' +
      'width:100%;padding:14px;border:none;border-radius:12px;cursor:pointer;' +
      'background:linear-gradient(135deg,#2f5bea,#4a90e2);' +
      'color:#fff;font-size:15px;font-weight:700;letter-spacing:0.3px;' +
      'box-shadow:0 4px 14px rgba(47,91,234,.35);' +
      'transition:opacity .2s;">' +
      'Back to Inspections &rarr;' +
    '</button>';

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  /* Button hover effect */
  var okBtn = document.getElementById('_popup_ok');
  okBtn.addEventListener('mouseenter', function () { this.style.opacity = '0.88'; });
  okBtn.addEventListener('mouseleave', function () { this.style.opacity = '1'; });

  /* Close + redirect */
  function closeAndRedirect() {
    overlay.style.opacity    = '0';
    overlay.style.transition = 'opacity .25s';
    setTimeout(function () {
      if (overlay.parentNode) overlay.remove();
      window.location.href = '../recordinspection/index.html';
    }, 260);
  }

  okBtn.addEventListener('click', closeAndRedirect);

  /* Auto-redirect after 5 s if user doesn't click */
  var autoTimer = setTimeout(closeAndRedirect, 5000);
  okBtn.addEventListener('click', function () { clearTimeout(autoTimer); });
}
