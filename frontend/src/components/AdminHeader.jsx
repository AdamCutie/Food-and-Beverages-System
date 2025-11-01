import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileDropdown from './ProfileDropdown'; // To get the logout button back

// This component is ONLY for the Admin Dashboard
const AdminHeader = () => {
  const { user } = useAuth(); // We can still use this

  // Style for the "Go to Kitchen" link
  const navLinkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '16px',
    border: '1px solid white',
  };

  return (
    <nav style={{
        backgroundColor: '#3C2A21', // The dark brown/maroon color you wanted
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
        <Link to="/admin">
          <img src="/images/logo_var.svg" alt="Logo" style={{ height: '64px' }} />
        </Link>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>
          Admin Dashboard
        </h1>
      </div>

      {/* Right: Kitchen Link & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* This is the "Go to Kitchen" link you requested */}
        <Link
          to="/kitchen"
          style={navLinkStyle}
        >
          Go to Kitchen Portal
        </Link>
        
        {/* This brings back your profile and logout button */}
        <ProfileDropdown />
      </div>
    </nav>
  );
};

export default AdminHeader;