(function() {
  var routes = {
    home: '../../applicant_connected/connected/landing%20page/index.html',
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
    var munis = (window.TRADEZO && typeof TRADEZO.getMunicipalities === 'function') ? TRADEZO.getMunicipalities() : [];
    var muniId = user.municipality_id || user.municipalityId || '';
    var muniObj = munis.find(function(m) { return String(m.municipality_id).toLowerCase() === String(muniId).toLowerCase(); });
    var locationName = user.location || (muniObj ? (muniObj.name || muniObj.district) : 'Municipal Corporation');

    return {
      id: user.user_id || user.id || user.employee_id || user.empId || '',
      empId: user.employee_id || user.empId || user.id || user.user_id || '',
      employee_id: user.employee_id || user.empId || user.id || user.user_id || '',
      backendUserId: user.backendUserId || user.user_id || user.id || '',
      name: user.full_name || user.name || 'Field Officer',
      email: user.email || '',
      phone: user.phone || '',
      role: normalizeRole(user.role) || 'field officer',
      status: user.status || 'Active',
      municipality_id: muniId,
      joinDate: user.joinDate || user.created_at || user.createdAt || '',
      department: user.department || 'Trade License Department',
      location: locationName
    };
  }

  window.foCurrentOfficer = function() {
    var loggedIn = {};
    try { loggedIn = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch(e) {}

    var tradezoUsers = (window.TRADEZO && Array.isArray(TRADEZO.users)) ? TRADEZO.users : [];
    var candidates = safeArray('users').concat(safeArray('registeredUsers')).concat(tradezoUsers);
    
    var email = (loggedIn.email || '').toLowerCase();
    var stored = null;
    if (email) {
      stored = candidates.find(function(user) {
        return (user.email || '').toLowerCase() === email;
      });
    }
    if (!stored && loggedIn.user_id) {
      stored = candidates.find(function(user) {
        return user.user_id === loggedIn.user_id || user.id === loggedIn.user_id;
      });
    }
    return normalizeOfficer(Object.assign({}, stored || {}, loggedIn || {}));
  };

  window.foBelongsToCurrentMunicipality = function(item) {
    if (!item) return false;
    var officer = window.foCurrentOfficer();
    var officerMuni = String(officer.municipality_id || '').toLowerCase().trim();
    if (!officerMuni) return true;
    if (window.TRADEZO && typeof TRADEZO.isAllowedForTenant === 'function') {
      return TRADEZO.isAllowedForTenant(item, officerMuni);
    }
    var itemMuni = String(item.municipality_id || item.municipalityId || '').toLowerCase().trim();
    if (itemMuni) return itemMuni === officerMuni;
    return true;
  };

  window.foIsAssignedToCurrentOfficer = function(item) {
    if (!window.foBelongsToCurrentMunicipality(item)) return false;
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
    ].map(function(value) {
      return String(value).toLowerCase().trim();
    }).filter(function(v) { return v.length > 0 && v !== 'undefined' && v !== 'null' && v !== 'n/a'; });

    var keys = [officer.id, officer.empId, officer.backendUserId, officer.name, officer.email]
      .map(function(value) { return String(value || '').toLowerCase().trim(); })
      .filter(function(v) { return v.length > 0 && v !== 'field officer' && v !== 'undefined' && v !== 'null' && v !== 'n/a'; });

    if (values.length === 0 || keys.length === 0) return false;

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

  function addHomeNavigation() {
    document.querySelectorAll('.sidebar ul').forEach(function(list) {
      if (list.querySelector('[data-canonical-home]')) return;
      var item = document.createElement('li');
      item.dataset.canonicalHome = 'true';
      item.textContent = 'Home';
      item.addEventListener('click', function() { window.location.href = routes.home; });
      list.insertBefore(item, list.firstChild);
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

    var muniId = (officer && officer.municipality_id) || 'muni-hyd';
    var muni = (window.TRADEZO && typeof TRADEZO.getMunicipality === 'function')
      ? TRADEZO.getMunicipality(muniId)
      : { name: 'Greater Hyderabad Municipal Corporation (GHMC)' };

    document.querySelectorAll('.logo h4, .subtitle, .top-text small').forEach(function(el) {
      if (el.textContent && el.textContent.includes('Municipal Corporation')) {
        el.textContent = muni.name + ' \u2013 Trade License Management System';
      }
    });

    addSidebarNavigation();
    addHomeNavigation();
    patchMissingImages();
  });
})();
