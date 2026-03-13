//src\services\otpApi.js

import api from "./api";

/**
 * Verify OTP
 * POST /api/v1/users/admin/verify-otp/
 */
export const verifyOtp = async ({ mobile, otp }) => {
  const res = await api.post(
    "/api/v1/users/admin/verify-otp/",
    {
      mobile,
      otp,
    }
  );
  return res.data;
};
