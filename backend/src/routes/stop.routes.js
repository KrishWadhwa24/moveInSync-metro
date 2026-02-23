import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { rebuildGraph } from '../graph/GraphBuilder.js';

const router = express.Router();

// POST /api/stops  (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'name and code are required' });
    }

    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO stops (id, name, code) VALUES ($1, $2, $3) RETURNING *',
      [id, name, code.toUpperCase()]
    );

    // Rebuild graph so new stop is included
    await rebuildGraph();

    res.status(201).json({ success: true, message: 'Stop created', stop: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // Postgres unique violation
      return res.status(409).json({ success: false, message: 'Stop code already exists' });
    }
    next(err);
  }
});

// GET /api/stops  (public - used for frontend dropdowns)
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM stops ORDER BY name ASC');
    res.json({ success: true, stops: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;