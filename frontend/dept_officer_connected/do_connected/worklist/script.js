// DO worklist/script.js — uses TRADEZO mock data
document.addEventListener('DOMContentLoaded', function() {

  // Fill worklist table from TRADEZO applications
  var tbody = document.querySelector('tbody');
  if (tbody) {
    tbody.innerHTML = '';
    TRADEZO.applications.forEach(function(app) {
      var color = TRADEZO.statusColor(app.status);
      var row = document.createElement('tr');
      row.innerHTML =
        '<td style="color:#1E3A8A;font-weight:600;">#' + app.id + '</td>' +
        '<td><strong>' + app.businessName + '</strong><br><small style="color:#64748b;">' + app.tradeCategory + '</small></td>' +
        '<td>' + app.submittedDate + '</td>' +
        '<td><span style="background:' + color + '22;color:' + color + ';padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">● ' + app.status + '</span></td>' +
        '<td><button class="action-btn" data-id="' + app.id + '" style="background:#1E3A8A;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;">' +
          (app.doReview === 'Approved' || app.doReview === 'Rejected' ? 'View' : 'Review') +
        '</button></td>';
      tbody.appendChild(row);
    });
  }

  // Wire Review buttons
  document.querySelectorAll('.action-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      sessionStorage.setItem('selectedAppDO', this.getAttribute('data-id'));
      window.location.href = '../review/index.html';
    });
  });

  // Search
  var searchInput = document.querySelector('.search-bar input, input[type="text"]');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      var q = this.value.toLowerCase();
      document.querySelectorAll('tbody tr').forEach(function(row) {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  // Filter tabs
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.textContent.trim().toLowerCase();
      document.querySelectorAll('tbody tr').forEach(function(row) {
        row.style.display = (filter === 'all applications' || row.textContent.toLowerCase().includes(filter)) ? '' : 'none';
      });
    });
  });

  // Export
  var exportBtn = document.querySelector('.export-btn');
  if (exportBtn) exportBtn.addEventListener('click', function() { window.print(); });
});