import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Admin } from './pages/Admin';
import { BookingPage } from './pages/BookingPage';
import { MyBookings } from './pages/MyBookings';
import { PageLayout } from './components/PageLayout'; // Imported Layout

function App() {
  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { background: '#333', color: '#fff', borderRadius: '10px', fontSize: '14px' },
          success: { style: { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }, iconTheme: { primary: '#059669', secondary: '#ecfdf5' } },
          error: { style: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }, iconTheme: { primary: '#ef4444', secondary: '#fef2f2' } },
        }}
      />
      
      <AuthProvider>
        <BookingProvider>
          <BrowserRouter>
          
            <Routes>
              {/* These pages handle their own full-screen background */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Use PageLayout to apply the consistent animated background */}
                <Route element={<PageLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/booking/:slotId" element={<BookingPage />} />
                <Route path="/my-bookings" element={<MyBookings />} />
              </Route>
            </Routes>
          </BrowserRouter>  
        </BookingProvider>
      </AuthProvider>
    </>
  );
}

export default App;