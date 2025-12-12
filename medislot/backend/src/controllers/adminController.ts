import { Request, Response } from 'express';
import { pool } from '../config/db';

// 1. Create a New Doctor
export const createDoctor = async (req: Request, res: Response) => {
  const { name, specialization } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO doctors (name, specialization) VALUES ($1, $2) RETURNING *',
      [name, specialization]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error creating doctor', error: err });
  }
};

// 2. View All Bookings (Dashboard Data)
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    // Join tables to get readable names instead of IDs
    const query = `
      SELECT 
        b.id as booking_id,
        b.status,
        b.created_at,
        u.name as patient_name,
        u.email as patient_email,
        d.name as doctor_name,
        d.specialization,
        s.start_time
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN slots s ON b.slot_id = s.id
      JOIN doctors d ON s.doctor_id = d.id
      ORDER BY b.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookings', error: err });
  }
};

// 3. Cancel/Delete Booking with DYNAMIC BUFFERING (Innovation Feature)
export const cancelBooking = async (req: Request, res: Response) => {
  const { id } = req.params; // Booking ID
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get the booking details
    const bookingRes = await client.query(
      'SELECT slot_id FROM bookings WHERE id = $1', 
      [id]
    );
    
    if (bookingRes.rows.length === 0) {
      throw new Error('Booking not found');
    }

    const slotId = bookingRes.rows[0].slot_id;

    // --- INNOVATION START: Dynamic Slot Buffering ---
    // Instead of releasing the slot immediately, we mark it as 'BUFFER'
    // This simulates holding it for a "Waitlist" or preventing instant re-booking errors
    
    // 1. Update Booking Status to BUFFER (keeps the slot locked effectively)
    // We repurpose the 'created_at' to NOW() so the cron job knows when the buffer started.
    await client.query(
      "UPDATE bookings SET status = 'BUFFER', created_at = NOW() WHERE id = $1", 
      [id]
    );

    // Note: We DO NOT set slots.is_booked = FALSE yet. 
    // The slot remains "booked" (unavailable to general public) while in buffer.

    await client.query('COMMIT');
    
    res.json({ 
      message: 'Booking moved to BUFFER state. It will be released to the public in 10 minutes.' 
    });
    // --- INNOVATION END ---

  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message || 'Error cancelling booking' });
  } finally {
    client.release();
  }
};

// ... existing functions

// 4. Delete a Slot (Admin)
export const deleteSlot = async (req: Request, res: Response) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Delete associated bookings first (to satisfy Foreign Key constraints)
    await client.query('DELETE FROM bookings WHERE slot_id = $1', [id]);
    // Delete the slot
    await client.query('DELETE FROM slots WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ message: 'Slot deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error deleting slot' });
  } finally {
    client.release();
  }
};

// 5. Delete a Doctor (Admin)
export const deleteDoctor = async (req: Request, res: Response) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Find all slots for this doctor
    const slotRes = await client.query('SELECT id FROM slots WHERE doctor_id = $1', [id]);
    const slotIds = slotRes.rows.map(r => r.id);

    if (slotIds.length > 0) {
      // 2. Delete bookings for those slots
      await client.query('DELETE FROM bookings WHERE slot_id = ANY($1::int[])', [slotIds]);
      // 3. Delete the slots
      await client.query('DELETE FROM slots WHERE doctor_id = $1', [id]);
    }

    // 4. Delete the doctor
    await client.query('DELETE FROM doctors WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    res.json({ message: 'Doctor and all associated data deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error deleting doctor' });
  } finally {
    client.release();
  }
};