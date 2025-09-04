import React, { createContext, useContext, useState } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children, user }) => {
  const [notifications, setNotifications] = useState({
    "0": [], // All notifications
    "2": [], // User-specific notifications
    "4": [], // Admin notifications
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState({ "0": 0, "2": 0, "4": 0 });

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        setNotifications,
        unreadCount,
        setUnreadCount,
        total,
        setTotal,
        user,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
};