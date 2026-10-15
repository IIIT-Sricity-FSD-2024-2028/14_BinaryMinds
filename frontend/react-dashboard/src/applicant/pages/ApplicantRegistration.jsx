import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

    if (form.fullName.trim().length < 3 || form.fullName.trim().length > 120) {
      setMessage('Full Name must be between 3 and 120 characters.');
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
          full_name: form.fullName.trim(),
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
            <input type="text" name="fullName" placeholder="Full Name" autoComplete="name" minLength={3} maxLength={120} required value={form.fullName} onChange={updateField} />
          </div>

          <div className="form-group">
            <input type="email" name="email" placeholder="Email Address" autoComplete="email" maxLength={120} required value={form.email} onChange={updateField} />
          </div>

          <div className="form-group">
            <input type="tel" name="phone" placeholder="Phone Number (10 digits)" autoComplete="tel" pattern="[0-9]{10}" maxLength={10} required value={form.phone} onChange={updateField} />
          </div>

          <div className="form-group">
            <input type="password" name="password" placeholder="Password (Min. 6 chars)" autoComplete="new-password" minLength={6} maxLength={255} required value={form.password} onChange={updateField} />
          </div>

          <div className="form-group">
            <input type="password" name="confirmPassword" placeholder="Confirm Password" autoComplete="new-password" minLength={6} maxLength={255} required value={form.confirmPassword} onChange={updateField} />
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
            Already have an account? <Link to="/login">Login Here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
