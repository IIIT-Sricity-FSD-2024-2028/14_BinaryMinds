import { Link } from 'react-router-dom';
import '../../../../applicant_connected/connected/landing page/style.css';

export default function ApplicantLandingPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to Main Content
      </a>

      <header className="site-header">
        <div className="brand-row">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
            alt="Municipal Corporation emblem"
            className="emblem"
            style={{ filter: 'none' }}
          />
          <div>
            <p className="municipal-name">Municipal Corporation</p>
            <h1>TradeZo</h1>
            <p className="system-name">Trade License Management System</p>
          </div>
        </div>
        <nav className="main-nav" aria-label="Primary navigation">
          <Link to="/" aria-current="page">Home</Link>
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
          <Link to="/platform-admin/login">Super Admin</Link>
        </nav>
      </header>

      <main id="main-content">
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">Municipal Corporation</p>
            <h2>Online Trade License<br />Management System</h2>
            <p>Apply for a new trade license, track application status, renew licenses and download approved licenses online.</p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/apply-license">Apply for License</Link>
              <Link className="button button-secondary" to="/track-status">Track Application</Link>
            </div>
          </div>
          <div className="hero-landmark" aria-hidden="true"><div className="flag"></div><div className="dome"></div><div className="building"></div></div>
        </section>

        <section className="section services">
          <h2>Quick Services</h2>
          <p className="section-intro">Easily access the key services for your trade license needs.</p>
          <div className="card-grid">
            <Link className="service-card" to="/apply-license"><span className="icon">&#128196;</span><span><strong>Apply for New<br />Trade License</strong><small>Create your account and submit an application.</small></span></Link>
            <Link className="service-card" to="/track-status"><span className="icon">&#128269;</span><span><strong>Track Application<br />Status</strong><small>View the progress of your application.</small></span></Link>
            <Link className="service-card" to="/download-license"><span className="icon">&#8681;</span><span><strong>Download Approved<br />License</strong><small>Download your issued trade license.</small></span></Link>
            <Link className="service-card" to="/review-license"><span className="icon">&#10227;</span><span><strong>Renew Trade<br />License</strong><small>Renew your trade license digitally.</small></span></Link>
          </div>
        </section>

        <section className="section how-it-works">
          <h2>How It Works</h2>
          <p className="section-intro">Simple steps to obtain your trade license.</p>
          <div className="card-grid steps">
            <article><span>1</span><h3>Register Account</h3><p>Create your account on the portal.</p></article>
            <article><span>2</span><h3>Submit Application</h3><p>Fill in the details and submit your application.</p></article>
            <article><span>3</span><h3>Verification &amp; Inspection</h3><p>Documents are verified and inspections are conducted.</p></article>
            <article><span>4</span><h3>License Issued</h3><p>Receive your trade license digitally.</p></article>
          </div>
        </section>

        <section className="section notices">
          <h2><span aria-hidden="true">&#128276;</span> Important Notices</h2>
          <p className="section-intro">Latest information for TradeZo applicants.</p>
          <ul><li>Trade license renewal deadline extended to 30 June.</li><li>New guidelines for business registration issued.</li><li>Applicants must upload valid identity documents.</li></ul>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-grid">
          <section><h2>About the Portal</h2><a href="/">About TradeZo</a><p>Privacy Policy</p><p>Terms &amp; Conditions</p></section>
          <section><h2>Important Links</h2><Link to="/apply-license">Apply License</Link><Link to="/track-status">Track Application</Link><Link to="/download-license">Download License</Link></section>
          <section><h2>Contact Us</h2><p>Trade License Department</p><p>Municipal Corporation</p><p>+91 7422 588991</p></section>
          <section><h2>Platform Access</h2><Link to="/platform-admin/login">TradeZo Platform Admin</Link><p>Internal platform management</p></section>
        </div>
        <p className="copyright">&copy; 2026 TradeZo Trade License Management System. All Rights Reserved.</p>
      </footer>
    </>
  );
}
