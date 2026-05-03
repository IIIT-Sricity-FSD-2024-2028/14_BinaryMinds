// ============================================================
// mock.js — TradeZo Lightweight Mock Backend
// Stores everything in localStorage. No frameworks.
// ============================================================

var DB = (function() {

  // ---- SEED: runs only once per browser ----
  function init() {
    if (localStorage.getItem('tz_db_ready')) return;

    var users = [
      { id:'APP-1001', name:'Rajesh Kumar',  email:'rajesh@applicant.com',    password:'applicant123', role:'applicant',           phone:'9876543210', notifications:[], hasApplied:false, applicationId:null },
      { id:'APP-1002', name:'Priya Sharma',  email:'priya@applicant.com',     password:'applicant123', role:'applicant',           phone:'9876543211', notifications:[], hasApplied:true,  applicationId:'TL-2026-002' },
      { id:'FO-2001',  name:'Myra Singh',    email:'myra@fieldofficer.com',   password:'field123',     role:'field officer',       phone:'9876543220', notifications:[{msg:'You have been added as a Field Officer on TradeZo. Welcome!', read:false}], hasApplied:false, applicationId:null },
      { id:'FO-2002',  name:'Vikram Desai',  email:'vikram@fieldofficer.com', password:'field123',     role:'field officer',       phone:'9876543221', notifications:[], hasApplied:false, applicationId:null },
      { id:'DO-3001',  name:'Anjali Mehta',  email:'admin@deptofficer.com',   password:'dept123',      role:'department officer',  phone:'9876543230', notifications:[], hasApplied:false, applicationId:null },
      { id:'SU-4001',  name:'Admin User',    email:'admin@tradezo.gov.in',    password:'super123',     role:'superuser',           phone:'9876543240', notifications:[], hasApplied:false, applicationId:null }
    ];

    var applications = [
      {
        id:'TL-2026-001', userId:'APP-1001',
        applicantName:'Rajesh Kumar', email:'rajesh@applicant.com', phone:'9876543210',
        businessName:'Green Valley Restaurant', businessType:'Retail Shop',
        tradeCategory:'Food & Beverages', shopAddress:'123 Main Street, Sector 45',
        city:'Gurugram', district:'Gurugram', state:'Haryana', pincode:'122001',
        shopArea:'450', aadhaar:'234567891234', fatherName:'Suresh Kumar', motherName:'Meena Kumar', gender:'Male',
        submittedDate:'Feb 20, 2026', paymentRef:'PAY-2026-98761',
        assignedFO:'FO-2001',
        inspectionDate:'', inspectionTime:'',
        licenseId:'', licenseIssueDate:'', licenseExpiryDate:'',
        rejectionReason:'',
        docs:{ aadhaar:'aadhaar_rajesh.pdf', addressProof:'address_rajesh.pdf', shopPhoto:'shop_rajesh.jpg' },
        status:'Documents Verified',
        timeline:[
          { step:'Submitted',            date:'Feb 20, 2026', done:true  },
          { step:'Documents Verified',   date:'Feb 25, 2026', done:true  },
          { step:'Inspection Scheduled', date:'',             done:false },
          { step:'Inspection Completed', date:'',             done:false },
          { step:'Approved',             date:'',             done:false }
        ]
      },
      {
        id:'TL-2026-002', userId:'APP-1002',
        applicantName:'Priya Sharma', email:'priya@applicant.com', phone:'9876543211',
        businessName:'Fresh Mart Grocery', businessType:'Wholesale',
        tradeCategory:'Retail', shopAddress:'Connaught Place',
        city:'Delhi', district:'Central Delhi', state:'Delhi', pincode:'110001',
        shopArea:'320', aadhaar:'456789123456', fatherName:'Anil Sharma', motherName:'Kavita Sharma', gender:'Female',
        submittedDate:'Jan 15, 2026', paymentRef:'PAY-2026-76543',
        assignedFO:'FO-2001',
        inspectionDate:'Feb 10, 2026', inspectionTime:'11:00 AM',
        licenseId:'LIC-2026-0031', licenseIssueDate:'Feb 28, 2026', licenseExpiryDate:'Feb 28, 2027',
        rejectionReason:'',
        docs:{ aadhaar:'aadhaar_priya.pdf', addressProof:'address_priya.pdf', shopPhoto:'shop_priya.jpg' },
        status:'Approved',
        timeline:[
          { step:'Submitted',            date:'Jan 15, 2026', done:true },
          { step:'Documents Verified',   date:'Jan 20, 2026', done:true },
          { step:'Inspection Scheduled', date:'Jan 25, 2026', done:true },
          { step:'Inspection Completed', date:'Feb 10, 2026', done:true },
          { step:'Approved',             date:'Feb 28, 2026', done:true }
        ]
      }
    ];

    _save('tz_users', users);
    _save('tz_apps',  applications);
    localStorage.setItem('tz_db_ready', '1');
  }

  // ---- HELPERS ----
  function _save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function _load(key)      { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){ return []; } }

  // ---- USERS ----
  function getUsers()      { return _load('tz_users'); }
  function saveUsers(u)    { _save('tz_users', u); }

  function getUserByEmail(email) {
    return getUsers().find(function(u){ return u.email.toLowerCase()===email.toLowerCase(); }) || null;
  }
  function getUserById(id) {
    return getUsers().find(function(u){ return u.id===id; }) || null;
  }
  function updateUser(id, data) {
    var users = getUsers();
    var idx   = users.findIndex(function(u){ return u.id===id; });
    if (idx===-1) return;
    Object.assign(users[idx], data);
    saveUsers(users);
  }
  function addUser(data) {
    var users = getUsers();
    data.id   = 'USR-' + Date.now();
    data.notifications = [];
    data.hasApplied    = false;
    data.applicationId = null;
    users.push(data);
    saveUsers(users);
    // Welcome notification
    addNotification(data.id, 'You have been added as a ' + data.role + ' on TradeZo. Welcome!');
    return data;
  }
  function deleteUser(id) {
    saveUsers(getUsers().filter(function(u){ return u.id!==id; }));
  }

  // ---- APPLICATIONS ----
  function getApps()    { return _load('tz_apps'); }
  function saveApps(a)  { _save('tz_apps', a); }

  function getAppById(id) {
    return getApps().find(function(a){ return a.id===id; }) || null;
  }
  function getAppsByUser(userId) {
    return getApps().filter(function(a){ return a.userId===userId; });
  }
  function getAppsByOfficer(foId) {
    return getApps().filter(function(a){ return a.assignedFO===foId; });
  }
  function getAllApps() {
    return getApps();
  }

  function addApp(data) {
    var apps = getApps();
    var id   = 'TL-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-5);
    var app  = Object.assign({
      id: id,
      status: 'Submitted',
      submittedDate: new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),
      paymentRef: 'PAY-' + String(Date.now()).slice(-8),
      assignedFO: 'FO-2001',
      licenseId:'', licenseIssueDate:'', licenseExpiryDate:'',
      rejectionReason:'', inspectionDate:'', inspectionTime:'',
      timeline:[
        { step:'Submitted',            date:new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}), done:true  },
        { step:'Documents Verified',   date:'', done:false },
        { step:'Inspection Scheduled', date:'', done:false },
        { step:'Inspection Completed', date:'', done:false },
        { step:'Approved',             date:'', done:false }
      ]
    }, data);
    apps.push(app);
    saveApps(apps);

    // Mark user as applied
    updateUser(data.userId, { hasApplied:true, applicationId:id });

    // Notify assigned FO
    addNotification(app.assignedFO, 'New application ' + id + ' assigned to you for verification.');
    return app;
  }

  function updateAppStatus(id, newStatus, extra) {
    var apps = getApps();
    var idx  = apps.findIndex(function(a){ return a.id===id; });
    if (idx===-1) return null;

    apps[idx].status = newStatus;
    var today = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});

    // Update timeline
    var stepMap = {
      'Documents Verified':   1,
      'Inspection Scheduled': 2,
      'Inspection Completed': 3,
      'Approved':             4,
      'Rejected':             -1
    };
    var si = stepMap[newStatus];
    if (si && si>0) {
      for (var i=0; i<=si; i++) {
        if (apps[idx].timeline[i] && !apps[idx].timeline[i].done) {
          apps[idx].timeline[i].done = true;
          apps[idx].timeline[i].date = today;
        }
      }
    }
    if (extra) Object.assign(apps[idx], extra);
    saveApps(apps);

    // Notify applicant
    var msgs = {
      'Documents Verified':   'Your documents have been verified for application ' + id + '.',
      'Inspection Scheduled': 'An inspection has been scheduled for your application ' + id + '.',
      'Inspection Completed': 'Inspection completed for ' + id + '. Pending final review.',
      'Approved':             'Congratulations! Application ' + id + ' has been approved. Your license is ready.',
      'Rejected':             'Application ' + id + ' was rejected. Reason: ' + (extra&&extra.rejectionReason||'See officer notes.')
    };
    if (msgs[newStatus]) addNotification(apps[idx].userId, msgs[newStatus]);

    return apps[idx];
  }

  // ---- NOTIFICATIONS ----
  function addNotification(userId, msg) {
    var users = getUsers();
    var idx   = users.findIndex(function(u){ return u.id===userId; });
    if (idx===-1) return;
    if (!users[idx].notifications) users[idx].notifications = [];
    users[idx].notifications.unshift({ msg:msg, read:false, date:new Date().toLocaleDateString('en-IN') });
    saveUsers(users);
  }
  function getNotifications(userId) {
    var u = getUserById(userId);
    return (u && u.notifications) ? u.notifications : [];
  }
  function getUnreadCount(userId) {
    return getNotifications(userId).filter(function(n){ return !n.read; }).length;
  }
  function markNotificationsRead(userId) {
    var users = getUsers();
    var idx   = users.findIndex(function(u){ return u.id===userId; });
    if (idx===-1) return;
    (users[idx].notifications||[]).forEach(function(n){ n.read=true; });
    saveUsers(users);
  }

  // ---- SESSION ----
  function getSession() {
    try { return JSON.parse(sessionStorage.getItem('tz_session')||'null'); } catch(e){ return null; }
  }
  function setSession(user) {
    sessionStorage.setItem('tz_session', JSON.stringify({ id:user.id, name:user.name, email:user.email, role:user.role }));
  }
  function clearSession() {
    sessionStorage.removeItem('tz_session');
  }

  // ---- STATUS COLOR ----
  function statusColor(status) {
    var map = {
      'Submitted':'#f59e0b', 'Documents Verified':'#3b82f6',
      'Inspection Scheduled':'#8b5cf6', 'Inspection Completed':'#06b6d4',
      'Approved':'#16a34a', 'Rejected':'#ef4444'
    };
    return map[status]||'#6b7280';
  }

  // ---- REGISTER ----
  function register(name, email, phone, password) {
    if (getUserByEmail(email)) return { ok:false, msg:'Email already registered.' };
    var user = addUser({ name:name, email:email, phone:phone, password:password, role:'applicant' });
    setSession(user);
    return { ok:true, user:user };
  }

  // ---- LOGIN ----
  var DEMO_USERS = [
    { id:'APP-1001', name:'Rajesh Kumar',  email:'rajesh@applicant.com',    password:'applicant123', role:'applicant',           phone:'9876543210', notifications:[], hasApplied:false, applicationId:null },
    { id:'APP-1002', name:'Priya Sharma',  email:'priya@applicant.com',     password:'applicant123', role:'applicant',           phone:'9876543211', notifications:[], hasApplied:true,  applicationId:'TL-2026-002' },
    { id:'FO-2001',  name:'Myra Singh',    email:'myra@fieldofficer.com',   password:'field123',     role:'field officer',       phone:'9876543220', notifications:[], hasApplied:false, applicationId:null },
    { id:'FO-2002',  name:'Vikram Desai',  email:'vikram@fieldofficer.com', password:'field123',     role:'field officer',       phone:'9876543221', notifications:[], hasApplied:false, applicationId:null },
    { id:'DO-3001',  name:'Anjali Mehta',  email:'admin@deptofficer.com',   password:'dept123',      role:'department officer',  phone:'9876543230', notifications:[], hasApplied:false, applicationId:null },
    { id:'SU-4001',  name:'Admin User',    email:'admin@tradezo.gov.in',    password:'super123',     role:'superuser',           phone:'9876543240', notifications:[], hasApplied:false, applicationId:null }
  ];

  function login(email, password, role) {
    // Check localStorage DB users first
    var user = getUserByEmail(email);
    // Fallback to hardcoded demo users (in case localStorage was cleared)
    if (!user) {
      user = DEMO_USERS.find(function(u){ return u.email.toLowerCase() === email.toLowerCase(); }) || null;
    }
    if (!user) return { ok:false, msg:'No account found with this email.' };
    if (user.password !== password) return { ok:false, msg:'Incorrect password.' };
    if (user.role.toLowerCase() !== role.toLowerCase()) return { ok:false, msg:'Wrong role selected. Your role is: ' + user.role };
    setSession(user);
    return { ok:true, user:user };
  }

  // Run init
  init();

  // Public API
  return {
    getUsers:getUsers, saveUsers:saveUsers, getUserByEmail:getUserByEmail, getUserById:getUserById,
    updateUser:updateUser, addUser:addUser, deleteUser:deleteUser,
    getApps:getApps, getAppById:getAppById, getAppsByUser:getAppsByUser,
    getAppsByOfficer:getAppsByOfficer, getAllApps:getAllApps,
    addApp:addApp, updateAppStatus:updateAppStatus,
    addNotification:addNotification, getNotifications:getNotifications,
    getUnreadCount:getUnreadCount, markNotificationsRead:markNotificationsRead,
    getSession:getSession, setSession:setSession, clearSession:clearSession,
    statusColor:statusColor, register:register, login:login
  };
})();
