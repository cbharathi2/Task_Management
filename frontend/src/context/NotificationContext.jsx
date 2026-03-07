import React, { createContext, useState, useEffect, useContext } from 'react';
import { notificationService } from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Error loading notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false));
  }, []);

  const refreshNotifications = () => {
    fetchNotifications();
  };

  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, loading, refreshNotifications, deleteNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
