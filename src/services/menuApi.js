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
  formData.append("discounted_price", String(payload.discounted_price));
  formData.append("label", payload.label);
  formData.append("user", String(payload.user));
  // file upload
  if (payload.manu_image) {
    formData.append("manu_image", payload.manu_image);
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
