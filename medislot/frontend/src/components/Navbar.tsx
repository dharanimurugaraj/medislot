
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    // GLASS EFFECT: sticky header, semi-transparent white, blur backdrop
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🏥</span>
            <span className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
              MediSlot
            </span>
          </Link>

          {/* Buttons Section */}
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                {/* Admin Link: Only visible to Admins */}
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-slate-600 hover:text-blue-600 font-medium transition-colors hidden md:block">
                    Admin Panel
                  </Link>
                )}

                {/* My Appointments Link: Visible to everyone (or just normal users if you prefer) */}
                {user.role !== 'admin' && (
                   <Link to="/my-bookings" className="text-slate-600 hover:text-blue-600 font-medium transition-colors hidden md:block">
                     My Appointments
                   </Link>
                )}

                <div className="flex items-center gap-4">
                  <span className="text-slate-600 font-medium hidden sm:block">
                    Hi, {user.name}
                  </span>
                  <button 
                    onClick={handleLogout} 
                    className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-slate-200 transition-all"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 hover:shadow-lg transition-all shadow-blue-500/30"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};