import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define the port
const PORT = process.env.PORT || 5000;

// Basic route to test the server
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running successfully!',
    status: 'OK'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});