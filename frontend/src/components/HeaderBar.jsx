import React, { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, ShoppingCart, Search } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';

// --- Helper Functions for Live Clock (No change) ---

const getFormattedDate = (date) => {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${weekday}, ${month} ${day}, ${year}`;
};

const getFormattedTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

// --- Main Component ---

export default function HeaderBar({
  onBack, // Back button handler
  onCartToggle,
  cartCount = 0,
  searchTerm,
  onSearchChange
}) {

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Effect to update the clock every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const liveDate = getFormattedDate(currentDateTime);
  const liveTime = getFormattedTime(currentDateTime);

  // Define color constants for clarity
  const BG_COLOR = 'bg-[#073532]'; // Dark Green/Teal
  const ACCENT_COLOR_TEXT = 'text-[#F6B24B]'; // Accent Orange/Gold
  const ACCENT_COLOR_BUTTON = 'bg-[#F6B24B]'; // Accent Orange/Gold

  return (
    // KEY CHANGE: Nagbago ang 'z-50' sa 'z-10' at 'sticky top-0'
    // Pinili ko ang 'sticky top-0' na may 'z-10' para manatili ang header sa itaas,
    // pero may mas mababang z-index.
    <header className={`flex justify-between items-center px-4 md:px-6 py-2 shadow-lg ${BG_COLOR} sticky top-0 z-10 border-b border-[#1E302C]`}>

      {/* 1. LEFT SECTION: Back Button */}
      <div className="flex items-center min-w-[80px] sm:min-w-[120px] justify-start">
        <button
          onClick={onBack}
          className={`flex items-center space-x-1 p-2 rounded-lg ${ACCENT_COLOR_TEXT} hover:bg-[#3A5C54] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F6B24B]`}
        >
          <ArrowLeft size={20} className={ACCENT_COLOR_TEXT} />
          <span className="font-medium text-base xs:inline">Back</span>
        </button>
      </div>

      {/* 2. CENTER SECTION: Logo and Search Bar (Stacked and Centered) */}
      <div className="flex flex-col items-center flex-grow mx-50 px-4 sm:px-0 space-y-1">

        {/* Logo (Top) */}
        <img
          src="/images/logo_var.svg"
          alt="FoodieHub Logo"
          className="h-10 w-auto mb-1"
        />

        {/* Search Bar (Bottom) */}
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-300" size={1} />
          </div>
          <input
            type="text"
            placeholder="Search for items or categories..."
            className="w-full pl-10 pr-4 py-1 border border-[#4A706A] rounded-full bg-[#3A5C54] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F6B24B] text-sm sm: text-base"
            value={searchTerm}
            onChange={onSearchChange}
          />
        </div>
      </div>

      {/* 3. RIGHT SECTION: Live Clock (Stacked), Cart Button, and Profile Dropdown */}
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-[150px] sm:min-w-[200px] justify-end">

        {/* Live Date and Time (Stacked Vertically, hidden on small mobile) */}
        <div className="hidden md:flex flex-col items-end text-right text-xs sm:text-sm font-sans text-gray-200">
          {/* Date (Above) */}
          <div className="flex items-center space-x-1 ">
            <Calendar size={14} className={ACCENT_COLOR_TEXT} />
            <span className="font-semibold">{liveDate}</span>
          </div>

          {/* Time (Below) */}
          <div className="flex items-center space-x-1">
            <Clock size={14} className={ACCENT_COLOR_TEXT} />
            <span className="font-semibold">{liveTime}</span>
          </div>
        </div>

        {/* Cart Button with Count */}
        <button
          onClick={onCartToggle}
          className={`relative ${ACCENT_COLOR_BUTTON} text-white p-2.5 rounded-full shadow-md hover:bg-[#E0A040] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F6B24B]`}
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {cartCount}
            </span>
          )}
        </button>

        {/* Profile Dropdown (Side-by-side with Cart) */}
        <ProfileDropdown />
      </div>
    </header>
  );
}