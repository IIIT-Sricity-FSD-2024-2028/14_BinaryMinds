// Active nav link
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', function () {
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    this.classList.add('active');
  });
});

// View License button
document.querySelector('.btn-view').addEventListener('click', function () {
  alert('Opening license document for TL-2023-8842...');
});

// Contact Support button
document.querySelector('.btn-support').addEventListener('click', function () {
  alert('Connecting to support. Please wait...');
});

// View All Notifications
document.querySelector('.view-all').addEventListener('click', function (e) {
  e.preventDefault();
  alert('Loading all notifications...');
});