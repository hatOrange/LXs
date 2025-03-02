// models/Contact.js
const mongoose = require('mongoose');
const validator = require('validator');

const ContactSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  phone: { 
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\+?[\d\s()-]{8,20}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  message: { 
    type: String, 
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters']
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'resolved'],
    default: 'new'
  }
});

// Indexes for efficient queries
ContactSchema.index({ email: 1 });
ContactSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Contact', ContactSchema);

// models/Booking.js
const mongoose = require('mongoose');
const validator = require('validator');

const BookingSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  phone: { 
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\+?[\d\s()-]{8,20}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  service: {
    type: String,
    required: [true, 'Service type is required'],
    enum: ['residential', 'commercial', 'termite', 'rodent', 'insect', 'eco-friendly']
  },
  preferredDate: {
    type: Date,
    required: [true, 'Preferred date is required'],
    validate: {
      validator: function(v) {
        return v >= new Date();
      },
      message: 'Preferred date must be in the future'
    }
  },
  address: {
    street: { type: String, required: [true, 'Street address is required'] },
    city: { type: String, required: [true, 'City is required'] },
    state: { type: String, required: [true, 'State is required'] },
    postalCode: { type: String, required: [true, 'Postal code is required'] }
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for efficient queries
BookingSchema.index({ email: 1 });
BookingSchema.index({ preferredDate: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', BookingSchema);