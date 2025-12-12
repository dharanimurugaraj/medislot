import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Booking {
  id: number;
  doctor_name: string;
  specialization: string;
  start_time: string;
  status: string;
}

export const MyBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  useAuth();

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/bookings/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (err) {
      console.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel your appointment?')) return;
    
    // Optimistic UI Update: Remove it immediately from the list
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    toast.loading("Cancelling...", { duration: 1000 });

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/bookings/my/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Booking Cancelled");
    } catch (err) {
      toast.error("Failed to cancel on server");
      fetchMyBookings(); // Revert if failed
    }
  };

  if (loading) return <div className="p-10 text-center">Loading your history...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-slate-800">My Appointments 📅</h1>

        {bookings.length === 0 ? (
          <div className="bg-white p-10 rounded-xl shadow-sm text-center">
            <p className="text-slate-500 mb-4">You haven't booked any appointments yet.</p>
            <Link to="/" className="text-blue-600 font-bold hover:underline">Find a Doctor</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                
                {/* Left: Doctor Info */}
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-xl">
                    🩺
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{b.doctor_name}</h3>
                    <p className="text-slate-500 text-sm">{b.specialization}</p>
                  </div>
                </div>

                {/* Middle: Time */}
                <div className="text-left md:text-center w-full">
                  <p className="font-bold text-slate-800">
                    {new Date(b.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                  </p>
                </div>

                {/* Right: Status & Action */}
                <div className="w-full text-right flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                    ${b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                      b.status === 'BUFFER' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700'}
                  `}>
                    {b.status}
                  </span>
                  
                  {/* Cancel Button */}
                  {b.status === 'CONFIRMED' && (
                    <button 
                      onClick={() => handleCancel(b.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};