// routes/contact.js
const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const Booking = require('../models/Booking');
const { check, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { sendContactConfirmation, sendContactAssignmentNotification } = require('../utils/emailService');

// Rate limiting specifically for contact form submissions
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 contact form submissions per hour
  message: 'Too many contact requests from this IP, please try again later'
});

// Auth middleware for protected routes
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Authentication required' });
};

// Validation middleware
const contactValidation = [
  check('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  check('email').trim().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  check('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
];

// GET /api/contact - Get all contact inquiries (admin/staff only)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    let query = {};
    
    // Filter by status if specified
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    
    // Filter by date range if specified
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // If assigned to specific user
    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }
    
    // If user is not admin, only show contacts assigned to them
    if (req.user.role !== 'admin') {
      query.assignedTo = req.user._id;
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get contacts with pagination
    const contacts = await Contact.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Contact.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: contacts,
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
      message: 'Error retrieving contact inquiries',
      error: error.message
    });
  }
});

// GET /api/contact/:id - Get a specific contact inquiry
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid contact ID format' });
    }
    
    const contact = await Contact.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('notes.author', 'name');
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact inquiry not found' });
    }
    
    // If not admin, check if assigned to current user
    if (req.user.role !== 'admin' && 
        contact.assignedTo && 
        contact.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving contact inquiry',
      error: error.message
    });
  }
});

// POST /api/contact - Create a new contact inquiry (public endpoint)
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
      service: req.body.service || '',
      message: req.body.message
    });
    
    const savedContact = await newContact.save();
    
    // Send confirmation email to the customer
    try {
      await sendContactConfirmation(savedContact);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }
    
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

// PUT /api/contact/:id - Update a contact inquiry (admin/staff only)
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid contact ID format' });
    }
    
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact inquiry not found' });
    }
    
    // If not admin, check if assigned to current user
    if (req.user.role !== 'admin' && 
        contact.assignedTo && 
        contact.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Keep track if assignment changed
    const assignedToChanged = req.body.assignedTo && 
                             (!contact.assignedTo || 
                              contact.assignedTo.toString() !== req.body.assignedTo.toString());
    
    // Update allowed fields
    const allowedUpdates = ['status', 'assignedTo', 'convertedToBooking', 'bookingId'];
    
    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        contact[update] = req.body[update];
      }
    });
    
    const updatedContact = await contact.save();
    
    // Send notification if assigned to someone new
    if (assignedToChanged) {
      try {
        await sendContactAssignmentNotification(updatedContact);
      } catch (emailError) {
        console.error('Error sending assignment notification:', emailError);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Contact inquiry updated successfully',
      data: updatedContact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating contact inquiry',
      error: error.message
    });
  }
});

// POST /api/contact/:id/note - Add note to a contact inquiry
router.post('/:id/note', isAuthenticated, async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid contact ID format' });
    }
    
    // Validate note content
    if (!req.body.content || req.body.content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Note content is required' });
    }
    
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact inquiry not found' });
    }
    
    // If not admin, check if assigned to current user
    if (req.user.role !== 'admin' && 
        contact.assignedTo && 
        contact.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Add note
    contact.notes.push({
      content: req.body.content.trim(),
      author: req.user._id,
      createdAt: new Date()
    });
    
    const updatedContact = await contact.save();
    
    // Populate author info for response
    await updatedContact.populate('notes.author', 'name');
    
    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: updatedContact.notes[updatedContact.notes.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding note',
      error: error.message
    });
  }
});

// POST /api/contact/:id/convert-to-booking - Convert contact to booking
router.post('/:id/convert-to-booking', isAuthenticated, async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid contact ID format' });
    }
    
    // Validate required booking fields
    const requiredFields = ['preferredDate', 'preferredTime', 'service', 'address'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required for booking conversion`
        });
      }
    }
    
    // Check if address has all required fields
    const requiredAddressFields = ['street', 'city', 'state', 'postalCode'];
    for (const field of requiredAddressFields) {
      if (!req.body.address[field]) {
        return res.status(400).json({
          success: false,
          message: `address.${field} is required for booking conversion`
        });
      }
    }
    
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact inquiry not found' });
    }
    
    // Create new booking from contact data
    const newBooking = new Booking({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || req.body.phone,
      service: req.body.service,
      propertySize: req.body.propertySize || 'medium',
      preferredDate: new Date(req.body.preferredDate),
      preferredTime: req.body.preferredTime,
      address: {
        street: req.body.address.street,
        city: req.body.address.city,
        state: req.body.address.state,
        postalCode: req.body.address.postalCode
      },
      notes: `Converted from contact inquiry. Original message: ${contact.message}`,
      status: 'pending'
    });
    
    const savedBooking = await newBooking.save();
    
    // Update contact with booking reference
    contact.convertedToBooking = true;
    contact.bookingId = savedBooking._id;
    contact.status = 'converted';
    
    await contact.save();
    
    res.status(200).json({
      success: true,
      message: 'Contact successfully converted to booking',
      data: {
        contact: {
          id: contact._id,
          status: contact.status
        },
        booking: {
          id: savedBooking._id,
          service: savedBooking.service,
          preferredDate: savedBooking.preferredDate,
          status: savedBooking.status
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error converting contact to booking',
      error: error.message
    });
  }
});

// GET /api/contact/status/counts - Get contact counts by status (admin/staff only)
router.get('/status/counts', isAuthenticated, async (req, res) => {
  try {
    let matchStage = {};
    
    // If not admin, only count assigned contacts
    if (req.user.role !== 'admin') {
      matchStage.assignedTo = mongoose.Types.ObjectId(req.user._id);
    }
    
    const counts = await Contact.aggregate([
      { $match: matchStage },
      { $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert to a more user-friendly format
    const result = {
      new: 0,
      contacted: 0,
      resolved: 0,
      converted: 0,
      archived: 0,
      total: 0
    };
    
    // Fill in the actual counts
    counts.forEach(item => {
      result[item._id] = item.count;
      result.total += item.count;
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving contact counts',
      error: error.message
    });
  }
});

module.exports = router;