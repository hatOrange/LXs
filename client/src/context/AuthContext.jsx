import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify token on app load
  useEffect(() => {
    const verifyToken = async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/auth/verifyToken", {}, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setUser({
            id: response.data.id,
            email: response.data.email
          });
        }
      } catch (error) {
        console.error("Token verification failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/auth/login", {
        email,
        password
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        // If OTP verification is required
        if (response.data.otp_required) {
          return {
            success: true,
            otp_required: true,
            message: response.data.msg
          };
        }

        // If login successful
        setUser({
          id: response.data.id,
          email: email
        });

        return {
          success: true,
          message: "Login successful!"
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.msg || "Login failed. Please try again."
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post("/api/auth/register", userData, {
        withCredentials: true
      });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.msg
        };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: error.response?.data?.msg || "Registration failed. Please try again."
      };
    }
  };

  // Verify OTP function
  const verifyOTP = async (otp) => {
    try {
      const response = await axios.post("/api/auth/verify", {
        otp
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        // Fetch user details
        const userResponse = await axios.post("/api/auth/verifyToken", {}, {
          withCredentials: true
        });
        
        if (userResponse.data.success) {
          setUser({
            id: userResponse.data.id,
            email: userResponse.data.email
          });
        }

        return {
          success: true,
          message: "Verification successful!"
        };
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      return {
        success: false,
        message: error.response?.data?.msg || "Verification failed. Please try again."
      };
    }
  };

  // Resend OTP function
  const resendOTP = async (email) => {
    try {
      const response = await axios.post("/api/auth/otp/resend", {}, {
        withCredentials: true
      });

      return {
        success: response.data.success,
        message: response.data.msg
      };
    } catch (error) {
      console.error("Resend OTP error:", error);
      return {
        success: false,
        message: error.response?.data?.msg || "Failed to resend OTP. Please try again."
      };
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      const response = await axios.post("/api/auth/forgot-password", { 
        email 
      });

      return {
        success: response.data.success,
        message: response.data.msg
      };
    } catch (error) {
      console.error("Forgot password error:", error);
      return {
        success: false,
        message: error.response?.data?.msg || "Failed to process request. Please try again."
      };
    }
  };

  // Reset password function
  const resetPassword = async (otp, newPassword) => {
    try {
      // First verify OTP
      const verifyResponse = await axios.post("/api/auth/verify-reset", { 
        otp 
      }, {
        withCredentials: true
      });

      if (!verifyResponse.data.success) {
        return {
          success: false,
          message: verifyResponse.data.msg
        };
      }

      // Then reset password
      const resetResponse = await axios.post("/api/auth/reset-password", { 
        password: newPassword 
      }, {
        withCredentials: true
      });

      return {
        success: resetResponse.data.success,
        message: resetResponse.data.msg
      };
    } catch (error) {
      console.error("Reset password error:", error);
      return {
        success: false,
        message: error.response?.data?.msg || "Failed to reset password. Please try again."
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, {
        withCredentials: true
      });
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};