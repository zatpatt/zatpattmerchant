// src/services/dashboard.js

import api from "./api";

/**
 * Get Dashboard Data
 * POST /api/v1/common/orders/my-orders/
 */

export const getDashboardData = async (userId) => {
  const res = await api.post(
    "/api/v1/common/orders/my-orders/",
    {
      user: userId,
    }
  );

  return res.data;
};