// routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { sendPasswordResetEmail } = require('../utils/emailService');

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per IP
  message: 'Too many login attempts, please try again after 15 minutes'
});

// Rate limiting for password reset requests
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset requests per IP per hour
  message: 'Too many password reset requests, please try again after an hour'
});

// Auth middleware for protected routes
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Authentication required' });
};

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ success: false, message: 'Admin privileges required' });
};

// Login route
router.post('/login', loginLimiter, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Authentication error', error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ success: false, message: info.message || 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is disabled. Please contact administrator.' });
    }
    
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Login error', error: err.message });
      }
      
      // Update last login time
      User.findByIdAndUpdate(user._id, { lastLogin: new Date() })
        .catch(err => console.error('Error updating last login:', err));
      
      // Return user info without sensitive data
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    });
  })(req, res, next);
});

// Logout route
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout error', error: err.message });
    }
    res.status(200).json({ success: true, message: 'Logout successful' });
  });
});

// Get current user info
router.get('/me', isAuthenticated, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      lastLogin: req.user.lastLogin
    }
  });
});

// Change password route
router.post('/change-password', [
  isAuthenticated,
  check('currentPassword').notEmpty().withMessage('Current password is required'),
  check('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Check current password
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = req.body.newPassword;
    await user.save();
    
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
});

// Request password reset route
router.post('/forgot-password', [
  resetLimiter,
  check('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    
    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If your email is in our system, you will receive a password reset link'
      });
    }
    
    // Generate reset token
    const token = crypto.randomBytes(20).toString('hex');
    
    // Set token and expiry
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // Send password reset email
    await sendPasswordResetEmail(user, token);
    
    res.status(200).json({
      success: true,
      message: 'If your email is in our system, you will receive a password reset link'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message
    });
  }
});

// Reset password with token
router.post('/reset-password/:token', [
  check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }
    
    // Set new password
    user.password = req.body.password;
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
});

// Admin only: Create new user
router.post('/create-user', [
  isAuthenticated,
  isAdmin,
  check('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  check('email').isEmail().withMessage('Please provide a valid email'),
  check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  check('role').isIn(['admin', 'staff', 'technician']).withMessage('Invalid role')
], async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
    
    // Create new user
    const newUser = new User({
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      password: req.body.password,
      role: req.body.role,
      isActive: true
    });
    
    await newUser.save();
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// Admin only: Get all users
router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: error.message
    });
  }
});

// Admin only: Update user
router.put('/users/:id', [
  isAuthenticated,
  isAdmin,
  check('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  check('email').optional().isEmail().withMessage('Please provide a valid email'),
  check('role').optional().isIn(['admin', 'staff', 'technician']).withMessage('Invalid role'),
  check('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if email already exists (if email is being updated)
    if (req.body.email && req.body.email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }
    
    // Update allowed fields
    const allowedUpdates = ['name', 'email', 'role', 'isActive'];
    
    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        if (update === 'email') {
          user[update] = req.body[update].toLowerCase();
        } else {
          user[update] = req.body[update];
        }
      }
    });
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Admin only: Reset user password
router.post('/users/:id/reset-password', [
  isAuthenticated,
  isAdmin,
  check('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update password
    user.password = req.body.newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
});

module.exports = router;