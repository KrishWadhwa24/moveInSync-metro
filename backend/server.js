import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();

import pool from './src/config/db.js';
import { buildGraph } from './src/graph/GraphBuilder.js';
import authRoutes from './src/routes/auth.routes.js';
import stopRoutes from './src/routes/stop.routes.js';
import routeRoutes from './src/routes/route.routes.js';
import bookingRoutes from './src/routes/booking.routes.js';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Testing DB connection
    await pool.query('SELECT 1');
    console.log('Database connected successfully');

    await buildGraph();
    console.log('Graph built and cached');

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Startup failed:', err.message);
    process.exit(1);
  }
}

start();