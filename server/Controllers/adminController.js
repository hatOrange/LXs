import db from '../dbConnection.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mailer from 'nodemailer';
import crypto from 'crypto';

// Configure email transporter
const transporter = mailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: process.env.production == true,
    auth: {
        user: process.env.sender_email,
        pass: process.env.sender_pass,
    },
});

// Admin login controller
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin by email
        const result = await db.query(`SELECT * FROM admins WHERE email = $1`, [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ 
                success: false, 
                msg: "Admin account not found" 
            });
        }

        const admin = result.rows[0];
        
        // Check if admin account is active
        if (!admin.is_active) {
            return res.status(403).json({ 
                success: false, 
                msg: "This admin account has been deactivated" 
            });
        }
        
        // Compare passwords
        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) {
            return res.status(400).json({ 
                success: false, 
                msg: "Invalid password" 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: admin.id, 
                email: admin.email,
                type: 'admin'
            }, 
            process.env.sec_key,
            { expiresIn: '12h' }
        );

        // Update last login timestamp
        await db.query(
            `UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
            [admin.id]
        );

        // Set auth cookie
        res.cookie('adminAuthToken', token, {
            httpOnly: true,
            secure: process.env.production == true,
            sameSite: 'Strict',
            maxAge: 12 * 60 * 60 * 1000 // 12 hours
        });

        return res.status(200).json({ 
            success: true,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                passwordResetRequired: admin.password_reset_required
            }
        });
    } catch (error) {
        console.error("Admin login error:", error);
        return res.status(500).json({ 
            success: false, 
            msg: "Internal server error" 
        });
    }
};

// Create new admin controller
export const createAdmin = async (req, res) => {
    try {
        const { name, email } = req.body;
        const creatorId = req.adminId; // From admin middleware

        // Check if email already exists
        const existingAdmin = await db.query(
            `SELECT id FROM admins WHERE email = $1`,
            [email]
        );

        if (existingAdmin.rows.length > 0) {
            return res.status(400).json({
                success: false,
                msg: "Email is already registered to an admin account"
            });
        }

        // Generate a secure random password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        // Create new admin account
        const result = await db.query(
            `INSERT INTO admins (
                name, email, password, created_by, password_reset_required, otp_verified
            ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, created_at`,
            [name, email, hashedPassword, creatorId, true, true]
        );

        const newAdmin = result.rows[0];

        // Get creator admin info for email
        const creatorResult = await db.query(
            `SELECT name, email FROM admins WHERE id = $1`,
            [creatorId]
        );
        
        const creator = creatorResult.rows[0];

        // Send email to new admin with credentials
        await transporter.sendMail({
            from: process.env.sender_email,
            to: email,
            subject: "Your Admin Account Has Been Created",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #2c3e50; text-align: center;">Welcome to the Admin Team!</h2>
                    
                    <p>Hello ${name},</p>
                    
                    <p>You have been added as an administrator by ${creator.name}.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; font-weight: bold;">Your login credentials:</p>
                        <p style="margin: 10px 0 0 0;"><strong>Email:</strong> ${email}</p>
                        <p style="margin: 5px 0 0 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
                    </div>
                    
                    <p style="color: #e74c3c; font-weight: bold;">Important: Please change your password immediately after your first login for security purposes.</p>
                    
                    <p>If you have any questions, please contact the administrator who created your account at ${creator.email}.</p>
                    
                    <p>Thank you!</p>
                    
                    <div style="font-size: 12px; color: #7f8c8d; margin-top: 30px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 10px;">
                        This is an automated message. Please do not reply directly to this email.
                    </div>
                </div>
            `
        });

        return res.status(201).json({
            success: true,
            msg: "Admin account created successfully and login credentials sent by email",
            admin: {
                id: newAdmin.id,
                name: newAdmin.name,
                email: newAdmin.email,
                created_at: newAdmin.created_at
            }
        });
    } catch (error) {
        console.error("Create admin error:", error);
        return res.status(500).json({
            success: false,
            msg: "Internal server error"
        });
    }
};

