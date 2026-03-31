// Highlight selected payment option
var opts = document.querySelectorAll(".opt");

opts.forEach(function(opt) {
  opt.addEventListener("click", function() {
    opts.forEach(function(o) { o.classList.remove("selected"); });
    opt.classList.add("selected");
  });
});

// Pay Now button
function payNow() {
  var choice = document.querySelector('input[name="pay"]:checked').value;
  var names = { upi: "UPI / QR Code", card: "Debit / Credit Card", net: "Net Banking" };
  alert("Redirecting to " + names[choice] + "...\nAmount: ₹2100.00");
}