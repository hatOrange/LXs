import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/dashboard.css";
import api from "../utils/api";

const serviceTypes = [
  { id: 'residential', name: 'Residential', description: 'Home pest control services' },
  { id: 'commercial', name: 'Commercial', description: 'Business pest control solutions' },
  { id: 'termite', name: 'Termite Control', description: 'Specialized termite treatment' },
  { id: 'rodent', name: 'Rodent Control', description: 'Mice and rat elimination' },
  { id: 'insect', name: 'Insect Control', description: 'General insect treatments' }
];

const propertySizes = [
  { id: 'small', name: 'Small', description: 'Up to 1,000 sq ft' },
  { id: 'medium', name: 'Medium', description: '1,000 - 2,500 sq ft' },
  { id: 'large', name: 'Large', description: '2,500 - 4,000 sq ft' },
  { id: 'commercial', name: 'Commercial', description: 'Commercial properties' }
];

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Booking form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    booking_type: 'residential',
    property_size: 'medium',
    booking_date: '',
    location: '',
    location_phone: '',
    location_email: ''
  });
  const [bookingFormError, setBookingFormError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Load bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/bookings');
      if (response.data.success) {
        setBookings(response.data.bookings);
      } else {
        setError("Failed to load bookings");
      }
    } catch (err) {
      setError("Error fetching bookings. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingForm({
      ...bookingForm,
      [name]: value
    });
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setBookingFormError('');
    setBookingSuccess('');
    setFormLoading(true);
    
    try {
      const response = await api.post('/bookings', bookingForm);
      
      if (response.data.success) {
        setBookingSuccess("Booking created successfully!");
        // Reset form and fetch updated bookings
        setBookingForm({
          booking_type: 'residential',
          property_size: 'medium',
          booking_date: '',
          location: '',
          location_phone: '',
          location_email: ''
        });
        setShowBookingForm(false);
        fetchBookings();
      } else {
        setBookingFormError(response.data.msg || "Failed to create booking");
      }
    } catch (err) {
      setBookingFormError(err.response?.data?.msg || "Error creating booking. Please try again.");
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelRequest = (booking) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
  };

  const submitCancelRequest = async () => {
    setCancelLoading(true);
    
    try {
      const response = await api.post(`/bookings/${bookingToCancel.booking_id}/cancel`, {
        reason: cancelReason
      });
      
      if (response.data.success) {
        setShowCancelModal(false);
        setBookingToCancel(null);
        setCancelReason('');
        setBookingSuccess("Cancellation request submitted successfully!");
        fetchBookings();
      } else {
        setBookingFormError(response.data.msg || "Failed to submit cancellation request");
      }
    } catch (err) {
      setBookingFormError(err.response?.data?.msg || "Error submitting cancellation request");
      console.error(err);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge color
  const getStatusClass = (status) => {
    const classes = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'completed': 'status-completed',
      'canceled': 'status-canceled',
      'cancellation_requested': 'status-cancellation-requested'
    };
    return classes[status] || 'status-default';
  };

  // Helper to format the status text
  const formatStatus = (status) => {
    return status.replace('_', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="dashboard-container">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}
      
      {/* Mobile sidebar */}
      <div className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-close-button">
          <button onClick={() => setSidebarOpen(false)}>
            <span className="icon">✕</span>
            <span className="sr-only">Close sidebar</span>
          </button>
        </div>
        
        <div className="sidebar-content">
          <div className="sidebar-logo">
            <span>PestAway</span>
          </div>
          <nav className="sidebar-nav">
            <a href="#" className="sidebar-nav-link active">
              <span className="sidebar-icon">🏠</span>
              Dashboard
            </a>
            <a href="#" className="sidebar-nav-link">
              <span className="sidebar-icon">📅</span>
              My Bookings
            </a>
            <a href="#" className="sidebar-nav-link">
              <span className="sidebar-icon">👤</span>
              Profile
            </a>
          </nav>
        </div>
        <div className="sidebar-footer">
          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <span className="sidebar-icon">🚪</span>
            Sign out
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="desktop-sidebar">
        <div className="sidebar-content">
          <div className="sidebar-logo">
            <span>PestAway</span>
          </div>
          <nav className="sidebar-nav">
            <a href="#" className="sidebar-nav-link active">
              <span className="sidebar-icon">🏠</span>
              Dashboard
            </a>
            <a href="#" className="sidebar-nav-link">
              <span className="sidebar-icon">📅</span>
              My Bookings
            </a>
            <a href="#" className="sidebar-nav-link">
              <span className="sidebar-icon">👤</span>
              Profile
            </a>
          </nav>
        </div>
        <div className="sidebar-footer">
          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <span className="sidebar-icon">🚪</span>
            Sign out
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="mobile-header">
          <button
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="icon">☰</span>
          </button>
        </div>

        {/* Main content */}
        <main className="dashboard-main">
          {/* Page header */}
          <div className="page-header">
            <div className="header-content">
              <div className="welcome-message">
                <h2>Welcome back{user?.name ? `, ${user.name}` : ''}</h2>
              </div>
              <div className="action-buttons">
                <button
                  className="book-button"
                  onClick={() => setShowBookingForm(true)}
                >
                  <span className="button-icon">+</span>
                  Book a Service
                </button>
              </div>
            </div>
          </div>

          <div className="page-content">
            {/* Booking form modal */}
            {showBookingForm && (
              <div className="modal-overlay">
                <div className="modal">
                  <div className="modal-close">
                    <button onClick={() => setShowBookingForm(false)}>
                      <span className="icon">✕</span>
                    </button>
                  </div>
                  <div className="modal-header">
                    <h3>Book a New Service</h3>
                    <p className="modal-description">
                      Fill in the details below to book a pest control service.
                    </p>
                  </div>

                  {bookingFormError && (
                    <div className="alert error">
                      <div className="alert-content">
                        <span className="alert-icon">⚠️</span>
                        <p className="alert-message">{bookingFormError}</p>
                      </div>
                    </div>
                  )}

                  {bookingSuccess && (
                    <div className="alert success">
                      <div className="alert-content">
                        <span className="alert-icon">✅</span>
                        <p className="alert-message">{bookingSuccess}</p>
                      </div>
                    </div>
                  )}

                  <form className="booking-form" onSubmit={handleCreateBooking}>
                    <div className="form-group">
                      <label htmlFor="booking_type">Service Type</label>
                      <select
                        id="booking_type"
                        name="booking_type"
                        value={bookingForm.booking_type}
                        onChange={handleBookingChange}
                        required
                      >
                        {serviceTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name} - {type.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="property_size">Property Size</label>
                      <select
                        id="property_size"
                        name="property_size"
                        value={bookingForm.property_size}
                        onChange={handleBookingChange}
                        required
                      >
                        {propertySizes.map(size => (
                          <option key={size.id} value={size.id}>
                            {size.name} - {size.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="booking_date">Service Date and Time</label>
                      <input
                        type="datetime-local"
                        name="booking_date"
                        id="booking_date"
                        value={bookingForm.booking_date}
                        onChange={handleBookingChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="location">Service Location</label>
                      <input
                        type="text"
                        name="location"
                        id="location"
                        value={bookingForm.location}
                        onChange={handleBookingChange}
                        required
                        placeholder="Enter full address"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="location_phone">Contact Phone at Location</label>
                      <input
                        type="tel"
                        name="location_phone"
                        id="location_phone"
                        value={bookingForm.location_phone}
                        onChange={handleBookingChange}
                        required
                        placeholder="+61412345678 or 0412345678"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="location_email">Contact Email at Location (Optional)</label>
                      <input
                        type="email"
                        name="location_email"
                        id="location_email"
                        value={bookingForm.location_email}
                        onChange={handleBookingChange}
                        placeholder="contact@example.com"
                      />
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() => setShowBookingForm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="submit-button"
                        disabled={formLoading}
                      >
                        {formLoading ? "Creating..." : "Create Booking"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Cancellation modal */}
            {showCancelModal && (
              <div className="modal-overlay">
                <div className="modal">
                  <div className="modal-header cancel-header">
                    <div className="cancel-icon">⚠️</div>
                    <h3>Request Booking Cancellation</h3>
                    <p className="modal-description">
                      Are you sure you want to request cancellation for this booking? Our team will review your request.
                    </p>
                  </div>

                  <div className="cancel-form">
                    <div className="form-group">
                      <label htmlFor="cancelReason">Reason for cancellation (optional)</label>
                      <textarea
                        id="cancelReason"
                        name="cancelReason"
                        rows="3"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Please tell us why you're cancelling..."
                      ></textarea>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() => setShowCancelModal(false)}
                      >
                        Go Back
                      </button>
                      <button
                        type="button"
                        className="cancel-request-button"
                        onClick={submitCancelRequest}
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? "Submitting..." : "Request Cancellation"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success/error alerts */}
            {bookingSuccess && !showBookingForm && (
              <div className="alert success dismissable">
                <div className="alert-content">
                  <span className="alert-icon">✅</span>
                  <p className="alert-message">{bookingSuccess}</p>
                </div>
                <button className="alert-dismiss" onClick={() => setBookingSuccess('')}>
                  <span className="icon">✕</span>
                </button>
              </div>
            )}

            {error && (
              <div className="alert error dismissable">
                <div className="alert-content">
                  <span className="alert-icon">⚠️</span>
                  <p className="alert-message">{error}</p>
                </div>
                <button className="alert-dismiss" onClick={() => setError(null)}>
                  <span className="icon">✕</span>
                </button>
              </div>
            )}

            {/* Bookings list */}
            <div className="bookings-container">
              <div className="bookings-header">
                <h3>Your Bookings</h3>
                <p>View and manage your pest control service appointments</p>
              </div>
              
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="empty-bookings">
                  <p>You don't have any bookings yet. Book your first service now!</p>
                  <button
                    className="book-button-small"
                    onClick={() => setShowBookingForm(true)}
                  >
                    <span className="button-icon">+</span>
                    Book a Service
                  </button>
                </div>
              ) : (
                <ul className="bookings-list">
                  {bookings.map((booking) => (
                    <li key={booking.booking_id} className="booking-item">
                      <div className="booking-header">
                        <div className="booking-title">
                          <p className="booking-type">
                            {booking.booking_type.charAt(0).toUpperCase() + booking.booking_type.slice(1)} - {booking.property_size.charAt(0).toUpperCase() + booking.property_size.slice(1)} Property
                          </p>
                          <span className={`booking-status ${getStatusClass(booking.status)}`}>
                            {formatStatus(booking.status)}
                          </span>
                        </div>
                        <div className="booking-actions">
                          {(booking.status === 'pending' || booking.status === 'confirmed') && !booking.has_pending_cancellation && (
                            <button
                              onClick={() => handleCancelRequest(booking)}
                              className="cancel-booking-button"
                            >
                              Request Cancellation
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="booking-details">
                        <div className="booking-detail">
                          <span className="detail-icon">📅</span>
                          <span className="detail-text">{formatDate(booking.booking_date)}</span>
                        </div>
                        <div className="booking-detail">
                          <span className="detail-icon">📍</span>
                          <span className="detail-text">{booking.location}</span>
                        </div>
                        <div className="booking-contact">
                          <div className="contact-detail">
                            <span className="detail-icon">📞</span>
                            <span className="detail-text">{booking.location_phone}</span>
                          </div>
                          {booking.location_email && (
                            <div className="contact-detail">
                              <span className="detail-icon">✉️</span>
                              <span className="detail-text">{booking.location_email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;