import { Request, Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

// 1. BOOK SLOT (With Concurrency Control)
export const bookSlot = async (req: AuthRequest, res: Response) => {
  const { slotId } = req.body;
  const userId = req.user.id; // From Auth Token

  const client = await pool.connect(); // Get a dedicated client for transaction

  try {
    await client.query('BEGIN'); // START TRANSACTION

    // --- CRITICAL: LOCK THE SLOT ---
    // 'FOR UPDATE' locks this row. No other transaction can read/write it 
    // until we COMMIT or ROLLBACK. This prevents double-booking.
    const slotCheck = await client.query(
      'SELECT id, is_booked FROM slots WHERE id = $1 FOR UPDATE', 
      [slotId]
    );
    const slot = slotCheck.rows[0];

    // Checks
    if (!slot) throw new Error('Slot not found');
    if (slot.is_booked) throw new Error('Slot already booked');

    // 2. Create the Booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (slot_id, user_id, status) VALUES ($1, $2, 'CONFIRMED') RETURNING *`,
      [slotId, userId]
    );

    // 3. Mark Slot as Booked
    await client.query('UPDATE slots SET is_booked = TRUE WHERE id = $1', [slotId]);

    await client.query('COMMIT'); // SUCCESS
    
    res.status(200).json({ 
      message: 'Booking Confirmed', 
      booking: bookingResult.rows[0] 
    });

  } catch (error: any) {
    await client.query('ROLLBACK'); // FAILURE: Undo everything
    
    if (error.message === 'Slot already booked') {
      res.status(409).json({ message: 'Slot already booked' });
    } else {
      res.status(500).json({ message: error.message || 'Booking Failed' });
    }
  } finally {
    client.release(); // Release client back to pool
  }
};

// 2. GET MY BOOKINGS
export const getUserBookings = async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  try {
    const query = `
      SELECT 
        b.id, b.status, b.created_at,
        d.name as doctor_name, d.specialization,
        s.start_time
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      JOIN doctors d ON s.doctor_id = d.id
      WHERE b.user_id = $1
      ORDER BY s.start_time ASC
    `;
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookings' });
  }
};

// 3. CANCEL MY BOOKING
export const cancelMyBooking = async (req: AuthRequest, res: Response) => {
  const bookingId = req.params.id;
  const userId = req.user.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify ownership
    const check = await client.query(
      'SELECT slot_id FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, userId]
    );

    if (check.rows.length === 0) throw new Error('Booking not found');

    const slotId = check.rows[0].slot_id;

    // Cancel Booking
    await client.query("UPDATE bookings SET status = 'CANCELLED' WHERE id = $1", [bookingId]);
    // Free Slot
    await client.query("UPDATE slots SET is_booked = FALSE WHERE id = $1", [slotId]);

    await client.query('COMMIT');
    res.json({ message: 'Booking cancelled successfully' });

  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};