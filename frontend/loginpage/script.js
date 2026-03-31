// This function runs when the Login button is clicked
 
function handleLogin() {
 
  // Get what the user typed
  var email = document.querySelector('input[type="text"]').value;
  var password = document.querySelector('input[type="password"]').value;
  var role = document.querySelector('select').value;
 
  // Check if fields are empty
  if (email === "") {
    alert("Please enter your Email or Phone Number.");
    return;
  }
 
  if (password === "") {
    alert("Please enter your Password.");
    return;
  }
 
  if (role === "") {
    alert("Please select Login As.");
    return;
  }
 
  // If all filled, show success message
  alert("Login Successful! Welcome to TradeZo.");
}