// Get all admins controller
export const getAllAdmins = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
                a.id, a.name, a.email, a.created_at, a.last_login, a.is_active, 
                c.name as created_by_name
            FROM 
                admins a
            LEFT JOIN 
                admins c ON a.created_by = c.id
            ORDER BY 
                a.created_at DESC`
        );

        return res.status(200).json({
            success: true,
            admins: result.rows
        });
    } catch (error) {
        console.error("Get all admins error:", error);
        return res.status(500).json({
            success: false,
            msg: "Internal server error"
        });
    }
};

// Admin profile controller
export const getAdminProfile = async (req, res) => {
    try {
        const adminId = req.adminId;

        const result = await db.query(
            `SELECT id, name, email, created_at, last_login, password_reset_required
            FROM admins WHERE id = $1`,
            [adminId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                msg: "Admin account not found"
            });
        }

        return res.status(200).json({
            success: true,
            admin: result.rows[0]
        });
    } catch (error) {
        console.error("Get admin profile error:", error);
        return res.status(500).json({
            success: false,
            msg: "Internal server error"
        });
    }
};

// Change password controller
export const changePassword = async (req, res) => {
    try {
        const adminId = req.adminId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                msg: "Current password and new password are required"
            });
        }

        // Check password length
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                msg: "New password must be at least 8 characters long"
            });
        }

        // Get admin current password
        const admin = await db.query(
            `SELECT password FROM admins WHERE id = $1`,
            [adminId]
        );

        if (admin.rows.length === 0) {
            return res.status(404).json({
                success: false,
                msg: "Admin account not found"
            });
        }

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, admin.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                msg: "Current password is incorrect"
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await db.query(
            `UPDATE admins 
            SET password = $1, password_reset_required = false 
            WHERE id = $2`,
            [hashedPassword, adminId]
        );

        return res.status(200).json({
            success: true,
            msg: "Password updated successfully"
        });
    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({
            success: false,
            msg: "Internal server error"
        });
    }
};

// Forgot password controller
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Verify admin exists
        const result = await db.query(
            `SELECT id, name FROM admins WHERE email = $1 AND is_active = true`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                msg: "No active admin account found with this email"
            });
        }

        const admin = result.rows[0];

        // Generate OTP
        const otp = crypto.randomInt(100000, 999999);
        
        // Store OTP in database with expiration (5 minutes)
        await db.query(
            `INSERT INTO otp (email, otp, otp_expires) 
            VALUES ($1, $2, NOW() + INTERVAL '5 minutes')
            ON CONFLICT (email) DO UPDATE 
            SET otp = $2, otp_expires = NOW() + INTERVAL '5 minutes'`,
            [email, otp]
        );

        // Create reset token
        const resetToken = jwt.sign(
            { 
                id: admin.id,
                email: email,
                type: 'admin_reset'
            },
            process.env.sec_key,
            { expiresIn: '10m' }
        );

        // Set cookie
        res.cookie('adminResetToken', resetToken, {
            httpOnly: true,
            secure: process.env.production == true,
            sameSite: 'Strict',
            maxAge: 10 * 60 * 1000 // 10 minutes
        });

        // Send OTP email
        await transporter.sendMail({
            from: process.env.sender_email,
            to: email,
            subject: "Admin Password Reset OTP",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #2c3e50; text-align: center;">Admin Password Reset</h2>
                    
                    <p>Hello ${admin.name},</p>
                    
                    <p>We received a request to reset your admin account password. Your verification code is:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                        ${otp}
                    </div>
                    
                    <p>This code will expire in 5 minutes.</p>
                    
                    <p>If you did not request this password reset, please ignore this email or contact support if you believe this is an error.</p>
                    
                    <div style="font-size: 12px; color: #7f8c8d; margin-top: 30px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 10px;">
                        This is an automated message. Please do not reply directly to this email.
                    </div>
                </div>
            `
        });

        return res.status(200).json({
            success: true,
            msg: "OTP sent to your email"
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({
            success: false,
            msg: "Internal server error"
        });
    }
};

