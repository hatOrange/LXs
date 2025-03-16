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

// Get all bookings with optional filtering
export const getAllBookings = async (req, res) => {
  try {
    const { status, date_from, date_to, search } = req.query;
    
    let query = `
      SELECT 
        b.booking_id, 
        b.booking_type, 
        b.property_size,
        b.booking_date,
        b.status,
        b.location,
        b.location_phone,
        b.location_email,
        b.created_at,
        u.name as user_name,
        u.email as user_email,
        u.phone_number as user_phone,
        (SELECT count(*) > 0 FROM cancellation_requests cr WHERE cr.booking_id = b.booking_id AND cr.status = 'pending') as has_cancellation_request
      FROM 
        bookings b
      JOIN 
        users u ON b.user_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add status filter if provided
    if (status) {
      queryParams.push(status);
      query += ` AND b.status = $${queryParams.length}`;
    }
    
    // Add date range filter if provided
    if (date_from) {
      queryParams.push(date_from);
      query += ` AND b.booking_date >= $${queryParams.length}`;
    }
    
    if (date_to) {
      queryParams.push(date_to);
      query += ` AND b.booking_date <= $${queryParams.length}`;
    }
    
    // Add search filter if provided (searches in location, user name, user email)
    if (search) {
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
      query += ` AND (
        b.location ILIKE $${queryParams.length - 2} OR 
        u.name ILIKE $${queryParams.length - 1} OR 
        u.email ILIKE $${queryParams.length})`;
    }
    
    // Add ordering by booking date
    query += ` ORDER BY b.booking_date DESC`;
    
    const bookings = await db.query(query, queryParams);
    
    return res.status(200).json({
      success: true,
      count: bookings.rows.length,
      bookings: bookings.rows
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    return res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Get all cancellation requests
export const getCancellationRequests = async (req, res) => {
  try {
    const query = `
      SELECT 
        cr.id as cancellation_request_id,
        cr.booking_id, 
        cr.reason as cancellation_reason,
        cr.created_at as request_date,
        cr.status as request_status,
        b.booking_type, 
        b.property_size,
        b.booking_date,
        b.status as booking_status,
        b.location,
        b.location_phone,
        b.location_email,
        b.created_at as booking_created_at,
        u.name as user_name,
        u.email as user_email,
        u.phone_number as user_phone
      FROM 
        cancellation_requests cr
      JOIN 
        bookings b ON cr.booking_id = b.booking_id
      JOIN 
        users u ON b.user_id = u.id
      WHERE 
        cr.status = 'pending'
      ORDER BY 
        cr.created_at ASC
    `;
    
    const result = await db.query(query);
    
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      cancellationRequests: result.rows
    });
  } catch (error) {
    console.error("Get cancellation requests error:", error);
    return res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Get booking details by ID including cancellation requests
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        msg: "Booking ID is required"
      });
    }
    
    // Get booking details
    const bookingQuery = `
      SELECT 
        b.booking_id, 
        b.booking_type, 
        b.property_size,
        b.booking_date,
        b.status,
        b.location,
        b.location_phone,
        b.location_email,
        b.created_at,
        b.updated_at,
        b.admin_note,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.phone_number as user_phone
      FROM 
        bookings b
      JOIN 
        users u ON b.user_id = u.id
      WHERE 
        b.booking_id = $1
    `;
    
    const bookingResult = await db.query(bookingQuery, [bookingId]);
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "Booking not found"
      });
    }
    
    // Get cancellation requests if any
    const cancellationQuery = `
      SELECT 
        id as cancellation_request_id,
        reason,
        created_at,
        status as request_status,
        processed_at,
        admin_note
      FROM 
        cancellation_requests
      WHERE 
        booking_id = $1
      ORDER BY 
        created_at DESC
    `;
    
    const cancellationResult = await db.query(cancellationQuery, [bookingId]);
    
    // Combine the data
    const response = {
      ...bookingResult.rows[0],
      cancellation_requests: cancellationResult.rows
    };
    
    return res.status(200).json({
      success: true,
      booking: response
    });
  } catch (error) {
    console.error("Get booking details error:", error);
    return res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, adminNote } = req.body;
    const adminId = req.adminId;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        msg: "Booking ID is required"
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        msg: "Status is required"
      });
    }
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'canceled', 'completed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid status value. Valid values are: pending, confirmed, canceled, completed"
      });
    }
    
    // Get the booking and user details for email notification
    const bookingQuery = `
      SELECT 
        b.booking_id, 
        b.booking_type, 
        b.property_size,
        b.booking_date,
        b.status,
        b.location,
        u.name as user_name,
        u.email as user_email
      FROM 
        bookings b
      JOIN 
        users u ON b.user_id = u.id
      WHERE 
        b.booking_id = $1
    `;
    
    const bookingResult = await db.query(bookingQuery, [bookingId]);
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "Booking not found"
      });
    }
    
    const booking = bookingResult.rows[0];
    
    // Prevent updating if booking is already in the requested status
    if (booking.status === status) {
      return res.status(400).json({
        success: false,
        msg: `Booking is already in '${status}' status`
      });
    }
    
    // Start a database transaction
    await db.query('BEGIN');
    
    try {
      // Update booking status
      let updateQuery = `
        UPDATE bookings
        SET 
          status = $1,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      const updateParams = [status];
      
      // Add admin note if provided
      if (adminNote) {
        updateQuery += `, admin_note = $2`;
        updateParams.push(adminNote);
      }
      
      updateQuery += ` WHERE booking_id = $${updateParams.length + 1} RETURNING booking_id, status`;
      updateParams.push(bookingId);
      
      const updateResult = await db.query(updateQuery, updateParams);
      
      // If status is confirmed or canceled, automatically handle any pending cancellation requests
      if (status === 'confirmed' || status === 'canceled') {
        const requestStatus = status === 'canceled' ? 'approved' : 'rejected';
        
        await db.query(
          `UPDATE cancellation_requests
           SET 
             status = $1,
             processed_by = $2,
             processed_at = CURRENT_TIMESTAMP,
             admin_note = COALESCE($3, admin_note)
           WHERE 
             booking_id = $4 AND status = 'pending'`,
          [requestStatus, adminId, adminNote, bookingId]
        );
      }
      
      // Commit the transaction
      await db.query('COMMIT');
      
      // Send email notification to customer
      const statusMessages = {
        pending: "Your booking is now pending review.",
        confirmed: "Your booking has been confirmed!",
        canceled: "Your booking has been canceled.",
        completed: "Your booking has been marked as completed."
      };
      
      await transporter.sendMail({
        from: process.env.sender_email,
        to: booking.user_email,
        subject: `Booking Status Update: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #2c3e50; text-align: center;">Booking Status Update</h2>
            
            <p>Hello ${booking.user_name || 'Valued Customer'},</p>
            
            <p>Your booking has been updated to: <strong>${status.toUpperCase()}</strong></p>
            
            <p>${statusMessages[status]}</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Booking Details:</p>
              <p style="margin: 10px 0 0 0;"><strong>Booking ID:</strong> ${booking.booking_id}</p>
              <p style="margin: 5px 0 0 0;"><strong>Service Type:</strong> ${booking.booking_type}</p>
              <p style="margin: 5px 0 0 0;"><strong>Property Size:</strong> ${booking.property_size}</p>
              <p style="margin: 5px 0 0 0;"><strong>Location:</strong> ${booking.location}</p>
              <p style="margin: 5px 0 0 0;"><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleString()}</p>
            </div>
            
            ${adminNote ? `<p><strong>Note from admin:</strong> ${adminNote}</p>` : ''}
            
            <p>If you have any questions, please contact our customer service.</p>
            
            <p>Thank you for choosing our services!</p>
            
            <div style="font-size: 12px; color: #7f8c8d; margin-top: 30px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 10px;">
              This is an automated message. Please do not reply directly to this email.
            </div>
          </div>
        `
      });
      
      return res.status(200).json({
        success: true,
        msg: `Booking status updated to '${status}'`,
        booking: updateResult.rows[0]
      });
      
    } catch (error) {
      // Rollback transaction in case of error
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error("Update booking status error:", error);
    return res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Process cancellation request
export const processCancellationRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { approved, adminNote } = req.body;
    const adminId = req.adminId;
    
    if (!requestId) {
      return res.status(400).json({
        success: false,
        msg: "Cancellation request ID is required"
      });
    }
    
    if (approved === undefined) {
      return res.status(400).json({
        success: false,
        msg: "Approval decision is required"
      });
    }
    
    // Start a database transaction
    await db.query('BEGIN');
    
    try {
      // Get the cancellation request
      const requestQuery = `
        SELECT 
          cr.*,
          b.booking_id,
          b.booking_type,
          b.property_size,
          b.booking_date,
          b.location,
          b.status as booking_status,
          u.name as user_name,
          u.email as user_email
        FROM 
          cancellation_requests cr
        JOIN 
          bookings b ON cr.booking_id = b.booking_id
        JOIN 
          users u ON b.user_id = u.id
        WHERE 
          cr.id = $1 AND cr.status = 'pending'
      `;
      
      const requestResult = await db.query(requestQuery, [requestId]);
      
      if (requestResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          msg: "Cancellation request not found or already processed"
        });
      }
      
      const request = requestResult.rows[0];
      
      // Verify booking can be canceled (not already completed)
      if (request.booking_status === 'completed') {
        await db.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          msg: "Cannot process cancellation for a completed booking"
        });
      }
      
      // Update cancellation request status
      await db.query(
        `UPDATE cancellation_requests
         SET 
           status = $1,
           processed_by = $2,
           processed_at = CURRENT_TIMESTAMP,
           admin_note = $3
         WHERE id = $4`,
        [approved ? 'approved' : 'rejected', adminId, adminNote || null, requestId]
      );
      
      // If approved, also update the booking status
      if (approved) {
        await db.query(
          `UPDATE bookings
           SET 
             status = 'canceled',
             updated_at = CURRENT_TIMESTAMP,
             admin_note = COALESCE($1, admin_note)
           WHERE booking_id = $2`,
          [adminNote, request.booking_id]
        );
      }
      
      // Commit the transaction
      await db.query('COMMIT');
      
      // Send email notification to customer
      const emailSubject = approved 
        ? "Cancellation Request Approved" 
        : "Cancellation Request Denied";
      
      const emailMessage = approved
        ? "Your cancellation request has been approved. Your booking has been canceled."
        : "Your cancellation request has been denied. Your booking remains active.";

        await transporter.sendMail({
            from: process.env.sender_email,
            to: request.user_email,
            subject: emailSubject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #2c3e50; text-align: center;">Cancellation Request ${approved ? 'Approved' : 'Denied'}</h2>
                
                <p>Hello ${request.user_name || 'Valued Customer'},</p>
                
                <p>${emailMessage}</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: bold;">Booking Details:</p>
                  <p style="margin: 10px 0 0 0;"><strong>Booking ID:</strong> ${request.booking_id}</p>
                  <p style="margin: 5px 0 0 0;"><strong>Service Type:</strong> ${request.booking_type}</p>
                  <p style="margin: 5px 0 0 0;"><strong>Property Size:</strong> ${request.property_size}</p>
                  <p style="margin: 5px 0 0 0;"><strong>Location:</strong> ${request.location}</p>
                  <p style="margin: 5px 0 0 0;"><strong>Date:</strong> ${new Date(request.booking_date).toLocaleString()}</p>
                </div>
                
                ${adminNote ? `<p><strong>Note from admin:</strong> ${adminNote}</p>` : ''}
                
                <p>If you have any questions, please contact our customer service.</p>
                
                <p>Thank you for choosing our services!</p>
                
                <div style="font-size: 12px; color: #7f8c8d; margin-top: 30px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 10px;">
                  This is an automated message. Please do not reply directly to this email.
                </div>
              </div>
            `
          });
          
          return res.status(200).json({
            success: true,
            msg: `Cancellation request ${approved ? 'approved' : 'denied'}`,
            cancellationRequest: {
              id: requestId,
              status: approved ? 'approved' : 'rejected',
              booking_id: request.booking_id,
              booking_status: approved ? 'canceled' : request.booking_status
            }
          });
          
        } catch (error) {
          // Rollback transaction in case of error
          await db.query('ROLLBACK');
          throw error;
        }
      } catch (error) {
        console.error("Process cancellation request error:", error);
        return res.status(500).json({
          success: false,
          msg: "Internal server error"
        });
      }
    };
    
    // Get booking statistics
    export const getBookingStats = async (req, res) => {
      try {
        // Get counts by status
        const statusQuery = `
          SELECT 
            status, 
            COUNT(*) as count 
          FROM 
            bookings 
          GROUP BY 
            status
        `;
        
        // Get counts by booking type
        const typeQuery = `
          SELECT 
            booking_type, 
            COUNT(*) as count 
          FROM 
            bookings 
          GROUP BY 
            booking_type
        `;
        
        // Get counts by property size
        const sizeQuery = `
          SELECT 
            property_size, 
            COUNT(*) as count 
          FROM 
            bookings 
          GROUP BY 
            property_size
        `;
        
        // Get counts of pending cancellation requests
        const cancellationQuery = `
          SELECT COUNT(*) as count 
          FROM cancellation_requests 
          WHERE status = 'pending'
        `;
        
        // Get counts by month (for the current year)
        const monthlyQuery = `
          SELECT 
            EXTRACT(MONTH FROM booking_date) as month,
            COUNT(*) as count
          FROM 
            bookings
          WHERE 
            EXTRACT(YEAR FROM booking_date) = EXTRACT(YEAR FROM CURRENT_DATE)
          GROUP BY 
            EXTRACT(MONTH FROM booking_date)
          ORDER BY 
            month
        `;
        
        const statusResult = await db.query(statusQuery);
        const typeResult = await db.query(typeQuery);
        const sizeResult = await db.query(sizeQuery);
        const cancellationResult = await db.query(cancellationQuery);
        const monthlyResult = await db.query(monthlyQuery);
        
        // Format monthly data with month names
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const monthlyData = monthlyResult.rows.map(row => ({
          month: monthNames[row.month - 1],
          month_number: row.month,
          count: parseInt(row.count)
        }));
        
        return res.status(200).json({
          success: true,
          statistics: {
            by_status: statusResult.rows.map(row => ({
              status: row.status,
              count: parseInt(row.count)
            })),
            by_type: typeResult.rows.map(row => ({
              booking_type: row.booking_type,
              count: parseInt(row.count)
            })),
            by_size: sizeResult.rows.map(row => ({
              property_size: row.property_size,
              count: parseInt(row.count)
            })),
            pending_cancellations: parseInt(cancellationResult.rows[0].count),
            monthly: monthlyData
          }
        });
      } catch (error) {
        console.error("Get booking statistics error:", error);
        return res.status(500).json({
          success: false,
          msg: "Internal server error"
        });
      }
    };
    
    // Get cancellation request history
    export const getCancellationHistory = async (req, res) => {
      try {
        const query = `
          SELECT 
            cr.id as cancellation_request_id,
            cr.booking_id, 
            cr.reason as cancellation_reason,
            cr.created_at as request_date,
            cr.status as request_status,
            cr.processed_at,
            cr.admin_note,
            a.name as processed_by_admin,
            b.booking_type, 
            b.property_size,
            b.booking_date,
            b.status as booking_status,
            u.name as user_name,
            u.email as user_email
          FROM 
            cancellation_requests cr
          JOIN 
            bookings b ON cr.booking_id = b.booking_id
          JOIN 
            users u ON b.user_id = u.id
          LEFT JOIN
            admins a ON cr.processed_by = a.id
          WHERE 
            cr.status != 'pending'
          ORDER BY 
            cr.processed_at DESC
          LIMIT 100
        `;
        
        const result = await db.query(query);
        
        return res.status(200).json({
          success: true,
          count: result.rows.length,
          cancellationHistory: result.rows
        });
      } catch (error) {
        console.error("Get cancellation history error:", error);
        return res.status(500).json({
          success: false,
          msg: "Internal server error"
        });
      }
    };