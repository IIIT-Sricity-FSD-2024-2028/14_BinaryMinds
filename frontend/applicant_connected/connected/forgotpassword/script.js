(function () {
  var form = document.getElementById('forgotPasswordForm');
  var message = document.getElementById('resetMessage');
  if (!form || !message) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    message.textContent = 'Password recovery is not enabled on this TradeZo server. No OTP was sent and your password has not been changed. Please contact your municipal administrator.';
  });
})();
