//src\services\profileApi.js

import api from "./api";

/**
 * Get Merchant Profile
 * POST /api/v1/common/orders/my-profile-merchant/
 */
export const getMerchantProfile = async (payload) => {
  const res = await api.post(
    "/api/v1/common/merchant/my-profile-merchant/",
    payload
  );
  return res.data;
};
 
// /**
//  * Edit Merchant Profile (FORM-DATA)
//  * POST /api/v1/common/orders/edit-profile-merchant/
//  */
// export const editMerchantProfile = async (payload) => {
//   const formData = new FormData();

//   const appendIfExists = (key, value) => {
//     if (value !== undefined && value !== null && value !== "") {
//       formData.append(key, value);
//     }
//   };

//   appendIfExists("user", payload.user);
//   appendIfExists("full_name", payload.full_name);
//   appendIfExists("address", payload.address);
//   appendIfExists("mobile", payload.mobile);
//   appendIfExists("email", payload.email);

//   appendIfExists("gst_number", payload.gst_number);
//   appendIfExists("fssai_number", payload.fssai_number);
//   appendIfExists("pan_number", payload.pan_number);

//   appendIfExists("servicable_radius_km", payload.servicable_radius_km);

//   appendIfExists("account_number", payload.account_number);
//   appendIfExists("owner_name", payload.owner_name);
//   appendIfExists("upi_id", payload.upi_id);
//   appendIfExists("bank_name", payload.bank_name);

//   appendIfExists("city", payload.city);
//   appendIfExists("state", payload.state);
//   appendIfExists("pincode", payload.pincode);

//   if (payload.logo instanceof File) {
//     formData.append("logo", payload.logo);
//   }

//   const res = await api.post(
//   "/api/v1/common/orders/edit-profile-merchant/",
//   formData,
//   {
//     headers: {
//       "Content-Type": "multipart/form-data",
//     },
//   }
// );

//   return res.data;
// };

/**
 * Edit Working Hours
 * POST /api/v1/common/orders/edit-wh-merchant/
 */
// export const editWorkingHours = async (payload) => {
//   const res = await api.post(
//     "/api/v1/common/merchant/edit-wh-merchant/",
//     payload
//   );
//   return res.data;
// };

/**
 * Add Merchant Details (FORM-DATA)
 * POST /api/v1/common/orders/add-merchant-details/
 */
/**
 * Add Merchant Details (FORM-DATA)
 * POST /api/v1/common/orders/add-merchant-details/
 */
