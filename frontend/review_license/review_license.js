window.onload = function () {
  var now = new Date();
  document.getElementById('submittedAt').value = now.toLocaleString('en-IN');
};

// Show the selected filename next to the upload button
function showFile(inputId, nameId) {
  var file = document.getElementById(inputId).files[0];

  // Check: file must be less than 5MB
  if (file.size > 5 * 1024 * 1024) {
    alert('File too large! Max size is 5MB.');
    return;
  }

  // Show the file name
  document.getElementById(nameId).textContent = file.name;
}

// Validate and submit the form
function submitForm() {
  var valid = true;

  // Check Renewal Period
  if (document.getElementById('renewalPeriod').value === '') {
    document.getElementById('err1').classList.add('show');
    document.getElementById('renewalPeriod').classList.add('invalid-field');
    valid = false;
  } else {
    document.getElementById('err1').classList.remove('show');
    document.getElementById('renewalPeriod').classList.remove('invalid-field');
  }

  // Check License Category
  if (document.getElementById('licenseCategory').value === '') {
    document.getElementById('err2').classList.add('show');
    document.getElementById('licenseCategory').classList.add('invalid-field');
    valid = false;
  } else {
    document.getElementById('err2').classList.remove('show');
    document.getElementById('licenseCategory').classList.remove('invalid-field');
  }

  // Check Shop Area (must be a number greater than 0)
  var area = document.getElementById('shopArea').value;
  if (area === '' || Number(area) <= 0) {
    document.getElementById('err3').classList.add('show');
    document.getElementById('shopArea').classList.add('invalid-field');
    valid = false;
  } else {
    document.getElementById('err3').classList.remove('show');
    document.getElementById('shopArea').classList.remove('invalid-field');
  }

  // If all fields are valid, show success message
  if (valid) {
    document.getElementById('successMsg').style.display = 'block';
    document.querySelector('.renew-btn').textContent = 'Submitted ✓';
    document.querySelector('.renew-btn').disabled = true;
  }
}
