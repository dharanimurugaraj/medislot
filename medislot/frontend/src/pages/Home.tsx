import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { SpotlightCard } from '../components/SpotlightCard'; // Import Spotlight
import { motion } from 'framer-motion'; // Import Framer Motion

export const Home = () => {
  const { doctors, loading } = useBooking();
  const navigate = useNavigate();
  
  // INNOVATION: Visual Locking State
  // Tracks which specific slot is being clicked to prevent double-clicks
  const [processingSlotId, setProcessingSlotId] = useState<number | null>(null);

  const handleSlotClick = (slotId: number) => {
    // 1. VISUAL LOCK: Immediately lock the UI
    setProcessingSlotId(slotId);
    
    // 2. Delay navigation slightly to let the user see the "Lock" animation (UX preference)
    setTimeout(() => {
      navigate(`/booking/${slotId}`);
      setProcessingSlotId(null); // Reset if they come back
    }, 600);
  };

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-slate-500 font-medium animate-pulse">Loading Specialists...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-slate-50 relative overflow-hidden">
       {/* Background Decoration (Magic UI Style) */}
       <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50 to-transparent -z-10" />

       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center md:text-left"
          >
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
              Find Your <span className="text-blue-600">Specialist</span>
            </h1>
            <p className="text-slate-500 mt-3 text-lg max-w-2xl">
              Book appointments with top doctors instantly. Secure, fast, and reliable.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {doctors.map((doc, idx) => (
               // Staggered Animation for cards
               <motion.div
                 key={doc.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
               >
                 <SpotlightCard className="p-6 h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl shadow-inner">
                        👨‍⚕️
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">{doc.name}</h2>
                        <p className="text-blue-600 font-medium text-sm bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                          {doc.specialization}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Available Slots</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {doc.slots.map(slot => {
                          const isProcessing = processingSlotId === slot.id;
                          return (
                            <button
                              key={slot.id}
                              disabled={slot.is_booked || isProcessing}
                              onClick={() => handleSlotClick(slot.id)}
                              className={`
                                relative py-2.5 px-1 text-sm rounded-lg font-medium transition-all duration-300 overflow-hidden
                                ${slot.is_booked 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                                  : isProcessing
                                    ? 'bg-yellow-400 text-white scale-95 border border-yellow-500 shadow-inner' // VISUAL LOCK STATE
                                    : 'bg-white text-slate-700 hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-600 shadow-sm hover:shadow-md'
                                }
                              `}
                            >
                              {/* Content */}
                              <span className="relative z-10">
                                {isProcessing ? (
                                  <span className="flex items-center justify-center gap-1">
                                    🔒 <span className="text-xs">Locking</span>
                                  </span>
                                ) : (
                                  new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: false })
                                )}
                              </span>

                              {/* Booked Overlay */}
                              {slot.is_booked && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 text-[10px] font-bold uppercase text-red-400">
                                  Booked
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {doc.slots.length === 0 && (
                        <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                          <p className="text-sm text-slate-400 italic">No slots available</p>
                        </div>
                      )}
                    </div>
                 </SpotlightCard>
               </motion.div>
             ))}
          </div>

          {!loading && doctors.length === 0 && (
             <div className="text-center py-20">
                <p className="text-gray-400 text-lg">No doctors found. Please check backend connection.</p>
             </div>
          )}
       </div>
    </div>
  );
};