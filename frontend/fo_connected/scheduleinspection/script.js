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
 
  // Show success popup then go to Record Inspection page
  alert('Inspection Scheduled Successfully!\nDate: ' + date + '\nTime: ' + time);
  window.location.href = '../recordinspection/index.html';
}
 
// Cancel button → go back to verification
document.addEventListener('DOMContentLoaded', function() {
  var cancelBtn = document.querySelector('.cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      window.location.href = '../verification/index.html';
    });
  }
});
 