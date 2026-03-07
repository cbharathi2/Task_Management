import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiX } from 'react-icons/fi';
import { useNotifications } from '../context/NotificationContext';


const NotificationIcon = ({ onRefresh }) => {
  const { notifications, refreshNotifications, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef();

  useEffect(() => {
    if (open) {
      refreshNotifications();
    }
  }, [open]);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error deleting notification', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        className="relative p-2 hover:bg-dark-card-hover rounded-full transition-smooth"
        onClick={() => setOpen(!open)}
        title="Notifications"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute -right-2 sm:right-0 mt-2 w-[20rem] max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto bg-dark-card border border-white/10 rounded-xl shadow-xl z-50">
          <div className="p-3 border-b border-dark-border flex justify-between items-center gap-2">
            <span className="font-semibold text-text-primary">Notifications</span>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-dark-card-hover">
              <FiX />
            </button>
          </div>
          <div className="p-3 space-y-2">
            {notifications.length === 0 && <p className="text-xs text-text-muted">No notifications</p>}
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-2 p-2 bg-dark-card-hover rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-text-primary">{n.message || n.type}</p>
                  <p className="text-xs text-text-secondary">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => handleDelete(n.id)} className="p-1 rounded hover:bg-dark-border/40">
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;