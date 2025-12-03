import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

// Detect environment to automatically set the correct URL
const SOCKET_URL = import.meta.env.MODE === 'production' 
  ? 'https://food-and-beverages-system.onrender.com' 
  : 'http://localhost:21917';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only connect if the user is authenticated
    if (isAuthenticated && user) {
      const newSocket = io(SOCKET_URL, {
        withCredentials: true, // Crucial for CORS
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('✅ Connected to WebSocket:', newSocket.id);

        // 1. Join "Kitchen" room (For Kitchen Staff & Admins)
        if (user.position === 'Kitchen Staffs' || user.position === 'F&B Admin') {
          newSocket.emit('join-role', 'kitchen');
        }

        // 2. Join "POS" room (For Cashiers & Admins)
        if (user.position === 'Cashier' || user.position === 'F&B Admin') {
          newSocket.emit('join-role', 'pos');
        }

        // 3. Join "Admin" room (For Dashboard stats)
        if (user.position === 'F&B Admin') {
            newSocket.emit('join-role', 'admin');
        }

        // 4. Join Personal room (For specific notifications like "Your order is ready")
        if (user.id) {
            newSocket.emit('join-role', `user-${user.id}`);
        }
      });

      // Cleanup on logout
      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user]); 

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};