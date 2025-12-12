import cron from 'node-cron';
import { pool } from '../config/db';

export const startCleanupJob = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    const client = await pool.connect();
    try {
      console.log('🧹 Running Smart Cleanup Job...');

      await client.query('BEGIN');

      // --- TASK 1: Fail Stale PENDING Bookings (> 2 mins) ---
      // Requirement: "Automatically mark a booking as FAILED if it remains in PENDING... > 2 minutes"
      const pendingQuery = `
        SELECT id, slot_id FROM bookings 
        WHERE status = 'PENDING' 
        AND created_at < NOW() - INTERVAL '2 minutes'
        FOR UPDATE
      `;
      const stalePending = await client.query(pendingQuery);

      if (stalePending.rows.length > 0) {
        const ids = stalePending.rows.map(r => r.id);
        const slotIds = stalePending.rows.map(r => r.slot_id);
        
        // Mark as FAILED
        await client.query("UPDATE bookings SET status = 'FAILED' WHERE id = ANY($1::int[])", [ids]);
        
        // Release slots immediately
        await client.query("UPDATE slots SET is_booked = FALSE WHERE id = ANY($1::int[])", [slotIds]);
        
        console.log(`❌ Failed ${ids.length} stale PENDING bookings.`);
      }

      // --- TASK 2 (INNOVATION): Release BUFFERED Slots (> 10 mins) ---
      // These are slots that were cancelled by Admin and held in 'BUFFER' status
      const bufferQuery = `
        SELECT id, slot_id FROM bookings 
        WHERE status = 'BUFFER' 
        AND created_at < NOW() - INTERVAL '10 minutes'
        FOR UPDATE
      `;
      const staleBuffer = await client.query(bufferQuery);

      if (staleBuffer.rows.length > 0) {
        const ids = staleBuffer.rows.map(r => r.id);
        const slotIds = staleBuffer.rows.map(r => r.slot_id);

        // Finalize them as CANCELLED (Historical record)
        await client.query("UPDATE bookings SET status = 'CANCELLED' WHERE id = ANY($1::int[])", [ids]);
        
        // NOW we finally release the slot to the public
        await client.query("UPDATE slots SET is_booked = FALSE WHERE id = ANY($1::int[])", [slotIds]);
        
        console.log(`♻️ Released ${ids.length} BUFFERED slots to the public pool.`);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('⚠️ Cleanup Job Failed:', err);
    } finally {
      client.release();
    }
  });
};