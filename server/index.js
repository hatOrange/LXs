import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import router from './Route/authRoutes.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); // For handling cookies

// Define the port
const PORT = process.env.PORT || 3000;

// Basic route to test the server
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running successfully!',
    status: 'OK'
  });
});

// Link authentication routes
app.use('/api/auth', router);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});