// Verify OTP controller
export const verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const adminResetToken = req.cookies.adminResetToken;

        if (!adminResetToken) {
            return res.status(401).json({
                success: false,
                msg: "Reset token not found"
            });
        }

        // Verify token
        const decoded = jwt.verify(adminResetToken, process.env.sec_key);
        if (decoded.type !== 'admin_reset') {
            return res.status(401).json({
                success: false,
                msg: "Invalid reset token"
            });
        }

        const email = decoded.email;

        // Get stored OTP
        const result = await db.query(
            `SELECT otp FROM otp WHERE email = $1 AND otp_expires > NOW()`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                msg: "OTP expired or not found"
            });
        }

        // Verify OTP
        const storedOTP = result.rows[0].otp;
        if (Number(otp) !== storedOTP) {
            return res.status(400).json({
                success: false,
                msg: "Invalid OTP"
            });
        }

        // Delete used OTP
        await db.query(`DELETE FROM otp WHERE email = $1`, [email]);

        // Create password reset confirmation token
        const confirmationToken = jwt.sign(
            { 
                id: decoded.id,
                email: email,
                type: 'admin_reset_confirmed'
            },
            process.env.sec_key,
            { expiresIn: '10m' }
        );

        // Clear reset token
        res.clearCookie('adminResetToken', {
            httpOnly: true,
            secure: process.env.production == true,
            sameSite: 'Strict'
        });

        // Set confirmation token
        res.cookie('adminResetConfirmToken', confirmationToken, {
            httpOnly: true,
            secure: process.env.production == true,
            sameSite: 'Strict',
            maxAge: 10 * 60 * 1000 // 10 minutes
        });

        return res.status(200).json({
            success: true,
            msg: "OTP verified successfully"
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        return res.status(500).json({
            success: false,
            msg: "Internal server error"
        });
    }
};

// Reset password controller
export const resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const confirmToken = req.cookies.adminResetConfirmToken;

        if (!confirmToken) {
            return res.status(401).json({
                success: false,
                msg: "Verification token not found"
            });
        }

        // Verify token
        const decoded = jwt.verify(confirmToken, process.env.sec_key);
        if (decoded.type !== 'admin_reset_confirmed') {
            return res.status(401).json({
                success: false,
                msg: "Invalid verification token"
            });
        }

        // Check password length
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                msg: "Password must be at least 8 characters long"
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update admin password
        await db.query(
            `UPDATE admins 
            SET password = $1, password_reset_required = false 
            WHERE id = $2`,
            [hashedPassword, decoded.id]
        );

        // Clear confirmation token
        res.clearCookie('adminResetConfirmToken', {
            httpOnly: true,
            secure: process.env.production == true,
            sameSite: 'Strict'
        });

        return res.status(200).json({
            success: true,
            msg: "Password reset successfully"
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({
            success: false,
            msg: "Internal server error"
        });
    }
};

// Logout controller
export const logoutAdmin = async (req, res) => {
    try {
        res.clearCookie('adminAuthToken', {
            httpOnly: true,
            secure: process.env.production == true,
            sameSite: 'Strict'
        });

        return res.status(200).json({
            success: true,
            msg: "Logged out successfully"
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            msg: "Internal server error"
        });
    }
};

// Deactivate admin controller (only works on accounts created by the current admin)
export const deactivateAdmin = async (req, res) => {
    try {
        const { adminIdToDeactivate } = req.params;
        const currentAdminId = req.adminId;

        // Check if admin exists and was created by current admin
        const admin = await db.query(
            `SELECT created_by FROM admins WHERE id = $1`,
            [adminIdToDeactivate]
        );

        if (admin.rows.length === 0) {
            return res.status(404).json({
                success: false,
                msg: "Admin account not found"
            });
        }

        // Check if admin created by current admin
        if (admin.rows[0].created_by !== currentAdminId) {
            return res.status(403).json({
                success: false,
                msg: "You can only deactivate admin accounts you created"
            });
        }

        // Deactivate admin
        await db.query(
            `UPDATE admins SET is_active = false WHERE id = $1`,
            [adminIdToDeactivate]
        );

        return res.status(200).json({
            success: true,
            msg: "Admin account deactivated successfully"
        });
    } catch (error) {
        console.error("Deactivate admin error:", error);
        return res.status(500).json({
            success: false,
            msg: "Internal server error"
        });
    }
};

// Create initial developer admin (should be called only once during setup)
export const createInitialAdmin = async () => {
    try {
        // Check if any admin account exists
        const existingAdmins = await db.query(`SELECT COUNT(*) FROM admins`);
        
        if (parseInt(existingAdmins.rows[0].count) > 0) {
            console.log("Initial admin already exists. Skipping creation.");
            return;
        }

        // Get admin details from environment variables
        const name = process.env.INITIAL_ADMIN_NAME;
        const email = process.env.INITIAL_ADMIN_EMAIL;
        const password = process.env.INITIAL_ADMIN_PASSWORD;

        if (!name || !email || !password) {
            console.error("Initial admin credentials not found in environment variables.");
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin
        await db.query(
            `INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)`,
            [name, email, hashedPassword]
        );

        console.log(`Initial admin account created with email: ${email}`);
    } catch (error) {
        console.error("Failed to create initial admin:", error);
    }
};