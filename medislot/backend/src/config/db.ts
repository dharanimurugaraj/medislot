import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isLocal = process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1');

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? undefined : { rejectUnauthorized: false }
});

// ✅ THIS IS THE MISSING PIECE ✅
// This catches the "Connection terminated" error so the app stays alive
pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    // process.exit(-1) // Do not exit, just log it.
});

pool.connect()
    .then(() => console.log('✅ Connected to PostgreSQL Database'))
    .catch((err) => console.error('❌ Database connection error', err));