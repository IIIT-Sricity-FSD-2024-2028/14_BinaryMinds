// ============================================================
// script.js — Super User Panel
// Plain JavaScript — No libraries, no frameworks
// ============================================================
 
 
// ============================================================
// MOCK DATA — This acts as our fake database
// ============================================================
 
// List of officers in the system
var users = [
  { id: "USR001", name: "Rajesh Kumar",    email: "rajesh.kumar@tradezo.gov.in",    phone: "9876543210", role: "Field Officer",      status: "Active",   empId: "EMP-00101", joinDate: "2023-01-15" },
  { id: "USR002", name: "Priya Sharma",    email: "priya.sharma@tradezo.gov.in",    phone: "9876543211", role: "Department Officer", status: "Active",   empId: "EMP-00102", joinDate: "2022-06-10" },
  { id: "USR005", name: "Vikram Singh",    email: "vikram.singh@tradezo.gov.in",    phone: "9876543212", role: "Field Officer",      status: "Active",   empId: "EMP-00105", joinDate: "2023-03-20" },
  { id: "USR007", name: "Arjun Verma",     email: "arjun.verma@tradezo.gov.in",     phone: "9876543213", role: "Department Officer", status: "Active",   empId: "EMP-00107", joinDate: "2021-11-05" },
  { id: "USR009", name: "Rohit Desai",     email: "rohit.desai@tradezo.gov.in",     phone: "9876543214", role: "Field Officer",      status: "Inactive", empId: "EMP-00109", joinDate: "2022-09-14" },
  { id: "USR011", name: "Sanjay Malhotra", email: "sanjay.malhotra@tradezo.gov.in", phone: "9876543215", role: "Field Officer",      status: "Active",   empId: "EMP-00111", joinDate: "2023-07-01" },
  { id: "USR013", name: "Deepak Chopra",   email: "deepak.chopra@tradezo.gov.in",   phone: "9876543216", role: "Department Officer", status: "Active",   empId: "EMP-00113", joinDate: "2020-12-22" },
  { id: "USR015", name: "Manish Tiwari",   email: "manish.tiwari@tradezo.gov.in",   phone: "9876543217", role: "Field Officer",      status: "Active",   empId: "EMP-00115", joinDate: "2024-01-08" }
];
 
// List of trade license applications
var applications = [
  { id: "TL2026-001245", applicant: "Rajesh Kumar",  business: "Green Valley Restaurant", category: "Food & Beverages", date: "Feb 20, 2026", status: "Pending",      address: "123 Main St, Gurugram",  phone: "9876543210", email: "rajesh@example.com" },
  { id: "TL2026-001240", applicant: "Vikram Singh",  business: "Singh Electronics",       category: "Retail",           date: "Feb 18, 2026", status: "Under Review", address: "45 MG Road, Delhi",      phone: "9876543211", email: "vikram@example.com" },
  { id: "TL2026-001235", applicant: "Amit Patel",    business: "Patel Wholesale Hub",     category: "Wholesale",        date: "Feb 15, 2026", status: "Rejected",     address: "67 Ring Road, Ahmedabad",phone: "9876543212", email: "amit@example.com" },
  { id: "TL2026-001230", applicant: "Priya Sharma",  business: "Sharma Healthcare",       category: "Healthcare",       date: "Feb 12, 2026", status: "Approved",     address: "89 Park Street, Mumbai", phone: "9876543213", email: "priya@example.com" },
  { id: "TL2026-001225", applicant: "Sneha Reddy",   business: "Reddy Constructions",     category: "Manufacturing",    date: "Feb 10, 2026", status: "Approved",     address: "12 Lake View, Hyderabad",phone: "9876543214", email: "sneha@example.com" },
  { id: "TL2026-001220", applicant: "Meera Gupta",   business: "Gupta Retail Store",      category: "Retail",           date: "Feb 08, 2026", status: "Pending",      address: "34 Civil Lines, Jaipur", phone: "9876543215", email: "meera@example.com" },
  { id: "TL2026-001215", applicant: "Arjun Verma",   business: "Verma Foods",             category: "Food & Beverages", date: "Feb 05, 2026", status: "Under Review", address: "56 Sector 21, Noida",    phone: "9876543216", email: "arjun@example.com" },
  { id: "TL2026-001210", applicant: "Rohit Desai",   business: "Desai Manufacturing",     category: "Manufacturing",    date: "Feb 03, 2026", status: "Approved",     address: "78 MIDC, Pune",          phone: "9876543217", email: "rohit@example.com" },
  { id: "TL2026-001205", applicant: "Suresh Nair",   business: "Nair Wholesale",          category: "Wholesale",        date: "Jan 30, 2026", status: "Approved",     address: "90 Calicut Road, Kochi", phone: "9876543218", email: "suresh@example.com" },
  { id: "TL2026-001200", applicant: "Kavita Joshi",  business: "Joshi Medical Store",     category: "Healthcare",       date: "Jan 28, 2026", status: "Pending",      address: "11 Shivaji Nagar, Pune", phone: "9876543219", email: "kavita@example.com" }
];
 
