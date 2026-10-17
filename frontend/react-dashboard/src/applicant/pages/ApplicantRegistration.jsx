import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNavigation from '../../common-components/PublicNavigation';
import '../styles/ApplicantRegistration.css';

export default function ApplicantRegistration() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({ password: false, confirmPassword: false });

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }));
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSuccess(false);

    const normalizedFullName = form.fullName.trim().replace(/ +/g, ' ');
    if (!normalizedFullName) {
      setMessage('Full Name is required. Enter at least two name parts using English letters and spaces.');
      return;
    }
    if (
      normalizedFullName.length > 100 ||
      !/^[A-Za-z]+(?: [A-Za-z]+)+$/.test(normalizedFullName) ||
      normalizedFullName.replace(/ /g, '').length < 3
    ) {
      setMessage('Enter at least two name parts using English letters and spaces, with at least 3 letters and no more than 100 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || form.email.trim().length > 120) {
      setMessage('Enter a valid email address (maximum 120 characters).');
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setMessage('Phone Number must contain exactly 10 digits.');
      return;
    }
    if (form.password.length < 6 || form.password.length > 255) {
      setMessage('Password must be between 6 and 255 characters.');
      return;
    }
    if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
      setMessage('Password must include at least one letter, one number, and one special character.');
      return;
    }
    if (form.confirmPassword.length < 6 || form.confirmPassword.length > 255) {
      setMessage('Confirm Password must be between 6 and 255 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: normalizedFullName,
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });

      if (response.status !== 201) {
        const payload = await response.json().catch(() => ({}));
        const errorMessage = Array.isArray(payload.message)
          ? payload.message.join(' ')
          : payload.message;
        throw new Error(errorMessage || 'Registration failed. Please try again.');
      }

      setForm({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });
      setIsSuccess(true);
      setMessage('Account created. Redirecting to login...');
      window.setTimeout(() => navigate('/login'), 1000);
    } catch (error) {
      setMessage(error.message || 'Unable to register. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-page">
      <div className="top-header">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
          alt="Emblem"
          className="emblem"
          style={{ filter: 'none' }}
        />
        <div>
          <p className="gov-text">Government of India</p>
          <p className="brand-name">TradeZo</p>
        </div>
      </div>

      <PublicNavigation />

      <div className="main-content">
        <form className="register-card" id="registrationForm" noValidate onSubmit={handleSubmit}>
          <h3>Create an Account</h3>

          <div className="form-group">
            <input type="text" name="fullName" placeholder="Full Name" autoComplete="name" minLength={3} maxLength={100} required value={form.fullName} onChange={updateField} />
          </div>

          <div className="form-group">
            <input type="email" name="email" placeholder="Email Address" autoComplete="email" maxLength={120} required value={form.email} onChange={updateField} />
          </div>

          <div className="form-group">
            <input type="tel" name="phone" placeholder="Phone Number (10 digits)" autoComplete="tel" pattern="[0-9]{10}" maxLength={10} required value={form.phone} onChange={updateField} />
          </div>

          <div className="form-group">
            <div className="registration-page-password-field">
              <input type={visiblePasswords.password ? 'text' : 'password'} name="password" placeholder="Password (letter, number, special character)" autoComplete="new-password" minLength={6} maxLength={255} required value={form.password} onChange={updateField} aria-describedby="registration-password-help" />
              <PasswordVisibilityButton visible={visiblePasswords.password} onClick={() => togglePasswordVisibility('password')} label="password" />
            </div>
            <small id="registration-password-help">Use at least one letter, one number, and one special character.</small>
          </div>

          <div className="form-group">
            <div className="registration-page-password-field">
              <input type={visiblePasswords.confirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm Password" autoComplete="new-password" minLength={6} maxLength={255} required value={form.confirmPassword} onChange={updateField} />
              <PasswordVisibilityButton visible={visiblePasswords.confirmPassword} onClick={() => togglePasswordVisibility('confirmPassword')} label="confirm password" />
            </div>
          </div>

          <p
            id="registrationMessage"
            role="status"
            aria-live="polite"
            style={{ margin: '0 0 12px', color: isSuccess ? '#047857' : '#b91c1c', fontSize: '13px' }}
          >
            {message}
          </p>
          <button className="btn-register" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>

          <p className="login-text">
            Already have an account? <a href="/login">Login Here</a>
          </p>
        </form>
      </div>
    </div>
  );
}

function PasswordVisibilityButton({ visible, onClick, label }) {
  return (
    <button
      className="password-visibility-toggle"
      type="button"
      onClick={onClick}
      aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
      aria-pressed={visible}
      title={`${visible ? 'Hide' : 'Show'} ${label}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {visible ? (
          <>
            <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
            <path d="M9.9 5.2A10.9 10.9 0 0112 5c5 0 9 4.5 10 7-.4 1-1.4 2.4-2.8 3.7M6.2 6.2C3.9 7.7 2.4 10 2 12c1 2.5 5 7 10 7 1.3 0 2.5-.3 3.6-.8" />
          </>
        ) : (
          <>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </button>
  );
}
