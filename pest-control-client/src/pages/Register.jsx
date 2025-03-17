import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { EyeIcon, EyeOffIcon, UserIcon, MailIcon, PhoneIcon, LockIcon } from "lucide-react";
import '../styles/register.css';

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");

  const { register, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validatePhone = (phone) => {
    // Australian phone number validation (basic)
    const regex = /^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;
    return regex.test(phone);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Form validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (!validatePhone(formData.phone)) {
      setError("Please enter a valid Australian phone number");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      
      if (result.success) {
        setSuccess(result.message || "Registration successful! Please verify your email.");
        setShowOtp(true);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await verifyOTP(otp);
      
      if (result.success) {
        setSuccess("Account verified successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred during verification. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-header">
          <h2 className="register-title">
            {showOtp ? "Verify Your Email" : "Create a new account"}
          </h2>
          <p className="register-subtitle">
            {showOtp 
              ? "Enter the verification code sent to your email" 
              : "Join us to manage your pest control services"
            }
          </p>
        </div>

        {error && (
          <div className="error-message">
            <div className="flex-shrink-0 mr-3">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <div className="flex-shrink-0 mr-3">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p>{success}</p>
          </div>
        )}

        {!showOtp ? (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <div className="form-input-wrapper">
                <UserIcon className="form-icon" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email address</label>
              <div className="form-input-wrapper">
                <MailIcon className="form-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number (Australian)</label>
              <div className="form-input-wrapper">
                <PhoneIcon className="form-icon" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+61412345678 or 0412345678"
                />
              </div>
              <p className="form-hint">
                Format: +61412345678, 0412345678, or 61412345678
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="form-input-wrapper">
                <LockIcon className="formicon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input form-input-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="form-hint">
                At least 8 characters
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="form-input-wrapper">
                <LockIcon className="form-icon" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="form-group">
              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? (
                  <svg 
                    className="loading-spinner animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : "Create Account"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label htmlFor="otp" className="form-label">
                Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="form-input otp-input"
                placeholder="123456"
              />
              <p className="form-hint text-center">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <div className="form-group">
              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? (
                  <svg 
                    className="loading-spinner animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : "Verify"}
              </button>
            </div>

            <div className="text-sm text-center mt-4">
              <button
                type="button"
                onClick={() => {/* Add resend OTP function here */}}
                className="resend-link"
              >
                Didn't receive a code? Resend
              </button>
            </div>

            <div className="text-sm text-center mt-2">
              <button
                type="button"
                onClick={() => setShowOtp(false)}
                className="back-link"
              >
                Back to sign up
              </button>
            </div>
          </form>
        )}

        <div className="divider">
          <div className="divider-line"></div>
          <span className="divider-text">Already have an account?</span>
          <div className="divider-line"></div>
        </div>

        <div className="mt-6">
          <Link
            to="/login"
            className="login-link"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;