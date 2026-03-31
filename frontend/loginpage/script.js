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
 
  // Store user info in localStorage
  localStorage.setItem("user", JSON.stringify({ name: email, role: role }));
 
  // Redirect based on role
  if (role === "applicant") {
    window.location.href = "../Applicant_dashboard/";
  } else if (role === "field officer") {
    window.location.href = "../fodashboard/";
  } else if (role === "department officer") {
    window.location.href = "../details/";
  }
}