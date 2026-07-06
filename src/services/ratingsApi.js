import api from "./api";

/**
 * Get Rating Summary
 */
export const getMerchantRating = async (payload) => {
  const res = await api.post(
    "/api/v1/common/merchant/merchant-get-rating/",
    payload
  );
  return res.data;
};

/**
 * Get All Reviews
 */
export const getMerchantReviews = async (payload) => {
  const res = await api.post(
    "/api/v1/common/merchant/merchant-all-review/",
    payload
  );
  return res.data;
};

/**
 * Get Review Insights
 */
export const getMerchantReviewInsights = async (payload) => {
  const res = await api.post(
    "/api/v1/common/merchant/merchant-review-insights/",
    payload
  );
  return res.data;
};

/**
 * Get Merchant Chat (Replies)
 */
export const getMerchantChats = async (payload) => {
  const res = await api.post(
    "/api/v1/common/merchant/get-chat-merchant/",
    payload
  );
  return res.data;
};
