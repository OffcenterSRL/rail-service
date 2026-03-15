import express from 'express';
import http from 'node:http';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { connectDatabase } from './config/database';
import apiRoutes from './routes/api.routes';
import { attachTechnicianPresenceStream } from './services/technician-presence.service';

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

app.use('/api', apiRoutes);

// Start Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/technicians' });
attachTechnicianPresenceStream(wss);

server.listen(PORT, () => {
  console.log(`🚂 Server running on port ${PORT}`);
});
