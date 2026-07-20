// src/pages/MenuPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Edit,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getMerchantMenu,
  addMerchantMenu,
  getMenuCategoryList,
  getMenuDropdownCategories,
  addMenuCategory,
  addOffer,
  getOffers,
  editOffer,
  getMenuInsights,
  editMenuCategory,
  getMerchantMenuDetail,
  editMerchantMenu,
} from "../services/menuApi";


/**
 * MenuPage.jsx
 *
 * Features implemented (ready-to-paste):
 * - Tabs: All Items | Categories | Add Item | Add Service | Add All-in-one | Promotions | Insights
 * - Items are typed: "item" | "service" | "allinone"
 * - Category CRUD + visible toggle (hide/unhide). Hidden categories hide items in All Items.
 * - Add / Edit items & services & all-in-one with validation, MRP/Price/Discount logic.
 * - Sorting, filtering, search in "All Items".
 * - Import/Export JSON and CSV download. Option C: exports separate CSVs for items/services/allinone.
 * - Promotions: coupon create/delete with validations.
 * - Insights: top selling (derived if revenue exists), low stock, category performance chart.
 * - Edit modal uses light orange backdrop (not black) as requested.
 *
 * Storage keys:
 * - merchant_categories
 * - merchant_items
 * - merchant_coupons
 *
 * Notes:
 * - This is front-end only and stores everything in localStorage.
 * - Replace with API calls for production.
 */

const CATS_KEY = "merchant_categories";
const ITEMS_KEY = "merchant_items";

