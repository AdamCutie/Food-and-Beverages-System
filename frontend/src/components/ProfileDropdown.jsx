import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { User, ShoppingBag, LogOut } from 'lucide-react'; 
import { useAuth } from '../context/AuthContext';
import '../pages/Customer/CustomerTheme.css';

const ProfileDropdown = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate(); 

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Function to get the display name
  const getDisplayName = () => {
    if (!user) return "Guest";
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };
  
  if (!user) return null;

  const handleMyOrders = () => {
    setIsDropdownOpen(false);
    navigate('/my-orders');
  };

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Icon Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="header-icon-btn"
      >
        <User size={22} />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
          <div className="px-4 py-3">
            <p className="text-sm text-gray-500">Welcome,</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {getDisplayName()}
            </p>
          </div>
          
          <div className="border-t border-gray-100"></div>

          {/* ✅ CONDITION: Only show "My Orders" if role is 'customer' */}
          {user?.role === 'customer' && (
            <button
                onClick={handleMyOrders}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
                <ShoppingBag size={16} />
                My Orders
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;