// ---- BUTTON CLICK ACTIONS ----
 
// When "Apply for License" button is clicked
document.querySelector('.btn-orange').addEventListener('click', function() {
  alert('Taking you to Apply for License page...');
});
 
// When "Track Application" button is clicked
document.querySelector('.btn-blue').addEventListener('click', function() {
  alert('Taking you to Track Application page...');
});
 
 
// ---- CARD HOVER EFFECT ----
// Get all cards on the page
var allCards = document.querySelectorAll('.card');
 
// Loop through each card and add hover shadow effect
allCards.forEach(function(card) {
 
  // When mouse enters the card
  card.addEventListener('mouseenter', function() {
    card.style.boxShadow = '0 6px 20px rgba(30, 58, 138, 0.15)';
    card.style.transform = 'translateY(-3px)';
    card.style.transition = 'all 0.2s';
  });
 
  // When mouse leaves the card
  card.addEventListener('mouseleave', function() {
    card.style.boxShadow = 'none';
    card.style.transform = 'translateY(0)';
  });
 
});
 