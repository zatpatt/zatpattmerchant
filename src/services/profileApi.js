//src\services\profileApi.js

import api from "./api";

/**
 * Get Merchant Profile
 * POST /api/v1/common/orders/my-profile-merchant/
 */
export const getMerchantProfile = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/my-profile-merchant/",
    payload
  );
  return res.data;
};

/**
 * Edit Merchant Profile (FORM-DATA)
 * POST /api/v1/common/orders/edit-profile-merchant/
 */
export const editMerchantProfile = async (payload) => {
  const formData = new FormData();

  const appendIfExists = (key, value) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  };

  appendIfExists("user", payload.user);
  appendIfExists("full_name", payload.full_name);
  appendIfExists("address", payload.address);
  appendIfExists("mobile", payload.mobile);
  appendIfExists("email", payload.email);

  appendIfExists("gst_number", payload.gst_number);
  appendIfExists("fssai_number", payload.fssai_number);
  appendIfExists("pan_number", payload.pan_number);

  appendIfExists("servicable_radius_km", payload.servicable_radius_km);

  appendIfExists("account_number", payload.account_number);
  appendIfExists("owner_name", payload.owner_name);
  appendIfExists("upi_id", payload.upi_id);
  appendIfExists("bank_name", payload.bank_name);

  appendIfExists("city", payload.city);
  appendIfExists("state", payload.state);
  appendIfExists("pincode", payload.pincode);

  if (payload.logo instanceof File) {
    formData.append("logo", payload.logo);
  }

  const res = await api.post(
  "/api/v1/common/orders/edit-profile-merchant/",
  formData,
  {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }
);

  return res.data;
};

/**
 * Edit Working Hours
 * POST /api/v1/common/orders/edit-wh-merchant/
 */
export const editWorkingHours = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/edit-wh-merchant/",
    payload
  );
  return res.data;
};
