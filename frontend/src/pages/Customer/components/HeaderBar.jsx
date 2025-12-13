import React from 'react';
import { ShoppingCart, Search, Bell } from 'lucide-react';
import ProfileDropdown from '../../../components/ProfileDropdown';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext'; 
import { useNotifications } from '../../../context/NotificationContext';
import { Link } from 'react-router-dom';
import '../CustomerTheme.css'; 

export default function HeaderBar({ 
  onCartToggle, 
  searchTerm, 
  onSearchChange, 
  // notificationCount, <-- DELETE THIS PROP
  onNotificationToggle,
  showSearch = true 
}) {
  const { user } = useAuth();
  const { cartCount } = useCart(); 
  const { unreadCount } = useNotifications(); // ✅ Use Hook

  return (
    <header className="header-bar">
      {/* ... Logo & Search (No Changes) ... */}
      <div className="header-col-start">
        <Link to="/" className="flex items-center">
            <img 
                src="/images/foodAndBeverages.png" 
                alt="Celestia Hotel Logo" 
                className="header-logo cursor-pointer hover:opacity-90 transition-opacity"
            />
        </Link>
      </div>

      <div className="header-col-center">
        {showSearch ? (
            <div className="flex w-full max-w-md items-center bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
                <div className="text-gray-400 mr-2"><Search size={20} /></div>
                <input type="text" placeholder="Search for food..." className="bg-transparent border-none outline-none text-sm text-[#3C2A21] w-full placeholder-gray-400" value={searchTerm} onChange={onSearchChange} />
            </div>
        ) : (
            <div className="hidden md:block w-full"></div> 
        )}
      </div>

      {/* Right Column */}
      <div className="header-col-end">
        {user && (
            <>
                <button onClick={onNotificationToggle} className="header-icon-btn">
                    <Bell size={22} />
                    {/* ✅ Use Context Count */}
                    {unreadCount > 0 && (
                        <span className="icon-badge">{unreadCount}</span>
                    )}
                </button>
                    
                <button onClick={onCartToggle} className="header-icon-btn">
                    <ShoppingCart size={22} />
                    {cartCount > 0 && (
                        <span className="icon-badge">{cartCount}</span>
                    )}
                </button>
            </>
        )}
        <ProfileDropdown />
      </div>
    </header>
  );
}