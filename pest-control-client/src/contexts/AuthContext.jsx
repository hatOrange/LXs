import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

// Error message extraction utility
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

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setLoading(true);
        const response = await api.post("/auth/verifyToken");
        
        if (response.data.success) {
          setUser({
            id: response.data.id,
            email: response.data.email
          });
        }
      } catch (error) {
        console.error("Token verification failed");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      if (response.data.success) {
        if (response.data.otp_required) {
          return {
            success: true,
            otp_required: true,
            message: response.data.msg
          };
        }

        setUser({
          id: response.data.id,
          email: email
        });

        return {
          success: true,
          message: "Login successful!"
        };
      }
      
      return {
        success: false,
        message: response.data.msg
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error.response?.data?.msg) || "Login failed"
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log(userData);
      const response = await api.post("/auth/register", userData);
      
      return {
        success: response.data.success,
        message: response.data.msg
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error.response?.data?.msg) || "Registration failed"
      };
    }
  };

  const verifyOTP = async (otp, mode = "standard", email = null) => {
    try {
      let response;
      
      // Validate inputs
      if (!otp) {
        return {
          success: false,
          message: "Verification code is required"
        };
      }
      
      if (mode === "reset") {
        // For password reset verification
        if (!email) {
          return {
            success: false,
            message: "Email is required for password reset verification"
          };
        }
        
        // For password reset, send both OTP and email
        response = await api.post("/auth/verify-reset", { otp, email });
      } else {
        // For regular login/registration verification
        response = await api.post("/auth/verify", { otp });
      }
      
      if (response.data.success) {
        // For standard login/registration verification, fetch user details
        if (mode === "standard") {
          try {
            const userResponse = await api.post("/auth/verifyToken");
            if (userResponse.data.success) {
              setUser({
                id: userResponse.data.id,
                email: userResponse.data.email
              });
            }
          } catch (error) {
            console.error("Error fetching user after OTP verification:", error);
          }
        }

        return {
          success: true,
          message: response.data.msg || "Verification successful"
        };
      }
      
      return {
        success: false,
        message: response.data.msg || "Verification failed"
      };
    } catch (error) {
      console.error("OTP verification error:", error);
      
      // Check for different error formats and log them for debugging
      if (error.response) {
        console.log("Error response data:", error.response.data);
        
        // Handle validation errors array
        if (Array.isArray(error.response.data.msg)) {
          return {
            success: false,
            message: extractErrorMessage(error.response.data.msg)
          };
        }
        
        return {
          success: false,
          message: extractErrorMessage(error.response.data.msg) || "Verification failed"
        };
      }
      
      return {
        success: false,
        message: extractErrorMessage(error.message) || "Verification failed. Please try again."
      };
    }
  };

  const resendOTP = async () => {
    try {
      const response = await api.post("/auth/otp/resend");
      
      return {
        success: response.data.success,
        message: response.data.msg
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error.response?.data?.msg) || "Failed to resend OTP"
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      
      return {
        success: response.data.success,
        message: response.data.msg
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error.response?.data?.msg) || "Password reset request failed"
      };
    }
  };

  const resetPassword = async (newPassword) => {
    try {
      // The backend uses the passwordResetToken cookie set during OTP verification
      const resetResponse = await api.post("/auth/reset-password", { newPassword });
      
      return {
        success: resetResponse.data.success,
        message: resetResponse.data.msg
      };
    } catch (error) {
      return {
        success: false,
        message: extractErrorMessage(error.response?.data?.msg) || "Password reset failed"
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      verifyOTP,
      resendOTP,
      forgotPassword,
      resetPassword,
      logout,
      isAuthenticated: !!user,
      extractErrorMessage // Make the utility function available
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};