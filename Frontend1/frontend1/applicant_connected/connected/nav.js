/* =====================================================
   nav.js — Shared navigation paths for all pages
   All pages include this file + their own script
   ===================================================== */

var PAGES = {
  landing:      "../landing page/index.html",
  login:        "../login/index.html",
  register:     "../Register/index.html",
  forgot:       "../forgotpassword/index.html",
  dashboard:    "../Applicant dashboard/index.html",
  apply:        "../apply_license/apply_license.html",
  upload:       "../upload_document/upload_document.html",
  review:       "../details/application_review/application_review.html",
  track:        "../Track Application Status/index.html",
  payments:     "../payments/index.html",
  paynow:       "../paynow/index.html",
  paySuccess:   "../payment success/index.html",
  payFail:      "../payment failure/index.html",
  download:     "../download/index.html",
  renewLicense: "../review_license/review_license.html",
  profile:      "../Profile/index.html",
  helpdesk:     "../helpdesk/index.html"
};

function goTo(page) {
  if (PAGES[page]) {
    window.location.href = PAGES[page];
  }
}

/* Fix all navbar links on any page automatically */
document.addEventListener('DOMContentLoaded', function () {
  var navLinks = document.querySelectorAll('nav a, .navbar a, .nav-links a');
  navLinks.forEach(function (link) {
    var text = link.textContent.trim().toLowerCase();
    if (text === 'home')                  link.href = PAGES.landing;
    if (text === 'login')                 link.href = PAGES.login;
    if (text === 'register')              link.href = PAGES.register;
    if (text === 'dashboard')             link.href = PAGES.dashboard;
    if (text === 'apply license')         link.href = PAGES.apply;
    if (text === 'track application')     link.href = PAGES.track;
    if (text === 'download license')      link.href = PAGES.download;
    if (text === 'payments')              link.href = PAGES.payments;
    if (text === 'profile')               link.href = PAGES.profile;
    if (text === 'help' || text === 'helpdesk') link.href = PAGES.helpdesk;
  });
});