// routes/dashboard.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Contact = require('../models/Contact');

// These routes are already protected by isAuthenticated middleware in app.js

// GET /api/dashboard/stats - Get basic dashboard stats for staff/technicians
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Base query for staff dashboard
    let query = {};
    
    // If user is technician, filter by assigned technician
    if (req.user.role === 'technician') {
      query.technician = req.user._id;
    }
    
    // Today's bookings
    const todayBookingsQuery = {
      ...query,
      preferredDate: { $gte: today, $lt: tomorrow }
    };
    
    const todayBookings = await Booking.find(todayBookingsQuery)
      .sort('preferredTime')
      .populate('technician', 'name');
    
    // Pending bookings (not yet assigned or confirmed)
    const pendingBookingsQuery = {
      ...query,
      status: { $in: ['pending', 'confirmed'] }
    };
    
    const pendingBookings = await Booking.countDocuments(pendingBookingsQuery);
    
    // Upcoming bookings (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingBookingsQuery = {
      ...query,
      preferredDate: { $gte: today, $lt: nextWeek },
      status: { $in: ['confirmed', 'assigned'] }
    };
    
    const upcomingBookings = await Booking.find(upcomingBookingsQuery)
      .sort('preferredDate')
      .populate('technician', 'name');
    
    // Recent contacts - only for staff, not technicians
    let recentContacts = [];
    if (req.user.role !== 'technician') {
      const contactsQuery = {};
      
      // If role is staff, only show assigned contacts
      if (req.user.role === 'staff') {
        contactsQuery.assignedTo = req.user._id;
      }
      
      recentContacts = await Contact.find(contactsQuery)
        .sort('-createdAt')
        .limit(5)
        .populate('assignedTo', 'name');
    }
    
    // Unassigned contacts - only for admin
    let unassignedContacts = 0;
    if (req.user.role === 'admin') {
      unassignedContacts = await Contact.countDocuments({
        assignedTo: { $exists: false },
        status: 'new'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        todayBookings,
        pendingBookings,
        upcomingBookings,
        recentContacts,
        unassignedContacts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard statistics',
      error: error.message
    });
  }
});

// GET /api/dashboard/schedule - Get schedule for technicians
router.get('/schedule', async (req, res) => {
  try {
    // Get date range from query params or default to next 7 days
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    let endDate;
    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate);
      endDate = new Date(req.query.endDate);
    } else {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
    }
    
    // Base query
    const query = {
      preferredDate: { $gte: startDate, $lt: endDate },
      status: { $in: ['confirmed', 'assigned', 'in-progress'] }
    };
    
    // If technician, only show their bookings
    if (req.user.role === 'technician') {
      query.technician = req.user._id;
    }
    
    // Get schedule
    const schedule = await Booking.find(query)
      .populate('technician', 'name')
      .sort({ preferredDate: 1, preferredTime: 1 });
    
    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving schedule',
      error: error.message
    });
  }
});

// GET /api/dashboard/status-updates - Get latest status updates
router.get('/status-updates', async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 3;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Base query for recent status changes
    const query = {
      updatedAt: { $gte: startDate }
    };
    
    // If technician, only show their bookings
    if (req.user.role === 'technician') {
      query.technician = req.user._id;
    }
    
    // Get latest status updates
    const statusUpdates = await Booking.find(query)
      .populate('technician', 'name')
      .sort('-updatedAt')
      .limit(20);
    
    res.status(200).json({
      success: true,
      data: statusUpdates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving status updates',
      error: error.message
    });
  }
});

