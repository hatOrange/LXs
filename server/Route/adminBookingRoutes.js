import express from 'express';
// import { verifyAdmin, checkPasswordReset } from '../adminMiddleware.js';
import { verifyAdmin,checkPasswordReset } from '../adminmiddleware.js';
import {
  getAllBookings,
  getCancellationRequests,
  getBookingById,
  updateBookingStatus,
  processCancellationRequest,
  getBookingStats,
  getCancellationHistory
} from '../Controllers/adminBookingController.js';

const adminBookingRouter = express.Router();

// Protect all routes with admin authentication
adminBookingRouter.use(verifyAdmin);
adminBookingRouter.use(checkPasswordReset);

// Get booking statistics
// GET /api/admin/bookings/stats/overview
adminBookingRouter.get('/stats/overview', getBookingStats);

// Get all cancellation requests
// GET /api/admin/bookings/cancellation-requests
adminBookingRouter.get('/cancellation-requests', getCancellationRequests);

// Get cancellation request history
// GET /api/admin/bookings/cancellation-history
adminBookingRouter.get('/cancellation-history', getCancellationHistory);

// Process cancellation request
// PUT /api/admin/bookings/cancellation/:requestId
adminBookingRouter.put('/cancellation/:requestId', processCancellationRequest);

// Get all bookings with optional filtering
// GET /api/admin/bookings?status=pending&date_from=2023-01-01&date_to=2023-12-31&search=keyword
adminBookingRouter.get('/', getAllBookings);

// Get booking details by ID
// GET /api/admin/bookings/:bookingId
adminBookingRouter.get('/:bookingId', getBookingById);

// Update booking status
// PUT /api/admin/bookings/:bookingId/status
adminBookingRouter.put('/:bookingId/status', updateBookingStatus);

export default adminBookingRouter;