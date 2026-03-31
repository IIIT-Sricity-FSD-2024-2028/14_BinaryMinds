// Runs when Submit button is clicked
function submitForm() {

  var checked = document.getElementById('agree').checked;
  var error   = document.getElementById('declError');

  // If checkbox is NOT ticked, show red error and stop
  if (!checked) {
    error.classList.add('show');
    return;
  }

  // Checkbox is ticked — hide the error
  error.classList.remove('show');

  // Make a random reference number like TL-2024-4823
  var refNum = Math.floor(1000 + Math.random() * 9000);
  document.getElementById('refNo').textContent = 'TL-2024-' + refNum;

  // Show the green success message
  document.getElementById('successMsg').style.display = 'block';

  // Disable the button so user cannot click again
  document.querySelector('.submit-btn').disabled = true;
  document.querySelector('.submit-btn').textContent = 'Submitted ✓';
}
// Runs when user picks a new file to replace
function replaceDoc() {
  var file = document.getElementById('replaceFile').files[0];

  // Check file size max 5MB
  if (file.size > 5 * 1024 * 1024) {
    alert('File too large! Max 5MB.');
    return;
  }

  // Show success alert
  alert('Document replaced successfully: ' + file.name);
}