// List of issued licenses
var licenses = [
  { id: "LIC2025-000892", business: "Sneha Fashion Store",   owner: "Sneha Reddy",    category: "Retail",           issueDate: "Jan 5, 2025",  expiryDate: "Jan 5, 2026",  status: "Expiring Soon" },
  { id: "LIC2025-000567", business: "Amit General Store",    owner: "Amit Patel",     category: "Wholesale",        issueDate: "Mar 12, 2025", expiryDate: "Mar 12, 2027", status: "Active" },
  { id: "LIC2024-000234", business: "Kumar Electronics",     owner: "Suresh Kumar",   category: "Retail",           issueDate: "Jun 1, 2024",  expiryDate: "Jun 1, 2026",  status: "Active" },
  { id: "LIC2024-000189", business: "Singh Pharmaceuticals", owner: "Harpreet Singh", category: "Healthcare",       issueDate: "Aug 20, 2024", expiryDate: "Aug 20, 2025", status: "Expired" },
  { id: "LIC2025-000678", business: "Sharma Cafe",           owner: "Neha Sharma",    category: "Food & Beverages", issueDate: "Feb 14, 2025", expiryDate: "Feb 14, 2027", status: "Active" },
  { id: "LIC2023-000045", business: "Patel Construction",    owner: "Ramesh Patel",   category: "Manufacturing",    issueDate: "Apr 3, 2023",  expiryDate: "Apr 3, 2025",  status: "Revoked" },
  { id: "LIC2025-000901", business: "Gupta Textiles",        owner: "Anjali Gupta",   category: "Retail",           issueDate: "Dec 10, 2025", expiryDate: "Dec 10, 2027", status: "Active" },
  { id: "LIC2026-001001", business: "Verma Bakery",          owner: "Arjun Verma",    category: "Food & Beverages", issueDate: "Jan 20, 2026", expiryDate: "Jan 20, 2028", status: "Active" },
  { id: "LIC2024-000310", business: "Reddy Pharma",          owner: "Sneha Reddy",    category: "Healthcare",       issueDate: "Sep 5, 2024",  expiryDate: "Sep 5, 2026",  status: "Active" },
  { id: "LIC2023-000089", business: "Tiwari Traders",        owner: "Manish Tiwari",  category: "Wholesale",        issueDate: "Nov 15, 2023", expiryDate: "Nov 15, 2025", status: "Expired" }
];
 
// Trade categories for System Settings
var categories = [
  { id: 1, name: "Retail",           desc: "Retail trade businesses selling goods directly to consumers",   status: "Active" },
  { id: 2, name: "Wholesale",        desc: "Wholesale trade businesses selling goods in bulk to retailers", status: "Active" },
  { id: 3, name: "Manufacturing",    desc: "Manufacturing businesses producing goods",                      status: "Active" },
  { id: 4, name: "Food & Beverages", desc: "Restaurants, cafes, and food service establishments",          status: "Active" },
  { id: 5, name: "Healthcare",       desc: "Medical and healthcare service providers",                      status: "Active" },
  { id: 6, name: "Construction",     desc: "Construction and building services",                            status: "Inactive" }
];
 
// Audit log — records every action done in the system
var auditLogs = [
  { time: "Mar 28, 2026 10:23 AM", user: "Admin User",   role: "Super User",         action: "Approve", module: "Applications", desc: "Approved application #TL2026-001230",       ip: "192.168.1.1" },
  { time: "Mar 28, 2026 09:45 AM", user: "Priya Sharma", role: "Department Officer", action: "Update",  module: "Applications", desc: "Updated status for #TL2026-001240",         ip: "192.168.1.45" },
  { time: "Mar 28, 2026 09:12 AM", user: "Admin User",   role: "Super User",         action: "Create",  module: "Users",        desc: "Added new officer Manish Tiwari",           ip: "192.168.1.1" },
  { time: "Mar 28, 2026 08:55 AM", user: "Rajesh Kumar", role: "Field Officer",      action: "Login",   module: "System",       desc: "Login successful from Chrome",              ip: "192.168.1.23" },
  { time: "Mar 27, 2026 05:30 PM", user: "Admin User",   role: "Super User",         action: "Update",  module: "Settings",     desc: "Updated fee configuration",                ip: "192.168.1.1" },
  { time: "Mar 27, 2026 04:15 PM", user: "Arjun Verma",  role: "Department Officer", action: "Reject",  module: "Applications", desc: "Rejected application #TL2026-001235",      ip: "192.168.1.67" },
  { time: "Mar 27, 2026 03:00 PM", user: "Admin User",   role: "Super User",         action: "Delete",  module: "Users",        desc: "Removed inactive officer account USR004",  ip: "192.168.1.1" },
  { time: "Mar 27, 2026 02:10 PM", user: "Sneha Reddy",  role: "Applicant",          action: "Create",  module: "Applications", desc: "Submitted new application #TL2026-001245", ip: "192.168.2.10" },
  { time: "Mar 27, 2026 01:30 PM", user: "Vikram Singh", role: "Field Officer",      action: "Update",  module: "Licenses",     desc: "Recorded inspection for LIC2025-000678",   ip: "192.168.1.23" },
  { time: "Mar 27, 2026 11:00 AM", user: "Admin User",   role: "Super User",         action: "Update",  module: "Licenses",     desc: "Revoked license LIC2023-000045",           ip: "192.168.1.1" }
];
 
