// utils/emailService.js
const nodemailer = require('nodemailer');

/**
 * Configure email transport
 * In production, use proper SMTP settings from environment variables
 */
const createTransport = () => {
  // For development/testing - use ethereal.email
  if (process.env.NODE_ENV !== 'production') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.TEST_EMAIL_USER || 'ethereal_user',
        pass: process.env.TEST_EMAIL_PASS || 'ethereal_pass'
      }
    });
  }
  
  // For production - use real SMTP settings
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send an email
 * @param {Object} options Email options (to, subject, html, text)
 * @returns {Promise<Object>} Send info
 */
const sendEmail = async (options) => {
  const transporter = createTransport();
  
  const defaultOptions = {
    from: `"LX Pest Solutions" <${process.env.EMAIL_FROM || 'info@lxpestsolutions.com.au'}>`,
    replyTo: process.env.EMAIL_REPLY_TO || 'info@lxpestsolutions.com.au'
  };
  
  const mailOptions = { ...defaultOptions, ...options };
  
  return await transporter.sendMail(mailOptions);
};

/**
 * Send booking confirmation email to customer
 * @param {Object} booking Booking document
 * @returns {Promise<Object>} Send info
 */
const sendBookingConfirmation = async (booking) => {
  // Format date
  const formattedDate = new Date(booking.preferredDate).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Format time
  const timeMap = {
    'morning': '8:00 AM - 12:00 PM',
    'afternoon': '12:00 PM - 4:00 PM',
    'evening': '4:00 PM - 6:00 PM'
  };
  
  const formattedTime = timeMap[booking.preferredTime] || booking.preferredTime;
  
  // Format service type
  const serviceMap = {
    'residential': 'Residential Pest Control',
    'commercial': 'Commercial Pest Control',
    'termite': 'Termite Treatment',
    'rodent': 'Rodent Control',
    'insect': 'Insect Control',
    'eco-friendly': 'Eco-Friendly Pest Control'
  };
  
  const formattedService = serviceMap[booking.service] || booking.service;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #005792; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Booking Confirmation</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Dear ${booking.name},</p>
        
        <p>Thank you for booking with LX Pest Solutions. Your appointment has been scheduled for:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #005792;">
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
          <p><strong>Service:</strong> ${formattedService}</p>
          <p><strong>Address:</strong> ${booking.address.street}, ${booking.address.city}, ${booking.address.state} ${booking.address.postalCode}</p>
          <p><strong>Booking Reference:</strong> ${booking._id}</p>
        </div>
        
        <p>What happens next?</p>
        <ol>
          <li>We'll review your booking details.</li>
          <li>Our team will contact you to confirm the appointment.</li>
          <li>A technician will arrive at your location during the scheduled time window.</li>
        </ol>
        
        <p>Need to reschedule? Please contact us at least 24 hours in advance at <a href="tel:+61883711277">8371 1277</a> or reply to this email.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p>Thank you for choosing LX Pest Solutions!</p>
          <p>The LX Team<br>Phone: 8371 1277<br>Email: info@lxpestsolutions.com.au</p>
        </div>
      </div>
    </div>
  `;
  
  return await sendEmail({
    to: booking.email,
    subject: 'LX Pest Solutions - Booking Confirmation',
    html,
    text: `
      Booking Confirmation
      
      Dear ${booking.name},
      
      Thank you for booking with LX Pest Solutions. Your appointment has been scheduled for:
      
      Date: ${formattedDate}
      Time: ${formattedTime}
      Service: ${formattedService}
      Address: ${booking.address.street}, ${booking.address.city}, ${booking.address.state} ${booking.address.postalCode}
      Booking Reference: ${booking._id}
      
      What happens next?
      1. We'll review your booking details.
      2. Our team will contact you to confirm the appointment.
      3. A technician will arrive at your location during the scheduled time window.
      
      Need to reschedule? Please contact us at least 24 hours in advance at 8371 1277 or reply to this email.
      
      Thank you for choosing LX Pest Solutions!
      
      The LX Team
      Phone: 8371 1277
      Email: info@lxpestsolutions.com.au
    `
  });
};

/**
 * Send booking status update email to customer
 * @param {Object} booking Booking document
 * @param {string} oldStatus Previous status
 * @returns {Promise<Object>} Send info
 */
const sendBookingStatusUpdate = async (booking, oldStatus) => {
  // Format date
  const formattedDate = new Date(booking.preferredDate).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Status messages
  const statusMessages = {
    'confirmed': 'Your booking has been confirmed. A technician will arrive at your location during the scheduled time window.',
    'assigned': 'Your booking has been assigned to a technician who will service your property as scheduled.',
    'in-progress': 'Your service is now in progress. Our technician is working on resolving your pest issue.',
    'completed': 'Your service has been completed. Thank you for choosing LX Pest Solutions!',
    'cancelled': 'Your booking has been cancelled as requested.'
  };
  
  const statusMessage = statusMessages[booking.status] || `Your booking status has been updated to ${booking.status}.`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #005792; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Booking Update</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Dear ${booking.name},</p>
        
        <p>Your booking status has been updated.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #005792;">
          <p><strong>Booking Reference:</strong> ${booking._id}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>New Status:</strong> ${booking.status}</p>
          <p><strong>Update Message:</strong> ${statusMessage}</p>
        </div>
        
        <p>If you have any questions, please contact us at <a href="tel:+61883711277">8371 1277</a> or reply to this email.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p>Thank you for choosing LX Pest Solutions!</p>
          <p>The LX Team<br>Phone: 8371 1277<br>Email: info@lxpestsolutions.com.au</p>
        </div>
      </div>
    </div>
  `;
  
  return await sendEmail({
    to: booking.email,
    subject: `LX Pest Solutions - Booking Update: ${booking.status}`,
    html,
    text: `
      Booking Update
      
      Dear ${booking.name},
      
      Your booking status has been updated.
      
      Booking Reference: ${booking._id}
      Date: ${formattedDate}
      New Status: ${booking.status}
      Update Message: ${statusMessage}
      
      If you have any questions, please contact us at 8371 1277 or reply to this email.
      
      Thank you for choosing LX Pest Solutions!
      
      The LX Team
      Phone: 8371 1277
      Email: info@lxpestsolutions.com.au
    `
  });
};

