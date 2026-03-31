function searchCards() {
  var input = document.getElementById('searchInput').value.toLowerCase();
  var cards = document.querySelectorAll('.card');
  var count = 0;

  cards.forEach(function(card) {
    var name = card.querySelector('h3').textContent.toLowerCase();
    if (name.includes(input)) {
      card.classList.remove('hidden');
      count++;
    } else {
      card.classList.add('hidden');
    }
  });

  document.getElementById('countText').textContent = 'Showing ' + count + ' application(s)';
}

function viewDetails(appId) {
  localStorage.setItem('selectedApp', appId);
  window.location.href = 'verification_history.html';
}