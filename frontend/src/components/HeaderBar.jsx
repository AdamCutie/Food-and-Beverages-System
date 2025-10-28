import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, User } from 'lucide-react'; // 1. Import User icon
import { useAuth } from '../context/AuthContext'; // 2. Import useAuth

//temporary color object
const primaryColor = {
  backgroundColor: '#0B3D2E'
};

export default function HeaderBar({ cartCount, onCartToggle, searchTerm, onSearchChange }) {
  // 3. Get auth state and functions
  const { user, isAuthenticated, logout } = useAuth();
  
  // 4. Add state to manage the dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 5. Add logic to close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <header style={primaryColor} className="grid grid-cols-3 items-center px-6 py-4 shadow-sm sticky top-0 z-10" >

      {/* Left Column: Logo */}
      <div className="justify-self-start">
        <img src="/images/logo_var.svg" alt="FoodieHub Logo" className="h-20"/>
      </div>

      {/* Center Column: Search Bar */}
      <div className="relative w-full max-w-md justify-self-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400" size={20} />
        </div>
        <input
          type="text"
          placeholder="Search for food..."
          className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>

      {/* Right Column: Cart & Profile */}
      <div className="justify-self-end flex items-center gap-4"> {/* 6. Use flex to group buttons */}
        
        {/* Cart Button */}
        <button
          onClick={onCartToggle}
          className="relative bg-[#F6B24B] text-[#053a34] p-3 rounded-full shadow-md hover:bg-[#f7c36e] transition"
        >
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          )}
        </button>

        {/* 7. NEW: Profile Dropdown Button */}
        {isAuthenticated && user && (
          <div className="relative" ref={dropdownRef}>
            {/* Profile Icon Button */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-gray-200 text-primary p-3 rounded-full shadow-md hover:bg-gray-300 transition"
            >
              <User size={22} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-500">Welcome,</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {/* Use user's name from the token */}
                    {user.role === 'customer' ? 'Customer' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </p>
                </div>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={logout} // Call the logout function from context
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}