import React from 'react';
import { markAsRead, markAllRead } from '../../api/NotificationApi';

export default function NotificationDropdown({ notifications, refresh }) {
  const handleMark = async (id) => {
    await markAsRead(id);
    refresh();
  };

  const handleMarkAll = async () => {
    await markAllRead();
    refresh();
  };

  return (
    <div className="absolute right-0 mt-4 w-96 bg-white shadow-premium rounded-[2rem] border border-gray-100/50 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 bg-brand-bg/50 border-b border-gray-50">
        <span className="font-bold text-brand-text font-poppins">Notifications</span>
        <button
          onClick={handleMarkAll}
          className="text-xs font-bold text-primary hover:text-primary-dark transition-colors uppercase tracking-widest"
        >
          Mark all as read
        </button>
      </div>

      <div className="max-h-[30rem] overflow-y-auto scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
             <div className="w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center mb-3">
                <span className="text-xl opacity-50">🔔</span>
             </div>
             <p className="text-brand-textSecondary font-medium italic text-sm">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`px-6 py-4 border-b border-gray-50 cursor-pointer transition-all hover:bg-brand-bg/40 relative group ${
                n.isRead ? "opacity-75" : "bg-primary/[0.03]"
              }`}
              onClick={() => handleMark(n._id)}
            >
              {!n.isRead && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-lg shadow-primary/50" />
              )}
              <div className="flex flex-col gap-1">
                <p className={`font-bold text-sm ${n.isRead ? 'text-brand-textSecondary' : 'text-brand-text'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-brand-textSecondary leading-relaxed line-clamp-2">
                  {n.body}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                  {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
