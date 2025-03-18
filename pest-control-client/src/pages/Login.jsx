import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon } from "lucide-react";
import '../styles/login.css';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");

  const { login, verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state, or default to dashboard
  const redirectPath = location.state?.from || "/dashboard";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      const result = await login(email, password);
      
      if (result.success) {
        if (result.otp_required) {
          // Instead of showing in-page OTP form, navigate to dedicated OTP page
          navigate("/verify", {
            state: { 
              mode: "login",
              redirectPath: redirectPath 
            }
          });
        } else {
          navigate(redirectPath);
        }
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
  
  

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-header">
          <h2 className="login-title">
            {showOtp ? "Verify Your Account" : "Sign in to your account"}
          </h2>
          <p className="login-subtitle">
            {showOtp 
              ? "Enter the verification code sent to your email" 
              : "Manage your pest control services"}
          </p>
        </div>

        {error && (
          <div className="error-message">
            <div className="flex-shrink-0 mr-3">
              <svg 
                className="h-5 w-5 text-red-400" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <p>{error}</p>
          </div>
        )}
        
        {!showOtp ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <div className="form-input-wrapper">
                <MailIcon className="form-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="form-input-wrapper">
                <LockIcon className="form-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            <div className="form-remember">
              <div className="remember-checkbox">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <Link 
                to="/forgot-password" 
                className="forgot-password-link"
              >
                Forgot your password?
              </Link>
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
                ) : "Sign in"}
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
                onClick={handleResendOtp}
                disabled={loading}
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
                Back to sign in
              </button>
            </div>
          </form>
        )}

        <div className="divider">
          <div className="divider-line"></div>
          <span className="divider-text">Don't have an account?</span>
          <div className="divider-line"></div>
        </div>

        <Link
          to="/register"
          className="register-link"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default Login;