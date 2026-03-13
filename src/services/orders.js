import api from "./api";

/**
 * Get Live Orders
 * POST /api/v1/common/orders/my-live-orders/
 */

export const getLiveOrders = async (userId) => {
  const res = await api.post(
    "/api/v1/common/orders/my-live-orders/",
    {
      user_id: userId,
    }
  );

  return res.data;
};
