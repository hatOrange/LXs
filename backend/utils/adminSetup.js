// utils/adminSetup.js
const User = require('../models/User');

/**
 * Creates an admin user if one doesn't already exist
 * This ensures there's always at least one admin account for the system
 */
const createAdminUser = async () => {
  try {
    // Check if we already have an admin user
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      console.log('No admin user found. Creating default admin user...');
      
      // Create default admin account
      // In production, use environment variables for these values
      const defaultAdmin = new User({
        name: process.env.ADMIN_NAME || 'Admin User',
        email: process.env.ADMIN_EMAIL || 'admin@lxpestsolutions.com.au',
        password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
        role: 'admin'
      });
      
      await defaultAdmin.save();
      console.log('Default admin user created successfully.');
      console.log('IMPORTANT: Please change the default admin password immediately!');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

module.exports = { createAdminUser };