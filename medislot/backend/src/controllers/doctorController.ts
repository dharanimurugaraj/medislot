import { Request, Response } from 'express';
import { pool } from '../config/db';

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT d.id, d.name, d.specialization, 
      COALESCE(json_agg(
        json_build_object('id', s.id, 'start_time', s.start_time, 'is_booked', s.is_booked) 
        ORDER BY s.start_time ASC
      ) FILTER (WHERE s.id IS NOT NULL), '[]') as slots
      FROM doctors d
      LEFT JOIN slots s ON d.id = s.doctor_id
      GROUP BY d.id
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching doctors', error: err });
  }
};

// ADMIN API: Create Slot
export const createSlot = async (req: Request, res: Response) => {
  const { doctorId, startTime } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO slots (doctor_id, start_time) VALUES ($1, $2) RETURNING *',
      [doctorId, startTime]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error creating slot' });
  }
};