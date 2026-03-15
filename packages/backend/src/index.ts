import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDatabase();

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rail Service API is running' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚂 Server running on port ${PORT}`);
});
