import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import allRoutes from './routes/allRoutes';
import { startCleanupJob } from './jobs/cleanupJob';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', allRoutes);

// Start Jobs
startCleanupJob();

// Health Check
app.get('/', (req, res) => {
  res.send('MediSlot API is Running');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});