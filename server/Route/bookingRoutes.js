import express from 'express';
import { getUser } from '../middleware.js';
import { 
  getUserBookings,
  createBooking,
  requestCancellation
} from '../controllers/bookingController.js';
import { body } from 'express-validator';

const bookingRouter = express.Router();

// All booking routes require authentication
bookingRouter.use(getUser);

// Get all bookings for the authenticated user
bookingRouter.get('/', getUserBookings);

// Create a new booking
bookingRouter.post('/', [
  // Validation middleware
  body('booking_type').isIn(['residential', 'commercial', 'termite', 'rodent', 'insect']),
  body('property_size').isIn(['small', 'medium', 'large', 'commercial']),
  body('booking_date').isISO8601().toDate(),
  body('location').notEmpty().withMessage('Location is required'),
  body('location_phone').notEmpty().withMessage('Location phone is required'),
  body('location_email').optional().isEmail()
], createBooking);

// Request cancellation for a booking
bookingRouter.post('/:bookingId/cancel', [
  body('reason').optional()
], requestCancellation);

export default bookingRouter;