// Recent activity shown on dashboard
var activityLog = [
  { user: "Rajesh Kumar",  action: "Applied for new Trade License - Application #TL2026-001245", time: "10 min ago" },
  { user: "Priya Sharma",  action: "Approved License Application #TL2026-001230",                time: "25 min ago" },
  { user: "Admin System",  action: "Generated monthly revenue report",                           time: "1 hr ago" },
  { user: "Amit Patel",    action: "Renewed existing license - License #TL2025-000567",          time: "2 hr ago" },
  { user: "Sneha Reddy",   action: "Updated business information for License #TL2025-000892",    time: "3 hr ago" },
  { user: "Vikram Singh",  action: "Submitted payment for Application #TL2026-001240",           time: "4 hr ago" },
  { user: "Admin User",    action: "Rejected incomplete application #TL2026-001235",             time: "5 hr ago" },
  { user: "Meera Gupta",   action: "Registered new user account",                               time: "6 hr ago" }
];
 
// Default fee values (used when resetting)
var defaultFees = { new: 5000, renewal: 3000 };
 
// Track which user or category is being edited
var editUserId = null;
var editCatId  = null;
 
// How many rows to show per page
var rowsPerPage = 6;
 
// Current page numbers
var userPage  = 1;
var appPage   = 1;
var licPage   = 1;
var auditPage = 1;
 
// Filtered arrays — updated on search/filter
var filteredUsers = users.slice();
var filteredApps  = applications.slice();
var filteredLics  = licenses.slice();
var filteredAudit = auditLogs.slice();
 
 
// ============================================================
// NAVIGATION — Switch between sidebar pages
// ============================================================
 
function showPage(pageName, clickedLink) {
 
  // Hide all pages
  var allPages = document.querySelectorAll('.page');
  for (var i = 0; i < allPages.length; i++) {
    allPages[i].classList.remove('active');
  }
 
  // Remove active from all nav links
  var allLinks = document.querySelectorAll('.nav-link');
  for (var j = 0; j < allLinks.length; j++) {
    allLinks[j].classList.remove('active');
  }
 
  // Show selected page
  document.getElementById('page-' + pageName).classList.add('active');
 
  // Highlight clicked nav link
  if (clickedLink) {
    clickedLink.classList.add('active');
  }
 
  // Load data for the selected page
  if (pageName === 'dashboard')       renderDashboard();
  if (pageName === 'user-management') renderUsers();
  if (pageName === 'applications')    { renderApplicationStats(); renderApplications(); }
  if (pageName === 'licenses')        { renderLicenseStats(); renderLicenses(); }
  if (pageName === 'settings')        renderCategories();
  if (pageName === 'audit')           renderAudit();
}
 
 
// ============================================================
// DASHBOARD
// ============================================================
 
function renderDashboard() {
  var tbody = document.getElementById('activity-tbody');
  tbody.innerHTML = '';
 
  for (var i = 0; i < activityLog.length; i++) {
    var item    = activityLog[i];
    var initial = item.user.charAt(0);
 
    tbody.innerHTML +=
      '<tr>' +
        '<td><span class="avatar-circle">' + initial + '</span> ' + item.user + '</td>' +
        '<td>' + item.action + '</td>' +
        '<td>' + item.time + '</td>' +
      '</tr>';
  }
}
 
 
// ============================================================
// USER MANAGEMENT
// ============================================================
 
function renderUsers() {
  var tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '';
 
  // Get rows for the current page
  var start    = (userPage - 1) * rowsPerPage;
  var end      = start + rowsPerPage;
  var pageData = filteredUsers.slice(start, end);
 
  if (pageData.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No users found.</td></tr>';
  } else {
    for (var i = 0; i < pageData.length; i++) {
      var u       = pageData[i];
      var initial = u.name.charAt(0);
 
      var roleBadge = 'badge-purple';
      if (u.role === 'Field Officer')      roleBadge = 'badge-blue';
      if (u.role === 'Department Officer') roleBadge = 'badge-green';
 
      var statBadge = u.status === 'Active' ? 'badge-green' : 'badge-grey';
 
      tbody.innerHTML +=
        '<tr>' +
          '<td>' + u.id + '</td>' +
          '<td><div class="name-cell"><span class="avatar-circle">' + initial + '</span>' + u.name + '</div></td>' +
          '<td>' + u.email + '</td>' +
          '<td><span class="badge ' + roleBadge + '">' + u.role + '</span></td>' +
          '<td><span class="badge ' + statBadge + '">' + u.status + '</span></td>' +
          '<td>' +
            '<div class="action-btns">' +
              '<button class="btn-sm btn-edit"   onclick="openEditModal(\'' + u.id + '\')">&#9998; Edit</button>' +
              '<button class="btn-sm btn-delete" onclick="deleteUser(\'' + u.id + '\')">&#128465; Delete</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
    }
  }
 
  // Update summary counts
  document.getElementById('total-users').textContent   = filteredUsers.length;
  document.getElementById('active-users').textContent  = filteredUsers.filter(function(u) { return u.status === 'Active'; }).length;
  document.getElementById('officer-count').textContent = filteredUsers.length;
 
  renderPagination('users-pagination', filteredUsers.length, userPage, function(p) {
    userPage = p;
    renderUsers();
  });
}
 
function searchUsers(searchValue) {
  var q = searchValue.toLowerCase();
  filteredUsers = users.filter(function(u) {
    return u.name.toLowerCase().includes(q)  ||
           u.email.toLowerCase().includes(q) ||
           u.id.toLowerCase().includes(q)    ||
           u.role.toLowerCase().includes(q);
  });
  userPage = 1;
  renderUsers();
}
 
