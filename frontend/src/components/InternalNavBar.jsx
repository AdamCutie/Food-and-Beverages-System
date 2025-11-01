import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../context/AuthContext'; // We still need this for the profile

const InternalNavBar = () => {
  // Basic styling for the nav link items
  const navLinkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '18px', // text-lg
  };

  // Style for the active nav link
  const activeNavLinkStyle = {
    ...navLinkStyle,
    color: '#F9A825', // Accent color for active link
  };

  return (
    <nav style={{
        backgroundColor: '#3C2A21', // Dark brown background
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
    }}>
      {/* Left: Logo and Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/kitchen">
          <img src="/images/logo_var.svg" alt="Logo" style={{ height: '64px' }} />
        </Link>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>
          Staff Portal
        </h1>
      </div>

      {/* Center: Navigation Links (Kitchen ONLY) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <NavLink
          to="/kitchen"
          end
          style={({ isActive }) => (isActive ? activeNavLinkStyle : navLinkStyle)}
        >
          Kitchen
        </NavLink>
        
        <NavLink
          to="/kitchen/inventory"
          style={({ isActive }) => (isActive ? activeNavLinkStyle : navLinkStyle)}
        >
          Inventory
        </NavLink>

        <NavLink
          to="/kitchen/archive"
          style={({ isActive }) => (isActive ? activeNavLinkStyle : navLinkStyle)}
        >
          Archive
        </NavLink>
      </div>

      {/* Right: Profile Dropdown */}
      <div>
        <ProfileDropdown />
      </div>
    </nav>
  );
};

export default InternalNavBar;