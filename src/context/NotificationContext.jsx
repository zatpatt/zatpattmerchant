// src/context/NotificationContext.jsx
import React, { createContext, useCallback, useState } from "react";

export const NotificationContext = createContext({
  notifications: [],
  addNotification: (msg) => {},
  clearNotifications: () => {},
});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((msg) => {
    const id = Date.now() + Math.random();
    setNotifications((s) => [{ id, msg, ts: Date.now() }, ...s]);
    // keep notifications short-lived in localStorage (optional)
    try {
      localStorage.setItem("merchant_last_notification", JSON.stringify({ id, msg, ts: Date.now() }));
    } catch {}
    return id;
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}