/* ---------- helpers ---------- */
const onlyDigits = (v = "") => String(v || "").replace(/\D/g, "");
const clampDiscount = (v) => {
  const n = Number(v || 0);
  if (isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
};
const priceFromMrpDiscount = (mrp, discount) => {
  const m = Number(mrp || 0);
  const d = Number(discount || 0);
  if (!m) return 0;
  return Math.round(m * (1 - d / 100));
};
const discountFromPrices = (mrp, price) => {
  const m = Number(mrp || 0);
  const p = Number(price || 0);
  if (!m) return 0;
  const d = Math.round(((m - p) / m) * 100);
  return Math.max(0, Math.min(100, d));
};
const downloadFile = (content, filename, mime = "text/csv") => {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ---------- empty templates ---------- */
const emptyItem = {
  name: "",
  mrp: "",
  price: "",
  discount: "",
  stock: "",
  quantity: "",
  has_quantity: false,
  is_veg: true,
  is_active: true,
  desc: "",
  tags: "",
  unit: "",
  category: "",
  image: "",
  file: null,
  type: "item",
};
const emptyService = {
  name: "",
  price: "",
  duration: "",
  slots: "",
  desc: "",
  tags: "",
  category: "",
  image: "",
  type: "service",
};
const emptyAllInOne = {
  name: "",
  mrp: "",
  price: "",
  discount: "",
  stock: "",
  desc: "",
  tags: "",
  unit: "",
  category: "",
  image: "",
  type: "allinone",
};
const emptyCoupon = {
  code: "",
  kind: "percent", // percent | flat
  value: "",
  minOrder: "",
  expiry: "",
};

/* ---------- component ---------- */
export default function MenuPage() {
  // tabs
  const tabs = [
    "items",
    "categories",
    "add",
    "add-service",
    "add-allinone",
    "promotions",
    "insights",
  ];
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("menu_active_tab") || "items";
  });

  useEffect(() => {

    if (loadingMenu) return;

  localStorage.setItem("menu_active_tab", activeTab);
}, [activeTab]);


  // persisted data

  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ITEMS_KEY) || "[]");
    } catch {
      return [];
    }
  });
  

  // local UI states
  const [newCategory, setNewCategory] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | item | service | allinone
  const [sortKey, setSortKey] = useState(""); // "" | name_asc | price_desc | price_asc
  const [newItemState, setNewItemState] = useState(emptyItem);
  const [newServiceState, setNewServiceState] = useState(emptyService);
  const [newAllInOneState, setNewAllInOneState] = useState(emptyAllInOne);
  const [editing, setEditing] = useState(null); // object clone of item being edited
  const [priceError, setPriceError] =
  useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [couponState, setCouponState] = useState(emptyCoupon);
  const [menuData, setMenuData] = useState([]);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [dropdownCategories, setDropdownCategories] = useState([]);
  const [editOfferData, setEditOfferData] = useState(null);
  const [showEditOfferModal, setShowEditOfferModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [showAddMenuModal, setShowAddMenuModal] = useState(false);

  const [savingMenu, setSavingMenu] =
  useState(false);

  const [savingEdit, setSavingEdit] =
    useState(false);

  const [savingCategory, setSavingCategory] =
    useState(false);

  const [savingOffer, setSavingOffer] =
    useState(false);

  const [savingOfferEdit, setSavingOfferEdit] =
    useState(false);

  const [statusUpdating, setStatusUpdating] =
    useState(false);

  const [loadingMenu, setLoadingMenu] =
    useState(false);

  const handleEditOffer = async () => {

    if (savingOfferEdit) return;

  try {

    setSavingOfferEdit(true);

    const payload = {
      promotion_id: editOfferData.promotion_id,
      user: 88,
      promo_type: editOfferData.promo_type,
      value: editOfferData.value,
      min_order_amount: Number(editOfferData.min_order_amount),
      start_date: editOfferData.start_date,
      end_date: editOfferData.end_date,
      usage_limit: Number(editOfferData.usage_limit),
      budget: Number(editOfferData.budget),
      region: null,
    };

    const res = await editOffer(payload);

    if (res?.status) {
     toast.success("Offer updated successfully");
      setShowEditOfferModal(false);
      fetchOffers();
    }
  } catch (err) {
    console.error("Edit error:", err);
  }
  finally {
  setSavingOfferEdit(false);
}
};

  const fetchOffers = async () => {
  try {
    const res = await getOffers({ user: 88 });

    console.log("Offers API:", res);

    if (res?.status) {
      setOffers(res.data || []);
    }
  } catch (err) {
    console.error("Offers error:", err);
  }
};

useEffect(() => {
  if (activeTab === "promotions") {
    fetchOffers();
  }
}, [activeTab]);

const handleAddOffer = async () => {

  if (savingOffer) return;

  try {

    setSavingOffer(true);

    const payload = {
      user: 88,
      promo_type: offerForm.promo_type,
      value: offerForm.value || null,
      min_order_amount: Number(offerForm.min_order_amount),
      start_date: offerForm.start_date,
      end_date: offerForm.end_date,
      usage_limit: Number(offerForm.usage_limit),
      budget: Number(offerForm.budget),
      region: null,
    };

    console.log("Add Offer Payload:", payload);

    const res = await addOffer(payload);

    if (res?.status) {
      toast.success("Offer added successfully");

      fetchOffers();

      setOfferForm({
        promo_type: "discount",
        value: "",
        min_order_amount: "",
        start_date: "",
        end_date: "",
        usage_limit: "",
        budget: "",
      });
    }
  } catch (err) {
    console.error("Add offer error:", err);
  }
  finally {
  setSavingOffer(false);
}
};

  const handleAddCategory = async () => {

    if (savingCategory) return;

  try {

    setSavingCategory(true);

    if (!newCategory.trim()) {
      toast.error("Category name required");
return;
    }

    const res = await addMenuCategory({
      user: 88,
      name: newCategory,
    });

    console.log("Add Category API:", res);

    if (res?.status) {
      toast.success("Category added successfully");

      setNewCategory("");

      // reload categories
      fetchCategories();
    }
  } catch (err) {
    console.error("Add category error:", err);
  }
  finally {
  setSavingCategory(false);
}
};

// Category PAGE list
const fetchCategories = async () => {
  try {
    const res = await getMenuCategoryList({ user: 88 });

    if (res?.status) {

  // remove empty/broken categories
  const cleaned = (res.data || []).filter(
    (cat) =>
      (cat.name && cat.name.trim() !== "") ||
      (cat.category_name && cat.category_name.trim() !== "")
  );

 const normalized = cleaned.map((cat) => ({
  ...cat,
  is_active:
    String(cat.is_active) === "true" ||
    String(cat.is_active) === "True" ||
    cat.is_active === 1 ||
    cat.is_active === true,
}));

setCategoryList(normalized);
}
  } catch (err) {
    console.error(err);
  }
};

// Dropdown categories
const fetchDropdownCategories = async () => {
  try {
    const res = await getMenuDropdownCategories({ user: 88 });

    if (res?.status) {

  const cleaned = (res.data || []).filter(
    (cat) =>
      (cat.name && cat.name.trim() !== "") ||
      (cat.category_name && cat.category_name.trim() !== "")
  );

  setDropdownCategories(cleaned);
}
  } catch (err) {
    console.error(err);
  }
};

// useEffect(() => {
//   fetchCategories();
//   fetchDropdownCategories();
// }, []);

useEffect(() => {
  const loadData = async () => {

    if (activeTab === "items") {
      await fetchDropdownCategories();
      fetchMenu(sortKey, filterCategory);
    }

    if (activeTab === "categories") {
      fetchCategories();
    }

    if (activeTab === "add") {
      fetchDropdownCategories();
    }

    if (activeTab === "promotions") {
      fetchOffers();
    }

    if (activeTab === "insights") {
      fetchInsights();
    }
  };

  loadData();

}, [activeTab, sortKey, filterCategory]);


  const handleAddMenu = async () => {

    if (savingMenu) return;

  try {

    setSavingMenu(true);

   const payload = {
  category: newItemState.category,

  menu_name: newItemState.name,

  menu_description: newItemState.desc,

  is_veg: newItemState.is_veg,

  is_active: newItemState.is_active,

  has_quantity:
    newItemState.has_quantity,

  quantity:
    newItemState.has_quantity
      ? Number(
          newItemState.quantity || 0
        )
      : 0,

  menu_price: newItemState.mrp,

  discounted_price:
    newItemState.price,

  label:
    newItemState.tags || "normal",

  user: 88,

  menu_image: newItemState.file,
};

    const res = await addMerchantMenu(payload);

    console.log("Add menu response:", res);

   if (res?.status) {

  toast.success(
    "Menu added successfully"
  );

  setNewItemState(emptyItem);

  setShowAddMenuModal(false);

  fetchMenu();
}
  } catch (err) {
    console.error("Add menu error:", err);
  }
  finally {
  setSavingMenu(false);
}
};

const fetchMenu = async (
  selectedSort = sortKey,
  selectedCategory = filterCategory
) => {
  try {

    setLoadingMenu(true);

    const userId = localStorage.getItem("user_id");

    const payload = {
      user: userId,
    };

    // backend sorting
    if (selectedSort) {
      payload.sort_by = selectedSort;
    }

    // backend category filter
    if (selectedCategory) {
      const selectedCat = dropdownCategories.find(
        (c) =>
          String(c.id || c.category_id) ===
          String(selectedCategory)
      );

      if (selectedCat) {
        payload.category_sort =
          selectedCat.name ||
          selectedCat.category_name;
      }
    }
    
    console.log("Menu Payload:", payload);

    const res = await getMerchantMenu(payload);

    console.log("Menu API:", res);

    if (res?.status) {
      const data = res?.data;

      if (Array.isArray(data)) {
       const normalized = data.map((item) => ({
        

  ...item,

  // IMAGE FIX
  menu_image: item.menu_image
    ? item.menu_image.startsWith("http")
      ? item.menu_image
      : `${import.meta.env.VITE_API_URL}${item.menu_image}`
    : "",

  is_active:
    String(item.is_active) === "true" ||
    String(item.is_active) === "True" ||
    item.is_active === true ||
    item.is_active === 1,

  is_available:
    String(item.is_available) === "true" ||
    String(item.is_available) === "True" ||
    item.is_available === true ||
    item.is_available === 1,

  is_veg:
    String(item.is_veg) === "true" ||
    String(item.is_veg) === "True" ||
    item.is_veg === true ||
    item.is_veg === 1,

  has_quantity:
    String(item.has_quantity) === "true" ||
    String(item.has_quantity) === "True" ||
    item.has_quantity === true ||
    item.has_quantity === 1,

  quantity: Number(item.quantity || 0),
}));

setMenuData(normalized);

      } else if (Array.isArray(data?.items)) {
        setMenuData(data.items);
      } else {
        setMenuData([]);
      }
    }
  } catch (err) {
    console.error("Menu API error:", err);
    setMenuData([]);
  }
  finally {
  setLoadingMenu(false);
}
};
 
const fetchInsights = async () => {
  try {
    const userId = localStorage.getItem("user_id");

    if (!userId) return;

    const res = await getMenuInsights({
      user: userId,
    });

    console.log("Insights API:", res);

    if (res?.status) {
      setInsights(res.data || {});
    }
  } catch (err) {
    console.error("Insights error:", err);
  }
};

// useEffect(() => {
//   if (activeTab === "items") {
//     fetchMenu(sortKey, filterCategory);
//   }
// }, [sortKey, filterCategory]);;

  // ensure localStorage sync on changes

  useEffect(() => {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  }, [items]);


  // live update if other tabs / windows change storage
  useEffect(() => {
    const onStorage = (e) => {      
      if (e.key === ITEMS_KEY) {
        setItems(JSON.parse(e.newValue || "[]"));
      }
      
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ---------- Category CRUD ---------- */
  
  const toggleCategoryStatus = async (category) => {
  try {
    const payload = {
      menu_category_id:
        category.id || category.menu_category_id,

      is_active: !category.is_active,
    };

    const res = await editMenuCategory(payload);

    if (res?.status) {
      toast.success(
        !category.is_active
          ? "Category activated"
          : "Category deactivated"
      );

      fetchCategories();
      fetchDropdownCategories();
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to update category");
  }
};

const handleEditCategory = async () => {

  if (savingCategory) return;

  try {

    setSavingCategory(true);

    if (!editingCategory?.name?.trim()) {
      toast.error("Category name required");
      return;
    }

    const payload = {
      menu_category_id:
        editingCategory.id ||
        editingCategory.menu_category_id,

      name: editingCategory.name,
      is_active: editingCategory.is_active,
    };

    const res = await editMenuCategory(payload);

    if (res?.status) {
      toast.success("Category updated successfully");

      setShowEditCategoryModal(false);
      setEditingCategory(null);

      fetchCategories();
      fetchDropdownCategories();
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to update category");
  }
  finally {
  setSavingCategory(false);
}
};

  /* ---------- Items CRUD ---------- */
  const validateRequiredItem = (it) => {
    if (!it.name.trim()) return "Name required";
    if (!it.category.trim()) return "Category required";
    // price & mrp for item / allinone
    if (it.type === "item" || it.type === "allinone") {
      if (!String(it.mrp || "").trim()) return "MRP required";
      if (!String(it.price || "").trim()) return "Price required";
    } else if (it.type === "service") {
      if (!String(it.price || "").trim()) return "Service price required";
      if (!String(it.duration || "").trim()) return "Duration required";
    }
    return null;
  };

  const addNewItem = (payload) => {
    const it = { ...payload, id: Date.now(), available: true };
    const err = validateRequiredItem(it);
    if (err) {
  toast.error(err);
  return;
}
    // numeric conversions
    it.mrp = Number(it.mrp || 0);
    it.price = Number(it.price || 0);
    if (it.discount === "" || it.discount === null) it.discount = discountFromPrices(it.mrp, it.price);
    it.discount = clampDiscount(it.discount);
    it.quantity = Number(it.quantity || 0);
    setItems([it, ...items]);
    // clear form by type
    if (it.type === "item") setNewItemState(emptyItem);
    if (it.type === "service") setNewServiceState(emptyService);
    if (it.type === "allinone") setNewAllInOneState(emptyAllInOne);
    setActiveTab("items");
  };

  const toggleAvailability = async (item) => {

    if (statusUpdating) return;

  try {

    setStatusUpdating(true);

    const payload = {
  menu_id: String(item.menu_id || item.id),

  menu_name: item.menu_name,
  category: item.category,
  menu_description: item.menu_description,

  is_active: !item.is_active,
  is_available: item.is_available,
  is_veg: item.is_veg,
  has_quantity: item.has_quantity,

  menu_price: item.menu_price,
  discounted_price: item.discounted_price,

  label: item.label,
  quantity: item.quantity,

  user: localStorage.getItem("user_id"),
};

    const res =
      await editMerchantMenu(payload);

    if (res?.status) {

      toast.success(
        !item.is_active
          ? "Menu activated"
          : "Menu deactivated"
      );

      fetchMenu();
    }

  } catch (err) {

    console.error(err);

    toast.error(
      "Failed to update status"
    );
  }
  finally {
  setStatusUpdating(false);
}
};

 const deleteItem = (id) => {
  setDeleteItemId(id);
  setShowDeleteModal(true);
};

const confirmDeleteItem = () => {
  setItems(items.filter((i) => i.id !== deleteItemId));

  toast.success("Item deleted successfully");

  setShowDeleteModal(false);
  setDeleteItemId(null);
};

const openEdit = async (item) => {
  try {

    console.log("EDIT ITEM", item);

   const userId =
  localStorage.getItem("user_id");

const res =
  await getMerchantMenuDetail({
    menu_id: String(
      item.menu_id || item.id
    ),

    user: String(userId),
  });

    console.log("Menu Detail:", res);

    if (res?.status) {
    setEditing({
  ...res.data,

  // IDS
  menu_id:
    res.data.menu_id || "",

  category:
    res.data.category ||
    res.data.category_id ||
    "",

   menu_image_preview:
  res.data.menu_image
    ? res.data.menu_image.startsWith("http")
      ? res.data.menu_image
      : `${import.meta.env.VITE_API_URL}${res.data.menu_image}`
    : "",

  // TEXT
  menu_name:
    res.data.menu_name || "",

  menu_description:
    res.data.menu_description || "",

  label:
    res.data.label || "",

  // PRICES
  menu_price:
    res.data.menu_price || "",

  discounted_price:
    res.data.discounted_price || "",

  quantity:
    res.data.quantity || "",

  // BOOLEAN SAFE MAP
  is_active:
    String(res.data.is_active) === "true" ||
    String(res.data.is_active) === "True" ||
    res.data.is_active === true ||
    res.data.is_active === 1,

  is_available:
    String(res.data.is_available) === "true" ||
    String(res.data.is_available) === "True" ||
    res.data.is_available === true ||
    res.data.is_available === 1,

  is_veg:
    String(res.data.is_veg) === "true" ||
    String(res.data.is_veg) === "True" ||
    res.data.is_veg === true ||
    res.data.is_veg === 1,

  has_quantity:
    String(res.data.has_quantity) === "true" ||
    String(res.data.has_quantity) === "True" ||
    res.data.has_quantity === true ||
    res.data.has_quantity === 1,
});

      setShowEditModal(true);
    }

  } catch (err) {
    console.error(err);

    toast.error("Failed to load menu details");
  }
};

 const saveEdit = async () => {

  if (savingEdit) return;

  if (priceError) {
  toast.error(priceError);
  return;
}
  try {

    setSavingEdit(true);

   const payload = {

  menu_id: String(
    editing.menu_id || editing.id
  ),

  user: String(
    localStorage.getItem("user_id")
  ),

  menu_name:
    editing.menu_name,

 category: String(editing.category),

  is_active:
    editing.is_active,

  is_available:
    editing.is_available,

  is_veg:
    editing.is_veg,

  has_quantity:
    editing.has_quantity,

  menu_price:
    editing.menu_price,

  discounted_price:
    editing.discounted_price,

  menu_description:
    editing.menu_description,

  label:
    editing.label,

  quantity:
  editing.has_quantity
    ? Number(editing.quantity || 0)
    : 0,

   menu_image: editing.file,
};

    console.log("EDIT PAYLOAD", payload);

    const res = await editMerchantMenu(payload);

    if (res?.status) {
      toast.success("Menu updated");

      setShowEditModal(false);

      setEditing(null);

      fetchMenu();
    }
  } catch (err) {
    console.error(err);

    toast.error("Failed to update menu");
  }
  finally {
  setSavingEdit(false);
}
};

  /* ---------- Import / Export ---------- */
  const importJSON = (file, targetType = "items") => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!Array.isArray(parsed)) return toast.error("Invalid JSON: expected an array");
        if (targetType === "items") {
          // ensure shape, then prepend
          const normalized = parsed.map((p) => ({ ...emptyItem, ...p, id: p.id || Date.now() + Math.random() }));
          setItems((s) => [...normalized, ...s]);
        } else if (targetType === "categories") {
          const normalized = parsed.map((p) => ({ id: p.id || Date.now() + Math.random(), name: p.name || "Unnamed", visible: p.visible !== false }));
          setCategories((s) => [...normalized, ...s]);
        } else if (targetType === "coupons") {
          const normalized = parsed.map((p) => ({ ...emptyCoupon, ...p, id: p.id || Date.now() + Math.random() }));
          setCoupons((s) => [...normalized, ...s]);
        }
      } catch (e) {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const exportAllJSON = () => {
    const data = {
      categories,
      items,
      coupons,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "menu-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Option C: separate CSVs for items/services/allinone
  const exportCSVsSeparate = () => {
    const rowsFor = (type) => {
      const rows = items.filter((it) => it.type === type).map((it) => ({
        id: it.id,
        name: it.name,
        type: it.type,
        mrp: it.mrp || "",
        price: it.price || "",
        discount: it.discount || "",
        stock: it.quantity || "",
        duration: it.duration || "",
        slots: it.slots || "",
        desc: it.desc || "",
        tags: it.tags || "",
        unit: it.unit || "",
        category: it.category || "",
      }));
      return rows;
    };

    const toCSV = (rows) => {
      if (!rows.length) return "";
      const keys = Object.keys(rows[0]);
      const header = keys.join(",");
      const body = rows.map((r) => keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      return `${header}\n${body}`;
    };

    const itemsCSV = toCSV(rowsFor("item"));
    const servicesCSV = toCSV(rowsFor("service"));
    const allinoneCSV = toCSV(rowsFor("allinone"));

    if (itemsCSV) downloadFile(itemsCSV, "items.csv");
    else toast.error("No items to export (items.csv)");

    if (servicesCSV) downloadFile(servicesCSV, "services.csv");
    toast.error("No services to export (services.csv)");

    if (allinoneCSV) downloadFile(allinoneCSV, "allinone.csv");
    toast.error("No all-in-one to export (allinone.csv)");
  };

  /* ---------- Promotions (coupons) ---------- */
  const [offers, setOffers] = useState([]);
  const [offerForm, setOfferForm] = useState({
  promo_type: "discount",
  value: "",
  min_order_amount: "",
  start_date: "",
  end_date: "",
  usage_limit: "",
  budget: "",
  });

//   const [insights, setInsights] = useState({
//   total_items: 0,
//   low_stock_count: 0,
//   top_selling: [],
//   category_performance: [],
// });

const [insights, setInsights] = useState({
  total_items_count: 0,
  top_selling_menus: [],
  low_stocks: [],
  is_stock: false,
  category_performance: [],
});

useEffect(() => {

  return () => {

    if (
      newItemState.image?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        newItemState.image
      );
    }

  };

}, [newItemState.image]);

  /* ---------- Derived data / filters / sorting ---------- */
 const visibleCategoryNames = useMemo(
  () => categoryList.map((c) => c.name || c.category_name),
  [categoryList]
);

const filteredItems = useMemo(() => {
  let list = menuData.slice();

  if (filterType !== "all") {
    list = list.filter((it) => (it.type || "item") === filterType);
  }

  if (searchQ.trim()) {
    const q = searchQ.toLowerCase();
    list = list.filter((it) =>
      `${it.menu_name} ${it.category}`.toLowerCase().includes(q)
    );
  }

  return list;
}, [menuData, filterType, filterCategory, searchQ]);

  /* ---------- Insights ---------- */
//   const STOCK_THRESHOLD = 5;
//   const lowStock = items.filter((i) => Number(i.stock || 0) < STOCK_THRESHOLD && i.type !== "service");
//   const categoryPerformance = categoryList.map((cat) => {
//   const name = cat.name || cat.category_name;

//   const list = items.filter((it) => it.category === name);
//   const revenue = list.reduce((s, it) => s + (Number(it.revenue || 0)), 0);

//   return { category: name, revenue };
// });

//   const topSelling = [...items]
    // .filter((i) => Number(i.revenue || 0) > 0)
    // .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    // .slice(0, 10);

  /* ---------- UI Rendering ---------- */
  return (
  <>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: "12px",
          background: "#fff",
          color: "#333",
        },
      }}
    />

    <div className="min-h-screen bg-[#fff9f4] text-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="bg-white text-black rounded-full p-2">
            <ArrowLeft />
          </button>
          <h1 className="text-lg font-bold">Menu Management</h1>
        </div>
        <div className="text-sm opacity-90">Manage Items · Services · Promotions</div>
        <div />
      </div>

      {/* Tabs */}
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex gap-2 px-3 py-2 overflow-x-auto">
          {[
            { id: "items", label: "All Menus" },
            { id: "categories", label: "Categories" },
            //{ id: "add", label: "Add Item" },
            // { id: "add-service", label: "Add Service" },            
            { id: "promotions", label: "Promotions" },
            { id: "insights", label: "Insights" },
          ].map((t, index) => (
            <button
              key={t.id || index}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-2xl whitespace-nowrap text-sm font-semibold ${activeTab === t.id ? "bg-orange-50 text-orange-600 border-b-2 border-orange-400" : "text-gray-600 bg-white"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-5 space-y-6">


       {/* ===== All Menus ===== */}

{activeTab === "items" && (
  <div className="bg-white p-4 rounded-2xl shadow">

    {/* Title */}
   <div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold">
    All Menus
  </h2>

  <button
    onClick={() => setShowAddMenuModal(true)}
    className="
      px-4 py-2
      bg-orange-500
      text-white
      rounded-xl
      flex items-center gap-2
      hover:bg-orange-600
    "
  >
    <Plus size={16} />
    Add Item
  </button>
</div>

    {/* MOBILE FRIENDLY FILTERS */}
    <div className="space-y-3">

      {/* Search Box */}
      <input
        value={searchQ}
        onChange={(e) => setSearchQ(e.target.value)}
        placeholder="Search order, product, tags"
        className="
          w-full px-3 py-2 border rounded-xl text-sm
          focus:outline-none focus:ring-2 focus:ring-orange-400
        "
      />

      {/* FILTER ROW — SCROLLABLE ON MOBILE */}
      <div className="
        flex gap-2 overflow-x-auto pb-2
        whitespace-nowrap
        scrollbar-none
      ">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm min-w-[130px]"
        >
          <option value="all">All Types</option>
          <option value="item">Items</option>
          {/* <option value="service">Services</option>           */}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm min-w-[140px]"
        >
          <option value="">All categories</option>
         {dropdownCategories.map((cat, index) => (
          <option
            key={cat.id || index}
            value={cat.id || cat.category_id}
          >
            {cat.name || cat.category_name}
          </option>
        ))}
        </select>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm min-w-[130px]"
        >
        <option value="">No sort</option>
        <option value="a_z">Name A → Z</option>
        <option value="z_a">Name Z → A</option>
        <option value="high_to_low">Price High → Low</option>
        <option value="low_to_high">Price Low → High</option>
        </select>
      </div>

      {/* ACTION BUTTONS — STACK ON MOBILE */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={() => exportAllJSON()}
          className="px-3 py-2 w-full bg-white border rounded-xl text-sm flex items-center justify-center gap-2"
        >
          <Download size={14} /> Export JSON
        </button>

        <label className="w-full bg-amber-400 text-white px-3 py-2 rounded-xl text-sm cursor-pointer flex items-center justify-center gap-2">
          Import
          <input
            type="file"
            accept=".json"
            hidden
            onChange={(e) => {
              if (!e.target.files?.[0]) return;
              importJSON(e.target.files[0], "items");
            }}
          />
        </label>

        <button
          onClick={() => exportCSVsSeparate()}
          className="px-3 py-2 w-full bg-orange-500 text-white rounded-xl text-sm flex items-center justify-center gap-2"
        >
          Download CSVs
        </button>
      </div> */}
    </div>

    {/* Item List */}
    <div className="mt-5 space-y-5">
     {
        loadingMenu && (
          <div className="text-center py-10 text-orange-500 font-semibold">
            Loading menus...
          </div>
        )
      }
      {filteredItems.length === 0 ? (
        <div className="text-gray-500 p-6 text-center">No items found</div>
      ) : (
        filteredItems.map((it, index) => (
  <div
  key={it.id || it.menu_id || index}
  className="
    relative
    flex items-center justify-between
    p-5 rounded-3xl
    border border-orange-100
    bg-gradient-to-r from-white to-orange-50
    shadow-sm hover:shadow-md
    transition-all
  "
>

  {/* ACTIVE / INACTIVE BADGE */}
  <div className="absolute top-4 right-4">

    <span
      className={`
        text-xs font-semibold
        px-3 py-1 rounded-full
        ${
          it.is_active
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-600"
        }
      `}
    >
      {it.is_active ? "Active" : "Inactive"}
    </span>

  </div>

  {/* LEFT SIDE */}
  <div className="flex items-center gap-4 flex-1">

    {/* IMAGE */}
    {it.menu_image ? (
      <img
        src={it.menu_image}
        alt="img"
        className="
          w-24 h-24
          rounded-2xl
          object-cover
          border border-orange-100
          shadow-sm
        "
      />
    ) : (
      <div
        className="
          w-24 h-24
          rounded-2xl
          bg-orange-50
          border border-orange-100
          flex items-center justify-center
          text-xs text-gray-400
        "
      >
        No Image
      </div>
    )}

    {/* DETAILS */}
    <div className="space-y-2">

      {/* NAME */}
      <div className="text-2xl font-bold text-gray-900">
        {it.menu_name}
      </div>

      {/* CATEGORY + DISCOUNT */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* CATEGORY */}
       <span
  className="
    px-3 py-1
    rounded-full
    bg-orange-100
    text-orange-700
    text-xs font-semibold
  "
>
  {
    dropdownCategories.find(
      (cat) =>
        String(cat.id || cat.category_id) ===
        String(it.category)
    )?.name ||

    dropdownCategories.find(
      (cat) =>
        String(cat.id || cat.category_id) ===
        String(it.category)
    )?.category_name ||

    it.category_name ||

    "Uncategorized"
  }
</span>

{/* VEG / NON VEG */}
<span
  className={`
    px-3 py-1 rounded-full
    text-xs font-semibold
    ${
      it.is_veg
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
    }
  `}
>
  {it.is_veg ? "Veg" : "Non Veg"}
</span>

        {/* DISCOUNT */}
        {it.menu_price &&
          it.discounted_price &&
          Number(it.menu_price) >
            Number(it.discounted_price) && (
            <span className="
              px-3 py-1
              rounded-full
              bg-green-100
              text-green-700
              text-xs font-semibold
            ">
              {Math.round(
                ((it.menu_price -
                  it.discounted_price) /
                  it.menu_price) *
                  100
              )}
              % OFF
            </span>
        )}
      </div>

      {/* DESCRIPTION */}
      <div className="
        text-sm text-gray-500
        line-clamp-2 max-w-[320px]
      ">
        {it.menu_description ||
          "Fresh and delicious food item"}
      </div>

      {/* PRICE */}
      <div className="flex items-center gap-3">

        <span className="
          text-3xl font-bold text-gray-900
        ">
          ₹{it.discounted_price || it.menu_price}
        </span>

        {it.discounted_price && (
          <span className="
            line-through
            text-gray-400
            text-lg
          ">
            ₹{it.menu_price}
          </span>
        )}

      </div>

     {/* QUANTITY + STOCK */}
{it.has_quantity && (
  <div className="flex items-center gap-3 flex-wrap">

    {/* QUANTITY */}
    <span
      className="
        px-3 py-1 rounded-full
        bg-blue-100 text-blue-700
        text-xs font-semibold
      "
    >
      Qty: {it.quantity || 0}
    </span>

    {/* STOCK */}
    <span
      className={`
        px-3 py-1 rounded-full
        text-xs font-semibold
        ${
          Number(it.quantity) > 0
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-600"
        }
      `}
    >
      {Number(it.quantity) > 0
        ? "In Stock"
        : "Out of Stock"}
    </span>

  </div>
)}

    </div>
  </div>

  {/* RIGHT SIDE BUTTON */}
  <div className="ml-4">

    <button
      onClick={() => openEdit(it)}
      className="
        px-5 py-3
        rounded-2xl
        border border-orange-200
        bg-white
        hover:bg-orange-50
        text-sm font-medium
        flex items-center gap-2
        transition-all
      "
    >
      <Edit size={16} />
      Edit
    </button>

  </div>
</div>
        ))
      )}
    </div>
  </div>
)}

        {/* ===== Categories ===== */}
        {activeTab === "categories" && (
          <div className="bg-white p-4 rounded-2xl shadow space-y-4">
            <h2 className="text-lg font-semibold">Categories</h2>
            <div className="flex gap-2">
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" className="flex-1 px-3 py-2 border rounded-xl" />
             <button
              onClick={handleAddCategory}
              disabled={savingCategory}
              className="px-4 py-2 bg-orange-500 text-white rounded-xl"><Plus /> 
              {
                savingCategory
                  ? "Adding..."
                  : "Add"
              }
              </button>
              {/* <label className="bg-amber-400 text-white px-3 py-2 rounded-xl text-sm cursor-pointer">
                Import
                <input type="file" accept=".json" hidden onChange={(e)=>{ if (!e.target.files?.[0]) return; importJSON(e.target.files[0], "categories"); }} />
              </label> */}
            </div>

            <div className="space-y-2">
              {categoryList.length === 0 ? (
              <div className="text-gray-500">No categories yet</div>
            ) : (
              categoryList
  .filter(
    (c) =>
      (c.name && c.name.trim() !== "") ||
      (c.category_name &&
        c.category_name.trim() !== "")
  )
  .map((c, index) => (
  <div
    key={c.id || c.menu_category_id || index}
    className="flex items-center justify-between p-4 border rounded-2xl shadow-sm"
  >
    {/* LEFT */}
    <div>
      <div className="font-semibold text-gray-800">
        {c.name || c.category_name}
      </div>

      <div className="text-xs text-gray-500 mt-1">
       {String(c.is_active) === "true" ||
      String(c.is_active) === "True" ||
      c.is_active === 1 ||
      c.is_active === true
        ? "Active"
        : "Inactive"}
      </div>
    </div>

    {/* RIGHT */}
    <div className="flex items-center">

     
      {/* Edit */}
      <button
        onClick={() => {
          setEditingCategory({
            ...c,
            name: c.name || c.category_name,
          });

          setShowEditCategoryModal(true);
        }}
        className="px-4 py-2 border rounded-2xl text-sm flex items-center gap-2"
      >
        <Edit size={14} />
        Edit
      </button>
    </div>
  </div>
))
            )}
            </div>
          </div>
        )}

        {/* ===== Add Item ===== */}
        {activeTab === "add" && (
          <div className="bg-white p-4 rounded-2xl shadow">
            <h2 className="text-lg font-semibold">Add New Item</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <input placeholder="Item name" value={newItemState.name} onChange={(e)=>setNewItemState(s=>({...s, name:e.target.value}))} className="p-2 border rounded-xl" />
            
             <input
              placeholder="MRP (₹)"
              value={newItemState.mrp}
              onChange={(e) => {

                const mrp = onlyDigits(e.target.value);

                const selling =
                  Number(newItemState.price || 0);

                if (selling > Number(mrp)) {
                  setPriceError(
                    "Selling price cannot be greater than MRP"
                  );
                } else {
                  setPriceError("");
                }

                setNewItemState((s) => ({
                  ...s,
                  mrp,
                  discount: discountFromPrices(
                    mrp,
                    selling
                  ),
                }));
              }}
              className={`p-2 border rounded-xl ${
                priceError ? "border-red-500" : ""
              }`}
            />

              <input
              placeholder="Selling price (₹)"
              value={newItemState.price}
              onChange={(e) => {

                const selling =
                  onlyDigits(e.target.value);

                const mrp =
                  Number(newItemState.mrp || 0);

                if (Number(selling) > mrp) {
                  setPriceError(
                    "Selling price cannot be greater than MRP"
                  );
                } else {
                  setPriceError("");
                }

                setNewItemState((s) => ({
                  ...s,
                  price: selling,
                  discount: discountFromPrices(
                    mrp,
                    selling
                  ),
                }));
              }}
              className={`p-2 border rounded-xl ${
                priceError ? "border-red-500" : ""
              }`}
            />

                {priceError && (
                  <p className="text-red-500 text-sm">
                    {priceError}
                  </p>
                )}

              <input placeholder="Discount (%)" value={newItemState.discount} onChange={(e)=>{ const d=clampDiscount(e.target.value); setNewItemState(s=>({...s, discount:d, price: priceFromMrpDiscount(s.mrp, d)})); }} className="p-2 border rounded-xl" />
              {/* <input placeholder="Stock qty" value={newItemState.stock} onChange={(e)=>setNewItemState(s=>({...s, stock: onlyDigits(e.target.value)}))} className="p-2 border rounded-xl" />
              <input placeholder="Unit / measurement" value={newItemState.unit} onChange={(e)=>setNewItemState(s=>({...s, unit: e.target.value}))} className="p-2 border rounded-xl" /> */}
            </div>

            <textarea placeholder="Description" value={newItemState.desc} onChange={(e)=>setNewItemState(s=>({...s, desc:e.target.value}))} className="w-full p-2 border rounded-xl mt-3" />
            {/* <input placeholder="Tags (comma separated)" value={newItemState.tags} onChange={(e)=>setNewItemState(s=>({...s, tags: e.target.value}))} className="w-full p-2 border rounded-xl mt-2" /> */}

            <select value={newItemState.category} onChange={(e)=>setNewItemState(s=>({...s, category: e.target.value}))} className="w-full p-2 border rounded-xl mt-2">
              <option value="">Select Category</option>
             {dropdownCategories.map((cat, index) => (
              <option
                key={cat.id || index}
                value={cat.id || cat.category_id}
              >
                {cat.name || cat.category_name}
              </option>
            ))}
            </select>
{/* VEG TOGGLE */}
<div className="flex items-center justify-between mt-3">

  <span className="font-medium text-gray-700">
    Veg Item
  </span>

  <button
    type="button"
    onClick={() =>
      setNewItemState((prev) => ({
        ...prev,
        is_veg: !prev.is_veg,
      }))
    }
    className={`
      relative inline-flex
      h-7 w-14
      items-center
      rounded-full
      transition-colors duration-300
      ${
        newItemState.is_veg
          ? "bg-green-500"
          : "bg-red-400"
      }
    `}
  >
    <span
      className={`
        inline-block
        h-5 w-5
        transform
        rounded-full
        bg-white
        transition-transform duration-300
        shadow-md
        ${
          newItemState.is_veg
            ? "translate-x-8"
            : "translate-x-1"
        }
      `}
    />
  </button>
</div>

{/* HAS QUANTITY */}
<div className="flex items-center justify-between mt-3">

  <span className="font-medium text-gray-700">
    Has Quantity
  </span>

  <button
    type="button"
    onClick={() =>
      setNewItemState((prev) => ({
        ...prev,
        has_quantity:
          !prev.has_quantity,
        quantity:
          prev.has_quantity ? "" : prev.quantity,
      }))
    }
    className={`
      relative inline-flex
      h-7 w-14
      items-center
      rounded-full
      transition-colors duration-300
      ${
        newItemState.has_quantity
          ? "bg-orange-500"
          : "bg-gray-300"
      }
    `}
  >
    <span
      className={`
        inline-block
        h-5 w-5
        transform
        rounded-full
        bg-white
        transition-transform duration-300
        shadow-md
        ${
          newItemState.has_quantity
            ? "translate-x-8"
            : "translate-x-1"
        }
      `}
    />
  </button>
</div>

{/* QUANTITY INPUT */}
{newItemState.has_quantity && (
  <input
    value={newItemState.quantity || ""}
    onChange={(e) =>
      setNewItemState((prev) => ({
        ...prev,
        quantity: Number(
          onlyDigits(e.target.value)
        ),
      }))
    }
    placeholder="Quantity"
    className="w-full p-3 border rounded-xl mt-3"
  />
)}

{/* ACTIVE STATUS */}
<div className="flex items-center justify-between mt-3">

  <span className="font-medium text-gray-700">
    Active Status
  </span>

  <button
    type="button"
    onClick={() =>
      setNewItemState((prev) => ({
        ...prev,
        is_active: !prev.is_active,
      }))
    }
    className={`
      relative inline-flex
      h-7 w-14
      items-center
      rounded-full
      transition-colors duration-300
      ${
        newItemState.is_active
          ? "bg-orange-500"
          : "bg-gray-300"
      }
    `}
  >
    <span
      className={`
        inline-block
        h-5 w-5
        transform
        rounded-full
        bg-white
        transition-transform duration-300
        shadow-md
        ${
          newItemState.is_active
            ? "translate-x-8"
            : "translate-x-1"
        }
      `}
    />
  </button>
</div>

            <div className="mt-2">
              <label className="w-full border p-2 rounded-xl flex items-center justify-between cursor-pointer">
                <span>{newItemState.image ? "Image selected" : "Upload photo"}</span>
                <input type="file" accept="image/*" hidden 
                onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                    if (newItemState.image) {
                      URL.revokeObjectURL(newItemState.image);
                    }

                setNewItemState((s) => ({
                  ...s,
                  image: URL.createObjectURL(file), // preview
                  file: file, // ✅ ACTUAL FILE
                }));
              }}
              />
              </label>
              {newItemState.image && <img src={newItemState.image} alt="preview" className="mt-2 w-28 h-28 object-cover rounded" />}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleAddMenu}
                disabled={
                  !!priceError || savingMenu
                }                
               className={`
                px-4 py-2 rounded-xl text-white
                ${
                  priceError || savingMenu
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-orange-500"
                }
              `}
              >
                {
                  savingMenu
                    ? "Saving..."
                    : "Save Item"
                }
              </button>
              <button
                onClick={() => {

                  if (
                    newItemState.image?.startsWith("blob:")
                  ) {
                    URL.revokeObjectURL(
                      newItemState.image
                    );
                  }
                    if (
                      newItemState.image?.startsWith("blob:")
                    ) {
                      URL.revokeObjectURL(
                        newItemState.image
                      );
                    }
                  setNewItemState(emptyItem);

                }}className="px-4 py-2 border rounded-xl">Reset</button>
            </div>
          </div>
        )}

        {/* ===== Add Service ===== */}
        {/* {activeTab === "add-service" && (
          <div className="bg-white p-4 rounded-2xl shadow">
            <h2 className="text-lg font-semibold">Add New Service</h2>
               <div className="bg-white p-4 rounded-2xl shadow">
            <h2 className="text-lg font-semibold">COMING SOON!!!</h2>
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <input placeholder="Service name" value={newServiceState.name} onChange={(e)=>setNewServiceState(s=>({...s, name:e.target.value}))} className="p-2 border rounded-xl" />
              <input placeholder="Service price (₹)" value={newServiceState.price} onChange={(e)=>setNewServiceState(s=>({...s, price: onlyDigits(e.target.value)}))} className="p-2 border rounded-xl" />
              <input placeholder="Time required (minutes)" value={newServiceState.duration} onChange={(e)=>setNewServiceState(s=>({...s, duration: onlyDigits(e.target.value)}))} className="p-2 border rounded-xl" />
              <input placeholder="Max slots / day" value={newServiceState.slots} onChange={(e)=>setNewServiceState(s=>({...s, slots: onlyDigits(e.target.value)}))} className="p-2 border rounded-xl" />
              <select value={newServiceState.category} onChange={(e)=>setNewServiceState(s=>({...s, category: e.target.value}))} className="p-2 border rounded-xl">
                <option value="">Select Category</option>
               {categoryList.map((cat, index) => (
                <option
                  key={cat.id || index}
                  value={cat.id || cat.category_id}
                >
                  {cat.name || cat.category_name}
                </option>
              ))}
              </select>
            </div>

            <textarea placeholder="Description" value={newServiceState.desc} onChange={(e)=>setNewServiceState(s=>({...s, desc:e.target.value}))} className="w-full p-2 border rounded-xl mt-3" />
            <input placeholder="Tags" value={newServiceState.tags} onChange={(e)=>setNewServiceState(s=>({...s, tags: e.target.value}))} className="w-full p-2 border rounded-xl mt-2" />

            <div className="mt-2">
              <label className="w-full border p-2 rounded-xl flex items-center justify-between cursor-pointer">
                <span>{newServiceState.image ? "Image selected" : "Upload photo"}</span>
                <input type="file" accept="image/*" hidden onChange={(e)=>{ if (!e.target.files?.[0]) return; setNewServiceState(s=>({...s, image: URL.createObjectURL(e.target.files[0])})); }} />
              </label>
              {newServiceState.image && <img src={newServiceState.image} alt="preview" className="mt-2 w-28 h-28 object-cover rounded" />}
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={()=>addNewItem({...newServiceState, type:"service"})} className="px-4 py-2 bg-orange-500 text-white rounded-xl">Save Service</button>
              <button onClick={()=>setNewServiceState(emptyService)} className="px-4 py-2 border rounded-xl">Reset</button>
            </div> 
             </div>
          </div>
        )} */}



        {/* ===== Promotions (Coupons) ===== */}
        {activeTab === "promotions" && (
          <div className="bg-white p-4 rounded-2xl shadow space-y-4">
            <h2 className="text-lg font-semibold">Promotions & Coupons</h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select
              value={offerForm.promo_type}
              onChange={(e) =>
                setOfferForm((s) => ({ ...s, promo_type: e.target.value }))
              }
              className="p-2 border rounded-xl"
            >
              <option value="discount">Discount</option>
            </select>

            <div className="relative">
            <input
              placeholder="Discount Value"
              value={offerForm.value}
              onChange={(e) => {
              const val = Math.min(100, Math.max(0, Number(e.target.value)));
              setOfferForm((s) => ({ ...s, value: val }));
            }}
              className="p-2 border rounded-xl w-full pr-10"
            />

            {/* % indicator */}
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>

          {offerForm.value && (
            <div className="text-green-600 text-sm font-semibold">
              {offerForm.value}% OFF will be applied
            </div>
          )}

            <input
              placeholder="Min Order"
              value={offerForm.min_order_amount}
              onChange={(e) =>
                setOfferForm((s) => ({ ...s, min_order_amount: e.target.value }))
              }
              className="p-2 border rounded-xl"
            />

            <input
              type="date"
              value={offerForm.start_date}
              onChange={(e) =>
                setOfferForm((s) => ({ ...s, start_date: e.target.value }))
              }
              className="p-2 border rounded-xl"
            />

            <input
              type="date"
              value={offerForm.end_date}
              onChange={(e) =>
                setOfferForm((s) => ({ ...s, end_date: e.target.value }))
              }
              className="p-2 border rounded-xl"
            />

            <input
              placeholder="Usage Limit"
              value={offerForm.usage_limit}
              onChange={(e) =>
                setOfferForm((s) => ({ ...s, usage_limit: e.target.value }))
              }
              className="p-2 border rounded-xl"
            />

            <input
              placeholder="Budget"
              value={offerForm.budget}
              onChange={(e) =>
                setOfferForm((s) => ({ ...s, budget: e.target.value }))
              }
              className="p-2 border rounded-xl"
            />
            </div>

            <div className="flex gap-2">
             <button
              onClick={handleAddOffer}
              disabled={savingOffer}
              className="px-4 py-2 bg-orange-500 text-white rounded-xl">
                {
                  savingOffer
                    ? "Saving..."
                    : "Save Coupon"
                }
                </button>
            </div>

           <div className="space-y-4">
             {offers.length === 0 ? (
              <div className="text-gray-500">No offers</div>
            ) : (
              offers.map((o, index) => (
  <div
    key={o.promotion_id || index}
    className="flex justify-between items-center p-4 rounded-2xl shadow-md border bg-gradient-to-r from-white to-orange-50"
  >
    {/* LEFT CONTENT */}
    <div className="space-y-1">

      {/* CODE */}
      <div className="text-xl font-bold text-orange-600 tracking-wide">
        {o.code}
      </div>

      {/* TYPE + VALUE */}
      <div className="text-sm font-semibold text-gray-700 capitalize">
        {o.promo_type}
        <span className="ml-2 text-green-600 font-bold">
        {o.value ? `${o.value}% OFF` : "0% OFF"}
      </span>
      </div>

      {/* MIN + BUDGET */}
      <div className="text-sm text-gray-500">
        Min Order: ₹{Number(o.min_order_amount)} • Budget: ₹{Number(o.budget)}
      </div>

      {/* DATE */}
      <div className="text-xs text-gray-400">
        {new Date(o.start_date).toLocaleDateString()} →{" "}
        {new Date(o.end_date).toLocaleDateString()}
      </div>

      {/* USAGE */}
      <div className="text-xs text-gray-400">
        Usage Limit: {o.usage_limit}
      </div>
    </div>

    {/* RIGHT STATUS */}
    <div className="flex flex-col items-end gap-2">
      <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
        Active
      </span>

      <button
  onClick={() => {
    setEditOfferData(o);
    setShowEditOfferModal(true);
  }}
  className="text-xs text-orange-500 hover:underline"
>
  Edit
</button>
    </div>
  </div>
))
            )}
            </div>
          </div>
        )}

        {/* ===== Insights ===== */}
        {activeTab === "insights" && (
          <div className="bg-white p-4 rounded-2xl shadow space-y-4">
            <h2 className="text-lg font-semibold">Insights</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-orange-50">
                <div className="text-sm text-gray-500">Total Items</div>
                <div className="text-2xl font-bold">{insights.total_items_count || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Services: {items.filter(i=>i.type==="service").length} • All-in-one: {items.filter(i=>i.type==="allinone").length}</div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50">
                <div className="text-sm text-gray-500">Low Stock Alerts</div>
                <div className="text-2xl font-bold">
                {insights.low_stocks?.length || 0}
              </div>

              <div className="text-xs text-gray-500 mt-1">
                {insights.is_stock
                  ? "Stock Available"
                  : "Stock Running Low"}
              </div>
              </div>

{/* <div className="p-4 bg-white rounded-2xl shadow">

  <h4 className="font-semibold mb-3">
    Low Stock Items
  </h4>

  {insights.low_stocks?.length ? (

    insights.low_stocks.map((item, index) => (

      <div
        key={item.menu_id || index}
        className="
          flex justify-between items-center
          py-2 border-b last:border-0
        "
      >

        <div>
          {item.menu_name}
        </div>

        <div
          className="
            text-sm text-red-500
            font-semibold
          "
        >
          Qty: {item.quantity || 0}
        </div>

      </div>

    ))

  ) : (

    <div className="text-gray-500 text-sm">
      No low stock items
    </div>

  )}

</div> */}
              <div className="p-4 rounded-2xl bg-orange-50">
                <div className="text-sm text-gray-500">Top Sellers (by revenue)</div>
                <div className="text-2xl font-bold">{insights.top_selling_menus?.length || 0}</div>
               <div className="text-xs text-gray-500 mt-1">
                    Based on backend sales analytics
                  </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* <div className="p-4 bg-white rounded-2xl shadow">
                <h4 className="font-semibold mb-2">Category Performance</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={[]}>
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#fb923c" />
                  </BarChart>
                </ResponsiveContainer>
              </div> */}
              <div className="p-4 bg-white rounded-2xl shadow">

                <h4 className="font-semibold mb-4">
                  Category Performance
                </h4>

                {insights.category_performance?.length ? (

                  <ResponsiveContainer
                    width="100%"
                    height={260}
                  >

                    <BarChart
                      data={insights.category_performance}
                    >

                      <XAxis
                        dataKey="category_name"
                      />

                      <YAxis />

                      <Tooltip />

                      <Bar
                        dataKey="total_sold"
                        fill="#f97316"
                        radius={[8, 8, 0, 0]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                ) : (

                  <div className="text-gray-500 text-sm">
                    No category analytics available
                  </div>

                )}

              </div>
              <div className="p-4 bg-white rounded-2xl shadow">
                <h4 className="font-semibold mb-2">Top Selling Items</h4>
                {insights.top_selling_menus?.length
                ? insights.top_selling_menus.map((t, index) => (
                  <div key={t.id || index} className="flex justify-between items-center py-1">
                  <div>{t.menu_name}</div>
                  <div className="text-sm text-gray-600">
                   Sold: {t.total_sold || t.total_quantity_sold || 0}
                  </div>
                  </div>
                )) : <div className="text-gray-500">No revenue data available</div>}
              </div>

              <div className="p-4 bg-white rounded-2xl shadow">

                <h4 className="font-semibold mb-3">
                  Low Stock Items
                </h4>

                {insights.low_stocks?.length ? (

                  insights.low_stocks.map((item, index) => (

                    <div
                      key={item.menu_id || index}
                      className="
                        flex justify-between items-center
                        py-2 border-b last:border-0
                      "
                    >

                      <div>
                        {item.menu_name}
                      </div>

                      <div
                        className="
                          text-sm text-red-500
                          font-semibold
                        "
                      >
                        Qty: {item.quantity || 0}
                      </div>

                    </div>

                  ))

                ) : (

                  <div className="text-gray-500 text-sm">
                    No low stock items
                  </div>

                )}

              </div>

            </div>
          </div>
        )}

      </div>

      {/* Edit modal (orange light backdrop instead of black) */}
      {showEditModal && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "linear-gradient(180deg, rgba(255,240,230,0.85), rgba(255,245,240,0.95))" }}>
         <div
            className="
              bg-white rounded-3xl
              w-[95%]
              max-w-3xl
              max-h-[90vh]
              overflow-y-auto
              p-6
              shadow-2xl
            "
          >
                      <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold">
                    Edit Menu Item
                  </h3>
              <button onClick={()=>{ setShowEditModal(false); setEditing(null); }} className="text-gray-500">Close</button>
            </div>

            <div className="space-y-3">
              <input value={editing.menu_name || ""} onChange={(e)=>
                setEditing(prev=>({
                  ...prev,
                  menu_name: e.target.value
                }))
              } className="w-full p-2 border rounded-xl" />
              {editing.type !== "service" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">

  {/* MENU PRICE */}
  <div>
    <input
          value={editing.menu_price || ""}
      onChange={(e) => {

        const menuPrice =
          onlyDigits(e.target.value);

        const discounted =
          Number(
            editing.discounted_price || 0
          );

        if (
          discounted >
          Number(menuPrice)
        ) {
          setPriceError(
            "Discounted price cannot be greater than menu price"
          );
        } else {
          setPriceError("");
        }

        const discount =
          discountFromPrices(
            menuPrice,
            discounted
          );

        setEditing((prev) => ({
          ...prev,
          menu_price: menuPrice,
          discount,
        }));
      }}
      placeholder="Menu Price (₹)"
      className={` w-full min-w-0 p-3 border rounded-xl ${
        priceError
          ? "border-red-500"
          : ""
      }`}
    />

  </div>

  {/* DISCOUNTED PRICE */}
  <div>
    <input
        value={editing.discounted_price || ""}
      onChange={(e) => {

        const discounted =
          onlyDigits(e.target.value);

        const menuPrice =
          Number(
            editing.menu_price || 0
          );

        if (
          Number(discounted) >
          menuPrice
        ) {
          setPriceError(
            "Discounted price cannot be greater than menu price"
          );
        } else {
          setPriceError("");
        }

        const discount =
          discountFromPrices(
            menuPrice,
            discounted
          );

        setEditing((prev) => ({
          ...prev,
          discounted_price:
            discounted,
          discount,
        }));
      }}
      placeholder="Discounted Price (₹)"
      className={` w-full min-w-0 p-3 border rounded-xl ${
        priceError
          ? "border-red-500"
          : ""
      }`}
    />

    {priceError && (
      <p className="text-red-500 text-sm mt-1">
        {priceError}
      </p>
    )}
  </div>

  {/* AUTO DISCOUNT */}
  <div>
    <input
      value={`${editing.discount || 0}%`}
      readOnly
      className=" w-full min-w-0 p-3 border rounded-xl bg-gray-100 text-gray-600"
      placeholder="Discount"
    />
  </div>

</div>
              )}

              {editing.type === "service" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input value={editing.menu_price || ""} onChange={(e)=>setEditing(prev=>({...prev, price: onlyDigits(e.target.value)}))} placeholder="Service Price (₹)" className="p-3 border rounded-xl" />
                  <input value={editing.duration || ""} onChange={(e)=>setEditing(prev=>({...prev, duration: onlyDigits(e.target.value)}))} placeholder="Duration (min)" className="p-3 border rounded-xl" />
                </div>
              )}

            
             <textarea
              value={editing.menu_description || ""}
              onChange={(e)=>
                setEditing(prev=>({
                  ...prev,
                  menu_description: e.target.value
                }))
              }
              className="w-full p-3 border rounded-xl"
            />
              <select
  value={
    editing.category ||
    editing.category_id ||
    ""
  }
  onChange={(e) =>
    setEditing((prev) => ({
      ...prev,
      category: e.target.value,
    }))
  }
  className="w-full p-3 border rounded-xl"
>
  <option value="">
    Select Category
  </option>

  {dropdownCategories.map(
    (cat, index) => (
      <option
        key={
          cat.id ||
          cat.category_id ||
          index
        }
        value={
          cat.id ||
          cat.category_id
        }
      >
        {cat.name ||
          cat.category_name}
      </option>
    )
  )}
</select>

<div className="flex items-center justify-between">

  <span className="font-medium text-gray-700">
    Veg Item
  </span>

  <button
    type="button"
    onClick={() =>
      setEditing((prev) => ({
        ...prev,
        is_veg: !prev.is_veg,
      }))
    }
    className={`
      relative inline-flex
      h-7 w-14
      items-center
      rounded-full
      transition-colors duration-300
      ${
        editing.is_veg
          ? "bg-green-500"
          : "bg-red-400"
      }
    `}
  >
    <span
      className={`
        inline-block
        h-5 w-5
        transform
        rounded-full
        bg-white
        transition-transform duration-300
        shadow-md
        ${
          editing.is_veg
            ? "translate-x-8"
            : "translate-x-1"
        }
      `}
    />
  </button>
</div>

<div className="flex items-center justify-between">

  <span className="font-medium text-gray-700">
    Has Quantity
  </span>

  <button
    type="button"
    onClick={() =>
      setEditing((prev) => ({
        ...prev,
        has_quantity: !prev.has_quantity,
        quantity: prev.has_quantity ? "" : prev.quantity,
      }))
    }
    className={`
      relative inline-flex
      h-7 w-14
      items-center
      rounded-full
      transition-colors duration-300
      ${
        editing.has_quantity
          ? "bg-orange-500"
          : "bg-gray-300"
      }
    `}
  >
    <span
      className={`
        inline-block
        h-5 w-5
        transform
        rounded-full
        bg-white
        transition-transform duration-300
        shadow-md
        ${
          editing.has_quantity
            ? "translate-x-8"
            : "translate-x-1"
        }
      `}
    />
  </button>
</div>

 {editing.has_quantity && (
              <input
                value={editing.quantity || ""}
                onChange={(e)=>
                  setEditing(prev=>({
                    ...prev,
                    quantity: Number(onlyDigits(e.target.value))
                  }))
                }
                placeholder="Quantity"
                className="w-full p-3 border rounded-xl"
              />
            )}

              <div>
                <label className="w-full border p-3 rounded-xl flex items-center justify-between cursor-pointer">
                  <span>{editing.menu_image_preview ||
editing.menu_image ? "Image selected" : "Upload photo"}</span>
<input
  type="file"
  accept="image/*"
  hidden
  onChange={(e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setEditing((prev) => ({
      ...prev,
      menu_image_preview:
        URL.createObjectURL(file),

      file: file,
    }));
  }}
/>
                </label>
                {editing.menu_image_preview ||editing.menu_image && <img src={editing.menu_image_preview ||editing.menu_image} alt="preview" className="mt-2 w-28 h-28 object-cover rounded" />}
              </div>

  <div className="flex items-center justify-between">

  <span className="font-medium text-gray-700">
    Active Status
  </span>

  <button
    type="button"
    onClick={() =>
      setEditing((prev) => ({
        ...prev,
        is_active: !prev.is_active,
      }))
    }
    className={`
      relative inline-flex
      h-7 w-14
      items-center
      rounded-full
      transition-colors duration-300
      ${
        editing.is_active
          ? "bg-orange-500"
          : "bg-gray-300"
      }
    `}
  >
    <span
      className={`
        inline-block
        h-5 w-5
        transform
        rounded-full
        bg-white
        transition-transform duration-300
        shadow-md
        ${
          editing.is_active
            ? "translate-x-8"
            : "translate-x-1"
        }
      `}
    />
  </button>
</div>

              <div className="flex gap-3">
               <button
                onClick={saveEdit}
                disabled={savingEdit}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl">
                {
                savingEdit
                  ? "Saving..."
                  : "Save Changes"
              }
                  </button>
                <button onClick={()=>{ setShowEditModal(false); setEditing(null); }} className="px-4 py-2 border rounded-xl">Cancel</button>
              </div>
    
            </div>
          </div>
        </div>
      )}

{showEditOfferModal && editOfferData && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
    <div className="bg-white p-5 rounded-2xl w-full max-w-md space-y-3">

      <h3 className="text-lg font-semibold">Edit Offer</h3>

      <input
        value={editOfferData.value || ""}
        onChange={(e) =>
          setEditOfferData((s) => ({ ...s, value: e.target.value }))
        }
        placeholder="Value (%)"
        className="w-full p-2 border rounded-xl"
      />

      <input
        value={editOfferData.min_order_amount}
        onChange={(e) =>
          setEditOfferData((s) => ({
            ...s,
            min_order_amount: e.target.value,
          }))
        }
        placeholder="Min Order"
        className="w-full p-2 border rounded-xl"
      />

      <input
        type="date"
        value={editOfferData.start_date?.split("T")[0]}
        onChange={(e) =>
          setEditOfferData((s) => ({ ...s, start_date: e.target.value }))
        }
        className="w-full p-2 border rounded-xl"
      />

      <input
        type="date"
        value={editOfferData.end_date?.split("T")[0]}
        onChange={(e) =>
          setEditOfferData((s) => ({ ...s, end_date: e.target.value }))
        }
        className="w-full p-2 border rounded-xl"
      />

      <input
        value={editOfferData.usage_limit}
        onChange={(e) =>
          setEditOfferData((s) => ({
            ...s,
            usage_limit: e.target.value,
          }))
        }
        placeholder="Usage Limit"
        className="w-full p-2 border rounded-xl"
      />

      <input
        value={editOfferData.budget}
        onChange={(e) =>
          setEditOfferData((s) => ({ ...s, budget: e.target.value }))
        }
        placeholder="Budget"
        className="w-full p-2 border rounded-xl"
      />

      <div className="flex gap-2">
        <button
          onClick={handleEditOffer}
          className="flex-1 bg-orange-500 text-white py-2 rounded-xl"
        >
          Save
        </button>

        <button
          onClick={() => setShowEditOfferModal(false)}
          className="flex-1 border py-2 rounded-xl"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
{showDeleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95">

      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <Trash2 className="text-red-500" size={28} />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-center">
        Delete Item?
      </h3>

      <p className="text-sm text-gray-500 text-center mt-2">
        This action cannot be undone.
      </p>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => {
            setShowDeleteModal(false);
            setDeleteItemId(null);
          }}
          className="flex-1 py-2 border rounded-xl font-medium"
        >
          Cancel
        </button>

        <button
          onClick={confirmDeleteItem}
          className="flex-1 py-2 bg-red-500 text-white rounded-xl font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}
{showEditCategoryModal && editingCategory && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">

      <h3 className="text-xl font-semibold mb-4">
        Edit Category
      </h3>

      <input
        value={editingCategory.name}
        onChange={(e) =>
          setEditingCategory((s) => ({
            ...s,
            name: e.target.value,
          }))
        }
        placeholder="Category name"
        className="w-full p-3 border rounded-xl"
      />

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm font-medium">
          Active Status
        </span>

        <label className="relative inline-flex items-center cursor-pointer">

          <input
            type="checkbox"
            checked={
            String(editingCategory.is_active) === "true" ||
            String(editingCategory.is_active) === "True" ||
            editingCategory.is_active === 1 ||
            editingCategory.is_active === true
          }
            onChange={() =>
              setEditingCategory((s) => ({
                ...s,
                is_active: !s.is_active,
              }))
            }
            className="sr-only"
          />

          {/* TRACK */}
          <div
            className={`w-14 h-7 rounded-full transition-all duration-300 ${
              editingCategory.is_active
                ? "bg-orange-500"
                : "bg-gray-300"
            }`}
          />

          {/* THUMB */}
          <div
            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
              editingCategory.is_active
                ? "left-8"
                : "left-1"
            }`}
          />
        </label>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => {
            setShowEditCategoryModal(false);
            setEditingCategory(null);
          }}
          className="flex-1 py-2 border rounded-xl"
        >
          Cancel
        </button>

        <button
          onClick={handleEditCategory}
          className="flex-1 py-2 bg-orange-500 text-white rounded-xl"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}

{showAddMenuModal && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{
      background:
        "linear-gradient(180deg, rgba(255,240,230,0.85), rgba(255,245,240,0.95))",
    }}
  >
    <div
      className="
        bg-white
        rounded-3xl
        w-[95%]
        max-w-3xl
        max-h-[90vh]
        overflow-y-auto
        p-6
        shadow-2xl
      "
    >
                <div
  className="
    fixed inset-0 z-50
    flex items-center justify-center
    bg-black/30
  "
>
  <div
    className="
      bg-white
      w-[95%]
      max-w-3x
      max-h-[90vh]
      overflow-y-auto
      rounded-3xl
      p-6
      shadow-2xl
    "
  >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">
          Add New Item
        </h3>

        <button
          onClick={() =>
            setShowAddMenuModal(false)
          }
          className="text-gray-500"
        >
          Close
        </button>
      </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <input placeholder="Item name" value={newItemState.name} onChange={(e)=>setNewItemState(s=>({...s, name:e.target.value}))} className="p-2 border rounded-xl" />
            
             <input
              placeholder="MRP (₹)"
              value={newItemState.mrp}
              onChange={(e) => {

                const mrp = onlyDigits(e.target.value);

                const selling =
                  Number(newItemState.price || 0);

                if (selling > Number(mrp)) {
                  setPriceError(
                    "Selling price cannot be greater than MRP"
                  );
                } else {
                  setPriceError("");
                }

                setNewItemState((s) => ({
                  ...s,
                  mrp,
                  discount: discountFromPrices(
                    mrp,
                    selling
                  ),
                }));
              }}
              className={`p-2 border rounded-xl ${
                priceError ? "border-red-500" : ""
              }`}
            />

              <input
              placeholder="Selling price (₹)"
              value={newItemState.price}
              onChange={(e) => {

                const selling =
                  onlyDigits(e.target.value);

                const mrp =
                  Number(newItemState.mrp || 0);

                if (Number(selling) > mrp) {
                  setPriceError(
                    "Selling price cannot be greater than MRP"
                  );
                } else {
                  setPriceError("");
                }

                setNewItemState((s) => ({
                  ...s,
                  price: selling,
                  discount: discountFromPrices(
                    mrp,
                    selling
                  ),
                }));
              }}
              className={`p-2 border rounded-xl ${
                priceError ? "border-red-500" : ""
              }`}
            />

                {priceError && (
                  <p className="text-red-500 text-sm">
                    {priceError}
                  </p>
                )}

              <input placeholder="Discount (%)" value={newItemState.discount} onChange={(e)=>{ const d=clampDiscount(e.target.value); setNewItemState(s=>({...s, discount:d, price: priceFromMrpDiscount(s.mrp, d)})); }} className="p-2 border rounded-xl" />
              {/* <input placeholder="Stock qty" value={newItemState.stock} onChange={(e)=>setNewItemState(s=>({...s, stock: onlyDigits(e.target.value)}))} className="p-2 border rounded-xl" />
              <input placeholder="Unit / measurement" value={newItemState.unit} onChange={(e)=>setNewItemState(s=>({...s, unit: e.target.value}))} className="p-2 border rounded-xl" /> */}
            </div>

            <textarea placeholder="Description" value={newItemState.desc} onChange={(e)=>setNewItemState(s=>({...s, desc:e.target.value}))} className="w-full p-2 border rounded-xl mt-3" />
            {/* <input placeholder="Tags (comma separated)" value={newItemState.tags} onChange={(e)=>setNewItemState(s=>({...s, tags: e.target.value}))} className="w-full p-2 border rounded-xl mt-2" /> */}

            <select value={newItemState.category} onChange={(e)=>setNewItemState(s=>({...s, category: e.target.value}))} className="w-full p-2 border rounded-xl mt-2">
              <option value="">Select Category</option>
             {dropdownCategories.map((cat, index) => (
              <option
                key={cat.id || index}
                value={cat.id || cat.category_id}
              >
                {cat.name || cat.category_name}
              </option>
            ))}
            </select>
{/* VEG TOGGLE */}
<div className="flex items-center justify-between mt-3">

  <span className="font-medium text-gray-700">
    Veg Item
  </span>

  <button
    type="button"
    onClick={() =>
      setNewItemState((prev) => ({
        ...prev,
        is_veg: !prev.is_veg,
      }))
    }
    className={`
      relative inline-flex
      h-7 w-14
      items-center
      rounded-full
      transition-colors duration-300
      ${
        newItemState.is_veg
          ? "bg-green-500"
          : "bg-red-400"
      }
    `}
  >
    <span
      className={`
        inline-block
        h-5 w-5
        transform
        rounded-full
        bg-white
        transition-transform duration-300
        shadow-md
        ${
          newItemState.is_veg
            ? "translate-x-8"
            : "translate-x-1"
        }
      `}
    />
  </button>
</div>

{/* HAS QUANTITY */}
<div className="flex items-center justify-between mt-3">

  <span className="font-medium text-gray-700">
    Has Quantity
  </span>

  <button
    type="button"
    onClick={() =>
      setNewItemState((prev) => ({
        ...prev,
        has_quantity:
          !prev.has_quantity,
        quantity:
          prev.has_quantity ? "" : prev.quantity,
      }))
    }
    className={`
      relative inline-flex
      h-7 w-14
      items-center
      rounded-full
      transition-colors duration-300
      ${
        newItemState.has_quantity
          ? "bg-orange-500"
          : "bg-gray-300"
      }
    `}
  >
    <span
      className={`
        inline-block
        h-5 w-5
        transform
        rounded-full
        bg-white
        transition-transform duration-300
        shadow-md
        ${
          newItemState.has_quantity
            ? "translate-x-8"
            : "translate-x-1"
        }
      `}
    />
  </button>
</div>

{/* QUANTITY INPUT */}
{newItemState.has_quantity && (
  <input
    value={newItemState.quantity || ""}
    onChange={(e) =>
      setNewItemState((prev) => ({
        ...prev,
        quantity: Number(
          onlyDigits(e.target.value)
        ),
      }))
    }
    placeholder="Quantity"
    className="w-full p-3 border rounded-xl mt-3"
  />
)}

{/* ACTIVE STATUS */}
<div className="flex items-center justify-between mt-3">

  <span className="font-medium text-gray-700">
    Active Status
  </span>

  <button
    type="button"
    onClick={() =>
      setNewItemState((prev) => ({
        ...prev,
        is_active: !prev.is_active,
      }))
    }
    className={`
      relative inline-flex
      h-7 w-14
      items-center
      rounded-full
      transition-colors duration-300
      ${
        newItemState.is_active
          ? "bg-orange-500"
          : "bg-gray-300"
      }
    `}
  >
    <span
      className={`
        inline-block
        h-5 w-5
        transform
        rounded-full
        bg-white
        transition-transform duration-300
        shadow-md
        ${
          newItemState.is_active
            ? "translate-x-8"
            : "translate-x-1"
        }
      `}
    />
  </button>
</div>

            <div className="mt-2">
              <label className="w-full border p-2 rounded-xl flex items-center justify-between cursor-pointer">
                <span>{newItemState.image ? "Image selected" : "Upload photo"}</span>
                <input type="file" accept="image/*" hidden 
                onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                    if (newItemState.image) {
                      URL.revokeObjectURL(newItemState.image);
                    }

                setNewItemState((s) => ({
                  ...s,
                  image: URL.createObjectURL(file), // preview
                  file: file, // ✅ ACTUAL FILE
                }));
              }}
              />
              </label>
              {newItemState.image && <img src={newItemState.image} alt="preview" className="mt-2 w-28 h-28 object-cover rounded" />}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleAddMenu}
                disabled={
                  !!priceError || savingMenu
                }                
               className={`
                px-4 py-2 rounded-xl text-white
                ${
                  priceError || savingMenu
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-orange-500"
                }
              `}
              >
                {
                  savingMenu
                    ? "Saving..."
                    : "Save Item"
                }
              </button>
              <button
                onClick={() => {

                  if (
                    newItemState.image?.startsWith("blob:")
                  ) {
                    URL.revokeObjectURL(
                      newItemState.image
                    );
                  }
                    if (
                      newItemState.image?.startsWith("blob:")
                    ) {
                      URL.revokeObjectURL(
                        newItemState.image
                      );
                    }
                  setNewItemState(emptyItem);

                }}className="px-4 py-2 border rounded-xl">Reset</button>
            </div>
          </div>
</div>
  </div>
  </div>
)}


    </div>
    </>
  );
}
