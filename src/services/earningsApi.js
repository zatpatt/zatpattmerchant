// src/services/earningsApi.js

import api from "./api";

/**
 * Earnings Overview
 * POST /api/v1/common/orders/orders-overview/
 */
export const getEarningsOverview = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/orders-overview/",
    payload
  );

  return res.data;
};

/**
 * Request Payout
 * POST /api/v1/common/orders/merchant-request-payout/
 */
/**
 * Get Pending Payouts
 */
export const getPendingPayouts = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/merchant-pending-payouts/",
    payload
  );
  return res.data;
};

/**
 * Get Payout History
 */
export const getPayoutHistory = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/merchant-self-payout-detail/",
    payload
  );
  return res.data;
};

/**
 * Request Payout (UPDATED)
 */
export const requestMerchantPayout = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/merchant-request-payout/",
    payload
  );
  return res.data;
};

/**
 * Get Orders History
 * POST /api/v1/common/orders/orders-history/
 */
export const getOrdersHistory = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/merchant-history/",
    payload
  );
  return res.data;
};

/**
 * Get Merchant Insights
 * POST /api/v1/common/orders/merchant-insights/
 */
export const getMerchantInsights = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/merchant-insights/",
    payload
  );
  return res.data;
};