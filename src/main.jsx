//src\main.jsx

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { NotificationProvider } from "./context/NotificationContext";

import GoogleMapsProvider
from "./components/GoogleMapsProvider";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleMapsProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </GoogleMapsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
