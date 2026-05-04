(function() {
  var routes = {
    dashboard: '../fodashboard/index.html',
    verification: '../verification/index.html',
    recordinspection: '../recordinspection/index.html',
    verificationhistory: '../verificationhistory/index.html',
    inspectionhistory: '../inspectionhistory/index.html',
    profile: '../profile/index.html',
    sla: '../sla/index.html'
  };

  var labels = {
    dashboard: 'D',
    verification: 'V',
    recordinspection: 'R',
    verificationhistory: 'VH',
    inspectionhistory: 'IH',
    profile: 'P',
    sla: 'S'
  };

  function safeArray(key) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch(e) {
      return [];
    }
  }

  function normalizeRole(role) {
    return String(role || '').toLowerCase().replace('_', ' ').trim();
  }

  function normalizeOfficer(user) {
    return {
      id: user.id || user.user_id || user.empId || '',
      empId: user.empId || user.id || user.user_id || '',
      backendUserId: user.backendUserId || user.user_id || '',
      name: user.name || user.full_name || 'Field Officer',
      email: user.email || '',
      phone: user.phone || '',
      role: normalizeRole(user.role) || 'field officer',
      status: user.status || 'Active',
      joinDate: user.joinDate || user.created_at || '',
      department: user.department || 'Trade License Department',
      location: user.location || 'Municipal Corporation'
    };
  }

  window.foCurrentOfficer = function() {
    var loggedIn = {};
    try { loggedIn = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch(e) {}
    var email = (loggedIn.email || '').toLowerCase();
    var candidates = safeArray('users').concat(safeArray('registeredUsers'));
    var stored = candidates.find(function(user) {
      return (user.email || '').toLowerCase() === email;
    });
    return normalizeOfficer(Object.assign({}, stored || {}, loggedIn || {}));
  };

  window.foIsAssignedToCurrentOfficer = function(item) {
    var officer = window.foCurrentOfficer();
    var values = [
      item.assignedFO,
      item.foName,
      item.fieldOfficer,
      item.fieldOfficerName,
      item.fieldOfficerId,
      item.field_officer_id,
      item.assignedFieldOfficer,
      item.assignedTo,
      item.assignedEmail,
      item.fieldOfficerEmail
    ].filter(Boolean).map(function(value) {
      return String(value).toLowerCase().trim();
    });

    var keys = [officer.id, officer.empId, officer.backendUserId, officer.name, officer.email]
      .filter(Boolean)
      .map(function(value) { return String(value).toLowerCase().trim(); });

    return values.some(function(value) { return keys.indexOf(value) !== -1; });
  };

  window.foNav = function(page) {
    var key = String(page || '').toLowerCase().replace(/[\s_-]/g, '');
    if (routes[key]) window.location.href = routes[key];
  };

  window.foLogout = function() {
    if (!confirm('Are you sure you want to sign out?')) return;
    sessionStorage.clear();
    window.location.href = '../../applicant_connected/connected/login/index.html';
  };

  function pageKeyFromText(text) {
    return String(text || '').toLowerCase().replace(/[\s_-]/g, '');
  }

  function addSidebarNavigation() {
    var items = document.querySelectorAll('.sidebar li');
    items.forEach(function(item) {
      var key = pageKeyFromText(item.textContent);
      if (!routes[key]) return;
      item.addEventListener('click', function() {
        window.location.href = routes[key];
      });
    });
  }

  function injectFallbackStyles() {
    if (document.getElementById('fo-nav-fallback-styles')) return;
    var style = document.createElement('style');
    style.id = 'fo-nav-fallback-styles';
    style.textContent =
      '.fallback-icon{display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;border-radius:7px;background:#e0e7ff;color:#102a72;font-size:11px;font-weight:800;flex:0 0 auto}' +
      '.sidebar li.active .fallback-icon{background:rgba(255,255,255,.18);color:#fff}' +
      '.logout-fallback{border:1px solid #fecaca;border-radius:7px;background:#fef2f2;color:#dc2626;font-weight:800;padding:9px 12px;cursor:pointer}';
    document.head.appendChild(style);
  }

  function addIconFallback(img) {
    if (!img || img.dataset.fallbackReady === 'true') return;
    img.dataset.fallbackReady = 'true';

    if (img.classList.contains('header-icon')) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'logout-fallback';
      btn.textContent = 'Sign Out';
      btn.addEventListener('click', window.foLogout);
      img.replaceWith(btn);
      return;
    }

    if (img.classList.contains('icon')) {
      var item = img.closest('li');
      var key = pageKeyFromText(item ? item.textContent : '');
      var span = document.createElement('span');
      span.className = 'fallback-icon';
      span.textContent = labels[key] || '•';
      img.replaceWith(span);
      return;
    }

    img.style.display = 'none';
  }

  function patchMissingImages() {
    document.querySelectorAll('img').forEach(function(img) {
      if (img.complete && img.naturalWidth === 0) addIconFallback(img);
      img.addEventListener('error', function() { addIconFallback(img); });
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    injectFallbackStyles();
    var officer = window.foCurrentOfficer();
    document.querySelectorAll('.user-info b, .welcome-name, .user-name').forEach(function(el) {
      if (officer.name) el.textContent = officer.name;
    });
    addSidebarNavigation();
    patchMissingImages();
  });
})();
