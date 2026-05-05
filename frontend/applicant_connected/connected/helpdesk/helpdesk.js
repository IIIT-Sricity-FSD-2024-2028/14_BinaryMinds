// helpdesk/helpdesk.js

(function () {

  // ─── Submit Support Request ────────────────────────────────────────────────
  window.handleSubmit = function () {
    var nameEl    = document.querySelector('.form-card input[type="text"]:first-of-type') ||
                    document.querySelector('#hdName');
    var appIdEl   = document.querySelector('#hdAppId');
    var issueEl   = document.querySelector('.form-card select') || document.querySelector('#hdIssue');
    var messageEl = document.querySelector('.form-card textarea') || document.querySelector('#hdMessage');

    var name    = nameEl    ? nameEl.value.trim()    : '';
    var appId   = appIdEl   ? appIdEl.value.trim()   : '';
    var issue   = issueEl   ? issueEl.value.trim()   : '';
    var message = messageEl ? messageEl.value.trim() : '';

    if (!name) { alert('Please enter your full name.'); if (nameEl) nameEl.focus(); return; }
    if (!issue || issue === '') { alert('Please select an issue type.'); if (issueEl) issueEl.focus(); return; }
    if (!message) { alert('Please describe your issue.'); if (messageEl) messageEl.focus(); return; }

    // Save ticket to localStorage
    var tickets = [];
    try { tickets = JSON.parse(localStorage.getItem('helpdesk_tickets') || '[]'); } catch(e) {}

    var ticketId = 'TK-' + Math.floor(10000 + Math.random() * 90000);
    var newTicket = {
      id: ticketId,
      name: name,
      appId: appId,
      issue: issue,
      message: message,
      status: 'In Progress',
      createdAt: new Date().toLocaleString('en-IN')
    };

    tickets.push(newTicket);
    localStorage.setItem('helpdesk_tickets', JSON.stringify(tickets));

    alert('✅ Support request submitted successfully!\nYour Ticket ID: ' + ticketId);

    // Clear form
    if (nameEl)    nameEl.value    = '';
    if (appIdEl)   appIdEl.value   = '';
    if (issueEl)   issueEl.value   = '';
    if (messageEl) messageEl.value = '';
  };

  // ─── View All Tickets ──────────────────────────────────────────────────────
  window.viewAllTickets = function () {
    var tickets = [];
    try { tickets = JSON.parse(localStorage.getItem('helpdesk_tickets') || '[]'); } catch(e) {}
    if (!tickets.length) { alert('No tickets found.'); return; }
    var list = tickets.map(function(t) {
      return t.id + ' — ' + t.issue + ' (' + t.status + ')';
    }).join('\n');
    alert('All Tickets:\n\n' + list);
  };

  // ─── FAQ Toggle ───────────────────────────────────────────────────────────
  window.toggleFAQ = function (el) {
    var arrow = el.querySelector('span:last-child');
    var answer = el.nextElementSibling;

    if (answer && answer.classList.contains('faq-answer')) {
      // Toggle existing answer
      var isOpen = answer.style.display !== 'none';
      answer.style.display = isOpen ? 'none' : 'block';
      if (arrow) arrow.textContent = isOpen ? '→' : '↓';
    } else {
      // Create answer on first click
      var question = el.querySelector('span:first-child') ? el.querySelector('span:first-child').textContent : '';
      var answers = {
        'How to track application status?': 'Visit the "Track Application" page from the navbar or dashboard to see real-time status updates.',
        'How to download approved license?': 'Once your license is approved, visit the "Download License" page. A PDF download button will appear.',
        'What if payment fails?': 'If payment failed, go to the "Payments" page and click "Retry Payment". Contact support at 1800-123-4567 if the issue persists.'
      };
      var answerText = answers[question] || 'Please contact support at 1800-123-4567 for assistance.';
      var div = document.createElement('div');
      div.className = 'faq-answer';
      div.style.cssText = 'padding:8px 0 10px 0; font-size:13px; color:#334155; line-height:1.5; border-bottom:1px solid #f1f5f9;';
      div.textContent = answerText;
      el.parentNode.insertBefore(div, el.nextSibling);
      if (arrow) arrow.textContent = '↓';
    }
  };

  // ─── Chat Open / Close ────────────────────────────────────────────────────
  window.openChat = function () {
    var card = document.querySelector('.chat-card');
    if (card) card.classList.add('open');
  };

  window.closeChat = function () {
    var card = document.querySelector('.chat-card');
    if (card) card.classList.remove('open');
  };

  // ─── Send Chat ────────────────────────────────────────────────────────────
  window.sendChat = function () {
    var input = document.getElementById('chatInput');
    if (!input || !input.value.trim()) return;

    var body = document.querySelector('.chat-body');
    if (!body) return;

    // User message
    var userMsg = document.createElement('div');
    userMsg.style.cssText = 'text-align:right; margin-bottom:8px;';
    userMsg.innerHTML = '<span style="background:#1E3A8A; color:#fff; padding:8px 12px; border-radius:8px; font-size:13px; display:inline-block;">' + input.value + '</span>';
    body.appendChild(userMsg);

    var userText = input.value.toLowerCase();
    input.value = '';

    // Auto-reply
    setTimeout(function () {
      var reply = 'Thank you for reaching out. Our team will assist you shortly.';
      if (userText.includes('track') || userText.includes('status')) {
        reply = 'You can track your application status from the "Track Application" page in the navbar.';
      } else if (userText.includes('download') || userText.includes('license')) {
        reply = 'Once your license is approved, visit the "Download License" page to get your PDF.';
      } else if (userText.includes('payment') || userText.includes('pay')) {
        reply = 'For payment issues, please visit the Payments page or call 1800-123-4567.';
      }

      var botMsg = document.createElement('div');
      botMsg.innerHTML = '<div class="chat-bubble">' + reply + '</div>';
      body.appendChild(botMsg);
      body.scrollTop = body.scrollHeight;
    }, 700);
  };

  // ─── Pre-fill name and app ID from session ────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    var user = {};
    try { user = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch(e) {}

    // Try to fill name field (first text input in the form)
    var inputs = document.querySelectorAll('.form-card input[type="text"]');
    if (inputs[0] && user.name) inputs[0].value = user.name;

    // Try to fill app ID field
    var appRef = sessionStorage.getItem('applicationRef') || '';
    if (inputs[1] && appRef) inputs[1].value = appRef;
  });

})();
