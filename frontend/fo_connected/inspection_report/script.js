document.addEventListener('DOMContentLoaded', function () {

  var appId = sessionStorage.getItem('selectedApp');
  if (!appId) {
      alert("No application selected.");
      window.history.back();
      return;
  }

  // Find report in local storage
  var reports = [];
  try { reports = JSON.parse(localStorage.getItem('tz_inspection_reports') || '[]'); } catch(e){}
  
  var report = reports.find(function(r) { return r.appId === appId; });

  // Fallback to mock data if not in local storage but marked completed
  if (!report && window.TRADEZO && Array.isArray(TRADEZO.inspections)) {
      var mock = TRADEZO.inspections.find(function(i) { return i.appId === appId && i.status === 'Completed'; });
      if (mock) {
          report = {
              appId: mock.appId,
              businessName: mock.businessName,
              type: mock.type,
              address: mock.address,
              ownerName: mock.ownerName,
              date: mock.date,
              result: mock.result,
              notes: mock.notes || "No notes available (Mock Data)."
          };
      }
  }

  if (!report) {
      alert("Inspection report not found.");
      window.history.back();
      return;
  }

  // Populate UI
  function setText(id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text || 'N/A';
  }

  setText('appId', report.appId);
  setText('bizName', report.businessName);
  setText('ownerName', report.ownerName);
  setText('tradeCategory', report.type);
  setText('address', report.address);

  setText('inspDate', report.date);
  
  var resultEl = document.getElementById('inspResult');
  if (resultEl) {
      resultEl.textContent = report.result;
      if (report.result === 'Approved') {
          resultEl.style.color = '#16a34a';
      } else if (report.result === 'Rejected') {
          resultEl.style.color = '#dc2626';
      }
  }

  setText('inspNotes', report.notes);

});
