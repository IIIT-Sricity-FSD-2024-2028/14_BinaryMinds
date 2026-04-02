document.addEventListener('DOMContentLoaded', function () {

  /* Show app ID from session */
  var appId = sessionStorage.getItem('approvedAppDO') || sessionStorage.getItem('selectedAppDO') || 'APP-2024-0501';
  document.querySelectorAll('.bc-active, .app-ref').forEach(function (el) {
    el.textContent = appId;
  });

  /* Toggle auth option selection */
  document.querySelectorAll('.auth-option').forEach(function (opt) {
    opt.addEventListener('click', function () {
      document.querySelectorAll('.auth-option').forEach(function (o) {
        o.classList.remove('selected');
        var chk = o.querySelector('.auth-check');
        if (chk) chk.remove();
      });
      opt.classList.add('selected');
      if (!opt.querySelector('.auth-check')) {
        var chk = document.createElement('div');
        chk.className = 'auth-check';
        chk.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        opt.appendChild(chk);
      }
    });
  });

  /* Sign & Issue button → compliance page (success) */
  var signBtn = document.querySelector('.sign-btn');
  if (signBtn) {
    signBtn.addEventListener('click', function () {
      var selected = document.querySelector('.auth-option.selected');
      if (!selected) {
        alert('Please select an authorization method before signing.');
        return;
      }
      if (confirm('Confirm: Issue license for application ' + appId + '?')) {
        sessionStorage.setItem('issuedLicense', appId);
        alert('License signed and issued successfully! License No: LIC-' + Date.now().toString().slice(-6));
        window.location.href = '../compliance/index.html';
      }
    });
  }

  /* Go Back → review page */
  var goBackBtn = document.querySelector('.go-back-btn');
  if (goBackBtn) {
    goBackBtn.addEventListener('click', function () {
      window.location.href = '../review/index.html';
    });
  }
});