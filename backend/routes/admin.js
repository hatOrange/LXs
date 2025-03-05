// routes/admin.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Contact = require('../models/Contact');
const User = require('../models/User');

// These routes are already protected by isAuthenticated and isAdmin middleware in app.js

// GET /api/admin/stats - Get admin dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    
    // Bookings stats
    const bookingsToday = await Booking.countDocuments({ 
      createdAt: { $gte: today } 
    });
    
    const bookingsThisWeek = await Booking.countDocuments({ 
      createdAt: { $gte: lastWeek } 
    });
    
    const bookingsThisMonth = await Booking.countDocuments({ 
      createdAt: { $gte: lastMonth } 
    });
    
    const totalBookings = await Booking.countDocuments();
    
    // Contacts stats
    const contactsToday = await Contact.countDocuments({ 
      createdAt: { $gte: today } 
    });
    
    const contactsThisWeek = await Contact.countDocuments({ 
      createdAt: { $gte: lastWeek } 
    });
    
    const contactsThisMonth = await Contact.countDocuments({ 
      createdAt: { $gte: lastMonth } 
    });
    
    // Unassigned contacts
    const unassignedContacts = await Contact.countDocuments({
      assignedTo: { $exists: false },
      status: 'new'
    });
    
    // Today's bookings with full details
    const upcomingBookings = await Booking.find({
      preferredDate: { $gte: today, $lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) },
      status: { $in: ['confirmed', 'assigned'] }
    })
    .populate('technician', 'name')
    .sort('preferredDate')
    .limit(10);
    
    // Get booking count by service type
    const bookingsByService = await Booking.aggregate([
      { $group: {
          _id: "$service",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get booking count by status
    const bookingsByStatus = await Booking.aggregate([
      { $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get user count by role
    const usersByRole = await User.aggregate([
      { $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get total active users
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Format booking by service for easy frontend use
    const formattedBookingsByService = {};
    bookingsByService.forEach(item => {
      formattedBookingsByService[item._id] = item.count;
    });
    
    // Format booking by status for easy frontend use
    const formattedBookingsByStatus = {};
    bookingsByStatus.forEach(item => {
      formattedBookingsByStatus[item._id] = item.count;
    });
    
    // Response with all stats
    res.status(200).json({
      success: true,
      data: {
        bookings: {
          today: bookingsToday,
          week: bookingsThisWeek,
          month: bookingsThisMonth,
          total: totalBookings,
          byService: formattedBookingsByService,
          byStatus: formattedBookingsByStatus,
          upcoming: upcomingBookings
        },
        contacts: {
          today: contactsToday,
          week: contactsThisWeek,
          month: contactsThisMonth,
          unassigned: unassignedContacts
        },
        users: {
          byRole: Object.fromEntries(usersByRole.map(r => [r._id, r.count])),
          active: activeUsers,
          total: await User.countDocuments()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving admin statistics',
      error: error.message
    });
  }
});

// GET /api/admin/monthly-stats - Get monthly aggregated statistics
router.get('/monthly-stats', async (req, res) => {
  try {
    // Default to last 12 months if not specified
    const months = req.query.months ? parseInt(req.query.months) : 12;
    
    // Get start date (first day of the month, X months ago)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    
    // Monthly bookings
    const monthlyBookings = await Booking.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Monthly contacts
    const monthlyContacts = await Contact.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Monthly completed bookings for revenue tracking
    const monthlyCompletedBookings = await Booking.aggregate([
      { 
        $match: { 
          updatedAt: { $gte: startDate },
          status: 'completed',
          price: { $exists: true, $gt: 0 }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" }
          },
          count: { $sum: 1 },
          revenue: { $sum: "$price" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Format data for frontend charts
    const formatMonthData = (data) => {
      const formattedData = [];
      
      // Create array of all months in range
      const currentDate = new Date();
      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - i);
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JavaScript months are 0-indexed
        
        formattedData.unshift({
          date: `${year}-${month.toString().padStart(2, '0')}`,
          year,
          month,
          count: 0,
          revenue: 0
        });
      }
      
      // Fill in actual data
      data.forEach(item => {
        const index = formattedData.findIndex(
          d => d.year === item._id.year && d.month === item._id.month
        );
        
        if (index !== -1) {
          formattedData[index].count = item.count;
          if (item.revenue) {
            formattedData[index].revenue = item.revenue;
          }
        }
      });
      
      return formattedData;
    };
    
    res.status(200).json({
      success: true,
      data: {
        bookings: formatMonthData(monthlyBookings),
        contacts: formatMonthData(monthlyContacts),
        revenue: formatMonthData(monthlyCompletedBookings)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving monthly statistics',
      error: error.message
    });
  }
});

// GET /api/admin/technician-performance - Get technician performance metrics
router.get('/technician-performance', async (req, res) => {
  try {
    // Get time period from query params or default to last 30 days
    const days = req.query.days ? parseInt(req.query.days) : 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get technicians with active status
    const technicians = await User.find({ 
      role: 'technician',
      isActive: true 
    }, '_id name');
    
    // Performance metrics for each technician
    const performanceData = [];
    
    for (const tech of technicians) {
      // Completed bookings
      const completedBookings = await Booking.countDocuments({
        technician: tech._id,
        status: 'completed',
        updatedAt: { $gte: startDate }
      });
      
      // Total assigned
      const totalAssigned = await Booking.countDocuments({
        technician: tech._id,
        updatedAt: { $gte: startDate }
      });
      
      // Average customer rating
      const ratingResult = await Booking.aggregate([
        { 
          $match: { 
            technician: mongoose.Types.ObjectId(tech._id),
            status: 'completed',
            customerRating: { $exists: true, $gt: 0 },
            updatedAt: { $gte: startDate }
          } 
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$customerRating" },
            totalRatings: { $sum: 1 }
          }
        }
      ]);
      
      // Calculate completion rate
      const completionRate = totalAssigned > 0 
        ? (completedBookings / totalAssigned) * 100 
        : 0;
      
      performanceData.push({
        technicianId: tech._id,
        technicianName: tech.name,
        completedBookings,
        totalAssigned,
        completionRate: parseFloat(completionRate.toFixed(2)),
        averageRating: ratingResult.length > 0 
          ? parseFloat(ratingResult[0].averageRating.toFixed(2)) 
          : 0,
        totalRatings: ratingResult.length > 0 
          ? ratingResult[0].totalRatings 
          : 0
      });
    }
    
    res.status(200).json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving technician performance data',
      error: error.message
    });
  }
});

// GET /api/admin/customer-insights - Get customer insights
router.get('/customer-insights', async (req, res) => {
  try {
    // Repeat customers (customers with more than one booking)
    const repeatCustomers = await Booking.aggregate([
      { $group: {
          _id: "$email",
          count: { $sum: 1 },
          firstBooking: { $min: "$createdAt" },
          lastBooking: { $max: "$createdAt" },
          services: { $addToSet: "$service" }
        }
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);
    
    // Get top service combinations
    const serviceCombinations = await Booking.aggregate([
      { $group: {
          _id: "$service",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get postal code distribution
    const postalCodeDistribution = await Booking.aggregate([
      { $group: {
          _id: "$address.postalCode",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Customer retention metrics
    const totalCustomers = await Booking.aggregate([
      { $group: {
          _id: "$email",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalUniqueCustomers = totalCustomers.length;
    const repeatCustomerCount = repeatCustomers.length;
    const retentionRate = totalUniqueCustomers > 0 
      ? (repeatCustomerCount / totalUniqueCustomers) * 100 
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        repeatCustomers,
        serviceCombinations,
        postalCodeDistribution,
        metrics: {
          totalUniqueCustomers,
          repeatCustomerCount,
          retentionRate: parseFloat(retentionRate.toFixed(2))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving customer insights',
      error: error.message
    });
  }
});

// Export site data in JSON format (for backup/export)
router.get('/export-data', async (req, res) => {
  try {
    // Get data type from query params
    const dataType = req.query.type || 'all';
    
    let responseData = {};
    
    if (dataType === 'all' || dataType === 'bookings') {
      responseData.bookings = await Booking.find().sort('-createdAt');
    }
    
    if (dataType === 'all' || dataType === 'contacts') {
      responseData.contacts = await Contact.find().sort('-createdAt');
    }
    
    if (dataType === 'all' || dataType === 'users') {
      responseData.users = await User.find({}, '-password').sort('name');
    }
    
    // Set filename for download
    const date = new Date().toISOString().split('T')[0];
    const filename = `lx-pest-solutions-${dataType}-${date}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting data',
      error: error.message
    });
  }
});

module.exports = router;