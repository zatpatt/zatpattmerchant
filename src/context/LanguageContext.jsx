// src/context/LanguageContext.jsx
import React, { createContext, useState, useContext } from "react";

// Create the context
export const LanguageContext = createContext();

// Custom hook for easier usage
export const useLanguage = () => useContext(LanguageContext);

// Provider component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en"
  );

  const setAppLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const translations = {
    en: {
      dashboard: "Dashboard",
      orders: "Orders",
      earnings: "Earnings",
      profile: "Profile",
      leaderboard: "Leaderboard",
      settings: "Settings",
      online: "Online",
      offline: "Offline",
    },
    hi: {
      dashboard: "डैशबोर्ड",
      orders: "ऑर्डर",
      earnings: "कमाई",
      profile: "प्रोफ़ाइल",
      leaderboard: "लीडरबोर्ड",
      settings: "सेटिंग्स",
      online: "ऑनलाइन",
      offline: "ऑफ़लाइन",
    },
  };

  const t = (key) => translations[language]?.[key] || key;

  return (
    <LanguageContext.Provider value={{ language, setAppLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
