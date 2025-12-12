import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Define the shape of our data (TypeScript Interface)
interface Slot {
  id: number;
  start_time: string;
  is_booked: boolean;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  slots: Slot[];
}

interface BookingContextType {
  doctors: Doctor[];
  loading: boolean;
  refreshDoctors: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH LOGIC: Calls /api/doctors (which includes slots)
  const fetchDoctors = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/doctors');
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load doctors");
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  return (
    <BookingContext.Provider value={{ doctors, loading, refreshDoctors: fetchDoctors }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking must be used within BookingProvider");
  return context;
};