import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../context/AuthContext';

const InternalNavBar = () => {
  const { user } = useAuth();

  // Define the colors
  const bgColor = '#352721'; 
  const textColor = 'text-gray-200';
  const hoverAccentClass = 'text-yellow-400'; // Still using Tailwind class for link hover/active
  const profileIconHexColor = '#FFA237'; // The specific gold color requested

  return (
    <nav 
      style={{ backgroundColor: bgColor }} 
      className={`
        ${textColor} 
        flex items-center justify-between 
        px-8 py-3 shadow-2xl 
        sticky top-0 z-10 
        border-b border-gray-700
      `}
    >
      {/* Left: Logo and Title */}
      <div className="flex items-center gap-5"> 
        <Link to={user.role === 'admin' ? '/admin' : '/kitchen'}>
          <img src="/images/logo_var.svg" alt="Logo" className="h-20 w-auto" /> 
        </Link>
        <h1 className="text-xl font-semibold tracking-wider opacity-90"> 
          {user.role === 'admin' ? 'Admin Dashboard' : 'Kitchen Display'}
        </h1>
      </div>

      {/* Center: Navigation Links - ONLY Admin Dashboard remains */}
      <div className="flex items-center gap-20"> 
        {/* Admin-only link */}
        {user.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `text-base font-medium transition duration-200 
              hover:${hoverAccentClass} 
              ${isActive ? hoverAccentClass : textColor}`
            }
          >
            {({ isActive }) => (
              <span className={`pb-1 ${isActive ? 'border-b border-yellow-400' : ''}`}>
                **Dashboard**
              </span>
            )}
          </NavLink>
        )}
        
        {/* Kitchen and Archive links have been REMOVED */}
        
      </div>

      {/* Right: Profile Dropdown */}
      <div className="justify-self-end">
        {/* Passing the hex code directly as a prop */}
        <ProfileDropdown iconColor={profileIconHexColor} />
      </div>
    </nav>
  );
};

export default InternalNavBar;