// GET /api/dashboard/search - Search bookings and contacts
router.get('/search', async (req, res) => {
  try {
    const { query, type } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Limit to 20 results of each type
    const limit = 20;
    
    let results = {};
    
    // Search bookings
    if (!type || type === 'bookings') {
      let bookingQuery = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } },
          { 'address.street': { $regex: query, $options: 'i' } },
          { 'address.city': { $regex: query, $options: 'i' } },
          { 'address.postalCode': { $regex: query, $options: 'i' } }
        ]
      };
      
      // If technician, only search their bookings
      if (req.user.role === 'technician') {
        bookingQuery.technician = req.user._id;
      }
      
      results.bookings = await Booking.find(bookingQuery)
        .populate('technician', 'name')
        .sort('-createdAt')
        .limit(limit);
    }
    
    // Search contacts
    if ((!type || type === 'contacts') && req.user.role !== 'technician') {
      let contactQuery = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } },
          { message: { $regex: query, $options: 'i' } }
        ]
      };
      
      // If staff, only search assigned contacts
      if (req.user.role === 'staff') {
        contactQuery.assignedTo = req.user._id;
      }
      
      results.contacts = await Contact.find(contactQuery)
        .populate('assignedTo', 'name')
        .sort('-createdAt')
        .limit(limit);
    }
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error performing search',
      error: error.message
    });
  }
});

// GET /api/dashboard/customer/:email - Get customer history
router.get('/customer/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    
    // Get customer bookings
    let bookingQuery = { email };
    
    // If technician, only show their bookings
    if (req.user.role === 'technician') {
      bookingQuery.technician = req.user._id;
    }
    
    const bookings = await Booking.find(bookingQuery)
      .populate('technician', 'name')
      .sort('-preferredDate');
    
    // Get customer contacts (not for technicians)
    let contacts = [];
    if (req.user.role !== 'technician') {
      let contactQuery = { email };
      
      // If staff, only get assigned contacts
      if (req.user.role === 'staff') {
        contactQuery.assignedTo = req.user._id;
      }
      
      contacts = await Contact.find(contactQuery)
        .populate('assignedTo', 'name')
        .sort('-createdAt');
    }
    
    // Calculate customer metrics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const totalSpent = bookings
      .filter(b => b.status === 'completed' && b.price)
      .reduce((sum, booking) => sum + booking.price, 0);
    
    // Get services used
    const services = [...new Set(bookings.map(b => b.service))];
    
    res.status(200).json({
      success: true,
      data: {
        bookings,
        contacts,
        metrics: {
          totalBookings,
          completedBookings,
          totalSpent,
          services,
          firstBooking: bookings.length > 0 ? bookings[bookings.length - 1].createdAt : null,
          lastBooking: bookings.length > 0 ? bookings[0].createdAt : null
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving customer history',
      error: error.message
    });
  }
});

// GET /api/dashboard/workload - Get technician workload report
router.get('/workload', async (req, res) => {
  try {
    // This endpoint is not for technicians
    if (req.user.role === 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    // Get date range
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate)
      : new Date();
    
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = req.query.endDate
      ? new Date(req.query.endDate)
      : new Date(startDate);
    
    if (!req.query.endDate) {
      endDate.setDate(endDate.getDate() + 7); // Default to 7 days
    }
    
    // Get all technicians
    const User = mongoose.model('User');
    const technicians = await User.find({ 
      role: 'technician',
      isActive: true
    }, '_id name');
    
    // Get workload for each technician
    const workloadData = [];
    
    for (const tech of technicians) {
      const assignedBookings = await Booking.find({
        technician: tech._id,
        preferredDate: { $gte: startDate, $lt: endDate },
        status: { $in: ['assigned', 'confirmed', 'in-progress'] }
      }).sort('preferredDate');
      
      // Group by date
      const bookingsByDate = {};
      
      assignedBookings.forEach(booking => {
        const dateKey = booking.preferredDate.toISOString().split('T')[0];
        
        if (!bookingsByDate[dateKey]) {
          bookingsByDate[dateKey] = [];
        }
        
        bookingsByDate[dateKey].push(booking);
      });
      
      workloadData.push({
        technicianId: tech._id,
        technicianName: tech.name,
        totalAssigned: assignedBookings.length,
        bookingsByDate
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        startDate,
        endDate,
        technicians: workloadData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving workload report',
      error: error.message
    });
  }
});

module.exports = router;