function openAddModal() {
  clearFields(['add-name', 'add-email', 'add-phone', 'add-role', 'add-status', 'add-empid', 'add-date']);
  clearErrors(['err-add-name', 'err-add-email', 'err-add-phone', 'err-add-role', 'err-add-status', 'err-add-empid', 'err-add-date']);
  openModal('modal-add');
}
 
function addOfficer() {
  var name   = getVal('add-name');
  var email  = getVal('add-email');
  var phone  = getVal('add-phone');
  var role   = getVal('add-role');
  var status = getVal('add-status');
  var empId  = getVal('add-empid');
  var date   = getVal('add-date');
  var valid  = true;
 
  clearErrors(['err-add-name', 'err-add-email', 'err-add-phone', 'err-add-role', 'err-add-status', 'err-add-empid', 'err-add-date']);
 
  // Name validation
  if (!name) {
    showErr('err-add-name', 'Full name is required.'); valid = false;
  } else if (name.length < 3) {
    showErr('err-add-name', 'Name must be at least 3 characters.'); valid = false;
  }
 
  // Email validation
  if (!email) {
    showErr('err-add-email', 'Email is required.'); valid = false;
  } else if (!validEmail(email)) {
    showErr('err-add-email', 'Enter a valid email address.'); valid = false;
  } else if (users.find(function(u) { return u.email === email; })) {
    showErr('err-add-email', 'This email already exists in the system.'); valid = false;
  }
 
  // Phone validation
  if (!phone) {
    showErr('err-add-phone', 'Phone number is required.'); valid = false;
  } else if (!validPhone(phone)) {
    showErr('err-add-phone', 'Enter a valid 10-digit phone number.'); valid = false;
  }
 
  if (!role)   { showErr('err-add-role',   'Please select a role.');   valid = false; }
  if (!status) { showErr('err-add-status', 'Please select a status.'); valid = false; }
 
  // Employee ID validation
  if (!empId) {
    showErr('err-add-empid', 'Employee ID is required.'); valid = false;
  } else if (!/^EMP-\d+$/.test(empId)) {
    showErr('err-add-empid', 'Format must be EMP-XXXXX (e.g. EMP-00123).'); valid = false;
  } else if (users.find(function(u) { return u.empId === empId; })) {
    showErr('err-add-empid', 'This Employee ID already exists.'); valid = false;
  }
 
  if (!date) { showErr('err-add-date', 'Joining date is required.'); valid = false; }
 
  if (!valid) return;
 
  // Add the new officer
  var newId = 'USR' + String(users.length + 1).padStart(3, '0');
  users.push({ id: newId, name: name, email: email, phone: phone, role: role, status: status, empId: empId, joinDate: date });
  filteredUsers = users.slice();
 
  addAuditLog('Create', 'Users', 'Added new officer ' + name);
  closeModal('modal-add');
  renderUsers();
  showToast('Officer ' + name + ' added successfully!');
}
 
function openEditModal(userId) {
  var user = users.find(function(u) { return u.id === userId; });
  if (!user) return;
 
  editUserId = userId;
  document.getElementById('edit-id').value     = user.id;
  document.getElementById('edit-name').value   = user.name;
  document.getElementById('edit-email').value  = user.email;
  document.getElementById('edit-phone').value  = user.phone;
  document.getElementById('edit-role').value   = user.role;
  document.getElementById('edit-status').value = user.status;
  document.getElementById('edit-empid').value  = user.empId;
  document.getElementById('edit-date').value   = user.joinDate;
 
  clearErrors(['err-edit-name', 'err-edit-email', 'err-edit-phone', 'err-edit-role', 'err-edit-date']);
  openModal('modal-edit');
}
 
function saveEdit() {
  var name   = getVal('edit-name');
  var email  = getVal('edit-email');
  var phone  = getVal('edit-phone');
  var role   = getVal('edit-role');
  var status = getVal('edit-status');
  var date   = getVal('edit-date');
  var valid  = true;
 
  clearErrors(['err-edit-name', 'err-edit-email', 'err-edit-phone', 'err-edit-role', 'err-edit-date']);
 
  if (!name) {
    showErr('err-edit-name', 'Full name is required.'); valid = false;
  } else if (name.length < 3) {
    showErr('err-edit-name', 'Name must be at least 3 characters.'); valid = false;
  }
 
  if (!email) {
    showErr('err-edit-email', 'Email is required.'); valid = false;
  } else if (!validEmail(email)) {
    showErr('err-edit-email', 'Enter a valid email address.'); valid = false;
  } else {
    var duplicate = users.find(function(u) { return u.email === email && u.id !== editUserId; });
    if (duplicate) { showErr('err-edit-email', 'This email is already used by another officer.'); valid = false; }
  }
 
  if (!phone) {
    showErr('err-edit-phone', 'Phone number is required.'); valid = false;
  } else if (!validPhone(phone)) {
    showErr('err-edit-phone', 'Enter a valid 10-digit phone number.'); valid = false;
  }
 
  if (!role) { showErr('err-edit-role', 'Please select a role.'); valid = false; }
  if (!date) { showErr('err-edit-date', 'Joining date is required.'); valid = false; }
 
  if (!valid) return;
 
  // Update user in array
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === editUserId) {
      users[i].name     = name;
      users[i].email    = email;
      users[i].phone    = phone;
      users[i].role     = role;
      users[i].status   = status;
      users[i].joinDate = date;
      break;
    }
  }
 
  filteredUsers = users.slice();
  addAuditLog('Update', 'Users', 'Updated officer details for ' + name);
  closeModal('modal-edit');
  renderUsers();
  showToast('Officer details updated successfully!');
}
 
