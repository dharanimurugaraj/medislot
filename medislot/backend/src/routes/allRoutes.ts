import { Router } from 'express';
import { signup, login } from '../controllers/authController';
// FIX: Imported cancelMyBooking here
import { bookSlot, getUserBookings, cancelMyBooking } from '../controllers/bookingController';
import { 
  createDoctor, getAllBookings, cancelBooking, 
  deleteDoctor, deleteSlot 
} from '../controllers/adminController';
import { getDoctors, createSlot } from '../controllers/doctorController';
import { authenticateToken, authorizeAdmin } from '../middlewares/authMiddleware';

const router = Router();

// --- PUBLIC ROUTES ---
router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.get('/doctors', getDoctors);

// --- PROTECTED USER ROUTES ---
router.post('/bookings', authenticateToken, bookSlot);
router.get('/bookings/my', authenticateToken, getUserBookings);
router.delete('/bookings/my/:id', authenticateToken, cancelMyBooking); // User Cancel

// --- ADMIN ONLY ROUTES ---
router.post('/admin/doctors', authenticateToken, authorizeAdmin, createDoctor);
router.post('/slots', authenticateToken, authorizeAdmin, createSlot);
router.get('/admin/bookings', authenticateToken, authorizeAdmin, getAllBookings);
router.delete('/admin/bookings/:id', authenticateToken, authorizeAdmin, cancelBooking);
router.delete('/admin/doctors/:id', authenticateToken, authorizeAdmin, deleteDoctor);
router.delete('/admin/slots/:id', authenticateToken, authorizeAdmin, deleteSlot);

export default router;