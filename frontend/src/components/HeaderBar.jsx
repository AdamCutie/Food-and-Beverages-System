// frontend/src/components/HeaderBar.jsx

import React from 'react';
import { ShoppingCart, Search } from 'lucide-react';

// Make sure cartCount is received here
export default function HeaderBar({ cartCount, onCartToggle, searchTerm, onSearchChange }) {
  return (
    <header className="flex justify-between items-center px-6 py-4 shadow-sm bg-white sticky top-0 z-10">
      <h1 className="text-2xl font-bold text-[#053a34]">FoodieHub</h1>

      <div className="relative w-full max-w-md mx-4">
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

      <button
        onClick={onCartToggle}
        className="relative bg-[#F6B24B] text-[#053a34] p-3 rounded-full shadow-md hover:bg-[#f7c36e] transition"
      >
        <ShoppingCart size={22} />
        {/* This logic displays the count when it's greater than 0 */}
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {cartCount}
          </span>
        )}
      </button>
    </header>
  );
}