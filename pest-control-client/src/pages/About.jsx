import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/about.css";

function About() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const teamMembers = [
    {
      name: "Sarah Johnson",
      role: "Founder & CEO",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      bio: "With over 15 years of experience in pest management, Sarah founded PestAway with a vision to provide eco-friendly pest control solutions."
    },
    {
      name: "Michael Chen",
      role: "Technical Director",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      bio: "Michael leads our technical operations, bringing innovative pest control methods and ensuring our services meet the highest industry standards."
    },
    {
      name: "Jessica Patel",
      role: "Customer Relations Manager",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      bio: "Jessica ensures our customers receive exceptional service, managing our support team and developing training programs for our field technicians."
    },
    {
      name: "David Wilson",
      role: "Environmental Compliance Officer",
      image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      bio: "David oversees our commitment to environmentally responsible practices, ensuring all our methods comply with regulations while minimizing ecological impact."
    }
  ];

  const stats = [
    { id: 1, name: 'Years in business', value: '15+' },
    { id: 2, name: 'Satisfied customers', value: '10,000+' },
    { id: 3, name: 'Service locations', value: '50+' },
    { id: 4, name: 'Professional technicians', value: '75+' },
  ];

  const values = [
    {
      name: 'Customer First',
      description: 'We prioritize our customers\' needs and satisfaction above all else, tailoring our services to meet their specific requirements.',
      icon: '👥'
    },
    {
      name: 'Excellence',
      description: 'We strive for excellence in every aspect of our work, from customer service to the effectiveness of our pest control solutions.',
      icon: '🏆'
    },
    {
      name: 'Environmental Responsibility',
      description: 'We are committed to using methods and products that are effective while minimizing environmental impact.',
      icon: '🌍'
    },
    {
      name: 'Reliability',
      description: 'Our customers can count on us to be prompt, professional, and thorough in all our services and communications.',
      icon: '⏱️'
    }
  ];

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
                <Link to="/about" className="nav-link active">About</Link>
                <Link to="/contact" className="nav-link">Contact</Link>
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
            <Link to="/about" className="mobile-nav-link active">About</Link>
            <Link to="/contact" className="mobile-nav-link">Contact</Link>
          </div>
        </nav>
      </header>

      {/* Hero section */}
      <div className="hero about-hero">
        <div className="hero-content">
          <h1 className="hero-title">About Us</h1>
          <p className="hero-subtitle">
            PestAway is dedicated to providing effective, environmentally responsible pest control solutions for homes and businesses since 2010.
          </p>
        </div>
      </div>

      {/* Our story section */}
      <div className="story-section">
        <div className="section-container">
          <div className="story-grid">
            <div className="story-content">
              <h2 className="section-title">Our Story</h2>
              <p className="section-intro">
                Founded in 2010, PestAway began with a mission to revolutionize the pest control industry by combining effective treatments with environmental responsibility.
              </p>
              <div className="story-paragraphs">
                <p>
                  What started as a small family business has grown into one of the region's most trusted pest control companies, serving thousands of residential and commercial clients annually.
                </p>
                <p>
                  Our founder, Sarah Johnson, recognized the need for pest control services that would effectively eliminate pests while using methods and products that minimized environmental impact and risk to families, pets, and local ecosystems.
                </p>
                <p>
                  Over the years, we've expanded our service area and range of solutions, but we've never lost sight of our original mission. We continue to invest in training, research, and the most innovative technologies to provide our customers with the best possible service.
                </p>
                <p>
                  Today, PestAway is proud to be a leader in the industry, known for our expertise, reliability, and commitment to environmentally responsible pest management solutions.
                </p>
              </div>
            </div>
            <div className="story-image-container">
              <img
                className="story-image"
                src="https://images.unsplash.com/photo-1528901166007-3784c7dd3653?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="PestAway team at work"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="stats-section">
        <div className="section-container">
          <div className="stats-header">
            <h2 className="stats-title">Trusted by thousands of customers across the region</h2>
            <p className="stats-subtitle">
              We pride ourselves on delivering exceptional service and results
            </p>
          </div>
          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.id} className="stat-card">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-name">{stat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values section */}
      <div className="values-section">
        <div className="section-container">
          <div className="values-header">
            <span className="values-subtitle">Our Values</span>
            <h2 className="values-title">What We Stand For</h2>
            <p className="values-description">
              These core principles guide everything we do
            </p>
          </div>

          <div className="values-grid">
            {values.map((value) => (
              <div key={value.name} className="value-card">
                <div className="value-icon">
                  <span>{value.icon}</span>
                </div>
                <h3 className="value-name">{value.name}</h3>
                <p className="value-description">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team section */}
      <div className="team-section">
        <div className="section-container">
          <div className="team-header">
            <span className="team-subtitle">Our Team</span>
            <h2 className="team-title">Meet the Experts Behind PestAway</h2>
            <p className="team-description">
              Our passionate team brings years of experience and dedication to every project
            </p>
          </div>
          <div className="team-grid">
            {teamMembers.map((member) => (
              <div key={member.name} className="team-member">
                <div className="member-image-container">
                  <img className="member-image" src={member.image} alt={member.name} />
                </div>
                <div className="member-info">
                  <h3 className="member-name">{member.name}</h3>
                  <p className="member-role">{member.role}</p>
                  <p className="member-bio">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">
            <span>Ready to get started?</span>
            <span>Book a service today.</span>
          </h2>
          <p className="cta-description">
            Our team of professionals is ready to help keep your home or business pest-free.
          </p>
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="cta-button"
          >
            {isAuthenticated ? "Book Now" : "Sign Up & Book"}
          </Link>
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

export default About;