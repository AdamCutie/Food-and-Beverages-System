import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

// This component is for routes like /login and /register
// If the user is already logged in, it redirects them to their default page.
const AuthRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const getRedirectPath = (role) => {
    switch (role) {
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

  if (isAuthenticated) {
    // User is logged in, redirect them away from login/register
    const path = getRedirectPath(user ? user.role : 'customer');
    return <Navigate to={path} replace />;
  }

  // User is not logged in, show the login/register page
  return children;
};

export default AuthRoute;