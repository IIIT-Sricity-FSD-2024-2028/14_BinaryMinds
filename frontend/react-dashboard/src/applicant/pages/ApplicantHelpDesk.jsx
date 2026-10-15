import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import '../styles/ApplicantHelpDesk.css';

const ticketStorageKey = 'helpdesk_tickets';
const faqItems = [
  ['How to track application status?', 'Visit the Track Application page from the navbar or dashboard to see status updates.'],
  ['How to download approved license?', 'Once your license is approved, visit the Download License page.'],
  ['What if payment fails?', 'Visit the Payments page and choose Retry Payment. Contact support if the issue continues.'],
];

function readSessionUser() {
  try { return JSON.parse(sessionStorage.getItem('loggedInUser') || '{}'); } catch { return {}; }
}

function readTickets() {
  try {
    const saved = JSON.parse(localStorage.getItem(ticketStorageKey) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}

function makeAutoReply(message) {
  const text = message.toLowerCase();
  if (text.includes('track') || text.includes('status')) return 'You can track your application status from the Track Application page.';
  if (text.includes('download') || text.includes('license')) return 'Once your license is approved, visit the Download License page.';
  if (text.includes('payment') || text.includes('pay')) return 'For payment issues, visit Payments or contact your municipal corporation through its official website.';
  return 'Thank you for your message. This is an automated demo reply; no support request was sent.';
}

export default function ApplicantHelpDesk() {
  const navigate = useNavigate();
  const user = readSessionUser();
  const [tickets, setTickets] = useState(readTickets);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [name, setName] = useState(user.name || user.full_name || '');
  const [applicationId, setApplicationId] = useState(sessionStorage.getItem('applicationRef') || '');
  const [issue, setIssue] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [formNotice, setFormNotice] = useState('');
  const [faqOpen, setFaqOpen] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([{ from: 'assistant', text: 'Hi, how can we help you today? This is an automated demo assistant.' }]);

  function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setFormNotice('');
    if (!name.trim()) { setFormError('Please enter your full name.'); return; }
    if (!issue) { setFormError('Please select an issue type.'); return; }
    if (!message.trim()) { setFormError('Please describe your issue.'); return; }

    const ticket = {
      id: `TK-${Math.floor(10000 + Math.random() * 90000)}`,
      name: name.trim(),
      appId: applicationId.trim(),
      issue,
      message: message.trim(),
      status: 'In Progress',
      createdAt: new Date().toLocaleString('en-IN'),
    };
    const updatedTickets = [ticket, ...tickets];
    setTickets(updatedTickets);
    localStorage.setItem(ticketStorageKey, JSON.stringify(updatedTickets));
    setIssue('');
    setMessage('');
    setShowAllTickets(true);
    setFormNotice(`Demo ticket ${ticket.id} was saved in this browser only. It was not sent to municipal staff.`);
  }

  function sendChat(event) {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages((current) => [...current, { from: 'user', text }, { from: 'assistant', text: makeAutoReply(text) }]);
    setChatInput('');
  }

  function logout(event) {
    event.preventDefault();
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  const shownTickets = showAllTickets ? tickets : tickets.slice(0, 3);

  return (
    <div className="applicant-helpdesk-page">
      <header className="helpdesk-header"><img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="India Logo" /><div className="helpdesk-brand">Government of India<span>TradeZo</span></div></header>
      <ApplicantNavigation onLogout={logout} />
      <section className="helpdesk-title"><h1>Help Desk</h1><p>Get support for application, payment, and license-related issues.</p></section>
      <main className="helpdesk-layout">
        <div className="helpdesk-left">
          <section className="helpdesk-form-card">
            <h2>Support Request Form</h2>
            <form onSubmit={handleSubmit}>
              <div className="helpdesk-form-row">
                <div className="helpdesk-form-group"><label htmlFor="hd-name">Full Name</label><input id="hd-name" type="text" placeholder="Enter your full name" value={name} onChange={(event) => setName(event.target.value)} /></div>
                <div className="helpdesk-form-group"><label htmlFor="hd-app-id">Application ID</label><input id="hd-app-id" type="text" placeholder="TL-2023-XXXX" value={applicationId} onChange={(event) => setApplicationId(event.target.value)} /></div>
              </div>
              <div className="helpdesk-form-group"><label htmlFor="hd-issue">Issue Type</label><select id="hd-issue" value={issue} onChange={(event) => setIssue(event.target.value)}><option value="">Select an issue type</option><option>Payment Issue</option><option>License Issue</option><option>Application Issue</option><option>Other</option></select></div>
              <div className="helpdesk-form-group"><label htmlFor="hd-message">Message</label><textarea id="hd-message" placeholder="Describe your issue in detail..." value={message} onChange={(event) => setMessage(event.target.value)} /></div>
              {formError && <p className="helpdesk-form-error" role="alert">{formError}</p>}
              {formNotice && <p className="helpdesk-form-notice" role="status">{formNotice}</p>}
              <p className="helpdesk-local-notice">Tickets are saved in this browser only and are not sent to municipal staff.</p>
              <button className="helpdesk-submit" type="submit">Submit Request ➤</button>
            </form>
          </section>

          <section className="helpdesk-tickets">
            <div className="helpdesk-tickets-head"><h2>Recent Support Tickets</h2><button type="button" onClick={() => setShowAllTickets((current) => !current)}>{showAllTickets ? 'Show Recent' : 'View All Tickets'}</button></div>
            <div className="helpdesk-table-wrap"><table><thead><tr><th>TICKET ID</th><th>ISSUE</th><th>STATUS</th><th>LAST UPDATE</th></tr></thead><tbody>
              {shownTickets.map((ticket, index) => <tr key={`${ticket.id || 'ticket'}-${index}`}><td>#{ticket.id}</td><td>{ticket.issue}</td><td><span className={`helpdesk-status ${String(ticket.status).toLowerCase().replace(/\s+/g, '-')}`}>{ticket.status}</span></td><td>{ticket.createdAt || '—'}</td></tr>)}
              {tickets.length === 0 && <tr><td colSpan="4" className="helpdesk-empty">No locally saved demo tickets.</td></tr>}
            </tbody></table></div>
          </section>
          <Link className="helpdesk-cancel" to="/dashboard">← Cancel</Link>
        </div>

        <aside className="helpdesk-right">
          <section className="helpdesk-contact"><h2>Contact Support</h2><p>Use the contact details published on your municipal corporation website.</p></section>
          <section className="helpdesk-faq"><h2>📋 Frequently Asked Questions</h2>{faqItems.map(([question, answer], index) => <div className="helpdesk-faq-item" key={question}><button type="button" aria-expanded={Boolean(faqOpen[index])} onClick={() => setFaqOpen((current) => ({ ...current, [index]: !current[index] }))}><span>{question}</span><span>{faqOpen[index] ? '↓' : '→'}</span></button>{faqOpen[index] && <p className="helpdesk-faq-answer">{answer}</p>}</div>)}</section>
          <section className={`helpdesk-chat ${chatOpen ? 'is-open' : ''}`}>
            {chatOpen && <><div className="helpdesk-chat-header"><span>Virtual Assistant (Demo)</span><button type="button" onClick={() => setChatOpen(false)} aria-label="Close chat">×</button></div><div className="helpdesk-chat-body" aria-live="polite">{chatMessages.map((entry, index) => <p key={`${entry.from}-${index}`} className={`helpdesk-chat-bubble ${entry.from}`}>{entry.text}</p>)}</div><form className="helpdesk-chat-input" onSubmit={sendChat}><input aria-label="Chat message" value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Type your question..." /><button type="submit" aria-label="Send message">➤</button></form><p className="helpdesk-chat-disclaimer">Automated demo replies only; this chat does not contact staff.</p></>}
          </section>
          <div className="helpdesk-chat-launch"><span>Chat Support <small>Automated demo</small></span><button type="button" className="helpdesk-chat-icon" onClick={() => setChatOpen(true)} aria-label="Open demo chat">💬</button></div>
        </aside>
      </main>
    </div>
  );
}
