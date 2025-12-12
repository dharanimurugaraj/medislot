import { Outlet } from 'react-router-dom'; // <-- New Import
import { BackgroundBeams } from './BackgroundBeams';
import { Navbar } from './Navbar'; // Assuming Navbar is correctly imported here

// --- Remove the children prop requirement ---
// export const PageLayout = ({ children }: PageLayoutProps) => {  <-- DELETE THIS LINE
export const PageLayout = () => { // <-- USE THIS LINE
  return (
    <div className="relative min-h-screen w-full">
      <BackgroundBeams />
      
      <div className="relative z-10 w-full">
        <Navbar /> {/* <-- Render Navbar here once */}
        <main>
          <Outlet /> {/* <-- THIS RENDERS THE NESTED ROUTES (Home, Admin, etc.) */}
        </main>
      </div>
    </div>
  );
};