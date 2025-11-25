import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";

import LoginPage from "./pages/LoginPage";
import OtpPage from "./pages/OtpPage";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import MenuPage from "./pages/MenuPage";
import EarningsPage from "./pages/EarningsPage";
import RatingsPage from "./pages/RatingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";
import MarketingPage from "./pages/MarketingPage";

export default function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/earnings" element={<EarningsPage />} />
        <Route path="/ratings" element={<RatingsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LanguageProvider>
  );
}
