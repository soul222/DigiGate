import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Import Routes
import vehicleRoutes from './routes/vehicle.routes.js';
// import accessRoutes from './routes/access.routes.js'; // DISABLED - AWS dependency
import gateRoutes from './routes/gate.routes.js';
import visitorRoutes from './routes/visitor.routes.js';
import ocrRoutes from './routes/ocr.routes.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// --- SIMPLIFIED CORS FOR TESTING ---
// Allow ALL origins temporarily to fix CORS issues
const io = new Server(httpServer, {
  cors: {
    origin: "*", // ALLOW ALL - TEMPORARY FOR TESTING
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  }
});

// CORS Middleware - ALLOW ALL FOR TESTING
app.use(cors({
  origin: "*", // ALLOW ALL - TEMPORARY FOR TESTING
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add OPTIONS handler for preflight requests
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
// app.use('/api/access', accessRoutes); // DISABLED - AWS dependency issue
app.use('/api/gate', gateRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/ocr', ocrRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// --- SOCKET.IO EVENTS ---
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Export io agar bisa dipakai di Controller lain
export { io };

// --- START SERVER ---
const PORT = process.env.PORT || 3001; // Changed to 3001 to avoid nginx conflict
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});