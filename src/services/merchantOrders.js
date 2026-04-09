// src/services/merchantOrders.js

import api from "./api";

/**
 * Merchant Orders Page
 * POST /api/v1/common/orders/merchant-order-page/
 */
export const getMerchantOrders = async (userId, status, paymentStatus) => {
  const payload = {
    user: userId,
    status: status,
  };

  if (paymentStatus) {
    payload.payment_status = paymentStatus;
  }

  const res = await api.post(
    "/api/v1/common/orders/merchant-order-page/",
    payload
  );

  return res.data;
};

/**
 * Merchant Order Detail
 * POST /api/v1/common/orders/merchant-order-detail/
 */
export const getMerchantOrderDetail = async (orderId) => {
  const res = await api.post(
    "/api/v1/common/orders/merchant-order-detail/",
    {
      order_id: orderId,
    }
  );

  return res.data;
};

/**
 * Accept / Cancel Order
 * POST /api/v1/common/orders/accept-order-merchant
 */
export const acceptOrderMerchant = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/accept-order-merchant/",
    payload
  );

  return res.data;
};

/**
 * Update Order Status (Preparing / Prepared)
 * POST /api/v1/common/orders/update-order-status/
 */
export const updateOrderStatus = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/update-order-status/",
    payload
  );

  return res.data;
};

/**
 * Update Preparing Status
 * POST /api/v1/common/orders/update-preparing-status/
 */
export const updatePreparingStatus = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/update-preparing-status/",
    payload
  );
  return res.data;
};

/**
 * Update Prepared Status
 * POST /api/v1/common/orders/update-prepared-status/
 */
export const updatePreparedStatus = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/update-prepared-status/",
    payload
  );
  return res.data;
};
