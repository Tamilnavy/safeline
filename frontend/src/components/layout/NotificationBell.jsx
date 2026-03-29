import React, { useState, useEffect } from 'react';
import { Bell, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?unreadOnly=false');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Optional polling every 30s
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notif) => {
    setShowDropdown(false);
    if (!notif.read) {
      try {
        await api.put(`/notifications/${notif.id}/read`);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }
    // Navigate to complaint
    if (notif.complaintId) {
      navigate(`/dashboard/complaint/${notif.complaintId}`);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Don't trigger navigation
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center relative transition-colors"
      >
        <Bell size={20} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <React.Fragment>
          <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowDropdown(false)} />
          <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-black text-slate-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} title="Mark all as read" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors">
                    Read All
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={handleDeleteAll} title="Delete all notifications" className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
                <button onClick={() => setShowDropdown(false)} title="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold">All caught up!</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`block w-full text-left p-4 border-b border-slate-50 transition-colors cursor-pointer hover:bg-slate-50 pb-5 group
                      ${!notif.read ? 'bg-indigo-50/30' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-2 min-w-0">
                        {!notif.read && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className={`text-xs ${!notif.read ? 'font-black text-slate-900' : 'font-semibold text-slate-700'} leading-snug break-words`}>
                            {notif.message}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                            {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => handleDelete(e, notif.id)}
                        className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all shrink-0"
                        title="Delete"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default NotificationBell;
