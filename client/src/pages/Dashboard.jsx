import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOutIcon, UserIcon } from "lucide-react";

// This is a basic dashboard placeholder. It would be expanded with real
// functionality for viewing and managing bookings.

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Pest Control Services</h1>
          
          <div className="relative">
            <button
              className="flex items-center focus:outline-none"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <span className="ml-2 text-gray-700">{user?.email}</span>
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Welcome to your Dashboard!</h2>
          <p className="text-gray-500">
            This is a placeholder for the user dashboard. Here you would be able to:
          </p>
          <ul className="mt-4 list-disc pl-5 text-gray-500">
            <li>View your upcoming pest control appointments</li>
            <li>Schedule new services</li>
            <li>Manage your existing bookings</li>
            <li>Request cancellations</li>
          </ul>
          <div className="mt-6 flex">
            <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Book a new service
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;