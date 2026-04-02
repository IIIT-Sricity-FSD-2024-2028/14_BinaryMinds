// download/script.js — shows real license data from TRADEZO

document.addEventListener('DOMContentLoaded', function() {
  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null'); } catch(e){}
  if (!user) { window.location.href = '../login/index.html'; return; }

  // Find approved application for this user
  var app = null;
  if (window.TRADEZO) {
    app = TRADEZO.applications.find(function(a) {
      return (
        (a.email && a.email.toLowerCase() === user.email.toLowerCase()) ||
        (a.applicantName && a.applicantName.toLowerCase() === user.name.toLowerCase())
      ) && a.status === 'Approved' && a.licenseId;
    }) || null;

    // Also check by appRef
    var appRef = sessionStorage.getItem('applicationRef') || '';
    if (!app && appRef) {
      app = TRADEZO.applications.find(function(a){
        return (a.appRef === appRef || a.id === appRef) && a.status === 'Approved';
      }) || null;
    }
  }

  function fill(sel, val) {
    document.querySelectorAll(sel).forEach(function(el){ if (val) el.textContent = val; });
  }

  if (app) {
    fill('.license-id, .lic-number, h2',    app.licenseId);
    fill('.biz-name, .business-name',        app.businessName);
    fill('.licensee, .owner-name',           app.applicantName || user.name);
    fill('.category, .trade-category',       app.tradeCategory);
    fill('.issue-date',                      app.licenseIssueDate  || '—');
    fill('.expiry-date',                     app.licenseExpiryDate || '—');
    fill('.payment-ref',                     app.paymentRef || '—');
    fill('.valid-text',                      (app.licenseIssueDate || '') + ' to ' + (app.licenseExpiryDate || ''));
  } else {
    // No approved license — show message
    var main = document.querySelector('main, .content, .page');
    if (main) {
      var msg = document.createElement('div');
      msg.style.cssText = 'text-align:center;padding:48px 20px;';
      msg.innerHTML =
        '<div style="font-size:52px;margin-bottom:16px;">📜</div>' +
        '<h3 style="color:#1E3A8A;margin-bottom:10px;">No License Available</h3>' +
        '<p style="color:#64748b;margin-bottom:24px;">Your trade license will appear here once your application is approved.</p>' +
        '<a href="../Track Application Status/index.html" style="background:#1E3A8A;color:#fff;padding:11px 28px;border-radius:8px;font-weight:600;text-decoration:none;">Track Application →</a>';
      main.insertBefore(msg, main.firstChild);
    }
  }
});

function handleDownload() { window.print(); }
function handlePrint()    { window.print(); }
function handleCancel()   { window.location.href = '../Applicant dashboard/index.html'; }
