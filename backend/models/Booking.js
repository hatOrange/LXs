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
  propertySize: {
    type: String,
    enum: ['small', 'medium', 'large', 'commercial'],
    default: 'medium'
  },
  preferredDate: {
    type: Date,
    required: [true, 'Preferred date is required'],
    validate: {
      validator: function(v) {
        return v >= new Date(Date.now() - 86400000); // Allow today's date (24hrs buffer)
      },
      message: 'Preferred date must be in the future'
    }
  },
  preferredTime: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    required: [true, 'Preferred time is required']
  },
  address: {
    street: { type: String, required: [true, 'Street address is required'] },
    city: { type: String, required: [true, 'City is required'] },
    state: { type: String, required: [true, 'State is required'] },
    postalCode: { 
      type: String, 
      required: [true, 'Postal code is required'],
      validate: {
        validator: function(v) {
          return /^\d{4}$/.test(v); // Australian postal codes
        },
        message: 'Please provide a valid 4-digit postal code'
      }
    }
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  price: {
    type: Number,
    min: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  completionNotes: {
    type: String,
    trim: true
  },
  customerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  customerFeedback: {
    type: String,
    trim: true
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
BookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Update the updatedAt field on update
BookingSchema.pre('findOneAndUpdate', function(next) {
  this.update({}, { $set: { updatedAt: new Date() } });
  next();
});

// Helper method to check if booking can be cancelled
BookingSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

// Indexes for efficient queries
BookingSchema.index({ email: 1 });
BookingSchema.index({ phone: 1 });
BookingSchema.index({ preferredDate: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ technician: 1 });
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ updatedAt: -1 });
BookingSchema.index({ 'address.postalCode': 1 });

module.exports = mongoose.model('Booking', BookingSchema);