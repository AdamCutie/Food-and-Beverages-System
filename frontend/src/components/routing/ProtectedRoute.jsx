import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // 1. Check if user is logged in
  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check if the user's role is in the allowedRoles array
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User is logged in but does not have permission
    return <Navigate to="/not-authorized" replace />;
  }

  // 3. User is authenticated and has the correct role
  return children;
};

export default ProtectedRoute;