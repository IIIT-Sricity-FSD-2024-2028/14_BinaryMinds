// Highlight active nav link based on current page
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', function () {
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    this.classList.add('active');
  });
});

// Download receipt button simulation
document.querySelectorAll('td a').forEach(btn => {
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    const text = this.textContent.trim();
    if (text.includes('Download')) {
      alert('Receipt download started!');
    } else if (text.includes('Retry')) {
      alert('Redirecting to payment gateway...');
    }
  });
});

// Eye icon click on receipts
document.querySelectorAll('.fa-eye').forEach(icon => {
  icon.style.cursor = 'pointer';
  icon.addEventListener('click', function () {
    const row = this.closest('tr');
    const id = row.cells[0].textContent;
    alert('Viewing receipt: ' + id);
  });
});