/**
 * Send contact form confirmation email to customer
 * @param {Object} contact Contact document
 * @returns {Promise<Object>} Send info
 */
const sendContactConfirmation = async (contact) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #005792; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Message Received</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Dear ${contact.name},</p>
        
        <p>Thank you for contacting LX Pest Solutions. We have received your message and will get back to you shortly.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #005792;">
          <p><strong>Reference Number:</strong> ${contact._id}</p>
          <p><strong>Message:</strong> ${contact.message}</p>
        </div>
        
        <p>Our team typically responds within 1-2 business hours during our operating hours (Monday to Friday, 8:00 AM to 6:00 PM).</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p>Thank you for considering LX Pest Solutions!</p>
          <p>The LX Team<br>Phone: 8371 1277<br>Email: info@lxpestsolutions.com.au</p>
        </div>
      </div>
    </div>
  `;
  
  return await sendEmail({
    to: contact.email,
    subject: 'LX Pest Solutions - Your Message Has Been Received',
    html,
    text: `
      Message Received
      
      Dear ${contact.name},
      
      Thank you for contacting LX Pest Solutions. We have received your message and will get back to you shortly.
      
      Reference Number: ${contact._id}
      Message: ${contact.message}
      
      Our team typically responds within 1-2 business hours during our operating hours (Monday to Friday, 8:00 AM to 6:00 PM).
      
      Thank you for considering LX Pest Solutions!
      
      The LX Team
      Phone: 8371 1277
      Email: info@lxpestsolutions.com.au
    `
  });
};

/**
 * Send contact assignment notification email to staff
 * @param {Object} contact Contact document (populated with assignedTo)
 * @returns {Promise<Object>} Send info
 */
const sendContactAssignmentNotification = async (contact) => {
  // Get assigned user's email
  if (!contact.assignedTo) {
    throw new Error('Contact has no assigned user');
  }
  
  const User = require('../models/User');
  const assignedTo = await User.findById(contact.assignedTo);
  
  if (!assignedTo) {
    throw new Error('Assigned user not found');
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #005792; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">New Contact Assigned</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Hi ${assignedTo.name},</p>
        
        <p>A new contact inquiry has been assigned to you and requires your attention.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #005792;">
          <p><strong>Customer:</strong> ${contact.name}</p>
          <p><strong>Email:</strong> ${contact.email}</p>
          <p><strong>Phone:</strong> ${contact.phone || 'Not provided'}</p>
          <p><strong>Message:</strong> ${contact.message}</p>
          <p><strong>Reference:</strong> ${contact._id}</p>
        </div>
        
        <p>Please respond to this inquiry as soon as possible.</p>
        
        <p><a href="${process.env.APP_URL || 'https://lxpestsolutions.com.au'}/admin/contacts/${contact._id}" style="background-color: #005792; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px;">View Contact Details</a></p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p>LX Pest Solutions Admin</p>
        </div>
      </div>
    </div>
  `;
  
  return await sendEmail({
    to: assignedTo.email,
    subject: 'LX Pest Solutions - New Contact Assigned',
    html,
    text: `
      New Contact Assigned
      
      Hi ${assignedTo.name},
      
      A new contact inquiry has been assigned to you and requires your attention.
      
      Customer: ${contact.name}
      Email: ${contact.email}
      Phone: ${contact.phone || 'Not provided'}
      Message: ${contact.message}
      Reference: ${contact._id}
      
      Please respond to this inquiry as soon as possible.
      
      LX Pest Solutions Admin
    `
  });
};

/**
 * Send password reset email
 * @param {Object} user User document
 * @param {string} token Reset token
 * @returns {Promise<Object>} Send info
 */
const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.APP_URL || 'https://lxpestsolutions.com.au'}/admin/reset-password/${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #005792; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Password Reset</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Hi ${user.name},</p>
        
        <p>You requested a password reset for your LX Pest Solutions admin account.</p>
        
        <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
        
        <p><a href="${resetUrl}" style="background-color: #005792; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px;">Reset Password</a></p>
        
        <p>If you didn't request this, please ignore this email or contact the administrator.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p>LX Pest Solutions Admin</p>
        </div>
      </div>
    </div>
  `;
  
  return await sendEmail({
    to: user.email,
    subject: 'LX Pest Solutions - Password Reset',
    html,
    text: `
      Password Reset
      
      Hi ${user.name},
      
      You requested a password reset for your LX Pest Solutions admin account.
      
      Click the link below to reset your password. This link is valid for 1 hour.
      
      ${resetUrl}
      
      If you didn't request this, please ignore this email or contact the administrator.
      
      LX Pest Solutions Admin
    `
  });
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendBookingStatusUpdate,
  sendContactConfirmation,
  sendContactAssignmentNotification,
  sendPasswordResetEmail
};