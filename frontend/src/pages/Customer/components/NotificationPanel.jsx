import React from 'react';
import { X, Bell, Trash2 } from 'lucide-react'; // <-- Import Trash2

const NotificationPanel = ({
  notifications = [],
  isOpen,
  onClose,
  onDeleteOne, // <-- NEW prop
  onClearAll, // <-- NEW prop
}) => {
  return (
    <>
      {/* Backdrop (for clicking off the modal) */}
      <div
        className={`fixed inset-0 bg-black/75 z-20 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* The Sliding Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-orange-50 shadow-lg z-30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Notifications</h2>
            
            {/* --- NEW BUTTONS WRAPPER --- */}
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                  title="Clear all notifications"
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
              )}
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                <X size={24} />
              </button>
            </div>
            {/* --- END NEW BUTTONS WRAPPER --- */}
          </div>

          {/* Notification List Area */}
          <div className="flex-1 overflow-y-auto pr-2 mb-4">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                You have no new notifications.
              </p>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div 
                    key={notif.notification_id} 
                    className="relative flex items-start p-3 bg-white rounded-lg shadow-sm" // <-- Added 'relative'
                  >
                    {/* --- NEW INDIVIDUAL DELETE BUTTON --- */}
                    <button
                      onClick={() => onDeleteOne(notif.notification_id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      title="Delete notification"
                    >
                      <X size={16} />
                    </button>
                    {/* --- END NEW BUTTON --- */}
                    
                    <div className="p-2 bg-green-100 rounded-full mr-3">
                      <Bell size={20} className="text-green-700" />
                    </div>
                    <div>
                      {/* Added 'pr-4' to give title space from the 'X' button */}
                      <p className="font-semibold text-gray-800 pr-4">{notif.title}</p>
                      <p className="text-sm text-gray-600">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;