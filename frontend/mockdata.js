// ============================================================
// mockdata.js — TradeZo Central Mock Data
// Include this file in ANY page: <script src="path/to/mockdata.js"></script>
// All actors share this same data — changes flow across the system
// ============================================================

var TRADEZO = {};

// ============================================================
// 1. USERS — All system users (all roles)
// ============================================================
TRADEZO.users = [
  // Applicants
  { id: 'APP-1001', name: 'Rajesh Kumar',    email: 'rajesh@applicant.com',    phone: '9876543210', role: 'applicant',          password: 'applicant123', status: 'Active' },
  { id: 'APP-1002', name: 'Priya Sharma',    email: 'priya@applicant.com',     phone: '9876543211', role: 'applicant',          password: 'applicant123', status: 'Active' },
  { id: 'APP-1003', name: 'Amit Patel',      email: 'amit@applicant.com',      phone: '9876543212', role: 'applicant',          password: 'applicant123', status: 'Active' },
  // Field Officers
  { id: 'FO-2001',  name: 'Myra Singh',      email: 'myra@fieldofficer.com',   phone: '9876543220', role: 'field officer',      password: 'field@123',    status: 'Active' },
  { id: 'FO-2002',  name: 'Vikram Desai',    email: 'vikram@fieldofficer.com', phone: '9876543221', role: 'field officer',      password: 'field@123',    status: 'Active' },
  // Department Officers
  { id: 'DO-3001',  name: 'Anjali Mehta',    email: 'admin@deptofficer.com',   phone: '9876543230', role: 'department officer', password: 'dept123',      status: 'Active' },
  { id: 'DO-3002',  name: 'Rahul Gupta',     email: 'rahul@deptofficer.com',   phone: '9876543231', role: 'department officer', password: 'dept123',      status: 'Active' },
  // Super User
  { id: 'SU-4001',  name: 'Admin User',      email: 'admin@tradezo.gov.in',    phone: '9876543240', role: 'superuser',          password: 'super123',     status: 'Active' }
];