function deleteUser(userId) {
  var user = users.find(function(u) { return u.id === userId; });
  if (!user) return;
 
  if (!confirm('Are you sure you want to delete "' + user.name + '"? This cannot be undone.')) return;
 
  users = users.filter(function(u) { return u.id !== userId; });
  filteredUsers = users.slice();
  addAuditLog('Delete', 'Users', 'Deleted officer ' + user.name);
  renderUsers();
  showToast('Officer deleted successfully.');
}
 
 
// ============================================================
// APPLICATIONS OVERVIEW
// ============================================================
 
function renderApplicationStats() {
  document.getElementById('app-total').textContent    = applications.length;
  document.getElementById('app-pending').textContent  = applications.filter(function(a) { return a.status === 'Pending' || a.status === 'Under Review'; }).length;
  document.getElementById('app-approved').textContent = applications.filter(function(a) { return a.status === 'Approved'; }).length;
  document.getElementById('app-rejected').textContent = applications.filter(function(a) { return a.status === 'Rejected'; }).length;
}
 
function renderApplications() {
  var tbody    = document.getElementById('apps-tbody');
  tbody.innerHTML = '';
 
  var start    = (appPage - 1) * rowsPerPage;
  var pageData = filteredApps.slice(start, start + rowsPerPage);
 
  if (pageData.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No applications found.</td></tr>';
  } else {
    for (var i = 0; i < pageData.length; i++) {
      var a     = pageData[i];
      var badge = getAppBadge(a.status);
      tbody.innerHTML +=
        '<tr>' +
          '<td>' + a.id + '</td>' +
          '<td>' + a.applicant + '</td>' +
          '<td>' + a.business + '</td>' +
          '<td>' + a.category + '</td>' +
          '<td>' + a.date + '</td>' +
          '<td><span class="badge ' + badge + '">' + a.status + '</span></td>' +
          '<td><button class="btn-sm btn-view" onclick="viewApplication(\'' + a.id + '\')">&#128065; View</button></td>' +
        '</tr>';
    }
  }
 
  renderPagination('apps-pagination', filteredApps.length, appPage, function(p) {
    appPage = p;
    renderApplications();
  });
}
 
function filterApplications() {
  var search   = document.getElementById('app-search').value.toLowerCase();
  var status   = document.getElementById('app-status-filter').value;
  var category = document.getElementById('app-category-filter').value;
 
  filteredApps = applications.filter(function(a) {
    var matchSearch   = !search   || a.id.toLowerCase().includes(search) || a.applicant.toLowerCase().includes(search) || a.business.toLowerCase().includes(search);
    var matchStatus   = !status   || a.status === status;
    var matchCategory = !category || a.category === category;
    return matchSearch && matchStatus && matchCategory;
  });
 
  appPage = 1;
  renderApplications();
}
 
function viewApplication(appId) {
  var app = applications.find(function(a) { return a.id === appId; });
  if (!app) return;
 
  var badge = getAppBadge(app.status);
  document.getElementById('view-app-body').innerHTML =
    '<div class="detail-grid">' +
      '<div class="detail-item"><label>Application ID</label><p>' + app.id + '</p></div>' +
      '<div class="detail-item"><label>Status</label><p><span class="badge ' + badge + '">' + app.status + '</span></p></div>' +
      '<div class="detail-item"><label>Applicant Name</label><p>' + app.applicant + '</p></div>' +
      '<div class="detail-item"><label>Business Name</label><p>' + app.business + '</p></div>' +
      '<div class="detail-item"><label>Trade Category</label><p>' + app.category + '</p></div>' +
      '<div class="detail-item"><label>Submitted Date</label><p>' + app.date + '</p></div>' +
      '<div class="detail-item"><label>Phone</label><p>' + app.phone + '</p></div>' +
      '<div class="detail-item"><label>Email</label><p>' + app.email + '</p></div>' +
      '<div class="detail-item" style="grid-column:1/-1"><label>Address</label><p>' + app.address + '</p></div>' +
    '</div>';
 
  openModal('modal-view-app');
}
 
function getAppBadge(status) {
  if (status === 'Approved')     return 'badge-green';
  if (status === 'Rejected')     return 'badge-red';
  if (status === 'Under Review') return 'badge-blue';
  return 'badge-orange';
}
 
 
// ============================================================
// LICENSE MANAGEMENT
// ============================================================
 
function renderLicenseStats() {
  document.getElementById('lic-total').textContent    = licenses.length;
  document.getElementById('lic-active').textContent   = licenses.filter(function(l) { return l.status === 'Active'; }).length;
  document.getElementById('lic-expiring').textContent = licenses.filter(function(l) { return l.status === 'Expiring Soon'; }).length;
  document.getElementById('lic-revoked').textContent  = licenses.filter(function(l) { return l.status === 'Revoked'; }).length;
}
 
