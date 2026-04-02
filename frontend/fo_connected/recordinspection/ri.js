// fo_connected/recordinspection/ri.js
// Uses TRADEZO mock data

document.addEventListener('DOMContentLoaded', function() {
  var container = document.getElementById('inspectionCards');
  var countText = document.getElementById('countText');
  if (!container) return;

  var data = TRADEZO.inspections.filter(function(i) { return i.status === 'Scheduled'; });
  renderCards(data);

  var searchEl = document.getElementById('searchInspection');
  if (searchEl) {
    searchEl.addEventListener('input', function() {
      var val = this.value.toLowerCase();
      var filtered = TRADEZO.inspections.filter(function(i) {
        return i.status === 'Scheduled' && i.businessName.toLowerCase().includes(val);
      });
      renderCards(filtered);
    });
  }
});

function renderCards(data) {
  var container = document.getElementById('inspectionCards');
  var countText = document.getElementById('countText');
  container.innerHTML = '';
  if (countText) countText.innerText = 'Showing ' + data.length + ' inspection(s)';

  data.forEach(function(item) {
    var card = document.createElement('div');
    card.className = 'inspection-card blue';
    card.innerHTML =
      '<h3>' + item.businessName + '</h3>' +
      '<small>' + item.appId + '</small>' +
      '<p class="info">📁 ' + item.type + '</p>' +
      '<p class="info">📍 ' + item.address + '</p>' +
      '<p class="info">📅 ' + item.date + '</p>' +
      '<p class="info">⏰ ' + item.time + '</p>' +
      '<button class="start-btn" data-id="' + item.appId + '" data-name="' + item.businessName + '" data-type="' + item.type + '" data-address="' + item.address + '" data-owner="' + item.ownerName + '">Start Inspection</button>';
    container.appendChild(card);
  });

  document.querySelectorAll('.start-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      sessionStorage.setItem('selectedApp',   this.getAttribute('data-id'));
      sessionStorage.setItem('approvedApp',   this.getAttribute('data-id'));
      sessionStorage.setItem('businessName',  this.getAttribute('data-name'));
      sessionStorage.setItem('tradeCategory', this.getAttribute('data-type'));
      sessionStorage.setItem('address',       this.getAttribute('data-address'));
      sessionStorage.setItem('ownerName',     this.getAttribute('data-owner'));
      window.location.href = '../start inspection/index.html';
    });
  });
}