// ============================================================
// 2. APPLICATIONS — Trade License Applications
// ============================================================
TRADEZO.applications = [
  {
    id: 'TL-2026-001', appRef: 'TL2026-445821',
    applicantName: 'Rajesh Kumar',    applicantId: 'APP-1001',
    email: 'rajesh@example.com',      phone: '9876543210',
    businessName: 'Green Valley Restaurant',
    businessType: 'Retail Shop',      tradeCategory: 'Food & Beverages',
    shopAddress: '123 Main Street, Sector 45', city: 'Gurugram',
    district: 'Gurugram',             state: 'Haryana',    pincode: '122001',
    shopArea: '450',                  fatherName: 'Suresh Kumar',
    motherName: 'Meena Kumar',        gender: 'Male',
    aadhaar: '234567891234',
    submittedDate: 'Feb 20, 2026',    category: 'Food & Beverages',
    status: 'Under Verification',     paymentStatus: 'Paid',
    paymentAmount: '₹5,000',          paymentRef: 'PAY-2026-98761',
    assignedFO: 'FO-2001',            foName: 'Myra Singh',
    inspectionDate: 'Mar 8, 2026',    inspectionTime: '10:00 AM',
    inspectionResult: 'Approved',
    doReview: 'Pending',              licenseId: null,
    docs: { aadhaar: 'aadhaar_rajesh.pdf', addressProof: 'address_rajesh.pdf', shopPhoto: 'shop_rajesh.jpg' }
  },
  {
    id: 'TL-2026-002', appRef: 'TL2026-332190',
    applicantName: 'Vikram Singh',    applicantId: 'APP-1002',
    email: 'vikram@example.com',      phone: '9876543211',
    businessName: 'Tech Hub Electronics',
    businessType: 'Retail Shop',      tradeCategory: 'Retail',
    shopAddress: '456 MG Road',       city: 'Bangalore',
    district: 'Bangalore Urban',      state: 'Karnataka', pincode: '560001',
    shopArea: '600',                  fatherName: 'Mohan Singh',
    motherName: 'Sunita Singh',       gender: 'Male',
    aadhaar: '345678912345',
    submittedDate: 'Feb 18, 2026',    category: 'Retail',
    status: 'Under Review',           paymentStatus: 'Paid',
    paymentAmount: '₹5,000',          paymentRef: 'PAY-2026-87652',
    assignedFO: 'FO-2002',            foName: 'Vikram Desai',
    inspectionDate: 'Mar 9, 2026',    inspectionTime: '02:00 PM',
    inspectionResult: 'Approved',
    doReview: 'In Progress',          licenseId: null,
    docs: { aadhaar: 'aadhaar_vikram.pdf', addressProof: 'address_vikram.pdf', shopPhoto: 'shop_vikram.jpg' }
  },
  {
    id: 'TL-2026-003', appRef: 'TL2026-221045',
    applicantName: 'Priya Sharma',    applicantId: 'APP-1003',
    email: 'priya@example.com',       phone: '9876543212',
    businessName: 'Fresh Mart Grocery',
    businessType: 'Wholesale',        tradeCategory: 'Retail',
    shopAddress: 'Connaught Place',   city: 'Delhi',
    district: 'Central Delhi',        state: 'Delhi',      pincode: '110001',
    shopArea: '320',                  fatherName: 'Anil Sharma',
    motherName: 'Kavita Sharma',      gender: 'Female',
    aadhaar: '456789123456',
    submittedDate: 'Feb 15, 2026',    category: 'Retail',
    status: 'Approved',               paymentStatus: 'Paid',
    paymentAmount: '₹5,000',          paymentRef: 'PAY-2026-76543',
    assignedFO: 'FO-2001',            foName: 'Myra Singh',
    inspectionDate: 'Mar 10, 2026',   inspectionTime: '11:00 AM',
    inspectionResult: 'Approved',
    doReview: 'Approved',             licenseId: 'LIC-2026-0031',
    docs: { aadhaar: 'aadhaar_priya.pdf', addressProof: 'address_priya.pdf', shopPhoto: 'shop_priya.jpg' }
  },
  {
    id: 'TL-2026-004', appRef: 'TL2026-118734',
    applicantName: 'Amit Patel',      applicantId: 'APP-1003',
    email: 'amit@example.com',        phone: '9876543213',
    businessName: 'Urban Fitness Center',
    businessType: 'Service',          tradeCategory: 'Healthcare',
    shopAddress: 'Bandra West',       city: 'Mumbai',
    district: 'Mumbai Suburban',      state: 'Maharashtra', pincode: '400050',
    shopArea: '800',                  fatherName: 'Ramesh Patel',
    motherName: 'Geeta Patel',        gender: 'Male',
    aadhaar: '567891234567',
    submittedDate: 'Feb 10, 2026',    category: 'Healthcare',
    status: 'Rejected',               paymentStatus: 'Paid',
    paymentAmount: '₹5,000',          paymentRef: 'PAY-2026-65432',
    assignedFO: 'FO-2002',            foName: 'Vikram Desai',
    inspectionDate: 'Mar 5, 2026',    inspectionTime: '03:00 PM',
    inspectionResult: 'Rejected',
    rejectionReason: 'Business Affidavit document is incomplete.',
    doReview: 'Rejected',             licenseId: null,
    docs: { aadhaar: 'aadhaar_amit.pdf', addressProof: 'address_amit.pdf', shopPhoto: 'shop_amit.jpg' }
  },
  {
    id: 'TL-2026-005', appRef: 'TL2026-009871',
    applicantName: 'Sneha Reddy',     applicantId: 'APP-1002',
    email: 'sneha@example.com',       phone: '9876543214',
    businessName: 'Sunrise Exports',
    businessType: 'Wholesale',        tradeCategory: 'Wholesale',
    shopAddress: '78 Export Zone',    city: 'Hyderabad',
    district: 'Hyderabad',            state: 'Telangana',  pincode: '500001',
    shopArea: '1200',                 fatherName: 'Krishna Reddy',
    motherName: 'Lakshmi Reddy',      gender: 'Female',
    aadhaar: '678912345678',
    submittedDate: 'Jan 28, 2026',    category: 'Wholesale',
    status: 'Approved',               paymentStatus: 'Paid',
    paymentAmount: '₹5,000',          paymentRef: 'PAY-2026-54321',
    assignedFO: 'FO-2001',            foName: 'Myra Singh',
    inspectionDate: 'Feb 15, 2026',   inspectionTime: '11:30 AM',
    inspectionResult: 'Approved',
    doReview: 'Approved',             licenseId: 'LIC-2026-0025',
    docs: { aadhaar: 'aadhaar_sneha.pdf', addressProof: 'address_sneha.pdf', shopPhoto: 'shop_sneha.jpg' }
  }
];

