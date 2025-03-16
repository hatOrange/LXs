import jwt from "jsonwebtoken";
// import db from "../dbConnection.js";
import db from "./dbConnection.js"

// Admin verification middleware
export const verifyAdmin = async (req, res, next) => {
  try {
    const adminAuthToken = req.cookies.adminAuthToken;
    
    if (!adminAuthToken) {
      return res.status(401).json({ 
        success: false, 
        msg: "Authentication required" 
      });
    }

    // Verify token
    const decoded = jwt.verify(adminAuthToken, process.env.sec_key);
    
    // Check if it's an admin token
    if (decoded.type !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        msg: "Invalid admin authentication" 
      });
    }

    // Verify admin exists and is active
    const admin = await db.query(
      `SELECT is_active FROM admins WHERE id = $1`, 
      [decoded.id]
    );
    
    if (admin.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        msg: "Admin account not found" 
      });
    }
    
    if (!admin.rows[0].is_active) {
      return res.status(403).json({ 
        success: false, 
        msg: "Admin account is deactivated" 
      });
    }

    // Attach admin ID to request
    req.adminId = decoded.id;
    req.adminEmail = decoded.email;
    
    // Continue to next middleware or route handler
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        msg: "Invalid token" 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        msg: "Token expired" 
      });
    }
    
    console.error("Admin verification error:", error);
    return res.status(500).json({ 
      success: false, 
      msg: "Internal server error" 
    });
  }
};

// Password reset required middleware
export const checkPasswordReset = async (req, res, next) => {
  try {
    const adminId = req.adminId;
    
    // Check if password reset is required
    const result = await db.query(
      `SELECT password_reset_required FROM admins WHERE id = $1`,
      [adminId]
    );
    
    if (result.rows[0].password_reset_required) {
      return res.status(403).json({
        success: false,
        msg: "Password reset required before accessing this resource",
        passwordResetRequired: true
      });
    }
    
    next();
  } catch (error) {
    console.error("Password reset check error:", error);
    return res.status(500).json({ 
      success: false, 
      msg: "Internal server error" 
    });
  }
};