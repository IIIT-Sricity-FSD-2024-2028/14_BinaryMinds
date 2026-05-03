document.addEventListener('DOMContentLoaded', function() {
  var tbody = document.querySelector('tbody');
  var countText = document.getElementById('countText');
  var searchInput = document.getElementById('searchInput');

  function getGeneratedLicenses() {
    var generated = [];

    // 1. Fetch from mockdata licenses
    if (window.TRADEZO && window.TRADEZO.licenses) {
      window.TRADEZO.licenses.forEach(function(lic) {
        generated.push({
          appId: lic.appId || 'N/A',
          licenseNo: lic.id,
          businessName: lic.businessName,
          category: lic.category,
          status: lic.status,
          date: new Date(lic.issueDate || 0)
        });
      });
    }

    // 2. Fetch from sessionStorage keys doAppStatus_ for LIVE dynamic creations (legacy)
    Object.keys(sessionStorage).forEach(function(key) {
      if (key.startsWith('doAppStatus_')) {
        var statusObj = JSON.parse(sessionStorage.getItem(key));
        if (statusObj && statusObj.status === 'licensed' && statusObj.licenseNo) {
          var appId = key.replace('doAppStatus_', '');
          var appData = window.TRADEZO && window.TRADEZO.applications ? window.TRADEZO.applications.find(function(a){ return a.id === appId || a.appRef === appId; }) : null;
          generated.push({
             appId: appId,
             licenseNo: statusObj.licenseNo,
             businessName: appData ? appData.businessName : 'Unknown Business',
             category: appData ? (appData.tradeCategory || appData.category) : '-',
             status: 'Active',
             date: new Date()
          });
        }
      }
    });

    // 3. Fetch newly generated licenses globally from localStorage
    var localGen = [];
    try { localGen = JSON.parse(localStorage.getItem('tz_generated_licenses') || '[]'); } catch(e){}
    localGen.forEach(function(lic) {
      generated.push({
         appId: lic.appId,
         licenseNo: lic.licenseNo,
         businessName: lic.businessName,
         category: lic.category,
         status: lic.status,
         date: new Date(lic.date)
      });
    });

    // 4. Deduplicate by licenseNo
    var seen = new Set();
    generated = generated.filter(function(lic) {
      if (seen.has(lic.licenseNo)) return false;
      seen.add(lic.licenseNo);
      return true;
    });

    // 4. Sort strictly by date descending
    generated.sort(function(a, b) {
       return b.date - a.date;
    });

    return generated;
  }

  var licenses = getGeneratedLicenses();

  function renderTable(data) {
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:30px;">No generated licenses found.</td></tr>';
      countText.textContent = 'Showing 0 licenses';
      return;
    }

    data.forEach(function(lic) {
      var tr = document.createElement('tr');
      tr.innerHTML = 
        '<td style="color:#1e40af;font-weight:600;">' + lic.appId + '</td>' +
        '<td style="font-weight:700;color:#0f172a;">' + lic.licenseNo + '</td>' +
        '<td><strong>' + lic.businessName + '</strong></td>' +
        '<td>' + lic.category + '</td>' +
        '<td><span class="status-badge">' + (lic.status || 'Active') + '</span></td>';
      tbody.appendChild(tr);
    });

    countText.textContent = 'Showing ' + data.length + ' license(s)';
  }

  renderTable(licenses);

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      var q = this.value.toLowerCase();
      var filtered = licenses.filter(function(lic) {
        return (lic.businessName || '').toLowerCase().includes(q) || 
               (lic.licenseNo || '').toLowerCase().includes(q) || 
               (lic.appId || '').toLowerCase().includes(q);
      });
      renderTable(filtered);
    });
  }
});
