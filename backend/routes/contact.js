// routes/contact.js
const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { check, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiting specifically for contact form submissions
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 contact form submissions per hour
  message: 'Too many contact requests from this IP, please try again later'
});

// Validation middleware
const contactValidation = [
  check('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  check('email').trim().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  check('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
];

// GET /api/contact - Admin only route to get contact inquiries
router.get('/', async (req, res) => {
  try {
    // Note: In production, this should be protected by authentication
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving contact inquiries', error: error.message });
  }
});

// POST /api/contact - Save contact inquiry with improved validation
router.post('/', contactLimiter, contactValidation, async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const newContact = new Contact({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || '',
      message: req.body.message
    });
    
    const savedContact = await newContact.save();
    
    // In production, send notification email to staff
    // await sendNotificationEmail(savedContact);
    
    res.status(201).json({ 
      success: true, 
      message: 'Contact inquiry saved successfully', 
      data: {
        id: savedContact._id,
        name: savedContact.name,
        email: savedContact.email,
        createdAt: savedContact.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error saving contact inquiry', 
      error: error.message 
    });
  }
});

module.exports = bookingRouter;

// routes/booking.js
const express = require('express');
const bookingRouter = express.Router();
const Booking = require('../models/Booking');
const { check, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiting for booking submissions
const bookingLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Limit each IP to 3 booking requests per day
  message: 'Too many booking requests from this IP, please try again later'
});

// Validation middleware
const bookingValidation = [
  check('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  check('email').trim().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  check('phone').trim().matches(/^\+?[\d\s()-]{8,20}$/).withMessage('Please provide a valid phone number'),
  check('service').isIn(['residential', 'commercial', 'termite', 'rodent', 'insect', 'eco-friendly']).withMessage('Please select a valid service'),
  check('preferredDate').isISO8601().toDate().withMessage('Please provide a valid date'),
  check('address.street').trim().notEmpty().withMessage('Street address is required'),
  check('address.city').trim().notEmpty().withMessage('City is required'),
  check('address.state').trim().notEmpty().withMessage('State is required'),
  check('address.postalCode').trim().notEmpty().withMessage('Postal code is required')
];

// POST /api/booking - Create a new booking
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
      preferredDate: req.body.preferredDate,
      address: {
        street: req.body.address.street,
        city: req.body.address.city,
        state: req.body.address.state,
        postalCode: req.body.address.postalCode
      },
      notes: req.body.notes || ''
    });
    
    const savedBooking = await newBooking.save();
    
    // In production, send confirmation email to user
    // await sendConfirmationEmail(savedBooking);
    
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

module.exports = router;