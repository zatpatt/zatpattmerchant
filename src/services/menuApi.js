import api from "./api";

/**
 * Get Merchant Menu List
 * POST /api/v1/common/orders/merchant-menu-list/
 */
export const getMerchantMenu = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/merchant-menu-list/",
    payload
  );
  return res.data;
};

/**
 * Add Merchant Menu
 * POST /api/v1/common/orders/add-menu-merchant/
 */
export const addMerchantMenu = async (payload) => {
  const formData = new FormData();

  formData.append("category", payload.category);
  formData.append("menu_name", payload.menu_name);
  formData.append("menu_description", payload.menu_description);
  formData.append("is_veg", payload.is_veg ? "True" : "False");
  formData.append("menu_price", String(payload.menu_price));
  formData.append(
  "is_active",
  payload.is_active ? "True" : "False"
);

formData.append(
  "has_quantity",
  payload.has_quantity ? "True" : "False"
);

formData.append(
  "quantity",
  String(payload.quantity || 0)
);
  formData.append("discounted_price", String(payload.discounted_price));
  formData.append("label", payload.label);
  formData.append("user", String(payload.user));
  // file upload
  if (payload.menu_image) {
    formData.append("menu_image", payload.menu_image);
  }

  const res = await api.post(
    "/api/v1/common/orders/add-menu-merchant/",
    formData,
  );

  return res.data;
};

export const getMenuCategories = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/menu-category-dropdown/",
    payload
  );
  return res.data;
};

/**
 * Get Menu Categories List
 * POST /api/v1/common/orders/list-menu-category/
 */
export const getMenuCategoryList = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/list-menu-category/",
    payload
  );
  return res.data;
};

/**
 * Add Menu Category
 * POST /api/v1/common/orders/add-menu-category/
 */
export const addMenuCategory = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/add-menu-category/",
    payload
  );
  return res.data;
};

export const getMenuDropdownCategories = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/menu-category-dropdown/",
    payload
  );
  return res.data;
};

/**
 * Add Offer
 */
export const addOffer = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/add-offers/",
    payload
  );
  return res.data;
};

/**
 * Get Offers
 */
export const getOffers = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/get-offers/",
    payload
  );
  return res.data;
};

/**
 * Edit Offer
 */
export const editOffer = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/edit-offer/",
    payload
  );
  return res.data;
};

/**
 * Merchant Menu Insights
 * POST /api/v1/common/orders/merchant-menu-insights/
 */
export const getMenuInsights = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/merchant-menu-insights/",
    payload
  );

  return res.data;
};

/**
 * Edit Menu Category
 * POST /api/v1/common/orders/edit-menu-category/
 */
export const editMenuCategory = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/edit-menu-category/",
    payload
  );

  return res.data;
};

 /**
 * Get Single Menu Detail
 * POST /api/v1/common/orders/merchant-menu-detail/
 */
export const getMerchantMenuDetail = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/merchant-menu-detail/",
    payload
  );

  return res.data;
};

/**
 * Edit Menu
 * POST /api/v1/common/orders/edit-menu-book/
 */
export const editMerchantMenu = async (
  payload
) => {

  const formData = new FormData();

  formData.append(
    "menu_id",
    String(payload.menu_id)
  );

  formData.append(
    "menu_name",
    payload.menu_name || ""
  );

  formData.append(
    "category",
    payload.category || ""
  );

  formData.append(
    "menu_description",
    payload.menu_description || ""
  );

  formData.append(
    "is_active",
    payload.is_active ? "True" : "False"
  );

  formData.append(
    "is_available",
    payload.is_available ? "True" : "False"
  );

  formData.append(
    "is_veg",
    payload.is_veg ? "True" : "False"
  );

  formData.append(
    "has_quantity",
    payload.has_quantity ? "True" : "False"
  );

  formData.append(
    "menu_price",
    String(payload.menu_price || 0)
  );

  formData.append(
    "discounted_price",
    String(payload.discounted_price || 0)
  );

  formData.append(
    "label",
    payload.label || ""
  );

  formData.append(
    "quantity",
    String(payload.quantity || 0)
  );

  formData.append(
    "user",
    String(payload.user || "")
  );

  // IMPORTANT FIX
  if (payload.menu_image instanceof File) {

    console.log(
      "REAL FILE FOUND:",
      payload.menu_image
    );

    formData.append(
      "menu_image",
      payload.menu_image,
      payload.menu_image.name
    );
  }

  // DEBUG
  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }

  const res = await api.post(
    "/api/v1/common/orders/edit-menu-book/",
    formData
  );

  return res.data;
};