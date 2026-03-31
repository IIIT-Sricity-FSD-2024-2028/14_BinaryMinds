// Sidebar navigation
document.querySelectorAll('.sidebar p').forEach(function(item) {
  item.addEventListener('click', function() {
    var text = this.textContent.trim();
    if (text === 'Dashboard') {
      window.location.href = '#';
    } else if (text === 'Apply License') {
      window.location.href = '../apply_license/apply_license.html';
    } else if (text === 'Application Review') {
      window.location.href = '../application_review/application_review.html';
    } else if (text === 'Renew Licenses') {
      window.location.href = '../review_license/review_license.html';
    } else if (text === 'Logout') {
      localStorage.removeItem('user');
      window.location.href = '../loginpage/';
    }
  });
});

// Download license button
document.querySelector('.card button').addEventListener('click', function() {
  if (this.textContent.includes('Download')) {
    window.location.href = '../download/';
  }
});

// Upload button
document.querySelectorAll('.task button').forEach(function(btn) {
  if (btn.textContent.includes('Upload')) {
    btn.addEventListener('click', function() {
      window.location.href = '../upload_document/upload_document.html';
    });
  }
});
