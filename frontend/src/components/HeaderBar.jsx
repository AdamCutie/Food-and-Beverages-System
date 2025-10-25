// frontend/src/components/HeaderBar.jsx

import React from 'react';
import { ShoppingCart, Search } from 'lucide-react';

//temporary color object
const primaryColor = {
  backgroundColor: '#0B3D2E' // Your desired dark green background
};

// Make sure cartCount is received here
export default function HeaderBar({ cartCount, onCartToggle, searchTerm, onSearchChange }) {
  return (
    // 👇 Use grid layout with 3 columns AND apply your inline style
    <header style={primaryColor} className="grid grid-cols-3 items-center px-6 py-4 shadow-sm sticky top-0 z-10" >

      {/* Left Column: Logo */}
      <div className="justify-self-start">
        {/* Your larger logo size */}
        <img src="/images/logo_var.svg" alt="FoodieHub Logo" className="h-20"/>
      </div>

      {/* Center Column: Search Bar */}
      <div className="relative w-full max-w-md justify-self-center"> {/* Centers the search container */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400" size={20} />
        </div>
        <input
          type="text"
          placeholder="Search for food..."
          className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400" // You might want to change focus:ring-orange-400 to focus:ring-figma-orange
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>

      {/* Right Column: Cart Button */}
      <div className="justify-self-end"> {/* Aligns button to the end */}
        <button
          onClick={onCartToggle}
          // Using your button colors
          className="relative bg-[#F6B24B] text-[#053a34] p-3 rounded-full shadow-md hover:bg-[#f7c36e] transition"
        >
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}