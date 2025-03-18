import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/otp-verification.css";

// Add this utility function at the top of your file
const extractErrorMessage = (error) => {
  if (!error) return "An unknown error occurred";
  
  // If it's a string, return it directly
  if (typeof error === 'string') return error;
  
  // If it's an array (validation errors), extract the messages
  if (Array.isArray(error)) {
    return error.map(err => {
      if (typeof err === 'string') return err;
      return err.msg || err.message || JSON.stringify(err);
    }).join(', ');
  }
  
  // If it has msg or message property
  if (error.msg) return error.msg;
  if (error.message) return error.message;
  
  // Last resort: stringify the object
  try {
    return JSON.stringify(error);
  } catch (e) {
    return "Error processing error message";
  }
};

function OtpVerification() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [verificationMode, setVerificationMode] = useState("login"); // login, register, or reset
  const [email, setEmail] = useState("");
  
  const { verifyOTP, resendOTP, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the verification mode and redirect path from location state
  useEffect(() => {
    if (location.state) {
      if (location.state.mode) {
        setVerificationMode(location.state.mode);
      }
      if (location.state.email) {
        setEmail(location.state.email);
      }
      // Reset countdown when navigating to this page
      setCountdown(300);
    } else {
      // If no state, redirect to login
      navigate("/login");
    }
  }, [location, navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      setLoading(false);
      return;
    }

    try {
      let result;
      
      if (verificationMode === "reset") {
        // For password reset, we need to pass email
        if (!email) {
          setError("Email information is missing. Please go back and try again.");
          setLoading(false);
          return;
        }
        
        // Pass mode and email for reset verification
        result = await verifyOTP(otp, "reset", email);
      } else {
        // For login/register, use standard verification
        result = await verifyOTP(otp);
      }
      
      if (result.success) {
        setSuccess(result.message || "Verification successful!");
        
        // Handle redirection based on verification mode
        setTimeout(() => {
          if (verificationMode === "login") {
            navigate(location.state?.redirectPath || "/dashboard");
          } else if (verificationMode === "register") {
            navigate("/login", { state: { verified: true } });
          } else if (verificationMode === "reset") {
            // For reset, navigate to ForgotPassword to set new password
            navigate("/forgot-password", { 
              state: { 
                otpVerified: true,
                email: email
              } 
            });
          }
        }, 2000);
      } else {
        setError(extractErrorMessage(result.message));
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);

    try {
      let result;
      
      // For password reset, we need to request a new password reset OTP
      if (verificationMode === "reset" && email) {
        result = await forgotPassword(email);
      } else {
        // For login/register, use standard resend OTP
        result = await resendOTP();
      }
      
      if (result.success) {
        setSuccess("OTP resent successfully!");
        setCountdown(300); // Reset countdown to 5 minutes
      } else {
        setError(extractErrorMessage(result.message));
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-verification-container">
      <div className="otp-verification-wrapper">
        <div className="otp-verification-header">
          <h2 className="otp-verification-title">Verify Your Account</h2>
          <p className="otp-verification-subtitle">
            {verificationMode === "register" && "Complete your registration by verifying your email"}
            {verificationMode === "login" && "Verify your account to log in"}
            {verificationMode === "reset" && "Verify your account to reset password"}
          </p>
          {email && (
            <p className="otp-verification-email">Code sent to: {email}</p>
          )}
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
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength={6}
              className="form-input otp-input"
              placeholder="123456"
            />
            <p className="form-hint text-center">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <div className="countdown-timer">
            <p>Code expires in: <span className="countdown-time">{formatTime(countdown)}</span></p>
          </div>

          <div className="form-group">
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className={`submit-button ${(loading || otp.length !== 6) ? "disabled" : ""}`}
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
              disabled={loading || countdown > 270} // Prevent resend spam (only allow after 30 seconds)
              className={`resend-link ${(loading || countdown > 270) ? "disabled" : ""}`}
            >
              {countdown > 270 ? `Resend available in ${formatTime(countdown - 270)}` : "Didn't receive a code? Resend"}
            </button>
          </div>

          <div className="text-sm text-center mt-2">
            <button
              type="button"
              onClick={() => {
                if (verificationMode === "register") {
                  navigate("/register");
                } else if (verificationMode === "reset") {
                  navigate("/forgot-password");
                } else {
                  navigate("/login");
                }
              }}
              className="back-link"
            >
              Back to {verificationMode === "register" ? "sign up" : verificationMode === "reset" ? "password reset" : "sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OtpVerification;