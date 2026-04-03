// fo_connected/recordinspection/ri.js
// Uses TRADEZO mock data

document.addEventListener('DOMContentLoaded', function() {
  var container = document.getElementById('inspectionCards');
  var countText = document.getElementById('countText');
  if (!container) return;

  var data = TRADEZO.inspections.filter(function(i) { return i.status === 'Scheduled' || i.status === 'Pending Inspection'; });
  
  // Filter out completed inspections from local storage so static mock data disappears once submitted
  var completed = [];
  try { completed = JSON.parse(localStorage.getItem('tz_inspection_reports') || '[]'); } catch(e){}
  data = data.filter(function(item) {
      return !completed.some(function(c) { return c.appId === item.appId; });
  });
  
  // also merge from local storage
  var localApps = [];
  try {
      localApps = JSON.parse(localStorage.getItem('applications') || '[]');
  } catch(e){}
  
  localApps.forEach(function(app) {
      if(app.status === 'Scheduled' || app.status === 'Pending Inspection') {
          var tzApp = window.TRADEZO ? TRADEZO.getApplication(app.id) : null;
          var submittedApps = [];
          try { submittedApps = JSON.parse(localStorage.getItem('tz_submitted_apps') || '[]'); } catch(e){}
          var subApp = submittedApps.find(a => (a.id === app.id || a.appRef === app.id));
        
          var mergedApp = Object.assign({}, tzApp, subApp, app);

          // Map to inspection object format
          data.push({
              appId: app.id,
              businessName: mergedApp.businessName || 'Business Name N/A',
              type: mergedApp.tradeCategory || mergedApp.licenseType || mergedApp.category || 'Trade License',
              ownerName: mergedApp.applicantName || 'Applicant N/A',
              address: mergedApp.shopAddress || mergedApp.address || 'Address N/A',
              status: app.status
          });
      }
  });

  renderCards(data);

  var searchEl = document.getElementById('searchInspection');
  if (searchEl) {
    searchEl.addEventListener('input', function() {
      var val = this.value.toLowerCase();
      var filtered = data.filter(function(i) {
        return (i.status === 'Scheduled' || i.status === 'Pending Inspection') && i.businessName.toLowerCase().includes(val);
      });
      renderCards(filtered);
    });
  }
});

function renderCards(data) {
  var container = document.getElementById('inspectionCards');
  var countText = document.getElementById('countText');
  container.innerHTML = '';
  if (countText) countText.innerText = 'Showing ' + data.length + ' inspection(s)';

  data.forEach(function(item) {
    var card = document.createElement('div');
    card.className = 'inspection-card blue';
    
    var btnText = 'Start Inspection';
    
    card.innerHTML =
      '<h3>' + item.businessName + '</h3>' +
      '<small>' + item.appId + '</small>' +
      '<p class="info">' + item.ownerName + '</p>' +
      '<p class="info">' + item.type + '</p>' +
      '<p class="info">' + item.address + '</p>' +
      '<button class="start-btn" data-id="' + item.appId + '" data-name="' + item.businessName + '" data-type="' + item.type + '" data-address="' + item.address + '" data-owner="' + item.ownerName + '">' + btnText + '</button>';
    container.appendChild(card);
  });

  document.querySelectorAll('.start-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      sessionStorage.setItem('selectedApp',   this.getAttribute('data-id'));
      sessionStorage.setItem('approvedApp',   this.getAttribute('data-id'));
      sessionStorage.setItem('businessName',  this.getAttribute('data-name'));
      sessionStorage.setItem('tradeCategory', this.getAttribute('data-type'));
      sessionStorage.setItem('address',       this.getAttribute('data-address'));
      sessionStorage.setItem('ownerName',     this.getAttribute('data-owner'));
      window.location.href = '../start inspection/index.html';
    });
  });
}