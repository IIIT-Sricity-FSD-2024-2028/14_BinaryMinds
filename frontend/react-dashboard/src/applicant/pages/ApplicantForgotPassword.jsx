import { useState } from 'react';
import { Link } from 'react-router-dom';
import ApplicantNavigation from '../components/ApplicantNavigation';
import '../styles/ApplicantForgotPassword.css';

export default function ApplicantForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setMessage('Password recovery is not enabled on this TradeZo server. No OTP was sent and your password has not been changed. Please contact your municipal administrator.');
  }

  return (
    <div className="applicant-forgot-password-page">
      <ApplicantNavigation />
      <main className="forgot-content">
        <section className="forgot-intro">
          <h1>Forgot Your Password?</h1>
          <p>Reset your password to continue accessing TradeZo trade license services.</p>
        </section>
        <section className="forgot-card" aria-labelledby="forgot-reset-title">
          <h2 id="forgot-reset-title">Reset Password</h2>
          <p className="forgot-help">Enter your registered email to view password recovery options.</p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="forgot-email">Email Address</label>
            <input id="forgot-email" name="email" type="email" autoComplete="email" maxLength="120" placeholder="Enter registered email" required value={email} onChange={(event) => { setEmail(event.target.value); setMessage(''); }} />
            <button type="submit">Check Recovery Options</button>
          </form>
          <p className="forgot-message" role="status" aria-live="polite">{message}</p>
          <Link className="forgot-back" to="/login">Back to Login</Link>
        </section>
      </main>
    </div>
  );
}
