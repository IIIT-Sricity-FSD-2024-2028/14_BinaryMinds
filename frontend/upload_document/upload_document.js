// Store which files are uploaded
var uploaded = { file1: false, file2: false, file3: false };

// Called when user picks a file
function handleUpload(input, statusId, errId) {
  var file = input.files[0];
  var err = document.getElementById(errId);
  var status = document.getElementById(statusId);

  // Hide old error
  err.style.display = 'none';
  err.textContent = '';

  // Check file type
  var allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowed.includes(file.type)) {
    err.textContent = 'Only JPG, PNG or PDF files allowed.';
    err.style.display = 'block';
    return;
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    err.textContent = 'File size must be less than 5MB.';
    err.style.display = 'block';
    return;
  }

  // Show file name as success
  status.textContent = '✓ ' + file.name + ' uploaded successfully';
  uploaded[input.id] = true;
}

// Called when Next button is clicked
function goNext() {
  var allUploaded = uploaded.file1 && uploaded.file2 && uploaded.file3;

  if (!allUploaded) {
    alert('Please upload all required documents before proceeding.');
    return;
  }

  // Go to next page
  window.location.href = 'application_review.html';
}