export const addMerchantDetails = async (payload) => {
  const formData = new FormData();

  const appendIfExists = (key, value) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  };

  // Basic Details
  appendIfExists("user", payload.user);
  appendIfExists("address", payload.address);
  appendIfExists("city", payload.city);
  appendIfExists("state", payload.state);
  appendIfExists("pincode", payload.pincode);
  appendIfExists(
    "merchant_discreption",
    payload.merchant_discreption
  );

  appendIfExists("area", payload.area);
  appendIfExists("location", payload.location);

  appendIfExists(
    "opening_time",
    payload.opening_time
  );

  appendIfExists(
    "closing_time",
    payload.closing_time
  );

  // Owner Details
  appendIfExists("owner_name", payload.owner_name);
  appendIfExists("first_name", payload.first_name);
  appendIfExists("last_name", payload.last_name);
  appendIfExists("email", payload.email);
  appendIfExists("gender", payload.gender);
  appendIfExists("dob", payload.dob);

  // Business Numbers
  appendIfExists("gst_number", payload.gst_number);
  appendIfExists("fssai_number", payload.fssai_number);
  appendIfExists("pan_number", payload.pan_number);
  appendIfExists("aadhaar_number", payload.aadhaar_number);

  // Extra Fields
  appendIfExists("commission_type", payload.commission_type);
  appendIfExists("food", payload.food);
  appendIfExists("longitude", payload.longitude);
  appendIfExists("latitude", payload.latitude);
  appendIfExists("servicable_radius_km", payload.servicable_radius_km);
  appendIfExists("bank_name", payload.bank_name);
  appendIfExists("account_number", payload.account_number);
  appendIfExists("re_account_number", payload.re_account_number);
  appendIfExists("ifsc_code", payload.ifsc_code);
  appendIfExists("upi_id", payload.upi_id);
  appendIfExists("estimated_delivery_time", payload.estimated_delivery_time);
  appendIfExists("minimum_order_amount", payload.minimum_order_amount);

  // Files
  if (payload.profile_photo instanceof File) {
    formData.append("profile_photo", payload.profile_photo);
  }

  if (payload.logo instanceof File) {
    formData.append("logo", payload.logo);
  }

  if (payload.gst_certificate instanceof File) {
    formData.append("gst_certificate", payload.gst_certificate);
  }

  if (payload.fssai_certificate instanceof File) {
    formData.append("fssai_certificate", payload.fssai_certificate);
  }

  if (payload.pan_card instanceof File) {
    formData.append("pan_card", payload.pan_card);
  }

  if (payload.business_certificate instanceof File) {
    formData.append("business_certificate", payload.business_certificate);
  }

  if (payload.aadhaar_card instanceof File) {
    formData.append("aadhaar_card", payload.aadhaar_card);
  }

  const res = await api.post(
    "/api/v1/common/merchant/add-merchant-details/",
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
 * Category Dropdown
 * GET /api/v1/common/orders/category-dropdown/
 */
// export const getCategoryDropdown = async () => {
//   const res = await api.get(
//     "/api/v1/common/orders/category-dropdown/"
//   );
//   return res.data;
// };

/**
 * Request Profile Edit Permission
 * POST /api/v1/common/orders/request-edit/
 */
export const requestProfileEdit = async () => {
  const res = await api.post(
    "/api/v1/common/merchant/request-to-edit/",
    {
      grant_me: true,
    }
  );

  return res.data;
};

export const editMerchantProfile = async (payload) => {
  const formData = new FormData();

  const appendIfExists = (key, value) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      formData.append(key, value);
    }
  };

  appendIfExists("address", payload.address);
  appendIfExists("area", payload.area);
  appendIfExists("city", payload.city);
  appendIfExists("mobile", payload.mobile);
  appendIfExists("email", payload.email);

  appendIfExists("owner_name", payload.owner_name);

  appendIfExists("gst_number", payload.gst_number);
  appendIfExists("fssai_number", payload.fssai_number);
  appendIfExists("pan_number", payload.pan_number);

  appendIfExists("food", payload.food);

  appendIfExists("latitude", payload.latitude);
  appendIfExists("longitude", payload.longitude);

  appendIfExists(
    "servicable_radius_km",
    payload.servicable_radius_km
  );

  appendIfExists("bank_name", payload.bank_name);
  appendIfExists("account_number", payload.account_number);
  appendIfExists("re_account_number", payload.re_account_number);
  appendIfExists("ifsc_code", payload.ifsc_code);
  appendIfExists("upi_id", payload.upi_id);

  appendIfExists(
    "aadhaar_number",
    payload.aadhaar_number
  );

  appendIfExists(
    "minimum_order_amount",
    payload.minimum_order_amount
  );

  appendIfExists(
    "estimated_delivery_time",
    payload.estimated_delivery_time
  );

  appendIfExists(
    "merchant_discreption",
    payload.merchant_discreption
  );

  appendIfExists(
    "opening_time",
    payload.opening_time
  );

  appendIfExists(
    "closing_time",
    payload.closing_time
  );

  appendIfExists(
    "is_online",
    payload.is_online
  );

  if (payload.logo instanceof File) {
    formData.append("logo", payload.logo);
  }

  if (payload.gst_certificate instanceof File) {
    formData.append(
      "gst_certificate",
      payload.gst_certificate
    );
  }

  if (payload.fssai_certificate instanceof File) {
    formData.append(
      "fssai_certificate",
      payload.fssai_certificate
    );
  }

  if (payload.pan_card instanceof File) {
    formData.append(
      "pan_card",
      payload.pan_card
    );
  }

  if (payload.business_certificate instanceof File) {
    formData.append(
      "business_certificate",
      payload.business_certificate
    );
  }

  if (payload.aadhaar_card instanceof File) {
    formData.append(
      "aadhaar_card",
      payload.aadhaar_card
    );
  }

  const res = await api.post(
    "/api/v1/common/merchant/edit-profile-merchant/",
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return res.data;
};