// ============================================================
// 3. LICENSES — Issued Trade Licenses
// ============================================================
TRADEZO.licenses = [
  { id: 'LIC-2026-0031', appId: 'TL-2026-003', businessName: 'Fresh Mart Grocery',
    ownerName: 'Priya Sharma',   category: 'Retail',    issueDate: 'Mar 15, 2026',
    expiryDate: 'Mar 15, 2027',  status: 'Active',      renewalStatus: null },
  { id: 'LIC-2026-0025', appId: 'TL-2026-005', businessName: 'Sunrise Exports',
    ownerName: 'Sneha Reddy',    category: 'Wholesale', issueDate: 'Feb 25, 2026',
    expiryDate: 'Feb 25, 2027',  status: 'Active',      renewalStatus: null },
  { id: 'LIC-2025-0892', appId: 'TL-2025-012', businessName: 'Mugale Grocery Store',
    ownerName: 'Jiya Mugale',    category: 'Retail',    issueDate: 'Apr 10, 2025',
    expiryDate: 'Apr 10, 2026',  status: 'Expiring Soon', renewalStatus: 'Submitted' },
  { id: 'LIC-2024-0234', appId: 'TL-2024-008', businessName: 'Kumar Electronics',
    ownerName: 'Suresh Kumar',   category: 'Retail',    issueDate: 'Jun 1, 2024',
    expiryDate: 'Jun 1, 2026',   status: 'Active',      renewalStatus: null },
  { id: 'LIC-2023-0045', appId: 'TL-2023-003', businessName: 'Patel Wholesale Hub',
    ownerName: 'Ramesh Patel',   category: 'Wholesale', issueDate: 'Apr 3, 2023',
    expiryDate: 'Apr 3, 2025',   status: 'Expired',     renewalStatus: null }
];

// ============================================================
// 4. INSPECTIONS — Scheduled & Completed Inspections
// ============================================================
TRADEZO.inspections = [
  { id: 'INS-001', appId: 'TL-2026-001', businessName: 'Green Valley Restaurant',
    type: 'Food & Beverages', address: '123 Main Street, Sector 45, Gurugram',
    ownerName: 'Rajesh Kumar',  assignedFO: 'Myra Singh',
    date: 'Mar 8, 2026',  time: '10:00 AM', status: 'Scheduled' },
  { id: 'INS-002', appId: 'TL-2026-002', businessName: 'Tech Hub Electronics',
    type: 'Retail', address: '456 MG Road, Bangalore',
    ownerName: 'Vikram Singh',  assignedFO: 'Vikram Desai',
    date: 'Mar 9, 2026',  time: '02:00 PM', status: 'Scheduled' },
  { id: 'INS-003', appId: 'TL-2026-003', businessName: 'Fresh Mart Grocery',
    type: 'Retail', address: 'Connaught Place, Delhi',
    ownerName: 'Priya Sharma',  assignedFO: 'Myra Singh',
    date: 'Mar 10, 2026', time: '11:00 AM', status: 'Completed', result: 'Approved',
    notes: 'Shop is clean, well-organised. All documents verified.' },
  { id: 'INS-004', appId: 'TL-2026-005', businessName: 'Sunrise Exports',
    type: 'Wholesale', address: '78 Export Zone, Hyderabad',
    ownerName: 'Sneha Reddy',   assignedFO: 'Myra Singh',
    date: 'Feb 15, 2026', time: '11:30 AM', status: 'Completed', result: 'Approved',
    notes: 'Large warehouse, adequate space and safety measures.' },
  { id: 'INS-005', appId: 'TL-2026-004', businessName: 'Urban Fitness Center',
    type: 'Healthcare', address: 'Bandra West, Mumbai',
    ownerName: 'Amit Patel',    assignedFO: 'Vikram Desai',
    date: 'Mar 5, 2026',  time: '03:00 PM', status: 'Completed', result: 'Rejected',
    notes: 'Business Affidavit missing. Safety equipment inadequate.' }
];

// ============================================================
// 5. VERIFICATIONS — Field Officer Verification Queue
// ============================================================
TRADEZO.verifications = [
  { appId: 'TL-2026-001', businessName: 'Green Valley Restaurant',
    applicant: 'Rajesh Kumar',  category: 'Food & Beverages',
    submitted: 'Feb 20, 2026',  status: 'Pending Review',   priority: 'High',
    address: 'Sector 45, Gurugram' },
  { appId: 'TL-2026-002', businessName: 'Tech Hub Electronics',
    applicant: 'Vikram Singh',  category: 'Retail',
    submitted: 'Feb 18, 2026',  status: 'Under Review',     priority: 'Normal',
    address: 'MG Road, Bangalore' },
  { appId: 'TL-2026-003', businessName: 'Fresh Mart Grocery',
    applicant: 'Priya Sharma',  category: 'Retail',
    submitted: 'Feb 15, 2026',  status: 'Approved',         priority: 'Normal',
    address: 'Connaught Place, Delhi' },
  { appId: 'TL-2026-004', businessName: 'Urban Fitness Center',
    applicant: 'Amit Patel',    category: 'Healthcare',
    submitted: 'Feb 10, 2026',  status: 'Rejected',         priority: 'Normal',
    address: 'Bandra West, Mumbai' }
];

