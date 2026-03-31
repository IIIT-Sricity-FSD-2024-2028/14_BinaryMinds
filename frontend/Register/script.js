// register.js

document.querySelector('.btn-register').addEventListener('click', function () {
  const name = document.querySelectorAll('input')[0].value.trim();
  const email = document.querySelectorAll('input')[1].value.trim();
  const phone = document.querySelectorAll('input')[2].value.trim();
  const password = document.querySelectorAll('input')[3].value;
  const confirm = document.querySelectorAll('input')[4].value;
  const terms = document.getElementById('terms').checked;

  if (!name || !email || !phone || !password || !confirm) {
    alert('Please fill in all required fields.');
    return;
  }

  if (phone.length !== 10 || isNaN(phone)) {
    alert('Enter a valid 10-digit phone number.');
    return;
  }

  if (password !== confirm) {
    alert('Passwords do not match.');
    return;
  }

  if (!terms) {
    alert('Please agree to the Terms & Conditions.');
    return;
  }

  alert('Account registered successfully!');
});