function renderLicenses() {
  var tbody    = document.getElementById('licenses-tbody');
  tbody.innerHTML = '';
 
  var start    = (licPage - 1) * rowsPerPage;
  var pageData = filteredLics.slice(start, start + rowsPerPage);
 
  if (pageData.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No licenses found.</td></tr>';
  } else {
    for (var i = 0; i < pageData.length; i++) {
      var l         = pageData[i];
      var badge     = getLicBadge(l.status);
      var revokeBtn = '';
      if (l.status !== 'Revoked') {
        revokeBtn = '<button class="btn-sm btn-revoke" onclick="revokeLicense(\'' + l.id + '\')">&#10007; Revoke</button>';
      }
      tbody.innerHTML +=
        '<tr>' +
          '<td>' + l.id + '</td>' +
          '<td>' + l.business + '</td>' +
          '<td>' + l.owner + '</td>' +
          '<td>' + l.category + '</td>' +
          '<td>' + l.issueDate + '</td>' +
          '<td>' + l.expiryDate + '</td>' +
          '<td><span class="badge ' + badge + '">' + l.status + '</span></td>' +
          '<td>' + revokeBtn + '</td>' +
        '</tr>';
    }
  }
 
  renderPagination('licenses-pagination', filteredLics.length, licPage, function(p) {
    licPage = p;
    renderLicenses();
  });
}
 
function filterLicenses() {
  var search   = document.getElementById('lic-search').value.toLowerCase();
  var status   = document.getElementById('lic-status-filter').value;
  var category = document.getElementById('lic-category-filter').value;
 
  filteredLics = licenses.filter(function(l) {
    var matchSearch   = !search   || l.id.toLowerCase().includes(search) || l.business.toLowerCase().includes(search) || l.owner.toLowerCase().includes(search);
    var matchStatus   = !status   || l.status === status;
    var matchCategory = !category || l.category === category;
    return matchSearch && matchStatus && matchCategory;
  });
 
  licPage = 1;
  renderLicenses();
}
 
function revokeLicense(licId) {
  var lic = licenses.find(function(l) { return l.id === licId; });
  if (!lic) return;
 
  if (!confirm('Revoke license "' + licId + '" for ' + lic.business + '?')) return;
 
  for (var i = 0; i < licenses.length; i++) {
    if (licenses[i].id === licId) {
      licenses[i].status = 'Revoked';
      break;
    }
  }
 
  filteredLics = licenses.slice();
  addAuditLog('Update', 'Licenses', 'Revoked license ' + licId);
  renderLicenseStats();
  renderLicenses();
  showToast('License ' + licId + ' has been revoked.');
}
 
function getLicBadge(status) {
  if (status === 'Active')        return 'badge-green';
  if (status === 'Expired')       return 'badge-red';
  if (status === 'Expiring Soon') return 'badge-orange';
  return 'badge-grey';
}
 
 
// ============================================================
// SYSTEM SETTINGS — Trade Categories
// ============================================================
 
function renderCategories() {
  var list = document.getElementById('categories-list');
  list.innerHTML = '';
 
  if (categories.length === 0) {
    list.innerHTML = '<p style="color:#94a3b8; padding:20px; text-align:center;">No categories yet.</p>';
    return;
  }
 
  for (var i = 0; i < categories.length; i++) {
    var cat         = categories[i];
    var statusBadge = cat.status === 'Active' ? 'badge-green' : 'badge-grey';
    var toggleBtn   = cat.status === 'Active'
      ? '<button class="btn-deactivate" onclick="toggleCategory(' + cat.id + ')">Deactivate</button>'
      : '<button class="btn-activate"   onclick="toggleCategory(' + cat.id + ')">Activate</button>';
 
    list.innerHTML +=
      '<div class="category-row">' +
        '<div class="cat-left">' +
          '<div class="cat-name">' + cat.name + ' <span class="badge ' + statusBadge + '">' + cat.status + '</span></div>' +
          '<div class="cat-desc">' + cat.desc + '</div>' +
        '</div>' +
        '<div class="cat-right">' +
          toggleBtn +
          '<button class="btn-sm btn-edit"   onclick="openEditCategoryModal(' + cat.id + ')">&#9998;</button>' +
          '<button class="btn-sm btn-delete" onclick="deleteCategory(' + cat.id + ')">&#128465;</button>' +
        '</div>' +
      '</div>';
  }
}
 
function openCategoryModal() {
  editCatId = null;
  document.getElementById('cat-modal-title').textContent = 'Add Trade Category';
  document.getElementById('cat-edit-id').value = '';
  document.getElementById('cat-name').value    = '';
  document.getElementById('cat-desc').value    = '';
  document.getElementById('cat-status').value  = 'Active';
  clearErrors(['err-cat-name', 'err-cat-desc']);
  openModal('modal-category');
}
 
function openEditCategoryModal(catId) {
  var cat = categories.find(function(c) { return c.id === catId; });
  if (!cat) return;
 
  editCatId = catId;
  document.getElementById('cat-modal-title').textContent = 'Edit Trade Category';
  document.getElementById('cat-edit-id').value = cat.id;
  document.getElementById('cat-name').value    = cat.name;
  document.getElementById('cat-desc').value    = cat.desc;
  document.getElementById('cat-status').value  = cat.status;
  clearErrors(['err-cat-name', 'err-cat-desc']);
  openModal('modal-category');
}
 
