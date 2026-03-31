// ================================
// script.js - TradeZo Trade License
// ================================
 
// This function runs when "Download License PDF" is clicked
function handleDownload() {
  alert("Downloading your Trade License PDF...");
  // In a real project, this would trigger a real PDF download
}
 
// This function runs when "Print License" is clicked
function handlePrint() {
  alert("Opening print window...");
  window.print(); // Opens the browser's print dialog
}
 
// This function runs when "Cancel" is clicked
function handleCancel() {
  // Ask the user if they really want to cancel
  var confirmed = confirm("Are you sure you want to cancel?");
 
  if (confirmed) {
    alert("Action cancelled. Redirecting to Dashboard...");
    // In a real project, this would go to the dashboard page
    window.location.href = "../Applicant_dashboard/";
  }
}