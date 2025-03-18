import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  Menu, 
  X, 
  Shield, 
  Bug, 
  Sprout, 
  Leaf, 
  CheckCircle, 
  ArrowRight 
} from "lucide-react";
import '../styles/services.css';

function Services() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const services = [
    {
      id: "residential",
      title: "Residential Pest Control",
      description: "Comprehensive pest management solutions for your home, protecting your family and property from unwanted pests.",
      features: [
        "Thorough home inspection to identify entry points and infestation sources",
        "Customized treatment plans based on your specific situation",
        "Child and pet-friendly options available",
        "Preventative measures to avoid future infestations",
        "Regular follow-up services to ensure lasting results"
      ],
      icon: <Shield className="service-icon" />,
      image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "commercial",
      title: "Commercial Solutions",
      description: "Protect your business, reputation, and customers with our discreet and effective commercial pest control services.",
      features: [
        "Discreet treatments that won't disrupt your business operations",
        "Compliance with health and safety regulations",
        "Regular maintenance programs tailored to your industry",
        "Detailed documentation for audit purposes",
        "Emergency response for urgent situations"
      ],
      icon: <Bug className="service-icon" />,
      image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "termite",
      title: "Termite Protection",
      description: "Defend your property against destructive termites with our specialized prevention and treatment services.",
      features: [
        "Comprehensive termite inspection and detection",
        "Advanced termite baiting systems",
        "Chemical and non-chemical treatment options",
        "Structural damage assessment",
        "Long-term termite protection plans"
      ],
      icon: <Sprout className="service-icon" />,
      image: "https://images.unsplash.com/photo-1605152276897-4f618f831968?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "ecofriendly",
      title: "Eco-Friendly Options",
      description: "Environmentally responsible pest management solutions that are effective while minimizing ecological impact.",
      features: [
        "Organic and botanical treatment options",
        "Integrated Pest Management (IPM) approach",
        "Reduced chemical usage without compromising effectiveness",
        "Safe for households with children, pets, and those with sensitivities",
        "Sustainable practices that protect local ecosystems"
      ],
      icon: <Leaf className="service-icon" />,
      image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <div>
      {/* Header */}
      <header className="site-header">
        <nav className="main-nav" aria-label="Top">
          <div className="flex items-center">
            <Link to="/" className="site-logo">PestAway</Link>
            <div className="nav-links desktop">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/services" className="nav-link active">Services</Link>
              <Link to="/about" className="nav-link">About</Link>
              <Link to="/contact" className="nav-link">Contact</Link>
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
                <Link
                  to="/login"
                  className="btn btn-secondary"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                >
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
        
        {/* Mobile menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/services" className="nav-link active">Services</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </div>
      </header>

      {/* Hero section */}
      <div className="services-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Our Services</h1>
          <p className="hero-subtitle">
            Comprehensive pest management solutions for every situation.
          </p>
        </div>
      </div>

      {/* Services list section */}
      <div className="services-section">
        <div className="services-header">
          <h2>Solutions</h2>
          <p className="services-intro">
            Professional Pest Control Services
          </p>
          <p className="services-intro">
            Protect your home and business with our expert pest management solutions
          </p>
        </div>
        
        <div className="services-list">
          {services.map((service, index) => (
            <div 
              key={service.id} 
              className={`service-item ${
                index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              <div className="service-content">
                <div className="service-icon-container">
                  {service.icon}
                </div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                
                <div className="service-features">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="service-feature">
                      <CheckCircle className="feature-icon" />
                      <p>{feature}</p>
                    </div>
                  ))}
                </div>

                <Link
                  to={isAuthenticated ? "/dashboard" : "/register"}
                  className="service-cta"
                >
                  Book This Service
                  <ArrowRight className="service-cta-icon" />
                </Link>
              </div>

              <div className="service-image-container">
                <img
                  src={service.image}
                  alt={service.title}
                  className="service-image"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA section */}
      <div className="cta-section">
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
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-heading">Services</h3>
            <ul className="footer-links">
              <li><Link to="#" className="footer-link">Residential</Link></li>
              <li><Link to="#" className="footer-link">Commercial</Link></li>
              <li><Link to="#" className="footer-link">Termite Control</Link></li>
              <li><Link to="#" className="footer-link">Eco-Friendly Options</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-heading">Support</h3>
            <ul className="footer-links">
              <li><Link to="#" className="footer-link">Pricing</Link></li>
              <li><Link to="#" className="footer-link">Documentation</Link></li>
              <li><Link to="#" className="footer-link">Guides</Link></li>
              <li><Link to="#" className="footer-link">FAQ</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-heading">Company</h3>
            <ul className="footer-links">
              <li><Link to="#" className="footer-link">About</Link></li>
              <li><Link to="#" className="footer-link">Blog</Link></li>
              <li><Link to="#" className="footer-link">Jobs</Link></li>
              <li><Link to="#" className="footer-link">Press</Link></li>
            </ul>
          </div>

          <div className="newsletter-section">
            <h3 className="footer-heading">Subscribe to our newsletter</h3>
            <p className="text-base text-gray-300">
              The latest news, articles, and resources, sent to your inbox weekly.
            </p>
            <form className="newsletter-form">
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
            <Link to="#" className="social-link">Facebook</Link>
            <Link to="#" className="social-link">Instagram</Link>
            <Link to="#" className="social-link">Twitter</Link>
          </div>
          <p className="copyright">
            &copy; 2025 PestAway, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Services;