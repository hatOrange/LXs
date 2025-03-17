import axios from 'axios';

// Create instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Needed for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;