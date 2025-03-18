import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/contact.css";

function Contact() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [formStatus, setFormStatus] = useState({
    isSubmitting: false,
    isSuccess: false,
    isError: false,
    message: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus({
      isSubmitting: true,
      isSuccess: false,
      isError: false,
      message: ''
    });
    
    // Simulate form submission
    setTimeout(() => {
      setFormStatus({
        isSubmitting: false,
        isSuccess: true,
        isError: false,
        message: 'Thank you! Your message has been sent. We will contact you shortly.'
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 1500);
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <nav className="nav-container">
          <div className="nav-wrapper">
            <div className="logo-container">
              <Link to="/" className="logo">PestAway</Link>
              <div className="desktop-menu">
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/services" className="nav-link">Services</Link>
                <Link to="/about" className="nav-link">About</Link>
                <Link to="/contact" className="nav-link active">Contact</Link>
              </div>
            </div>
            <div className="auth-buttons">
              {isAuthenticated ? (
                <button
                  className="btn primary-btn"
                  onClick={() => navigate("/dashboard")}
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <Link to="/login" className="btn text-btn">Sign in</Link>
                  <Link to="/register" className="btn primary-btn">Sign up</Link>
                </>
              )}
            </div>
            <div className="mobile-menu-button">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <span className="sr-only">Open menu</span>
                {mobileMenuOpen ? (
                  <span className="icon">✕</span>
                ) : (
                  <span className="icon">☰</span>
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
            <Link to="/" className="mobile-nav-link">Home</Link>
            <Link to="/services" className="mobile-nav-link">Services</Link>
            <Link to="/about" className="mobile-nav-link">About</Link>
            <Link to="/contact" className="mobile-nav-link active">Contact</Link>
          </div>
        </nav>
      </header>

      {/* Hero section */}
      <div className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Get in Touch</h1>
          <p className="hero-subtitle">
            We're here to answer your questions and help you with all your pest control needs.
          </p>
        </div>
      </div>

      {/* Contact section */}
      <div className="contact-section">
        <div className="section-wrapper">
          <div className="section-header">
            <h2 className="section-title">Contact Us</h2>
            <p className="section-description">
              Whether you have a question about our services, pricing, or need a consultation,
              our team is ready to answer all your questions.
            </p>
          </div>
          <div className="contact-form-container">
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group full-width">
                <label htmlFor="name" className="form-label">Name</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone" className="form-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="subject" className="form-label">Subject</label>
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="message" className="form-label">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="form-textarea"
                />
              </div>
              <div className="form-group full-width">
                {formStatus.isSuccess && (
                  <div className="alert success">
                    <div className="alert-content">
                      <span className="alert-icon">✓</span>
                      <p className="alert-message">{formStatus.message}</p>
                    </div>
                  </div>
                )}
                
                {formStatus.isError && (
                  <div className="alert error">
                    <div className="alert-content">
                      <span className="alert-icon">✕</span>
                      <p className="alert-message">{formStatus.message}</p>
                    </div>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={formStatus.isSubmitting}
                  className="submit-button"
                >
                  {formStatus.isSubmitting ? "Sending..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Contact information */}
      <div className="info-section">
        <div className="section-wrapper">
          <div className="section-header">
            <h2 className="info-subtitle">Contact Information</h2>
            <p className="info-title">Reach Out to Us</p>
            <p className="info-description">
              Feel free to contact us through any of the following channels
            </p>
          </div>

          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">
                <span>📞</span>
              </div>
              <h3 className="info-card-title">Phone</h3>
              <div className="info-card-content">
                <p>Main Office: (555) 123-4567</p>
                <p>Customer Support: (555) 765-4321</p>
                <p>Emergency Line: (555) 911-PEST</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <span>✉️</span>
              </div>
              <h3 className="info-card-title">Email</h3>
              <div className="info-card-content">
                <p>General Inquiries: info@pestaway.com</p>
                <p>Customer Support: support@pestaway.com</p>
                <p>Careers: careers@pestaway.com</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <span>📍</span>
              </div>
              <h3 className="info-card-title">Location</h3>
              <div className="info-card-content">
                <p>123 Pest Control Avenue</p>
                <p>Suite 456</p>
                <p>Sydney, NSW 2000</p>
                <p>Australia</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <span>🕒</span>
              </div>
              <h3 className="info-card-title">Hours</h3>
              <div className="info-card-content">
                <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                <p>Saturday: 9:00 AM - 4:00 PM</p>
                <p>Sunday: Closed</p>
                <p>Emergency Services: 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="map-section">
        <div className="map-container">
          <div className="map-placeholder">
            <span>Map Location</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-links-group">
              <div className="footer-column">
                <h3 className="footer-heading">Services</h3>
                <ul className="footer-links">
                  <li><a href="#" className="footer-link">Residential</a></li>
                  <li><a href="#" className="footer-link">Commercial</a></li>
                  <li><a href="#" className="footer-link">Termite Control</a></li>
                  <li><a href="#" className="footer-link">Eco-Friendly Options</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h3 className="footer-heading">Support</h3>
                <ul className="footer-links">
                  <li><a href="#" className="footer-link">Pricing</a></li>
                  <li><a href="#" className="footer-link">Documentation</a></li>
                  <li><a href="#" className="footer-link">Guides</a></li>
                  <li><a href="#" className="footer-link">FAQ</a></li>
                </ul>
              </div>
            </div>
            <div className="footer-links-group">
              <div className="footer-column">
                <h3 className="footer-heading">Company</h3>
                <ul className="footer-links">
                  <li><a href="#" className="footer-link">About</a></li>
                  <li><a href="#" className="footer-link">Blog</a></li>
                  <li><a href="#" className="footer-link">Jobs</a></li>
                  <li><a href="#" className="footer-link">Press</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h3 className="footer-heading">Legal</h3>
                <ul className="footer-links">
                  <li><a href="#" className="footer-link">Privacy</a></li>
                  <li><a href="#" className="footer-link">Terms</a></li>
                </ul>
              </div>
            </div>
            <div className="newsletter-container">
              <h3 className="footer-heading">Subscribe to our newsletter</h3>
              <p className="newsletter-text">
                The latest news, articles, and resources, sent to your inbox weekly.
              </p>
              <form className="newsletter-form">
                <input
                  type="email"
                  name="email-address"
                  id="email-address"
                  autoComplete="email"
                  required
                  className="newsletter-input"
                  placeholder="Enter your email"
                />
                <button type="submit" className="newsletter-button">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="social-links">
              <a href="#" className="social-link">
                <span className="sr-only">Facebook</span>
                <span className="social-icon">Facebook</span>
              </a>
              <a href="#" className="social-link">
                <span className="sr-only">Instagram</span>
                <span className="social-icon">Instagram</span>
              </a>
              <a href="#" className="social-link">
                <span className="sr-only">Twitter</span>
                <span className="social-icon">Twitter</span>
              </a>
            </div>
            <p className="copyright">
              &copy; 2025 PestAway, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Contact;