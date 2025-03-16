import db from '../dbConnection.js';
import mailer from 'nodemailer';

// Configure email transporter
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

// Get all bookings for a user
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.uid; // From auth middleware
    
    const bookings = await db.query(
      `SELECT 
        booking_id, 
        booking_type, 
        property_size, 
        booking_date, 
        status, 
        created_at,
        location,
        location_phone,
        location_email
      FROM bookings 
      WHERE user_id = $1 
      ORDER BY booking_date DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      bookings: bookings.rows
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to retrieve bookings"
    });
  }
};

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const userId = req.uid; // From auth middleware
    const { 
      booking_type, 
      property_size, 
      booking_date,
      location,
      location_phone,
      location_email
    } = req.body;

    // Validate booking type
    const validBookingTypes = ['residential', 'commercial', 'termite', 'rodent', 'insect'];
    if (!validBookingTypes.includes(booking_type)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid booking type"
      });
    }

    // Validate property size
    const validPropertySizes = ['small', 'medium', 'large', 'commercial'];
    if (!validPropertySizes.includes(property_size)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid property size"
      });
    }

    // Validate location details
    if (!location || !location_phone) {
      return res.status(400).json({
        success: false,
        msg: "Location and location phone are required"
      });
    }

    // Validate booking date (must be in the future)
    const bookingDateTime = new Date(booking_date);
    const currentDateTime = new Date();
    
    if (bookingDateTime <= currentDateTime) {
      return res.status(400).json({
        success: false,
        msg: "Booking date must be in the future"
      });
    }

    // Get user details for notification
    const userResult = await db.query(
      "SELECT email, phone_number, name FROM users WHERE id = $1",
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }
    
    const user = userResult.rows[0];

    // Create the booking
    const result = await db.query(
      `INSERT INTO bookings (
        booking_id,
        user_id,
        booking_type,
        property_size,
        booking_date,
        status,
        location,
        location_phone,
        location_email,
        created_at
      ) VALUES (
        uuid_generate_v4(),
        $1,
        $2,
        $3,
        $4,
        'pending',
        $5,
        $6,
        $7,
        CURRENT_TIMESTAMP
      ) RETURNING booking_id, booking_type, property_size, booking_date, status, location`,
      [
        userId,
        booking_type,
        property_size,
        bookingDateTime,
        location,
        location_phone,
        location_email || null
      ]
    );

    const newBooking = result.rows[0];

    // Send confirmation email to user
    await transporter.sendMail({
      from: process.env.sender_email,
      to: user.email,
      subject: "Booking Confirmation",
      html: `
        <h2>Booking Confirmation</h2>
        <p>Dear ${user.name || 'Customer'},</p>
        <p>Your booking has been confirmed with the following details:</p>
        <ul>
          <li><strong>Booking ID:</strong> ${newBooking.booking_id}</li>
          <li><strong>Service Type:</strong> ${newBooking.booking_type}</li>
          <li><strong>Property Size:</strong> ${newBooking.property_size}</li>
          <li><strong>Location:</strong> ${newBooking.location}</li>
          <li><strong>Date:</strong> ${new Date(newBooking.booking_date).toLocaleString()}</li>
        </ul>
        <p>Thank you for choosing our services!</p>
      `
    });

    // Send notification email to admin
    await transporter.sendMail({
      from: process.env.sender_email,
      to: process.env.admin_email,
      subject: "New Booking Alert",
      html: `
        <h2>New Booking Created</h2>
        <p>A new booking has been created:</p>
        <ul>
          <li><strong>Booking ID:</strong> ${newBooking.booking_id}</li>
          <li><strong>Customer Name:</strong> ${user.name || 'Not provided'}</li>
          <li><strong>Customer Email:</strong> ${user.email}</li>
          <li><strong>Customer Phone:</strong> ${user.phone_number}</li>
          <li><strong>Service Type:</strong> ${newBooking.booking_type}</li>
          <li><strong>Property Size:</strong> ${newBooking.property_size}</li>
          <li><strong>Location:</strong> ${newBooking.location}</li>
          <li><strong>Location Phone:</strong> ${location_phone}</li>
          <li><strong>Location Email:</strong> ${location_email || 'Not provided'}</li>
          <li><strong>Date:</strong> ${new Date(newBooking.booking_date).toLocaleString()}</li>
        </ul>
      `
    });

    return res.status(201).json({
      success: true,
      msg: "Booking created successfully",
      booking: newBooking
    });

  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to create booking"
    });
  }
};

// Request cancellation for a booking
export const requestCancellation = async (req, res) => {
  try {
    const userId = req.uid; // From auth middleware
    const { bookingId } = req.params;
    const { reason } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        msg: "Booking ID is required"
      });
    }

    // Check if booking exists and belongs to user
    const bookingResult = await db.query(
      `SELECT b.*, u.email as user_email, u.name as user_name, u.phone_number as user_phone 
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.booking_id = $1 AND b.user_id = $2`,
      [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "Booking not found or you don't have permission to cancel it"
      });
    }

    const booking = bookingResult.rows[0];

    // Check if booking is already completed or canceled
    if (['completed', 'canceled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        msg: `Cannot cancel a booking with status: ${booking.status}`
      });
    }

    // Update booking status to "cancellation_requested"
    await db.query(
      `UPDATE bookings 
       SET status = 'cancellation_requested', updated_at = CURRENT_TIMESTAMP
       WHERE booking_id = $1`,
      [bookingId]
    );

    // Send cancellation request email to admin
    await transporter.sendMail({
      from: process.env.sender_email,
      to: process.env.admin_email,
      subject: "Booking Cancellation Request",
      html: `
        <h2>Booking Cancellation Request</h2>
        <p>A customer has requested to cancel their booking:</p>
        <ul>
          <li><strong>Booking ID:</strong> ${booking.booking_id}</li>
          <li><strong>Customer Name:</strong> ${booking.user_name || 'Not provided'}</li>
          <li><strong>Customer Email:</strong> ${booking.user_email}</li>
          <li><strong>Customer Phone:</strong> ${booking.user_phone}</li>
          <li><strong>Service Type:</strong> ${booking.booking_type}</li>
          <li><strong>Property Size:</strong> ${booking.property_size}</li>
          <li><strong>Location:</strong> ${booking.location}</li>
          <li><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleString()}</li>
          <li><strong>Cancellation Reason:</strong> ${reason || 'No reason provided'}</li>
        </ul>
        <p>Please contact the customer to process this cancellation request.</p>
      `
    });

    // Send confirmation email to user
    await transporter.sendMail({
      from: process.env.sender_email,
      to: booking.user_email,
      subject: "Booking Cancellation Request Received",
      html: `
        <h2>Cancellation Request Received</h2>
        <p>Dear ${booking.user_name || 'Customer'},</p>
        <p>We have received your request to cancel the following booking:</p>
        <ul>
          <li><strong>Booking ID:</strong> ${booking.booking_id}</li>
          <li><strong>Service Type:</strong> ${booking.booking_type}</li>
          <li><strong>Location:</strong> ${booking.location}</li>
          <li><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleString()}</li>
        </ul>
        <p>Our team will process your request and contact you if needed.</p>
        <p>Thank you for your patience!</p>
      `
    });

    return res.status(200).json({
      success: true,
      msg: "Cancellation request submitted successfully. Our team will contact you."
    });

  } catch (error) {
    console.error("Error requesting cancellation:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to submit cancellation request"
    });
  }
};