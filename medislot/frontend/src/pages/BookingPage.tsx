import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { ShimmerButton } from '../components/ShimmerButton'; // Premium Button
import toast from 'react-hot-toast';

export const BookingPage = () => {
  const { slotId } = useParams();
  const { doctors, refreshDoctors } = useBooking();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Efficiently find slot data from context
  const findSlotDetails = () => {
    for (const doc of doctors) {
      const foundSlot = doc.slots.find(s => s.id === Number(slotId));
      if (foundSlot) return { doctor: doc, slot: foundSlot };
    }
    return null;
  };

  const details = findSlotDetails();

  useEffect(() => {
    if (doctors.length > 0 && !details) {
      toast.error("Slot not found or expired");
      navigate('/');
    }
  }, [doctors, details, navigate]);

  const handleConfirmBooking = async () => {
    if (!user) {
      toast.error("Please login to continue");
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Securing your appointment...");

    try {
      const token = localStorage.getItem('token');
      // Execute Transaction
      await axios.post('http://localhost:5000/api/bookings', 
        { slotId: Number(slotId) }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Appointment Confirmed! 🎉", { id: toastId });
      await refreshDoctors(); // Sync global state
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || "Booking Failed";
      toast.error(msg, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!details) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading details...</div>;
  const { doctor, slot } = details;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Card Container */}
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden relative">
        
        {/* Header Decor */}
        <div className="bg-blue-600 h-32 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-blue-500" />
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        </div>

        <div className="px-8 pb-8 -mt-12 relative z-10">
          {/* Doctor Avatar */}
          <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center text-5xl mb-6 mx-auto border-4 border-slate-50">
            👨‍⚕️
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">{doctor.name}</h1>
            <p className="text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full inline-block mt-2 text-sm">
              {doctor.specialization}
            </p>
          </div>

          {/* Time Details Box */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
              <span className="text-slate-500 text-sm font-medium">Date</span>
              <span className="font-bold text-slate-800">
                {new Date(slot.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm font-medium">Time</span>
              <span className="font-bold text-slate-800 text-xl">
                {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/')}
              className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex-[1.5]">
              <ShimmerButton 
                onClick={handleConfirmBooking}
                disabled={isProcessing || slot.is_booked}
                className={slot.is_booked ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isProcessing ? 'Confirming...' : 'Confirm Appointment'}
              </ShimmerButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};