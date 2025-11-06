import React from 'react';
import { ShoppingCart, Search, Bell} from 'lucide-react';
import ProfileDropdown from '../../../components/ProfileDropdown';

//temporary color object
const primaryColor = {
  backgroundColor: '#0B3D2E'
};

export default function HeaderBar({ cartCount, onCartToggle, searchTerm, onSearchChange, notificationCount, onNotificationToggle }) {
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
      <div className="justify-self-end flex items-center gap-4">     
        {/* Notification Button */}
        <button
          onClick={onNotificationToggle}
          className="relative text-white p-3 rounded-full hover:bg-white/20 transition"
        >
          <Bell size={22} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {notificationCount}
            </span>
          )}
        </button>
           
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

        {/* 2. Replace all the profile logic with the new component */}
        <ProfileDropdown />
      </div>
    </header>
  );
}