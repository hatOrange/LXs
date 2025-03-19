import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/forgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Now we only have two steps: 1=Email entry, 2=New password
  const [step, setStep] = useState(1);

  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if returning from successful OTP verification
  useEffect(() => {
    if (location.state?.otpVerified) {
      setStep(2); // Move directly to password reset step
      
      // If email was passed back from OTP verification page, use it
      if (location.state.email) {
        setEmail(location.state.email);
      }
    }
  }, [location.state]);

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setSuccess("A verification code has been sent to your email.");
        
        // Short timeout to show the success message before redirecting
        setTimeout(() => {
          navigate("/verify", {
            state: { 
              mode: "reset",
              email: email // Pass email to maintain context
            }
          });
        }, 1500);
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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);

    try {
      // Note: OTP parameter is no longer needed here
      // The backend uses the passwordResetToken cookie set during OTP verification
      const result = await resetPassword(newPassword);
      
      if (result.success) {
        setSuccess("Your password has been reset successfully! You can now log in with your new password.");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(result.message);
        
        // If token verification failed or expired, go back to email step
        if (result.message.includes("token") || 
            result.message.includes("authentication") || 
            result.message.includes("expired")) {
          setStep(1);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepForm = () => {
    switch (step) {
      case 1: // Email submission step
        return (
          <form className="form-container" onSubmit={handleSubmitEmail}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <div className="input-container">
                <div className="input-icon">
                  <span className="icon">✉</span>
                </div>
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
              <p className="form-hint">
                We'll send a verification code to this email.
              </p>
            </div>

            <div className="form-group">
              <button
                type="submit"
                disabled={loading}
                className="primary-button"
              >
                {loading ? (
                  <div className="button-loading">
                    <div className="spinner"></div>
                    <span>Sending...</span>
                  </div>
                ) : "Send verification code"}
              </button>
            </div>
          </form>
        );
        
      case 2: // New password step (after OTP verification)
        return (
          <form className="form-container" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">
                New Password
              </label>
              <div className="input-container">
                <div className="input-icon">
                  <span className="icon">🔒</span>
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  minLength={8}
                />
                <div className="input-icon right">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="show-password-button"
                  >
                    {showPassword ? (
                      <span className="icon">👁‍🗨</span>
                    ) : (
                      <span className="icon">👁</span>
                    )}
                  </button>
                </div>
              </div>
              <p className="form-hint">
                At least 8 characters
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm New Password
              </label>
              <div className="input-container">
                <div className="input-icon">
                  <span className="icon">🔒</span>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="form-group">
              <button
                type="submit"
                disabled={loading}
                className="primary-button"
              >
                {loading ? (
                  <div className="button-loading">
                    <div className="spinner"></div>
                    <span>Resetting...</span>
                  </div>
                ) : "Reset Password"}
              </button>
            </div>

            <div className="start-over">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-button"
              >
                <span className="icon-left">⬅</span> Start over
              </button>
            </div>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="form-card-container">
        <h2 className="page-title">
          {step === 1 && "Reset your password"}
          {step === 2 && "Create new password"}
        </h2>
        <p className="page-subtitle">
          {step === 1 && "Enter your email to receive a verification code"}
          {step === 2 && "Choose a new secure password for your account"}
        </p>

        <div className="form-card">
          {error && (
            <div className="alert error">
              <div className="alert-content">
                <span className="alert-icon">❌</span>
                <p className="alert-message">{error}</p>
              </div>
            </div>
          )}
          
          {success && (
            <div className="alert success">
              <div className="alert-content">
                <span className="alert-icon">✅</span>
                <p className="alert-message">{success}</p>
              </div>
            </div>
          )}
          
          {renderStepForm()}

          <div className="divider">
            <span>Remember your password?</span>
          </div>

          <div className="login-link">
            <Link
              to="/login"
              className="secondary-button"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;