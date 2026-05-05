// upload_document.js — handles file uploads, validation, Back and Preview buttons

(function () {

  // ─── File Upload Handler ───────────────────────────────────────────────────
  window.handleUpload = function (input, statusId, errId) {
    var statusEl = document.getElementById(statusId);
    var errEl    = document.getElementById(errId);

    if (statusEl) statusEl.textContent = '';
    if (errEl)    errEl.textContent    = '';

    if (!input || !input.files || !input.files.length) return;

    var file     = input.files[0];
    var maxBytes = 5 * 1024 * 1024; // 5 MB
    var allowed  = ['image/jpeg', 'image/png', 'application/pdf'];

    if (!allowed.includes(file.type)) {
      if (errEl) errEl.textContent = '✖ Invalid file type. Please upload JPG, PNG, or PDF.';
      input.value = '';
      return;
    }

    if (file.size > maxBytes) {
      if (errEl) errEl.textContent = '✖ File too large. Maximum allowed size is 5 MB.';
      input.value = '';
      return;
    }

    if (statusEl) statusEl.textContent = '✔ ' + file.name + ' uploaded successfully.';

    // Persist filename in sessionStorage so it survives page reload
    sessionStorage.setItem('upload_' + statusId, file.name);
  };

  // ─── Back Button ──────────────────────────────────────────────────────────
  window.goBack = function () {
    window.location.href = '../apply_license/apply_license.html';
  };

  // ─── Preview / Review Button ──────────────────────────────────────────────
  window.previewApplication = function () {
    // Check ALL 3 files have been uploaded
    var uploaded = ['status1', 'status2', 'status3'].filter(function (id) {
      var el = document.getElementById(id);
      return el && el.textContent.trim().startsWith('✔');
    });

    if (uploaded.length < 3) {
      var remaining = 3 - uploaded.length;
      alert('Please upload all 3 required documents before proceeding.\n' + remaining + ' document(s) still pending.');
      return;
    }

    // Save upload state to sessionStorage
    sessionStorage.setItem('documentsUploaded', 'true');
    sessionStorage.setItem('documentsUploadedCount', uploaded.length);

    // Build uploadedDocs object mapping so paynow script can attach it to the application
    var uploadedDocs = {
      status1: sessionStorage.getItem('upload_status1') || '',
      status2: sessionStorage.getItem('upload_status2') || '',
      status3: sessionStorage.getItem('upload_status3') || ''
    };
    sessionStorage.setItem('uploadedDocs', JSON.stringify(uploadedDocs));

    // Also pull any in-progress application data and tag documents as done
    try {
      var appData = JSON.parse(sessionStorage.getItem('currentApplication') || '{}');
      appData.documentsUploaded = true;
      appData.uploadedAt = new Date().toISOString();
      sessionStorage.setItem('currentApplication', JSON.stringify(appData));
    } catch (e) {}

    // Navigate to payment page
    window.location.href = '../paynow/index.html';
  };

  // ─── Restore upload status labels on re-visit ─────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    ['status1', 'status2', 'status3'].forEach(function (id) {
      var saved = sessionStorage.getItem('upload_' + id);
      if (saved) {
        var el = document.getElementById(id);
        if (el) el.textContent = '✔ ' + saved + ' uploaded successfully.';
      }
    });
  });

})();
