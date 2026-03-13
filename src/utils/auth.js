//src\utils\auth.js

export const saveAuthData = ({ access, refresh, user }) => {
  localStorage.setItem("accessToken", access);
  if (refresh) localStorage.setItem("refreshToken", refresh);
  if (user) localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("role", user?.role || "merchant"); // ✅ save role
};

export const getAccessToken = () =>
  localStorage.getItem("accessToken");

export const getUser = () => {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
};

export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("role"); // ✅ clear role
  window.location.href = "/";
};

export const isAuthenticated = () =>
  !!localStorage.getItem("accessToken");

// ADD THIS at the bottom of auth.js:
export const getUserRole = () =>
  localStorage.getItem("role") || "merchant";

export const isMerchant = () =>
  localStorage.getItem("role") === "merchant";