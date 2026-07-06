// src/services/dashboard.js

import api from "./api";

/**
 * Get Dashboard Data
 * POST /api/v1/common/orders/my-orders/
 */

export const getDashboardData = async (userId) => {
  const res = await api.post(
    "/api/v1/common/merchant/my-orders-dashboard/",
    {
      user: userId,
    }
  );

  return res.data;
};

export const updateMerchantOnlineStatus =
  async (payload) => {

    const res = await api.post(
      "/api/v1/common/merchant/merchant-online-status/",
      payload
    );

    return res.data;
};