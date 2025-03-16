import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import router from './Route/authRoutes.js';
import bookingRouter from './Route/bookingRoutes.js';
import adminRouter from './Route/adminRoutes.js';
import adminBookingRouter from './Route/adminBookingRoutes.js';
import { createInitialAdmin } from './Controllers/adminController.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); // For handling cookies

// Define the port
const PORT = process.env.PORT || 5000;

// Basic route to test the server
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running successfully!',
    status: 'OK'
  });
});

// Link authentication routes
app.use('/api/auth', router);

// Link booking routes
app.use('/api/bookings', bookingRouter);

// Link admin routes
app.use('/api/admin', adminRouter);

// Link admin booking routes
app.use('/api/admin/bookings', adminBookingRouter);

// Create initial admin account during server startup
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  
  // Create initial admin account if environment variables are set
  try {
    await createInitialAdmin();
  } catch (error) {
    console.error("Error creating initial admin:", error);
  }
});