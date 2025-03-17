import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  LogOut, 
  Menu, 
  X, 
  Calendar, 
  Plus, 
  User, 
  Clock, 
  Home, 
  Map, 
  Phone, 
  Mail, 
  AlertCircle,
  CheckCircle
} from "lucide-react";
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
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'canceled': 'bg-red-100 text-red-800',
      'cancellation_requested': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-indigo-700">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <span className="text-white text-xl font-bold">PestAway</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              <a
                href="#"
                className="bg-indigo-800 text-white group flex items-center px-2 py-2 text-base font-medium rounded-md"
              >
                <Home className="mr-4 h-6 w-6" aria-hidden="true" />
                Dashboard
              </a>
              <a
                href="#"
                className="text-white hover:bg-indigo-600 group flex items-center px-2 py-2 text-base font-medium rounded-md"
              >
                <Calendar className="mr-4 h-6 w-6" aria-hidden="true" />
                My Bookings
              </a>
              <a
                href="#"
                className="text-white hover:bg-indigo-600 group flex items-center px-2 py-2 text-base font-medium rounded-md"
              >
                <User className="mr-4 h-6 w-6" aria-hidden="true" />
                Profile
              </a>
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-indigo-800 p-4">
            <button
              className="flex-shrink-0 group block focus:outline-none"
              onClick={handleLogout}
            >
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-base font-medium text-white">Sign out</p>
                </div>
                <LogOut className="ml-2 h-5 w-5 text-indigo-300" aria-hidden="true" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-indigo-700">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <span className="text-white text-xl font-bold">PestAway</span>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                <a
                  href="#"
                  className="bg-indigo-800 text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <Home className="mr-3 h-6 w-6" aria-hidden="true" />
                  Dashboard
                </a>
                <a
                  href="#"
                  className="text-white hover:bg-indigo-600 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <Calendar className="mr-3 h-6 w-6" aria-hidden="true" />
                  My Bookings
                </a>
                <a
                  href="#"
                  className="text-white hover:bg-indigo-600 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                >
                  <User className="mr-3 h-6 w-6" aria-hidden="true" />
                  Profile
                </a>
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-indigo-800 p-4">
              <button
                className="flex-shrink-0 w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white hover:bg-indigo-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-6 w-6" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Main content */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          {/* Page header */}
          <div className="bg-white shadow">
            <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
              <div className="py-6 md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    Welcome back{user?.name ? `, ${user.name}` : ''}
                  </h2>
                </div>
                <div className="mt-4 flex-shrink-0 flex md:mt-0 md:ml-4">
                  <button
                    type="button"
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setShowBookingForm(true)}
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Book a Service
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Booking form */}
            {showBookingForm && (
              <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowBookingForm(false)}></div>

                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                  <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                      <button
                        type="button"
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => setShowBookingForm(false)}
                      >
                        <span className="sr-only">Close</span>
                        <X className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                    <div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                          Book a New Service
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Fill in the details below to book a pest control service.
                          </p>
                        </div>
                      </div>
                    </div>

                    {bookingFormError && (
                      <div className="mt-4 rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-800">{bookingFormError}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {bookingSuccess && (
                      <div className="mt-4 rounded-md bg-green-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">{bookingSuccess}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <form className="mt-4 space-y-4" onSubmit={handleCreateBooking}>
                      <div>
                        <label htmlFor="booking_type" className="block text-sm font-medium text-gray-700">
                          Service Type
                        </label>
                        <select
                          id="booking_type"
                          name="booking_type"
                          value={bookingForm.booking_type}
                          onChange={handleBookingChange}
                          required
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          {serviceTypes.map(type => (
                            <option key={type.id} value={type.id}>
                              {type.name} - {type.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="property_size" className="block text-sm font-medium text-gray-700">
                          Property Size
                        </label>
                        <select
                          id="property_size"
                          name="property_size"
                          value={bookingForm.property_size}
                          onChange={handleBookingChange}
                          required
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          {propertySizes.map(size => (
                            <option key={size.id} value={size.id}>
                              {size.name} - {size.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="booking_date" className="block text-sm font-medium text-gray-700">
                          Service Date and Time
                        </label>
                        <input
                          type="datetime-local"
                          name="booking_date"
                          id="booking_date"
                          value={bookingForm.booking_date}
                          onChange={handleBookingChange}
                          required
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                          Service Location
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="location"
                            id="location"
                            value={bookingForm.location}
                            onChange={handleBookingChange}
                            required
                            placeholder="Enter full address"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="location_phone" className="block text-sm font-medium text-gray-700">
                          Contact Phone at Location
                        </label>
                        <div className="mt-1">
                          <input
                            type="tel"
                            name="location_phone"
                            id="location_phone"
                            value={bookingForm.location_phone}
                            onChange={handleBookingChange}
                            required
                            placeholder="+61412345678 or 0412345678"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="location_email" className="block text-sm font-medium text-gray-700">
                          Contact Email at Location (Optional)
                        </label>
                        <div className="mt-1">
                          <input
                            type="email"
                            name="location_email"
                            id="location_email"
                            value={bookingForm.location_email}
                            onChange={handleBookingChange}
                            placeholder="contact@example.com"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                          type="submit"
                          disabled={formLoading}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                        >
                          {formLoading ? "Creating..." : "Create Booking"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowBookingForm(false)}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Cancellation modal */}
            {showCancelModal && (
              <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowCancelModal(false)}></div>

                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                  <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div>
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:mt-5">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                          Request Booking Cancellation
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Are you sure you want to request cancellation for this booking? Our team will review your request.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700">
                        Reason for cancellation (optional)
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="cancelReason"
                          name="cancelReason"
                          rows={3}
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                          placeholder="Please tell us why you're cancelling..."
                        />
                      </div>
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                        onClick={submitCancelRequest}
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? "Submitting..." : "Request Cancellation"}
                      </button>
                      <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        onClick={() => setShowCancelModal(false)}
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success/error alerts */}
            {bookingSuccess && !showBookingForm && (
              <div className="mb-4 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{bookingSuccess}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        type="button"
                        className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                        onClick={() => setBookingSuccess('')}
                      >
                        <span className="sr-only">Dismiss</span>
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        type="button"
                        className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                        onClick={() => setError(null)}
                      >
                        <span className="sr-only">Dismiss</span>
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bookings list */}
            <div className="bg-white shadow sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Your Bookings
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  View and manage your pest control service appointments
                </p>
              </div>
              
              {loading ? (
                <div className="py-12 flex justify-center">
                  <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : bookings.length === 0 ? (
                <div className="px-4 py-5 sm:p-6 text-center">
                  <p className="text-sm text-gray-500">
                    You don't have any bookings yet. Book your first service now!
                  </p>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setShowBookingForm(true)}
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Book a Service
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <li key={booking.booking_id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {booking.booking_type.charAt(0).toUpperCase() + booking.booking_type.slice(1)} - {booking.property_size.charAt(0).toUpperCase() + booking.property_size.slice(1)} Property
                          </p>
                          <p className="sm:ml-2 flex-shrink-0 flex">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status.replace('_', ' ').charAt(0).toUpperCase() + booking.status.replace('_', ' ').slice(1)}
                            </span>
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          {(booking.status === 'pending' || booking.status === 'confirmed') && !booking.has_pending_cancellation && (
                            <button
                              onClick={() => handleCancelRequest(booking)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Request Cancellation
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                              {formatDate(booking.booking_date)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <Map className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                              {booking.location}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                          <p className="flex items-center text-sm text-gray-500">
                            <Phone className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                            {booking.location_phone}
                          </p>
                          {booking.location_email && (
                            <p className="flex items-center text-sm text-gray-500">
                              <Mail className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                              {booking.location_email}
                            </p>
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