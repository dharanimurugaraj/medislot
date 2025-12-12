import { pool } from '../config/db';

export const processBooking = async (slotId: number, userId: number) => {
  const client = await pool.connect(); // Get a dedicated client for transaction

  try {
    await client.query('BEGIN'); // 1. Start Transaction

    // 2. LOCK: Select slot and lock row until transaction ends
    const slotCheck = await client.query(
      'SELECT id, is_booked FROM slots WHERE id = $1 FOR UPDATE', 
      [slotId]
    );
    const slot = slotCheck.rows[0];

    if (!slot) throw new Error('Slot not found');
    if (slot.is_booked) throw new Error('Slot already booked');

    // 3. Create Booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (slot_id, user_id, status) VALUES ($1, $2, 'CONFIRMED') RETURNING *`,
      [slotId, userId]
    );

    // 4. Update Slot Status
    await client.query('UPDATE slots SET is_booked = TRUE WHERE id = $1', [slotId]);

    await client.query('COMMIT'); // 5. Commit
    return bookingResult.rows[0];

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback if any step fails
    throw error;
  } finally {
    client.release(); // Release client back to pool
  }
};