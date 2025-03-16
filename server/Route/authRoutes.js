import { getUser } from '../middleware.js';
import db from '../dbConnection.js';
import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mailer from 'nodemailer';
import crypto from 'crypto';
import rateLimit from "express-rate-limit";

// Rate limiter (max 5 OTP requests per 10 minutes per IP)
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: process.env.otp_limits || 5,
    message: { msg: "Too many OTP requests. Try again later.", success: false },
});

const router = express.Router();

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

// Australian phone number regex pattern
// Matches formats like: +61412345678, 0412345678, 61412345678
const australianPhoneRegex = /^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;

router.post('/register',
    [
        body('name', "Enter Valid Name").isLength({ min: 3 }),
        body('email', "Enter Valid Email").isEmail(),
        body('password', "Password must be at least 8 characters").isLength({ min: 8 }),
        body('phone').custom((value) => {
            if (!australianPhoneRegex.test(value)) {
                throw new Error('Enter a valid Australian phone number');
            }
            return true;
        }),
    ],
    async (req, res) => {
        let success = true;
        const errs = validationResult(req);

        if (!errs.isEmpty()) {
            success = false;
            return res.status(400).json({ msg: errs.array(), success: success });
        }

        try {
            // Format phone number consistently (strip spaces, hyphens)
            const formattedPhone = req.body.phone.replace(/[ -]/g, '');

            const userExistsResult = await db.query(
                'SELECT * FROM users WHERE email = $1 OR phone_number = $2', 
                [req.body.email, formattedPhone]
            );

            if (userExistsResult.rowCount > 0) {
                const existingUser = userExistsResult.rows[0];
                if (existingUser.email === req.body.email) {
                    return res.status(400).json({ msg: "Email already in use", success: false });
                } else {
                    return res.status(400).json({ msg: "Phone number already in use", success: false });
                }
            }

            // Generate password hash
            const salt = await bcrypt.genSalt(10);
            const securePass = await bcrypt.hash(req.body.password, salt);
            
            // Variable to store the new user
            let newUser = null;
            
            // First attempt - try with name column
            try {
                const insertQuery = `
                    INSERT INTO users(id, name, email, phone_number, password, otp_verified, created_at) 
                    VALUES(uuid_generate_v4(), $1, $2, $3, $4, false, CURRENT_TIMESTAMP) 
                    RETURNING id, email
                `;
                const queryResult = await db.query(insertQuery, [
                    req.body.name, 
                    req.body.email, 
                    formattedPhone, 
                    securePass
                ]);
                
                newUser = queryResult.rows[0];
            } catch (err) {
                // If the error is about the name column not existing
                if (err.code === '42703') {
                    console.log("Name column not found, trying without name");
                    const fallbackQuery = `
                        INSERT INTO users(id, email, phone_number, password, otp_verified, created_at) 
                        VALUES(uuid_generate_v4(), $1, $2, $3, false, CURRENT_TIMESTAMP) 
                        RETURNING id, email
                    `;
                    const fallbackResult = await db.query(fallbackQuery, [
                        req.body.email, 
                        formattedPhone, 
                        securePass
                    ]);
                    
                    newUser = fallbackResult.rows[0];
                } else {
                    // If it's a different error, log and rethrow
                    console.error("Error inserting user:", err);
                    throw err;
                }
            }
            
            // Make sure we have a valid newUser object
            if (!newUser) {
                throw new Error("Failed to create user");
            }
            
            // Generate temporary token for OTP verification
            const payload = {
                id: newUser.id,
                email: newUser.email,
                type: 'otp' // Token type
            };

            const token = jwt.sign(payload, process.env.sec_key, { expiresIn: '10m' });

            // Set token in cookie
            res.cookie('otpToken', token, {
                httpOnly: true,
                secure: process.env.production == true,
                sameSite: 'Strict',
                maxAge: 10 * 60 * 1000 // 10 minutes
            });

            // Send OTP automatically after registration
            // Generate OTP
            const otp = crypto.randomInt(100000, 999999);

            // Store OTP in database
            await db.query(
                `INSERT INTO otp (email, otp, otp_expires) VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
                [newUser.email, otp]
            );

            // Send OTP via email
            await transporter.sendMail({
                from: process.env.sender_email,
                to: newUser.email,
                subject: "Email Verification OTP",
                text: `Your verification code is ${otp}. This code is valid for 5 minutes.`,
            });

            return res.status(200).json({ 
                msg: "User registered successfully. Please verify your email with the OTP sent.", 
                success: true 
            });
        } catch (err) {
            console.error("Registration Error:", err);
            return res.status(500).json({ msg: "Internal Server Error", success: false });
        }
    });

router.post('/login', [
        body('email', "Enter a valid email").isEmail(),
        body("password", "Password must be at least 8 characters").isLength({ min: 8 })
    ], async (req, res) => {
        const errs = validationResult(req);
        if (!errs.isEmpty()) {
            return res.status(400).json({ msg: errs.array(), success: false });
        }
    
        try {
            const { email, password } = req.body;
    
            // Find user by email
            const result = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
    
            if (result.rows.length === 0) {
                return res.status(400).json({ msg: "User does not exist", success: false });
            }
    
            const user = result.rows[0];
            
            // Check if user is suspended
            if(user.suspended){
                return res.status(400).json({ msg: "User Is Suspended", success: false });
            }
            
            // Compare passwords
            const passComp = await bcrypt.compare(password, user.password);
            if (!passComp) {
                return res.status(400).json({ msg: "Invalid Password", success: false });
            }
    
            if (user.otp_verified) {
                // User is verified, generate authentication token
                const data = {
                    id: user.id,
                    email: user.email,
                    type: 'auth' // Token type
                };
    
                const token = jwt.sign(data, process.env.sec_key);
    
                res.cookie('authToken', token, {
                    httpOnly: true,
                    secure: process.env.production == true,
                    sameSite: 'Strict',
                    maxAge: 60 * 60 * 1000 // 1 hour
                });
    
                return res.status(200).json({ success: true, id: user.id });
            } else {
                // User is not verified, prompt for OTP verification
                // Generate OTP
                const otp = crypto.randomInt(100000, 999999);

                // Store OTP in database
                await db.query(
                    `INSERT INTO otp (email, otp, otp_expires) VALUES ($1, $2, NOW() + INTERVAL '5 minutes')
                    ON CONFLICT (email) DO UPDATE SET otp = $2, otp_expires = NOW() + INTERVAL '5 minutes'`,
                    [email, otp]
                );

                // Send OTP via email
                await transporter.sendMail({
                    from: process.env.sender_email,
                    to: email,
                    subject: "Email Verification OTP",
                    text: `Your verification code is ${otp}. This code is valid for 5 minutes.`,
                });

                // Generate OTP token
                const otpToken = jwt.sign({ 
                    id: user.id, 
                    email: user.email,
                    type: 'otp'
                }, process.env.sec_key, { expiresIn: "10m" });
    
                res.cookie('otpToken', otpToken, {
                    httpOnly: true,
                    secure: process.env.production == true,
                    sameSite: 'Strict',
                    maxAge: 10 * 60 * 1000 // 10 minutes
                });
    
                return res.status(200).json({ 
                    success: true, 
                    otp_required: true,
                    msg: "Email verification required. OTP has been sent to your email."
                });
            }
        } catch (error) {
            console.error("Login Error:", error);
            return res.status(500).json({ msg: "Internal Server Error", success: false });
        }
});
    
router.post("/otp/resend", otpLimiter, async (req, res) => {
    try {
        // Check for otpToken cookie
        const otpToken = req.cookies.otpToken;
        if (!otpToken) {
            return res.status(401).json({ 
                msg: "Authentication required", 
                success: false 
            });
        }

        // Verify token
        const data = jwt.verify(otpToken, process.env.sec_key);
        if (!data || data.type !== 'otp') {
            return res.status(403).json({ 
                msg: "Invalid token", 
                success: false 
            });
        }

        const email = data.email;
        
        // Generate new OTP
        const otp = crypto.randomInt(100000, 999999);

        // Remove any expired OTPs
        await db.query(`DELETE FROM otp WHERE email = $1 AND otp_expires < NOW()`, [email]);

        // Update or insert new OTP
        await db.query(
            `INSERT INTO otp (email, otp, otp_expires) 
             VALUES ($1, $2, NOW() + INTERVAL '5 minutes')
             ON CONFLICT (email) DO UPDATE 
             SET otp = $2, otp_expires = NOW() + INTERVAL '5 minutes'`,
            [email, otp]
        );
  
        // Send OTP via email
        await transporter.sendMail({
            from: process.env.sender_email,
            to: email,
            subject: "Email Verification OTP",
            text: `Your verification code is ${otp}. This code is valid for 5 minutes.`,
        });
  
        return res.status(200).json({ 
            msg: "OTP sent successfully", 
            success: true 
        });
  
    } catch (e) {
        console.error("OTP Resend Error:", e.message);
        return res.status(500).json({ 
            msg: "Internal server error", 
            success: false 
        });
    }
});

router.post("/verify", async (req, res) => {
    try {
        const { otp } = req.body;
        const otpToken = req.cookies.otpToken;

        if (!otp) {
            return res.status(400).json({ msg: "OTP is required", success: false });
        }

        if (!otpToken) {
            return res.status(401).json({ msg: "Authentication required", success: false });
        }

        // Verify token
        const data = jwt.verify(otpToken, process.env.sec_key);
        if (!data || data.type !== 'otp') {
            return res.status(403).json({ msg: "Invalid token", success: false });
        }

        const email = data.email;

        // Remove expired OTPs before checking
        await db.query(`DELETE FROM otp WHERE otp_expires < NOW()`);

        // Retrieve the stored OTP for the email
        const { rows } = await db.query(`SELECT otp FROM otp WHERE email = $1`, [email]);

        if (rows.length === 0) {
            return res.status(400).json({ msg: "Invalid or expired OTP", success: false });
        }

        const storedOtp = rows[0].otp;
        const isMatch = storedOtp == otp;
        
        // Compare the OTP
        if (!isMatch) {
            return res.status(401).json({ msg: "Incorrect OTP", success: false });
        }

        // Begin transaction for deleting OTP and updating user status
        await db.query("BEGIN");

        await db.query(`DELETE FROM otp WHERE email = $1`, [email]);
        await db.query(`UPDATE users SET otp_verified = true WHERE email = $1`, [email]);

        await db.query("COMMIT");

        // Clear OTP token
        res.clearCookie('otpToken', {
            httpOnly: true,
            secure: process.env.production == true,
            sameSite: 'Strict',
        });

        // Generate auth token
        const authData = {
            id: data.id,
            email: data.email,
            type: 'auth'
        };

        const authToken = jwt.sign(authData, process.env.sec_key);
    
        // Set authentication token
        res.cookie('authToken', authToken, {
            httpOnly: true,
            secure: process.env.production == true,
            sameSite: 'Strict',
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        return res.status(200).json({ 
            msg: "Verification successful", 
            success: true 
        });

    } catch (error) {
        await db.query("ROLLBACK");
        console.error("OTP Verification Error:", error.message);
        return res.status(500).json({ msg: "Internal Server Error", success: false });
    }
});

router.post('/verifyToken', getUser, (req, res) => {
    return res.status(200).json({ success: true, id: req.uid, email: req.email });
});

router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ msg: "Email is required", success: false });
        }

        // Check if the user exists
        const result = await db.query(`SELECT id FROM users WHERE email = $1`, [email]);
        if (result.rowCount === 0) {
            return res.status(400).json({ msg: "User does not exist", success: false });
        }

        // Generate a secure 6-digit OTP
        const otp = crypto.randomInt(100000, 999999);

        // Store OTP in the database with an expiration time (5 minutes)
        await db.query(
            `INSERT INTO otp (email, otp, otp_expires) 
             VALUES ($1, $2, NOW() + INTERVAL '5 minutes') 
             ON CONFLICT (email) DO UPDATE 
             SET otp = $2, otp_expires = NOW() + INTERVAL '5 minutes'`,
            [email, otp]
        );

        // Generate a one-time-use JWT for verification (reset Token)
        const resetToken = jwt.sign({ 
            email, 
            id: result.rows[0].id,
            type: 'reset' 
        }, process.env.sec_key, { expiresIn: "10m" });

        // Set cookie
        res.cookie('resetToken', resetToken, {
            httpOnly: true,
            secure: process.env.production == true,
            sameSite: 'Strict',
            maxAge: 10 * 60 * 1000 // 10 minutes
        });

        // Send OTP via email
        await transporter.sendMail({
            from: process.env.sender_email,
            to: email,
            subject: "Password Reset OTP",
            text: `Your OTP for password reset is ${otp}. It is valid for 5 minutes.`,
        });

        return res.status(200).json({
            msg: "OTP sent successfully",
            success: true,
        });

    } catch (error) {
        console.error("Forgot Password Error:", error.message);
        return res.status(500).json({ msg: "Internal Server Error", success: false });
    }
});

router.post('/verify-reset', async (req, res) => {
    try {
        const { otp } = req.body;
        const resetToken = req.cookies.resetToken;

        if (!otp) {
            return res.status(400).json({ msg: "OTP is required", success: false });
        }

        if (!resetToken) {
            return res.status(401).json({ msg: "Reset token required", success: false });
        }

        // Verify token
        const data = jwt.verify(resetToken, process.env.sec_key);
        if (!data || data.type !== 'reset') {
            return res.status(403).json({ msg: "Invalid token", success: false });
        }

        const email = data.email;

        // Retrieve the stored OTP for the email
        const { rows } = await db.query(`SELECT otp FROM otp WHERE email = $1 AND otp_expires > NOW()`, [email]);

        if (rows.length === 0) {
            return res.status(400).json({ msg: "Invalid or expired OTP", success: false });
        }

        const storedOtp = rows[0].otp;
        const isMatch = storedOtp == otp;
        
        if (!isMatch) {
            return res.status(401).json({ msg: "Incorrect OTP", success: false });
        }

        // Delete the OTP once used
        await db.query(`DELETE FROM otp WHERE email = $1`, [email]);

        // Generate and set a password reset confirmation token
        const passwordResetToken = jwt.sign({ 
            id: data.id,
            email: data.email,
            type: 'password_reset',
            verified: true
        }, process.env.sec_key, { expiresIn: "15m" });

        // Clear the reset token cookie
        res.clearCookie('resetToken', {
            httpOnly: true,
            secure: process.env.production == true,
            sameSite: 'Strict',
        });

        // Set new password reset cookie
        res.cookie('passwordResetToken', passwordResetToken, {
            httpOnly: true,
            secure: process.env.production == true,
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        return res.status(200).json({ 
            msg: "OTP verified successfully. You can now reset your password.", 
            success: true 
        });

    } catch (error) {
        console.error("Reset Verification Error:", error.message);
        return res.status(500).json({ msg: "Internal Server Error", success: false });
    }
});

router.post('/reset-password', [
    body('password', "Password must be at least 8 characters").isLength({ min: 8 })
], async (req, res) => {
    try {
        const { password } = req.body;
        const passwordResetToken = req.cookies.passwordResetToken;

        const errs = validationResult(req);
        if (!errs.isEmpty()) {
            return res.status(400).json({ msg: errs.array(), success: false });
        }

        if (!passwordResetToken) {
            return res.status(401).json({ msg: "Reset authentication required", success: false });
        }

        // Verify token
        const data = jwt.verify(passwordResetToken, process.env.sec_key);
        if (!data || data.type !== 'password_reset' || !data.verified) {
            return res.status(403).json({ msg: "Invalid or unverified token", success: false });
        }

        // Generate new password hash
        const salt = await bcrypt.genSalt(10);
        const securePass = await bcrypt.hash(password, salt);

        // Update user password
        await db.query(
            `UPDATE users SET password = $1 WHERE email = $2`, 
            [securePass, data.email]
        );

        // Clear the password reset token
        res.clearCookie('passwordResetToken', {
            httpOnly: true,
            secure: process.env.production == true,
            sameSite: 'Strict',
        });

        return res.status(200).json({ 
            msg: "Password updated successfully", 
            success: true 
        });
        
    } catch (error) {
        console.error("Password Reset Error:", error.message);
        return res.status(500).json({ msg: "Internal Server Error", success: false });
    }
});

router.post('/logout', (req, res) => {
    // Clear all auth cookies
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.production == true,
        sameSite: 'Strict',
    });
    
    res.clearCookie('otpToken', {
        httpOnly: true,
        secure: process.env.production == true,
        sameSite: 'Strict',
    });
    
    res.clearCookie('resetToken', {
        httpOnly: true,
        secure: process.env.production == true,
        sameSite: 'Strict',
    });
    
    res.clearCookie('passwordResetToken', {
        httpOnly: true,
        secure: process.env.production == true,
        sameSite: 'Strict',
    });
    
    return res.status(200).json({ 
        success: true, 
        msg: "Logged out successfully" 
    });
});

export default router;