import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Import useAuth

const NotAuthorizedPage = () => {
  const { user } = useAuth(); // Get user info

  // Determine the correct "home" page based on role
  const getHomePage = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'waiter':
      case 'cashier':
        return '/kitchen';
      case 'customer':
      default:
        return '/';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4">
      <img 
        src="/images/logo_var.svg" 
        alt="Logo" 
        className="h-32 mx-auto mb-8" 
      />
      <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
      <p className="text-lg text-gray-700 mb-8">
        You do not have permission to view this page.
      </p>
      <Link
        to={getHomePage()} // Link to the user's correct home page
        className="px-6 py-3 font-semibold text-white bg-primary rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Go to Your Home Page
      </Link>
    </div>
  );
};

export default NotAuthorizedPage;