// ============================================================
// 6. AUDIT LOG — System Activity Log
// ============================================================
TRADEZO.auditLog = [
  { time: 'Apr 1, 2026 10:23 AM',  user: 'Admin User',   role: 'Super User',         action: 'Approve', module: 'Applications', desc: 'Approved application TL-2026-003' },
  { time: 'Apr 1, 2026 09:45 AM',  user: 'Anjali Mehta', role: 'Department Officer', action: 'Update',  module: 'Applications', desc: 'Updated status for TL-2026-002' },
  { time: 'Apr 1, 2026 09:12 AM',  user: 'Admin User',   role: 'Super User',         action: 'Create',  module: 'Users',        desc: 'Added new officer Vikram Desai' },
  { time: 'Mar 31, 2026 05:30 PM', user: 'Admin User',   role: 'Super User',         action: 'Update',  module: 'Settings',     desc: 'Updated fee configuration' },
  { time: 'Mar 31, 2026 04:15 PM', user: 'Rahul Gupta',  role: 'Department Officer', action: 'Reject',  module: 'Applications', desc: 'Rejected application TL-2026-004' },
  { time: 'Mar 30, 2026 02:10 PM', user: 'Sneha Reddy',  role: 'Applicant',          action: 'Create',  module: 'Applications', desc: 'Submitted application TL-2026-005' },
  { time: 'Mar 30, 2026 01:30 PM', user: 'Myra Singh',   role: 'Field Officer',      action: 'Update',  module: 'Inspections',  desc: 'Completed inspection INS-004' },
  { time: 'Mar 29, 2026 11:00 AM', user: 'Admin User',   role: 'Super User',         action: 'Update',  module: 'Licenses',     desc: 'License LIC-2023-0045 marked as Expired' }
];

// ============================================================
// 7. DASHBOARD STATS — Used by all dashboards
// ============================================================
TRADEZO.stats = {
  applicant: {
    totalApplications: 2,
    pendingApplications: 1,
    approvedApplications: 1,
    licenseActive: 1
  },
  fieldOfficer: {
    applicationsSubmitted: 24,
    pendingInspections: 3,
    completedToday: 2,
    slaAlerts: 1
  },
  deptOfficer: {
    pendingApplications: 1284,
    licensesIssued: 45920,
    slaCompliance: '132 / 142'
  },
  superUser: {
    totalUsers: 8,
    pendingApplications: 2,
    issuedLicenses: 5
  }
};

// ============================================================
// HELPER FUNCTIONS — Use anywhere to get data
// ============================================================

// Get an application by ID
TRADEZO.getApplication = function(id) {
  return TRADEZO.applications.find(function(a) { return a.id === id || a.appRef === id; }) || null;
};

// Get a license by ID
TRADEZO.getLicense = function(id) {
  return TRADEZO.licenses.find(function(l) { return l.id === id; }) || null;
};

// Get all applications for an applicant
TRADEZO.getApplicantApps = function(applicantId) {
  return TRADEZO.applications.filter(function(a) { return a.applicantId === applicantId; });
};

// Get applications assigned to a field officer
TRADEZO.getFOApplications = function(foId) {
  return TRADEZO.applications.filter(function(a) { return a.assignedFO === foId; });
};

// Get inspections for a field officer
TRADEZO.getFOInspections = function(foId) {
  return TRADEZO.inspections.filter(function(i) {
    return i.assignedFO === TRADEZO.users.find(function(u) { return u.id === foId; }).name;
  });
};

// Get badge color for a status
TRADEZO.statusColor = function(status) {
  var map = {
    'Approved': '#16a34a', 'Active': '#16a34a', 'Completed': '#16a34a',
    'Rejected': '#dc2626', 'Expired': '#dc2626',
    'Under Verification': '#f59e0b', 'Pending': '#f59e0b', 'Pending Review': '#f59e0b',
    'Under Review': '#3b82f6', 'In Progress': '#3b82f6', 'Scheduled': '#3b82f6',
    'Expiring Soon': '#f97316'
  };
  return map[status] || '#6b7280';
};

// Get logged in user from session
TRADEZO.getLoggedInUser = function() {
  try {
    return JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
  } catch(e) { return {}; }
};

console.log('✅ TradeZo Mock Data loaded — ' + TRADEZO.applications.length + ' applications, ' + TRADEZO.licenses.length + ' licenses, ' + TRADEZO.users.length + ' users');
// ============================================================
// PERSISTENCE — Load user-submitted apps from localStorage
// So track page finds new apps even after page refresh
// ============================================================
(function() {
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]'); } catch(e){}
  saved.forEach(function(newApp) {
    var exists = TRADEZO.applications.some(function(a){ return a.appRef === newApp.appRef; });
    if (!exists) TRADEZO.applications.push(newApp);
  });
})();

// Updated getLoggedInUser — reads from sessionStorage key 'loggedInUser'
TRADEZO.getLoggedInUser = function() {
  try {
    var u = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
    return u || {};
  } catch(e) { return {}; }
};
