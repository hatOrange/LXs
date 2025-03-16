import express from 'express';
import { body } from 'express-validator';
// import { verifyAdmin, checkPasswordReset } from "../adminMiddleware.js";
import { verifyAdmin,checkPasswordReset } from '../adminmiddleware.js';
import {
  loginAdmin,
  createAdmin,
  getAllAdmins,
  getAdminProfile,
  changePassword,
  forgotPassword,
  verifyOTP,
  resetPassword,
  logoutAdmin,
  deactivateAdmin
} from '../Controllers/adminController.js';

const adminRouter = express.Router();

// Public routes (no auth required)
adminRouter.post('/login', [
  body('email', 'Valid email is required').isEmail(),
  body('password', 'Password is required').exists()
], loginAdmin);

adminRouter.post('/forgot-password', [
  body('email', 'Valid email is required').isEmail()
], forgotPassword);

adminRouter.post('/verify-otp', [
  body('otp', 'OTP is required').isNumeric().isLength({ min: 6, max: 6 })
], verifyOTP);

adminRouter.post('/reset-password', [
  body('newPassword', 'Password must be at least 8 characters').isLength({ min: 8 })
], resetPassword);

// Protected routes (admin auth required)
adminRouter.get('/profile', verifyAdmin, getAdminProfile);

adminRouter.post('/logout', verifyAdmin, logoutAdmin);

adminRouter.post('/change-password', [
  verifyAdmin,
  body('currentPassword', 'Current password is required').exists(),
  body('newPassword', 'New password must be at least 8 characters').isLength({ min: 8 })
], changePassword);

// Routes that require password to be reset (if required)
adminRouter.get('/admins', [verifyAdmin, checkPasswordReset], getAllAdmins);

adminRouter.post('/create', [
  verifyAdmin,
  checkPasswordReset,
  body('name', 'Name is required').notEmpty(),
  body('email', 'Valid email is required').isEmail()
], createAdmin);

adminRouter.put('/deactivate/:adminIdToDeactivate', [
  verifyAdmin,
  checkPasswordReset
], deactivateAdmin);

export default adminRouter;