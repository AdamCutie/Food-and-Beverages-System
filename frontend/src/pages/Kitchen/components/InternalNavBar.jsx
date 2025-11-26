import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import ProfileDropdown from '../../../components/ProfileDropdown';
import { useAuth } from '../../../context/AuthContext'; 

const InternalNavBar = () => {
  const { user } = useAuth();
  
  const navLinkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '18px',
  };

  // Style for the active nav link
  const activeNavLinkStyle = {
    ...navLinkStyle,
    color: '#F9A825', // Accent color for active link
  };

  const [isHovered, setIsHovered] = useState(false);

  const baseAdminLinkStyle = {
    color: 'white',
    backgroundColor: '#523a2e',
    border: '1px solid white',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '16px',
    transition: 'background-color 0.2s',
  };
  const hoverAdminLinkStyle = {
    backgroundColor: '#F9A825', // Your orange accent
    color: '#3C2A21', // Dark text for contrast
    border: '1px solid #F9A825',
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
      </div>

      {/* Center: Navigation Links (Kitchen ONLY) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '100px' }}>
        <NavLink
          to="/kitchen"
          end
          style={({ isActive }) => (isActive ? activeNavLinkStyle : navLinkStyle)}
        >
          Kitchen
        </NavLink>
        
        {/* --- NEW LINK ADDED HERE --- */}
        <NavLink
          to="/kitchen/pos"
          style={({ isActive }) => (isActive ? activeNavLinkStyle : navLinkStyle)}
        >
          Walk-in
        </NavLink>
        {/* --- END OF NEW LINK --- */}

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

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        
        {/* --- Conditionally render Admin Dashboard link --- */}
        {user && user.position === 'F&B Admin' && (
          <Link
            to="/admin"
            style={isHovered ? { ...baseAdminLinkStyle, ...hoverAdminLinkStyle } : baseAdminLinkStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            Go to Admin Dashboard
          </Link>
        )}

        <ProfileDropdown />
      </div>
    </nav>
  );
};

export default InternalNavBar;