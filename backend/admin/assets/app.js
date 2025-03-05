// app.js - Enhanced main application file
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');
const User = require('./models/User');
const { createAdminUser } = require('./utils/adminSetup');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://www.lxpestsolutions.com.au"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting to prevent abuse
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', globalLimiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration for admin panel
app.use(session({
  secret: process.env.SESSION_SECRET || 'lxpestsolutions-secret-key-7425',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/lxpestsolutions',
    collectionName: 'sessions'
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration for authentication
app.use(passport.initialize());
app.use(passport.session());

// Configure local strategy for authentication
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return done(null, false, { message: 'Incorrect email.' });
      }
      
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Admin panel static files
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// MongoDB connection with improved error handling
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lxpestsolutions', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB connected successfully');
  // Create admin user if it doesn't exist
  await createAdminUser();
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit process with failure
});

// Auth middleware for protected routes
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Authentication required' });
};

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ success: false, message: 'Admin privileges required' });
};

// Routes
const contactRoutes = require('./routes/contact');
const bookingRoutes = require('./routes/booking');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/contact', contactRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', isAuthenticated, isAdmin, adminRoutes);
app.use('/api/dashboard', isAuthenticated, dashboardRoutes);

// Admin panel route
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app; // Export for testing