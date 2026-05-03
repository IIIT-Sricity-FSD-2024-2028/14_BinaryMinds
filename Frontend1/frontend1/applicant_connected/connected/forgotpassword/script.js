function sendOTP() {
  var email = document.getElementById('email').value.trim();
  if (!email) {
    alert('Please enter your registered email address.');
    return;
  }
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }
  alert('OTP sent to ' + email + '. Please check your inbox.');
  /* In real system, after OTP verify → allow password reset */
  setTimeout(function() {
    window.location.href = '../login/index.html';
  }, 2000);
}
