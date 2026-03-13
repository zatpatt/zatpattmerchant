//src\services\authApi.js

import api from "./api";

/**
 * Request OTP for login
 * POST /api/v1/users/admin/request-otp/
 */
export const requestOtp = async (payload) => {
  const res = await api.post(
    "/api/v1/users/admin/request-otp/",
    {
      ...payload,
      role: "merchant", // ✅ explicitly set role
    }
  );
  return res.data;
};
