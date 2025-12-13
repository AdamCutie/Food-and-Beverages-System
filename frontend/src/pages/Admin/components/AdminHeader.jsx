import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import ProfileDropdown from '../../../components/ProfileDropdown';

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

const [isHovered, setIsHovered] = useState(false);

// This is the base style (maroon background, white text/border)
const baseLinkStyle = {
  color: 'white',
  backgroundColor: '#480c1b', // Your maroon background
  border: '1px solid white',
  textDecoration: 'none',
  padding: '8px 12px',
  borderRadius: '6px',
  fontWeight: 'bold',
  fontSize: '16px',
  transition: 'background-color 0.2s', // Smooth transition
};

// This style will be applied on hover
const hoverLinkStyle = {
  backgroundColor: '#F9A825', // Your orange accent
  color: '#3C2A21', // Dark text for contrast
  border: '1px solid #F9A825',
};

  return (
    <nav style={{
        backgroundColor: '#330813ff',
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
          <img src="/images/foodAndBeverages.png" alt="Logo" style={{ height: '64px' }} />
        </Link>
      </div>
      
      <div>
      <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#F9A825' }}>
          Admin Dashboard
        </h1>
      </div>
      {/* Right: Kitchen Link & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* This is the "Go to Kitchen" link you requested */}
        <Link
       to="/kitchen"
       style={isHovered ? { ...baseLinkStyle, ...hoverLinkStyle } : baseLinkStyle}
       onMouseEnter={() => setIsHovered(true)}
       onMouseLeave={() => setIsHovered(false)}
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