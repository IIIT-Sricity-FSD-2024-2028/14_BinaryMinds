/* Edit buttons → go back to apply */
document.querySelectorAll('.edit-btn').forEach(function(btn) {
  if (!btn.getAttribute('onclick')) {
    btn.addEventListener('click', function() {
      window.location.href = '../../apply_license/apply_license.html';
    });
  }
});

/* Submit Application */
function submitForm() {
  var decl = document.getElementById('declaration') || document.getElementById('decl');
  var declErr = document.getElementById('declError');

  if (decl && !decl.checked) {
    if (declErr) { declErr.style.display = 'block'; }
    return;
  }
  if (declErr) declErr.style.display = 'none';

  /* Generate reference number */
  var refNo = 'TL2026-' + String(Math.floor(100000 + Math.random() * 900000));
  sessionStorage.setItem('applicationRef', refNo);
  localStorage.setItem('hasApplied', 'true');

  var refEl = document.getElementById('refNo');
  var successMsg = document.getElementById('successMsg');
  if (refEl) refEl.textContent = refNo;
  if (successMsg) {
    successMsg.style.display = 'block';
    setTimeout(function() {
      window.location.href = '../../paynow/index.html';
    }, 1800);
  } else {
    window.location.href = '../../paynow/index.html';
  }
}

/* Previous button */
var prevBtn = document.querySelector('.cancel-btn');
if (prevBtn) {
  prevBtn.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = '../../upload_document/upload_document.html';
  });
}