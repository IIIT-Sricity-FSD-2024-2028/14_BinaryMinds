// This function runs when the SEND OTP button is clicked
 
function sendOTP() {
 
  // Get the email value from the input box
  var email = document.getElementById("email").value;
 
  // Get the green success message box
  var successMsg = document.getElementById("successMsg");
 
  // Check 1: If email box is empty
  if (email == "") {
    alert("Please enter your email address.");
    return; // Stop the function here
  }
 
  // Check 2: If email does not have @ symbol
  if (!email.includes("@")) {
    alert("Please enter a valid email address.");
    return; // Stop the function here
  }
 
  // If both checks pass, show the green success message
  successMsg.style.display = "block";
 
}