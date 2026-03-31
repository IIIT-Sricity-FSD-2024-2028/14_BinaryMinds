// Track Application button → goes to track page
document.getElementById('trackBtn').addEventListener('click', function () {
  window.location.href = '../Track_Application_Status/';
});

// Download Receipt button → triggers browser print/save
document.getElementById('downloadBtn').addEventListener('click', function () {
  window.print();
});

// Cancel button → goes back to previous page
document.getElementById('cancelBtn').addEventListener('click', function () {
  window.history.back();
});