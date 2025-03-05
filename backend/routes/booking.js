// routes/booking.js
const express = require('express');
const bookingRouter = express.Router();
const Booking = require('../models/Booking');
const { check, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { sendBookingConfirmation, sendBookingStatusUpdate } = require('../utils/emailService');

// Rate limiting for booking submissions (public API)
const bookingLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Limit each IP to 5 booking requests per day
  message: 'Too many booking requests from this IP, please try again later'
});

// Auth middleware for protected routes
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Authentication required' });
};

const isAdminOrTechnician = (req, res, next) => {
  if (req.isAuthenticated() && ['admin', 'technician'].includes(req.user.role)) {
    return next();
  }
  res.status(403).json({ success: false, message: 'Insufficient permissions' });
};

// Validation middleware
const bookingValidation = [
  check('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  check('email').trim().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  check('phone').trim().matches(/^\+?[\d\s()-]{8,20}$/).withMessage('Please provide a valid phone number'),
  check('service').isIn(['residential', 'commercial', 'termite', 'rodent', 'insect', 'eco-friendly']).withMessage('Please select a valid service'),
  check('preferredDate').isISO8601().toDate().withMessage('Please provide a valid date'),
  check('preferredTime').isIn(['morning', 'afternoon', 'evening']).withMessage('Please select a valid time preference'),
  check('address.street').trim().notEmpty().withMessage('Street address is required'),
  check('address.city').trim().notEmpty().withMessage('City is required'),
  check('address.state').trim().notEmpty().withMessage('State is required'),
  check('address.postalCode').trim().matches(/^\d{4}$/).withMessage('Please provide a valid Australian postal code')
];

// GET /api/booking - Get all bookings (admin/staff only)
bookingRouter.get('/', isAdminOrTechnician, async (req, res) => {
  try {
    let query = {};
    
    // Filter by status if specified
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    
    // Filter by date range if specified
    if (req.query.startDate && req.query.endDate) {
      query.preferredDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // If technician role, only show bookings assigned to them
    if (req.user.role === 'technician') {
      query.technician = req.user._id;
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .populate('technician', 'name email')
      .sort({ preferredDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Booking.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving bookings',
      error: error.message
    });
  }
});

// GET /api/booking/:id - Get booking by ID
bookingRouter.get('/:id', isAuthenticated, async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
    }
    
    // Get booking by ID
    const booking = await Booking.findById(req.params.id)
      .populate('technician', 'name email');
    
    // Check if booking exists
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // If technician role, only allow access to their assigned bookings
    if (req.user.role === 'technician' && 
        booking.technician && 
        booking.technician._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving booking',
      error: error.message
    });
  }
});

// POST /api/booking - Create a new booking (public API)
bookingRouter.post('/', bookingLimiter, bookingValidation, async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const newBooking = new Booking({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      service: req.body.service,
      propertySize: req.body.propertySize || 'medium',
      preferredDate: req.body.preferredDate,
      preferredTime: req.body.preferredTime,
      address: {
        street: req.body.address.street,
        city: req.body.address.city,
        state: req.body.address.state,
        postalCode: req.body.address.postalCode
      },
      notes: req.body.notes || ''
    });
    
    const savedBooking = await newBooking.save();
    
    // Send confirmation email
    try {
      await sendBookingConfirmation(savedBooking);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Booking created successfully', 
      data: {
        id: savedBooking._id,
        name: savedBooking.name,
        service: savedBooking.service,
        preferredDate: savedBooking.preferredDate,
        status: savedBooking.status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating booking', 
      error: error.message 
    });
  }
});

// PUT /api/booking/:id - Update booking (admin/staff only)
bookingRouter.put('/:id', isAuthenticated, async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
    }
    
    // Find booking
    const booking = await Booking.findById(req.params.id);
    
    // Check if booking exists
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // If technician role, only allow updates to their assigned bookings
    if (req.user.role === 'technician') {
      if (!booking.technician || booking.technician.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      
      // Technicians can only update specific fields
      const allowedFields = ['status', 'completionNotes'];
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          booking[key] = req.body[key];
        }
      });
    } else {
      // Admin/staff can update all fields
      const allowedUpdates = [
        'status', 'technician', 'price', 'isPaid', 'completionNotes',
        'followUpRequired', 'followUpDate', 'preferredDate', 'preferredTime'
      ];
      
      allowedUpdates.forEach(update => {
        if (req.body[update] !== undefined) {
          booking[update] = req.body[update];
        }
      });
    }
    
    // Track status change for notifications
    const statusChanged = req.body.status && booking.status !== req.body.status;
    const oldStatus = booking.status;
    
    // Save updated booking
    const updatedBooking = await booking.save();
    
    // Send status update email if status changed
    if (statusChanged) {
      try {
        await sendBookingStatusUpdate(updatedBooking, oldStatus);
      } catch (emailError) {
        console.error('Error sending status update email:', emailError);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
});

// Export the router
module.exports = bookingRouter;