import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { BentoGrid, BentoGridItem } from '../components/BentoGrid'; // Premium Layout
import toast from 'react-hot-toast';

interface BookingData {
  booking_id: number;
  patient_name: string;
  doctor_name: string;
  start_time: string;
  status: string;
}

export const Admin = () => {
  const { doctors, refreshDoctors } = useBooking();
  const { user } = useAuth();
  
  // Tabs & Data State
  const [activeTab, setActiveTab] = useState<'slots' | 'doctors' | 'bookings'>('slots');
  const [bookings, setBookings] = useState<BookingData[]>([]);
  
  // Forms State
  const [selectedDoc, setSelectedDoc] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpec, setNewDocSpec] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (user?.role === 'admin') fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (err) { console.error(err); }
  };

  // --- ACTIONS ---

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !date || !time) return toast.error("Fill all fields");
    setIsSubmitting(true);
    const startTime = new Date(`${date}T${time}`).toISOString();
    try {
      await axios.post('http://localhost:5000/api/slots', 
        { doctorId: selectedDoc, startTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Slot Created!");
      refreshDoctors();
      setTime('');
    } catch (err) { toast.error("Failed"); }
    finally { setIsSubmitting(false); }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDocSpec) return toast.error("Fill all fields");
    try {
      await axios.post('http://localhost:5000/api/admin/doctors',
        { name: newDocName, specialization: newDocSpec },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Doctor Added!");
      refreshDoctors();
      setNewDocName(''); setNewDocSpec('');
    } catch (err) { toast.error("Failed"); }
  };

  const handleCancelBooking = async (id: number) => {
    if(!confirm("Cancel booking?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Cancelled");
      fetchBookings();
    } catch (err) { toast.error("Failed"); }
  };

  const handleDeleteDoctor = async (id: number) => {
    if (!confirm("Delete Doctor? All data will be lost.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/doctors/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Deleted");
      refreshDoctors();
    } catch (err) { toast.error("Failed"); }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm("Delete Slot?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/slots/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Deleted");
      refreshDoctors();
    } catch (err) { toast.error("Failed"); }
  };

  if (!user || user.role !== 'admin') return <div className="p-10 text-center text-red-500 font-bold">Access Denied</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Dashboard</h1>
          <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {['slots', 'doctors', 'bookings'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab===tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: SLOTS & BENTO GRID */}
        {activeTab === 'slots' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Create Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit sticky top-24">
              <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-4">Create Slot</h2>
              <form onSubmit={handleCreateSlot} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Doctor</label>
                  <select className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition" value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)}>
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                  <input type="date" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 transition" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Time</label>
                  <input type="time" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 transition" value={time} onChange={e => setTime(e.target.value)} />
                </div>
                <button disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition active:scale-95">
                  {isSubmitting ? 'Creating...' : 'Create Slot'}
                </button>
              </form>
            </div>

            {/* Right: Bento Grid Stats */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-slate-800">Live Status (Bento Grid)</h2>
              <BentoGrid>
                {doctors.map((d, i) => {
                  const booked = d.slots.filter(s => s.is_booked).length;
                  const total = d.slots.length;
                  const isCritical = total > 0 && (booked / total) > 0.8;

                  return (
                    <BentoGridItem
                      key={d.id}
                      title={d.name}
                      description={d.specialization}
                      // Custom Header: Visual representation of busyness
                      header={
                        <div className={`flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br ${isCritical ? 'from-red-100 to-red-50' : 'from-blue-100 to-blue-50'} flex items-center justify-center relative group`}>
                           {/* Delete Button on Hover */}
                           <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteDoctor(d.id); }}
                              className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:text-red-600"
                              title="Delete Doctor"
                           >
                             🗑️
                           </button>

                           <div className="text-center">
                             <span className={`text-4xl font-extrabold ${isCritical ? 'text-red-500' : 'text-blue-500'}`}>
                               {total > 0 ? Math.round((booked / total) * 100) : 0}%
                             </span>
                             <p className="text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-wider">Booked</p>
                           </div>
                        </div>
                      }
                      className={i === 0 || i === 3 ? "md:col-span-2" : ""}
                      icon={
                        <div className="space-y-2">
                           {/* Quick Stats */}
                           <div className="flex justify-between items-center text-xs font-medium text-slate-500 bg-slate-50 p-2 rounded-lg">
                              <span><strong>{total}</strong> Slots</span>
                              <span className="text-slate-300">|</span>
                              <span className="text-blue-600"><strong>{total - booked}</strong> Open</span>
                           </div>
                           
                           {/* Mini Slot List */}
                           <div className="flex flex-wrap gap-1 mt-2">
                             {d.slots.slice(0, 5).map(s => (
                               <div key={s.id} className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${s.is_booked ? 'bg-red-50 border-red-100 text-red-400' : 'bg-green-50 border-green-100 text-green-600'}`}>
                                 {new Date(s.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                 {!s.is_booked && <button onClick={()=>handleDeleteSlot(s.id)} className="hover:text-red-600 text-slate-400 font-bold">×</button>}
                               </div>
                             ))}
                             {d.slots.length > 5 && <span className="text-[10px] text-slate-400">+{d.slots.length - 5} more</span>}
                           </div>
                        </div>
                      }
                    />
                  );
                })}
              </BentoGrid>
            </div>
          </div>
        )}

        {/* TAB 2: DOCTORS FORM */}
        {activeTab === 'doctors' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mt-10">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 text-center">Add Specialist</h2>
            <form onSubmit={handleCreateDoctor} className="space-y-5">
              <input placeholder="Name (e.g. Dr. House)" className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-green-500" value={newDocName} onChange={e => setNewDocName(e.target.value)} />
              <input placeholder="Specialization (e.g. Diagnostics)" className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-green-500" value={newDocSpec} onChange={e => setNewDocSpec(e.target.value)} />
              <button className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-500/30">Add Doctor</button>
            </form>
          </div>
        )}

        {/* TAB 3: BOOKINGS TABLE */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr><th className="p-5 font-semibold text-slate-500">ID</th><th className="p-5 font-semibold text-slate-500">Patient</th><th className="p-5 font-semibold text-slate-500">Doctor</th><th className="p-5 font-semibold text-slate-500">Status</th><th className="p-5 font-semibold text-slate-500">Action</th></tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.booking_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-5 text-slate-400 text-sm">#{b.booking_id}</td>
                    <td className="p-5 font-medium text-slate-700">{b.patient_name}</td>
                    <td className="p-5 text-slate-600">{b.doctor_name}</td>
                    <td className="p-5"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${b.status==='CONFIRMED'?'bg-emerald-100 text-emerald-700':b.status==='BUFFER'?'bg-amber-100 text-amber-700':'bg-rose-100 text-rose-700'}`}>{b.status}</span></td>
                    <td className="p-5">{b.status==='CONFIRMED'&&<button onClick={()=>handleCancelBooking(b.booking_id)} className="text-rose-500 text-sm font-medium hover:underline">Cancel</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};