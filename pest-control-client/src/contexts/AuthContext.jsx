import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

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
        message: error.response?.data?.msg || "Login failed"
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      
      return {
        success: response.data.success,
        message: response.data.msg
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.msg || "Registration failed"
      };
    }
  };

  const verifyOTP = async (otp) => {
    try {
      const response = await api.post("/auth/verify", { otp });
      
      if (response.data.success) {
        // Fetch user details after verification
        try {
          const userResponse = await api.post("/auth/verifyToken");
          if (userResponse.data.success) {
            setUser({
              id: userResponse.data.id,
              email: userResponse.data.email
            });
          }
        } catch (error) {
          console.error("Error fetching user after OTP verification");
        }

        return {
          success: true,
          message: "Verification successful"
        };
      }
      
      return {
        success: false,
        message: response.data.msg
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.msg || "Verification failed"
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
        message: error.response?.data?.msg || "Failed to resend OTP"
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
        message: error.response?.data?.msg || "Password reset request failed"
      };
    }
  };

  const resetPassword = async (otp, newPassword) => {
    try {
      // First verify OTP
      const verifyResponse = await api.post("/auth/verify-reset", { otp });
      
      if (!verifyResponse.data.success) {
        return {
          success: false,
          message: verifyResponse.data.msg
        };
      }
      
      // Reset password
      const resetResponse = await api.post("/auth/reset-password", { newPassword });
      
      return {
        success: resetResponse.data.success,
        message: resetResponse.data.msg
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.msg || "Password reset failed"
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
      isAuthenticated: !!user
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