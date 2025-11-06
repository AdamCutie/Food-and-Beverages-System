import React from 'react';
import { X, Bell } from 'lucide-react'; // We'll use the Bell icon for list items

const NotificationPanel = ({
  notifications = [], // This will be our list of notification objects
  isOpen,
  onClose,
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
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
              <X size={24} />
            </button>
          </div>

          {/* Notification List Area */}
          <div className="flex-1 overflow-y-auto pr-2 mb-4">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                You have no new notifications.
              </p>
            ) : (
              <div className="space-y-4">
                {/* We will map over the notifications in reverse to show newest first */}
                 {notifications.map((notif) => (
                  <div key={notif.notification_id} className="flex items-start p-3 bg-white rounded-lg shadow-sm">
                    <div className="p-2 bg-green-100 rounded-full mr-3">
                      <Bell size={20} className="text-green-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{notif.title}</p>
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