function saveCategory() {
  var name   = getVal('cat-name');
  var desc   = getVal('cat-desc');
  var status = getVal('cat-status');
  var valid  = true;
 
  clearErrors(['err-cat-name', 'err-cat-desc']);
 
  if (!name)          { showErr('err-cat-name', 'Category name is required.'); valid = false; }
  else if (name.length < 2) { showErr('err-cat-name', 'Name must be at least 2 characters.'); valid = false; }
 
  if (!desc)          { showErr('err-cat-desc', 'Description is required.'); valid = false; }
  else if (desc.length < 5) { showErr('err-cat-desc', 'Description must be at least 5 characters.'); valid = false; }
 
  if (!valid) return;
 
  if (editCatId) {
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].id === editCatId) {
        categories[i].name   = name;
        categories[i].desc   = desc;
        categories[i].status = status;
        break;
      }
    }
    addAuditLog('Update', 'Settings', 'Updated trade category: ' + name);
    showToast('Category updated successfully!');
  } else {
    var maxId = 0;
    for (var j = 0; j < categories.length; j++) {
      if (categories[j].id > maxId) maxId = categories[j].id;
    }
    categories.push({ id: maxId + 1, name: name, desc: desc, status: status });
    addAuditLog('Create', 'Settings', 'Added new trade category: ' + name);
    showToast('Category "' + name + '" added successfully!');
  }
 
  closeModal('modal-category');
  renderCategories();
}
 
function toggleCategory(catId) {
  for (var i = 0; i < categories.length; i++) {
    if (categories[i].id === catId) {
      categories[i].status = (categories[i].status === 'Active') ? 'Inactive' : 'Active';
      addAuditLog('Update', 'Settings', 'Changed category "' + categories[i].name + '" to ' + categories[i].status);
      showToast('Category status updated.');
      break;
    }
  }
  renderCategories();
}
 
function deleteCategory(catId) {
  var cat = categories.find(function(c) { return c.id === catId; });
  if (!cat) return;
  if (!confirm('Delete category "' + cat.name + '"?')) return;
 
  categories = categories.filter(function(c) { return c.id !== catId; });
  addAuditLog('Delete', 'Settings', 'Deleted trade category: ' + cat.name);
  renderCategories();
  showToast('Category deleted.');
}
 
// Fee Configuration
function saveFees() {
  var newFee     = parseInt(document.getElementById('fee-new').value);
  var renewalFee = parseInt(document.getElementById('fee-renewal').value);
 
  if (isNaN(newFee) || newFee < 0)     { showToast('Please enter a valid New Application Fee.'); return; }
  if (isNaN(renewalFee) || renewalFee < 0) { showToast('Please enter a valid Renewal Fee.'); return; }
 
  document.getElementById('display-fee-new').textContent     = '\u20B9' + newFee.toLocaleString('en-IN');
  document.getElementById('display-fee-renewal').textContent = '\u20B9' + renewalFee.toLocaleString('en-IN');
 
  addAuditLog('Update', 'Settings', 'Updated fee configuration');
  showToast('Fee configuration saved successfully!');
}
 
function resetFees() {
  document.getElementById('fee-new').value     = defaultFees.new;
  document.getElementById('fee-renewal').value = defaultFees.renewal;
  showToast('Fees reset to default values.');
}
 
// Settings Modals
function saveNotifications() {
  addAuditLog('Update', 'Settings', 'Updated notification settings');
  closeModal('modal-notifications');
  showToast('Notification settings saved!');
}
 
function saveSecurity() {
  var timeout  = parseInt(document.getElementById('sec-timeout').value);
  var attempts = parseInt(document.getElementById('sec-attempts').value);
  var passLen  = parseInt(document.getElementById('sec-passlen').value);
 
  if (isNaN(timeout)  || timeout < 5)  { showToast('Session timeout must be at least 5 minutes.'); return; }
  if (isNaN(attempts) || attempts < 3) { showToast('Login attempts must be at least 3.'); return; }
  if (isNaN(passLen)  || passLen < 6)  { showToast('Password length must be at least 6.'); return; }
 
  addAuditLog('Update', 'Settings', 'Updated security settings');
  closeModal('modal-security');
  showToast('Security settings saved!');
}
 
function saveBackup() {
  addAuditLog('Update', 'Settings', 'Updated backup settings');
  closeModal('modal-backup');
  showToast('Backup settings saved!');
}
 
function triggerManualBackup() {
  showToast('Manual backup started...');
  addAuditLog('Create', 'Settings', 'Triggered manual system backup');
  setTimeout(function() { showToast('Backup completed successfully!'); }, 3000);
}
 
 
// ============================================================
// AUDIT LOGS
// ============================================================
 
