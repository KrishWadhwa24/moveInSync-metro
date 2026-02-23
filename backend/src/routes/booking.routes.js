import express from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { findPath } from '../graph/Dijkstra.js';

const router = express.Router();


/**
 * Generates a unique tamper-resistant QR string
 * Format: base64url(bookingId|sourceCode|destCode|timestamp).hmacSignature
 */


function generateQRString(bookingId, sourceCode, destCode) {
  const timestamp = Date.now();
  const payload   = `${bookingId}|${sourceCode}|${destCode}|${timestamp}`;
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 16);

  const encoded = Buffer.from(payload).toString('base64url');
  return `${encoded}.${signature}`;
}


/**
 * POST /api/bookings
 * Body: { source_stop_id, destination_stop_id, strategy? }
 * Header: Authorization: Bearer <token>
 */


router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { source_stop_id, destination_stop_id, strategy = 'fastest' } = req.body;

    if (!source_stop_id || !destination_stop_id) {
      return res.status(400).json({
        success: false,
        message: 'source_stop_id and destination_stop_id are required',
      });
    }

    if (source_stop_id === destination_stop_id) {
      return res.status(400).json({ success: false, message: 'Source and destination cannot be the same' });
    }

    // Validate stops exist
    const [sourceResult, destResult] = await Promise.all([
      pool.query('SELECT id, name, code FROM stops WHERE id = $1', [source_stop_id]),
      pool.query('SELECT id, name, code FROM stops WHERE id = $1', [destination_stop_id]),
    ]);

    if (sourceResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Source stop not found' });
    }
    if (destResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Destination stop not found' });
    }

    const source      = sourceResult.rows[0];
    const destination = destResult.rows[0];

    // Idempotency check — prevent duplicate bookings for same user/route within 5 min window
    const idempotencyKey = `${req.user.id}:${source_stop_id}:${destination_stop_id}:${Math.floor(Date.now() / 300000)}`;
    const existing = await pool.query(
      'SELECT * FROM bookings WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Existing booking returned (idempotent)',
        booking: existing.rows[0],
      });
    }

    // Find path
    const pathResult = findPath(source_stop_id, destination_stop_id, strategy);
    if (!pathResult) {
      return res.status(404).json({
        success: false,
        message: 'No route exists between the selected stops. Booking not created.',
      });
    }

    // Generate QR string and create booking
    const bookingId = uuidv4();
    const qrString  = generateQRString(bookingId, source.code, destination.code);

    const result = await pool.query(
      `INSERT INTO bookings
        (id, user_id, source_stop_id, destination_stop_id, route_path, total_time, total_stops, transfers, optimization_strategy, qr_string, status, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active',$11)
       RETURNING *`,
      [
        bookingId,
        req.user.id,
        source_stop_id,
        destination_stop_id,
        JSON.stringify(pathResult),
        pathResult.totalTime,
        pathResult.totalStops,
        pathResult.transfers,
        strategy,
        qrString,
        idempotencyKey,
      ]
    );

    const booking = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id:           booking.id,
        source,
        destination,
        route_path:   pathResult,
        total_time:   pathResult.totalTime,
        total_stops:  pathResult.totalStops,
        transfers:    pathResult.transfers,
        strategy,
        qr_string:    qrString,
        status:       booking.status,
        created_at:   booking.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/bookings/:id
 * Returns full booking details with route path and QR string
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         b.*,
         s.name  AS source_name,  s.code  AS source_code,
         d.name  AS dest_name,    d.code  AS dest_code
       FROM bookings b
       JOIN stops s ON s.id = b.source_stop_id
       JOIN stops d ON d.id = b.destination_stop_id
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = result.rows[0];

    // Users can only view their own bookings (admins can see all)
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      booking: {
        id:          booking.id,
        source:      { id: booking.source_stop_id, name: booking.source_name, code: booking.source_code },
        destination: { id: booking.destination_stop_id, name: booking.dest_name, code: booking.dest_code },
        route_path:  booking.route_path,
        total_time:  booking.total_time,
        total_stops: booking.total_stops,
        transfers:   booking.transfers,
        strategy:    booking.optimization_strategy,
        qr_string:   booking.qr_string,
        status:      booking.status,
        created_at:  booking.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;