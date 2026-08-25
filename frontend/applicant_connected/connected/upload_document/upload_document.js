// Handles document selection, validation, and multipart uploads.

(function () {
  var MAX_BYTES = 5 * 1024 * 1024;
  var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  var DOCUMENTS = [
    { inputId: 'file1', statusId: 'status1', errorId: 'err1', type: 'aadhar_card' },
    { inputId: 'file2', statusId: 'status2', errorId: 'err2', type: 'business_affidavit' },
    { inputId: 'file3', statusId: 'status3', errorId: 'err3', type: 'passport_photo' }
  ];

  function setMessage(id, message) {
    var element = document.getElementById(id);
    if (element) element.textContent = message;
  }

  function getApplicationForm() {
    try {
      return JSON.parse(sessionStorage.getItem('applicationForm') || '{}');
    } catch (error) {
      return {};
    }
  }

  function createBackendApplication() {
    var existingId = Number(sessionStorage.getItem('backendApplicationId'));
    if (existingId) return Promise.resolve(existingId);

    var form = getApplicationForm();
    return TRADEZO.backendRequest('POST', '/applications', {
      applicantName: form.fullName || 'Applicant',
      businessName: form.businessName || '',
      tradeCategory: form.tradeCategory || form.businessType || '',
      shopAddress: form.shopAddress || '',
      phone: form.phone || ''
    }, 'applicant').then(function (response) {
      var application = response && response.data;
      var applicationId = Number(application && application.application_id);
      if (!applicationId) throw new Error('The backend did not return an application ID.');

      sessionStorage.setItem('backendApplicationId', String(applicationId));
      return applicationId;
    });
  }

  function uploadDocument(applicationId, documentConfig) {
    var input = document.getElementById(documentConfig.inputId);
    var file = input && input.files && input.files[0];
    var formData = new FormData();
    formData.append('application_id', String(applicationId));
    formData.append('document_type', documentConfig.type);
    formData.append('file', file);

    return fetch(TRADEZO.API_BASE + '/documents', {
      method: 'POST',
      headers: { role: TRADEZO.roleFor('applicant') },
      body: formData
    }).then(function (response) {
      return response.text().then(function (text) {
        var payload = text ? JSON.parse(text) : null;
        if (!response.ok) {
          throw new Error(payload && payload.message ? payload.message : 'Document upload failed.');
        }
        return payload;
      });
    });
  }

  window.handleUpload = function (input, statusId, errorId) {
    setMessage(statusId, '');
    setMessage(errorId, '');

    if (!input || !input.files || !input.files.length) return;

    var file = input.files[0];
    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage(errorId, 'Invalid file type. Please upload JPG, PNG, or PDF.');
      input.value = '';
      return;
    }

    if (file.size > MAX_BYTES) {
      setMessage(errorId, 'File too large. Maximum allowed size is 5 MB.');
      input.value = '';
      return;
    }

    setMessage(statusId, file.name + ' is ready to upload.');
  };

  window.goBack = function () {
    window.location.href = '../apply_license/apply_license.html';
  };

  window.previewApplication = function () {
    var missingDocument = DOCUMENTS.some(function (documentConfig) {
      var input = document.getElementById(documentConfig.inputId);
      return !input || !input.files || !input.files.length;
    });

    if (missingDocument) {
      alert('Please upload all 3 required documents before proceeding.');
      return;
    }

    var previewButton = document.querySelector('.btn-preview');
    if (previewButton) {
      previewButton.disabled = true;
      previewButton.textContent = 'Uploading...';
    }

    createBackendApplication()
      .then(function (applicationId) {
        return Promise.all(DOCUMENTS.map(function (documentConfig) {
          return uploadDocument(applicationId, documentConfig).then(function (uploadedDocument) {
            setMessage(documentConfig.statusId, 'Uploaded successfully.');
            return uploadedDocument;
          });
        }));
      })
      .then(function (uploadedDocuments) {
        var uploadedDocs = {};
        uploadedDocuments.forEach(function (uploadedDocument, index) {
          uploadedDocs[DOCUMENTS[index].statusId] = uploadedDocument.file_path;
        });
        sessionStorage.setItem('uploadedDocs', JSON.stringify(uploadedDocs));
        sessionStorage.setItem('documentsUploaded', 'true');
        sessionStorage.setItem('documentsUploadedCount', String(uploadedDocuments.length));
        window.location.href = '../paynow/index.html';
      })
      .catch(function (error) {
        setMessage('err1', error.message || 'Document upload failed.');
      })
      .finally(function () {
        if (previewButton) {
          previewButton.disabled = false;
          previewButton.textContent = 'Preview & Review';
        }
      });
  };
})();
