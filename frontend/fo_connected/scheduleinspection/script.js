function schedule() {
  var date = document.getElementById('date').value;
  var time = document.getElementById('time').value;
 
  // Validate date
  if (!date) {
    alert('Please select an inspection date.');
    return;
  }
 
  // Validate time
  if (!time) {
    alert('Please select an inspection time.');
    return;
  }
 
  // Validate date is not in the past
  var selected = new Date(date);
  var today    = new Date();
  today.setHours(0, 0, 0, 0);
  if (selected < today) {
    alert('Please select a future date for inspection.');
    return;
  }
 
  // Save schedule info in session
  sessionStorage.setItem('inspectionDate', date);
  sessionStorage.setItem('inspectionTime', time);

  // Update application in localStorage for applicant to see
  var appId = sessionStorage.getItem('selectedApp') || 'TL-2026-001';
  var apps = [];
  try { apps = JSON.parse(localStorage.getItem('applications') || '[]'); } catch(e){}
  apps.forEach(function(a) {
    if (a.id === appId) {
      a.inspectionDate = date;
      a.inspectionTime = time;
      a.status = 'Scheduled';
    }
  });
  localStorage.setItem('applications', JSON.stringify(apps));
 
  // Show success popup then go to Record Inspection page
  alert('Inspection Scheduled Successfully!\nDate: ' + date + '\nTime: ' + time);
  window.location.href = '../recordinspection/index.html';
}
 
// Cancel button → go back to verification
// Cancel button & Dynamic data load
document.addEventListener('DOMContentLoaded', function() {
  var appId = sessionStorage.getItem('selectedApp') || 'TL-2026-001';
  var app = null;

  var applications = [];
  try { applications = JSON.parse(localStorage.getItem('applications') || '[]'); } catch(e){}
  var localApp = applications.find(function(a) { return a.id === appId; });
  
  var tzApp = window.TRADEZO ? TRADEZO.getApplication(appId) : null;
  var submittedApps = [];
  try { submittedApps = JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]'); } catch(e){}
  var subApp = submittedApps.find(function(a) { return a.id === appId || a.appRef === appId; });

  var mergedApp = Object.assign({}, tzApp, subApp, localApp);

  if (mergedApp && Object.keys(mergedApp).length > 0) {
      app = {
          id: mergedApp.id || mergedApp.appRef || appId,
          businessName: mergedApp.businessName || 'N/A',
          applicantName: mergedApp.applicantName || 'N/A',
          tradeCategory: mergedApp.tradeCategory || mergedApp.licenseType || mergedApp.category || 'N/A',
          shopAddress: mergedApp.shopAddress || mergedApp.address || 'N/A',
          city: mergedApp.city || ''
      };
  } else {
      app = null;
  }

  if (app) {
      var dAppId = document.getElementById('dispAppId');
      if (dAppId) dAppId.textContent = app.id;
      
      var dBizName = document.getElementById('dispBizName');
      if (dBizName) dBizName.textContent = app.businessName || 'N/A';
      
      var address = app.shopAddress || 'N/A';
      if (app.city) address += ', ' + app.city;
      var dBizAddress = document.getElementById('dispBizAddress');
      if (dBizAddress) dBizAddress.textContent = address;
      
      var dAppName = document.getElementById('dispAppName');
      if (dAppName) dAppName.textContent = app.applicantName || 'N/A';
      
      var dAppCat = document.getElementById('dispAppCategory');
      if (dAppCat) dAppCat.textContent = app.tradeCategory || app.licenseType || 'N/A';
  }

  var cancelBtn = document.querySelector('.cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      window.location.href = '../verification/index.html';
    });
  }
}); 