import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth(); // <--- Get 'user' object too
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Fetch Logic
  const fetchNotifications = async () => {
    // 🛑 SECURITY CHECK: Only fetch if logged in AND is a Customer
    if (!isAuthenticated || !user || user.role !== 'customer') return; 

    try {
      const res = await apiClient('/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // Silent fail
    }
  };

  // 2. Polling Effect (Runs every 10 seconds)
  useEffect(() => {
    // 🛑 SECURITY CHECK: Only run polling for Customers
    if (isAuthenticated && user?.role === 'customer') {
        fetchNotifications(); // Initial fetch
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    } else {
        // Clear data if not a customer (e.g., Admin logged in)
        setNotifications([]);
        setUnreadCount(0);
    }
  }, [isAuthenticated, user]); // <--- Re-run if user changes

  // 3. Actions
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
        await apiClient('/notifications/mark-read', { method: 'PUT' });
        setUnreadCount(0); 
    } catch (err) {
        console.error("Failed to mark read");
    }
  };

  const deleteNotification = async (id) => {
    try {
        const res = await apiClient(`/notifications/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed");
        setNotifications(prev => prev.filter(n => n.notification_id !== id));
        toast.success('Notification removed');
    } catch (err) {
        toast.error('Could not delete notification');
    }
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm("Clear all notifications?")) return;

    try {
        const res = await apiClient('/notifications/clear-all', { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed");
        setNotifications([]);
        setUnreadCount(0);
        toast.success('All notifications cleared');
    } catch (err) {
        toast.error('Could not clear notifications');
    }
  };

  return (
    <NotificationContext.Provider value={{
        notifications,
        unreadCount,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        refreshNotifications: fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);