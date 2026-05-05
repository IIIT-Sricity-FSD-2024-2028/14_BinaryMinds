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
  
  function safeArray(key) {
      try {
          var value = JSON.parse(localStorage.getItem(key) || '[]');
          return Array.isArray(value) ? value : [];
      } catch(e) {
          return [];
      }
  }

  function clean(val) {
      if (val == null) return '';
      var text = String(val).trim();
      var lower = text.toLowerCase();
      if (!text || lower === 'undefined' || lower === 'null' || lower === 'n/a' || text === '-' || text === '—') return '';
      return text;
  }

  function firstValue() {
      for (var i = 0; i < arguments.length; i++) {
          var value = clean(arguments[i]);
          if (value) return value;
      }
      return 'N/A';
  }

  function appIdOf(item) {
      if (!item) return '';
      return clean(item.appId) || clean(item.id) || clean(item.appRef) || clean(item.applicationId) || clean(item.application_id);
  }

  function findByAppId(list, id) {
      return list.find(function(item) {
          return String(appIdOf(item)) === String(id);
      }) || {};
  }

  var report = findByAppId(reports, appId);
  if (!Object.keys(report).length) report = null;

  // Fallback to mock data if not in local storage but marked completed
  if (!report && window.TRADEZO && Array.isArray(TRADEZO.inspections)) {
      var mock = TRADEZO.inspections.find(function(i) { return String(appIdOf(i)) === String(appId) && i.status === 'Completed'; });
      if (mock) {
          report = {
              appId: mock.appId,
              businessName: mock.businessName,
              type: mock.type || mock.tradeCategory || mock.category,
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

  var app = findByAppId(
      []
          .concat(window.TRADEZO && Array.isArray(TRADEZO.applications) ? TRADEZO.applications : [])
          .concat(safeArray('tz_submitted_apps'))
          .concat(safeArray('applications'))
          .concat(safeArray('tradezo_applications')),
      appId
  );

  report = Object.assign({}, app, report, {
      appId: appId,
      businessName: firstValue(report.businessName, app.businessName, app.business_name, app.business),
      ownerName: firstValue(report.ownerName, app.ownerName, app.applicantName, app.full_name, app.applicant),
      type: firstValue(
          report.type,
          report.tradeCategory,
          app.tradeCategory,
          app.trade_category,
          app.category,
          app.licenseType,
          app.businessType,
          app.business_type
      ),
      address: firstValue(report.address, app.shopAddress, app.shop_address, app.address),
      date: firstValue(report.inspectionDate, report.date, app.inspectionDate),
      result: firstValue(report.result, report.inspectionResult, 'Pending'),
      notes: firstValue(report.notes, report.inspectionNotes, 'No notes available.')
  });

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
