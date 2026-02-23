import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { rebuildGraph } from '../graph/GraphBuilder.js';
import { findPath } from '../graph/Dijkstra.js';

const router = express.Router();

/**
 * POST /api/routes  (admin only)
 * Body: {
 *   name: "Yellow Line",
 *   color: "#FFD700",
 *   stops: [
 *     { stop_id: "uuid", stop_order: 1, travel_time_to_next: 3 },
 *     { stop_id: "uuid", stop_order: 2, travel_time_to_next: 2 },
 *     { stop_id: "uuid", stop_order: 3, travel_time_to_next: null }
 *   ]
 * }
 */


router.post('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { name, color, stops } = req.body;

    if (!name || !color || !stops || stops.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'name, color, and at least 2 stops are required',
      });
    }

    // Create route
    const routeId = uuidv4();
    const routeResult = await pool.query(
      'INSERT INTO routes (id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [routeId, name, color]
    );

    // Insert route_stops
    for (const s of stops) {
      await pool.query(
        'INSERT INTO route_stops (id, route_id, stop_id, stop_order, travel_time_to_next) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), routeId, s.stop_id, s.stop_order, s.travel_time_to_next || null]
      );
    }

    // Rebuild graph to include new route
    await rebuildGraph();

    res.status(201).json({
      success: true,
      message: 'Route created',
      route: routeResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
});



/**
 * GET /api/routes/search?from=stopId&to=stopId&strategy=fastest
 * strategy: 'fastest' (default) | 'least_transfers'
 */


router.get('/search', async (req, res, next) => {
  try {
    const { from, to, strategy = 'fastest' } = req.query;

    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'from and to query params are required' });
    }

    if (!['fastest', 'least_transfers'].includes(strategy)) {
      return res.status(400).json({ success: false, message: 'strategy must be fastest or least_transfers' });
    }

    if (from === to) {
      return res.status(400).json({ success: false, message: 'Source and destination cannot be the same' });
    }

    // Validate stops exist
    const [sourceResult, destResult] = await Promise.all([
      pool.query('SELECT id, name, code FROM stops WHERE id = $1', [from]),
      pool.query('SELECT id, name, code FROM stops WHERE id = $1', [to]),
    ]);

    if (sourceResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Source stop not found' });
    }
    if (destResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Destination stop not found' });
    }

    const source      = sourceResult.rows[0];
    const destination = destResult.rows[0];

    const result = findPath(from, to, strategy);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'No path found between these stops',
      });
    }

    res.json({
      success: true,
      source,
      destination,
      strategy,
      path: result,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/routes/map — returns all routes with ordered stops for map rendering
router.get('/map', async (req, res, next) => {
  try {
    const routesResult = await pool.query('SELECT * FROM routes ORDER BY name ASC');
    const routes = await Promise.all(
      routesResult.rows.map(async (route) => {
        const stopsResult = await pool.query(
          `SELECT s.id, s.name, s.code, rs.stop_order
           FROM route_stops rs
           JOIN stops s ON s.id = rs.stop_id
           WHERE rs.route_id = $1
           ORDER BY rs.stop_order ASC`,
          [route.id]
        );
        return { ...route, stops: stopsResult.rows };
      })
    );
    res.json({ success: true, routes });
  } catch (err) {
    next(err);
  }
});

// GET /api/routes  (list all routes with their stops)
router.get('/', async (req, res, next) => {
  try {
    const routesResult = await pool.query('SELECT * FROM routes ORDER BY name ASC');

    const routes = await Promise.all(
      routesResult.rows.map(async (route) => {
        const stopsResult = await pool.query(
          `SELECT s.id, s.name, s.code, rs.stop_order, rs.travel_time_to_next
           FROM route_stops rs
           JOIN stops s ON s.id = rs.stop_id
           WHERE rs.route_id = $1
           ORDER BY rs.stop_order ASC`,
          [route.id]
        );
        return { ...route, stops: stopsResult.rows };
      })
    );

    res.json({ success: true, routes });
  } catch (err) {
    next(err);
  }
});




export default router;