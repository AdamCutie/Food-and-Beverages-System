import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Corrected import
import toast from 'react-hot-toast';
import apiClient from '../utils/apiClient'; 

const AuthContext = createContext(null);

// This is the provider component that will "wrap" your entire app
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      try {
        return jwtDecode(savedToken); // Decode token on initial load
      } catch (error) {
        console.error("Failed to decode token on load", error);
        localStorage.removeItem('authToken');
        return null;
      }
    }
    return null;
  });

  const navigate = useNavigate();

  // This effect runs when the token changes to keep localStorage in sync
  useEffect(() => {
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
        localStorage.setItem('authToken', token);
      } catch (error) {
        console.error("Invalid token", error);
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
      }
    } else {
      setUser(null);
      localStorage.removeItem('authToken');
    }
  }, [token]);

  // Handles redirecting the user based on their role
  const handleRedirect = (role) => {
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'waiter':
      case 'cashier':
        navigate('/kitchen');
        break;
      case 'customer':
        navigate('/');
        break;
      default:
        console.warn(`Unknown user role: ${role}`);
        navigate('/'); // Default to customer menu
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      const response = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setToken(data.token); // This triggers the useEffect
      
      // The useEffect will decode the token, but we need the role NOW
      // to redirect. So we decode it here just for the redirect.
      const decoded = jwtDecode(data.token);
      handleRedirect(decoded.role);
      
      toast.success('Logged in successfully!');
      return true;

    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  // Register function (for customers only)
  // Register function (for customers only)
  const register = async (firstName, lastName, email, password, phone) => {
    try {
      const response = await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          phone,
          role: 'customer', 
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      toast.success('Registration successful! Please log in.');
      return true;

    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    // We will redirect to a login page (which we'll create next)
    navigate('/login');
    toast.success('Logged out.');
  };

  // The value provided to all children components
  const value = {
    token,
    user,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// This is a helper hook to easily use the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};