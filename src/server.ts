/**
 * CSIR EOI 8119 - Mining Safety Dashboard
 * Main Server Entry Point
 * 
 * Demonstrates:
 * - Node.js + Express + TypeScript
 * - Firebase Admin SDK integration
 * - Cloud services proficiency
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes';
import incidentRoutes from './routes/incidentRoutes';
import checklistRoutes from './routes/checklistRoutes';
import alertRoutes from './routes/alertRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

// Import Firebase initialization
import { initializeFirebase } from './config/firebase';

// Initialize Firebase
initializeFirebase();

// Create Express application
const app: Application = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static('public'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CSIR Mining Safety Dashboard API',
    version: '1.0.0',
    description: 'Mining Safety Dashboard with Firebase - CSIR EOI 8119',
    endpoints: {
      auth: '/api/auth',
      incidents: '/api/incidents',
      checklists: '/api/checklists',
      alerts: '/api/alerts',
      analytics: '/api/analytics'
    },
    documentation: '/docs',
    health: '/health'
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Mining Safety Dashboard',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    firebase: 'connected'
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           CSIR EOI 8119 - Mining Safety Dashboard             ║
║═══════════════════════════════════════════════════════════════║
║  Server running on port ${PORT}                                  ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
║  Firebase: Initialized                                        ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