function renderAudit() {
  var tbody    = document.getElementById('audit-tbody');
  tbody.innerHTML = '';
 
  var start    = (auditPage - 1) * rowsPerPage;
  var pageData = filteredAudit.slice(start, start + rowsPerPage);
 
  if (pageData.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No logs found.</td></tr>';
  } else {
    for (var i = 0; i < pageData.length; i++) {
      var log         = pageData[i];
      var actionClass = 'action-' + log.action.toLowerCase();
      tbody.innerHTML +=
        '<tr>' +
          '<td>' + log.time + '</td>' +
          '<td>' + log.user + '</td>' +
          '<td>' + log.role + '</td>' +
          '<td><span class="action-badge ' + actionClass + '">' + log.action + '</span></td>' +
          '<td>' + log.module + '</td>' +
          '<td>' + log.desc + '</td>' +
          '<td>' + log.ip + '</td>' +
        '</tr>';
    }
  }
 
  renderPagination('audit-pagination', filteredAudit.length, auditPage, function(p) {
    auditPage = p;
    renderAudit();
  });
}
 
function filterAudit() {
  var search = document.getElementById('audit-search').value.toLowerCase();
  var action = document.getElementById('audit-action-filter').value;
  var role   = document.getElementById('audit-role-filter').value;
 
  filteredAudit = auditLogs.filter(function(log) {
    var matchSearch = !search || log.user.toLowerCase().includes(search) || log.desc.toLowerCase().includes(search);
    var matchAction = !action || log.action === action;
    var matchRole   = !role   || log.role === role;
    return matchSearch && matchAction && matchRole;
  });
 
  auditPage = 1;
  renderAudit();
}
 
function exportAuditCSV() {
  var header = 'Timestamp,User Name,Role,Action,Module,Description,IP Address';
  var rows   = filteredAudit.map(function(log) {
    return [log.time, log.user, log.role, log.action, log.module, '"' + log.desc + '"', log.ip].join(',');
  });
 
  var csvContent = header + '\n' + rows.join('\n');
  var blob       = new Blob([csvContent], { type: 'text/csv' });
  var url        = URL.createObjectURL(blob);
  var link       = document.createElement('a');
  link.href      = url;
  link.download  = 'audit_logs.csv';
  link.click();
  URL.revokeObjectURL(url);
  showToast('Audit logs exported as CSV!');
}
 
// Add a new entry to audit log automatically on every action
function addAuditLog(action, module, description) {
  var now     = new Date();
  var timeStr = now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) +
                ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
 
  auditLogs.unshift({
    time: timeStr, user: 'Admin User', role: 'Super User',
    action: action, module: module, desc: description, ip: '192.168.1.1'
  });
 
  filteredAudit = auditLogs.slice();
}
 
 
// ============================================================
// PAGINATION
// ============================================================
 
function renderPagination(containerId, totalItems, currentPage, onPageChange) {
  var container  = document.getElementById(containerId);
  var totalPages = Math.ceil(totalItems / rowsPerPage);
  container.innerHTML = '';
 
  if (totalPages <= 1) return;
 
  // Prev button
  var prevBtn       = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerHTML = '\u2039 Prev';
  prevBtn.disabled  = (currentPage === 1);
  prevBtn.onclick   = function() { onPageChange(currentPage - 1); };
  container.appendChild(prevBtn);
 
  // Page number buttons
  for (var i = 1; i <= totalPages; i++) {
    (function(pageNum) {
      var btn         = document.createElement('button');
      btn.className   = 'page-btn' + (pageNum === currentPage ? ' active-page' : '');
      btn.textContent = pageNum;
      btn.onclick     = function() { onPageChange(pageNum); };
      container.appendChild(btn);
    })(i);
  }
 
  // Next button
  var nextBtn       = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerHTML = 'Next \u203a';
  nextBtn.disabled  = (currentPage === totalPages);
  nextBtn.onclick   = function() { onPageChange(currentPage + 1); };
  container.appendChild(nextBtn);
}
 
 
// ============================================================
// MODAL HELPERS
// ============================================================
 
function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}
 
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}
 
// Close modal when clicking outside it
window.addEventListener('click', function(event) {
  var modals = document.querySelectorAll('.modal-overlay');
  for (var i = 0; i < modals.length; i++) {
    if (event.target === modals[i]) {
      modals[i].classList.remove('show');
    }
  }
});
 
 
// ============================================================
// TOAST NOTIFICATION
// ============================================================
 
function showToast(message) {
  var toast         = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 3000);
}
 
 
// ============================================================
// SIGN OUT
// ============================================================
 
function signOut() {
  if (confirm('Are you sure you want to sign out?')) {
    sessionStorage.clear();
    showToast('Signing out...');
    setTimeout(function() { window.location.href = '../applicant_connected/connected/login/index.html'; }, 1500);
  }
}
 
 
// ============================================================
// FORM HELPERS
// ============================================================
 
function getVal(id) {
  return document.getElementById(id).value.trim();
}
 
function showErr(id, message) {
  var el = document.getElementById(id);
  if (el) el.textContent = message;
  var field = document.getElementById(id.replace('err-', ''));
  if (field) field.classList.add('input-error');
}
 
function clearErrors(idList) {
  for (var i = 0; i < idList.length; i++) {
    var el = document.getElementById(idList[i]);
    if (el) el.textContent = '';
    var field = document.getElementById(idList[i].replace('err-', ''));
    if (field) field.classList.remove('input-error');
  }
}
 
function clearFields(idList) {
  for (var i = 0; i < idList.length; i++) {
    var el = document.getElementById(idList[i]);
    if (el) el.value = '';
  }
}
 
function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
 
function validPhone(phone) {
  var digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}
 
 
// ============================================================
// RUN ON PAGE LOAD
// ============================================================
 
window.onload = function() {
  renderDashboard();
};