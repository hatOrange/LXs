import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  Menu, 
  X, 
  Shield, 
  Bug, 
  Sprout, 
  Leaf, 
  ChevronRight 
} from "lucide-react";
import '../styles/home.css';

function Home() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const services = [
    {
      title: "Residential Pest Control",
      description: "Keep your home safe from unwanted pests with our residential services.",
      icon: <Shield className="service-icon" />,
    },
    {
      title: "Commercial Solutions",
      description: "Comprehensive pest management for businesses of all sizes.",
      icon: <Bug className="service-icon" />,
    },
    {
      title: "Termite Protection",
      description: "Specialized treatment to protect your property from termite damage.",
      icon: <Sprout className="service-icon" />,
    },
    {
      title: "Eco-Friendly Options",
      description: "Green solutions that are safe for your family and the environment.",
      icon: <Leaf className="service-icon" />,
    },
  ];

  return (
    <div className="home-container">
      {/* Header */}
      <header>
        <nav className="site-nav">
          <div className="nav-brand">
            <Link to="/" className="site-logo">PestAway</Link>
            <div className="nav-links">
              <Link to="/">Home</Link>
              <Link to="/services">Services</Link>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </div>
          
          <div className="auth-buttons">
            {isAuthenticated ? (
              <button 
                className="btn btn-primary"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button 
            type="button" 
            className="mobile-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open menu</span>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <Link to="/">Home</Link>
            <Link to="/services">Services</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span>Protect Your Home</span>
            <span>From Unwanted Pests</span>
          </h1>
          <p className="hero-subtitle">
            Professional pest control services that keep your home and business safe,
            using eco-friendly solutions and the latest techniques.
          </p>
          <div className="hero-actions">
            <Link to="/services" className="hero-cta-primary">
              Book a Service
            </Link>
            <Link to="/services" className="hero-cta-secondary">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section" id="learn-more">
        <div className="services-header">
          <h2>Our Services</h2>
          <p>Comprehensive Pest Management Solutions</p>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-icon-container">
                {service.icon}
              </div>
              <div className="service-content">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <a href="#" className="service-learn-more">
                  Learn more <ChevronRight />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="book-service">
        <h2 className="cta-title">Ready to get started?</h2>
        <p className="cta-subtitle">
          Our team of professionals is ready to help keep your home or business pest-free.
        </p>
        <Link 
          to={isAuthenticated ? "/dashboard" : "/register"} 
          className="cta-button"
        >
          {isAuthenticated ? "Book Now" : "Sign Up & Book"}
        </Link>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <div className="footer-section">
            <h3>Services</h3>
            <ul className="footer-links">
              <li><a href="/services">Residential</a></li>
              <li><a href="/services">Commercial</a></li>
              <li><a href="/services">Termite Control</a></li>
              <li><a href="/services">Rodent Control</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Support</h3>
            <ul className="footer-links">
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Guides</a></li>
              <li><a href="#">API Status</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Company</h3>
            <ul className="footer-links">
              <li><a href="#">About</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Jobs</a></li>
              <li><a href="#">Press</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Newsletter</h3>
            <p>The latest news, articles, and resources, sent to your inbox weekly.</p>
            <form className="newsletter-signup">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="newsletter-input" 
                required 
              />
              <button type="submit" className="newsletter-button">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="social-links">
            <a href="#" aria-label="Facebook">Facebook</a>
            <a href="#" aria-label="Instagram">Instagram</a>
            <a href="#" aria-label="Twitter">Twitter</a>
          </div>
          <p>&copy; 2025 PestAway, Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;