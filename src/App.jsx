import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";

import LoginPage from "./pages/LoginPage";
// import SignupPage from "./pages/SignupPage";
import OtpPage from "./pages/OtpPage";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import MenuPage from "./pages/MenuPage";
import EarningsPage from "./pages/EarningsPage";
import RatingsPage from "./pages/RatingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";
import MarketingPage from "./pages/MarketingPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import { toast } from "react-hot-toast";
import ProfileGuard from "./components/ProfileGuard";

import LocationMapPage from "./pages/LocationMapPage";
import SupportChatPage from "./pages/SupportChatPage";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  return token ? children : <Navigate to="/" replace />;
}

function MerchantProtectedRoute({
  children,
}) {
  const token =
    localStorage.getItem("accessToken");

  const completion =
    Number(
      localStorage.getItem(
        "profile_completion"
      ) || 0
    );

  if (!token) {
    return <Navigate to="/" replace />;
  }

 if (completion < 100) {
  return <ProfileGuard />;
}

  return children;
}

export default function App() {
  return (
    <LanguageProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/otp" element={<OtpPage />} />

        {/* Protected Merchant Routes */}
        <Route
        path="/dashboard"
        element={
          <MerchantProtectedRoute>
            <DashboardPage />
          </MerchantProtectedRoute>
        }
      />
        <Route
            path="/orders"
            element={
              <MerchantProtectedRoute>
                <OrdersPage />
              </MerchantProtectedRoute>
            }
          />

          <Route
            path="/menu"
            element={
              <MerchantProtectedRoute>
                <MenuPage />
              </MerchantProtectedRoute>
            }
          />

          <Route
            path="/earnings"
            element={
              <MerchantProtectedRoute>
                <EarningsPage />
              </MerchantProtectedRoute>
            }
          />

          <Route
            path="/ratings"
            element={
              <MerchantProtectedRoute>
                <RatingsPage />
              </MerchantProtectedRoute>
            }
          />

<Route
  path="/support-chat"
  element={<SupportChatPage />}
/>

          <Route
            path="/location-map"
            element={
              <ProtectedRoute>
                <LocationMapPage />
              </ProtectedRoute>
            }
          />
          
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/marketing" element={<ProtectedRoute><MarketingPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route
          path="/order/:id"
          element={
            <MerchantProtectedRoute>
              <OrderDetailsPage />
            </MerchantProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LanguageProvider>
  );
}