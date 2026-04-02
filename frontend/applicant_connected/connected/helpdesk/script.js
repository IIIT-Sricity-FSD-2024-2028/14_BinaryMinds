// ================================
// helpdesk.js - TradeZo Help Desk
// ================================


// Runs when "Submit Request" button is clicked
function handleSubmit() {
  // Get the values from the form
  var name = document.querySelector('input[placeholder="Enter your full name"]').value;
  var appId = document.querySelector('input[placeholder="TL-2023-XXXX"]').value;
  var issue = document.querySelector('select').value;
  var message = document.querySelector('textarea').value;

  // Check if all fields are filled
  if (name === "" || appId === "" || issue === "" || message === "") {
    alert("Please fill in all the fields before submitting.");
    return;
  }

  // If all filled, show success message
  alert("Your support request has been submitted!\nWe will get back to you soon.");
}


// Runs when "Cancel" button is clicked
function handleCancel() {
  var confirmed = confirm("Are you sure you want to cancel?");
  if (confirmed) {
    alert("Redirecting to Dashboard...");
    // window.location.href = "dashboard.html"; // Uncomment in real project
  }
}


// Runs when "View All Tickets" is clicked
function viewAllTickets() {
  alert("Loading all support tickets...");
  // window.location.href = "tickets.html"; // Uncomment in real project
}


// Runs when an FAQ item is clicked
function toggleFAQ(element) {
  var question = element.querySelector('span').innerText;

  // Simple answers for each question
  if (question.includes("track")) {
    alert("To track your application: Go to Dashboard → Track Application → Enter your Application ID.");
  } else if (question.includes("download")) {
    alert("To download your license: Go to Dashboard → Download License → Click Download PDF.");
  } else if (question.includes("payment")) {
    alert("If payment fails: Wait 24 hours. If amount is deducted, raise a support ticket with your transaction ID.");
  }
}


// Runs when the chat send button is clicked
function sendChat() {
  var input = document.getElementById("chatInput");
  var message = input.value.trim();

  if (message === "") {
    alert("Please type a message first.");
    return;
  }

  // Show a simple response in the chat body
  var chatBody = document.querySelector(".chat-body");

  // Add user message
  var userMsg = document.createElement("div");
  userMsg.style.textAlign = "right";
  userMsg.style.marginTop = "8px";
  userMsg.style.fontSize = "13px";
  userMsg.style.color = "#333";
  userMsg.innerText = "You: " + message;
  chatBody.appendChild(userMsg);

  // Add bot response
  var botMsg = document.createElement("div");
  botMsg.className = "chat-bubble";
  botMsg.style.marginTop = "8px";
  botMsg.innerText = "Thank you for your message. Our team will assist you shortly.";
  chatBody.appendChild(botMsg);

  // Clear the input box
  input.value = "";
}


// Runs when the ✕ close button in chat is clicked
function closeChat() {
  var chatCard = document.querySelector(".chat-card");
  chatCard.style.display = "none";
}


// Runs when the chat icon button at bottom right is clicked
function openChat() {
  var chatCard = document.querySelector(".chat-card");
  chatCard.style.display = "block";
}