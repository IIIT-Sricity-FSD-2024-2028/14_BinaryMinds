// Track uploaded files
var uploaded     = { file1: false, file2: false, file3: false };
var uploadedNames = { file1: '', file2: '', file3: '' };

// Called when user picks a file
function handleUpload(input, statusId, errId) {
  var file   = input.files[0];
  var err    = document.getElementById(errId);
  var status = document.getElementById(statusId);

  err.style.display = 'none';
  err.textContent   = '';

  var allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowed.includes(file.type)) {
    err.textContent   = 'Only JPG, PNG or PDF files are allowed.';
    err.style.display = 'block';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    err.textContent   = 'File size must be less than 5MB.';
    err.style.display = 'block';
    return;
  }

  // Show success
  status.textContent = '✔ ' + file.name + ' uploaded successfully';
  status.style.color = '#16a34a';
  uploaded[input.id]       = true;
  uploadedNames[input.id]  = file.name;
}

// Preview & Review button — validates all 3 docs then goes to review page
function previewApplication() {
  if (!uploaded.file1 || !uploaded.file2 || !uploaded.file3) {
    alert('Please upload all 3 required documents before continuing.');
    return;
  }

  // Save uploaded document names to sessionStorage
  sessionStorage.setItem('uploadedDocs', JSON.stringify({
    aadhaar:      uploadedNames.file1,
    addressProof: uploadedNames.file2,
    shopPhoto:    uploadedNames.file3
  }));

  window.location.href = '../application_review/application_review.html';
}

// Back button
function goBack() {
  window.location.href = '../apply_license/apply_license.html';
}