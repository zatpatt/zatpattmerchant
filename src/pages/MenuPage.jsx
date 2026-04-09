// src/pages/MenuPage.jsx
import React, { useEffect, useMemo, useState } from "react";
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
  desc: "",
  tags: "",
  unit: "",
  category: "",
  image: "",
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
  const [activeTab, setActiveTab] = useState("items");

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [couponState, setCouponState] = useState(emptyCoupon);
  const [menuData, setMenuData] = useState([]);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [dropdownCategories, setDropdownCategories] = useState([]);
  const [editOfferData, setEditOfferData] = useState(null);
  const [showEditOfferModal, setShowEditOfferModal] = useState(false);

  const handleEditOffer = async () => {
  try {
    const payload = {
      promotion_id: editOfferData.promotion_id,
      user: 51,
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
      alert("Offer updated successfully");
      setShowEditOfferModal(false);
      fetchOffers();
    }
  } catch (err) {
    console.error("Edit error:", err);
  }
};

  const fetchOffers = async () => {
  try {
    const res = await getOffers({ user: 51 });

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
  try {
    const payload = {
      user: 51,
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
      alert("Offer added successfully");

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
};

  const handleAddCategory = async () => {
  try {
    if (!newCategory.trim()) {
      return alert("Category name required");
    }

    const res = await addMenuCategory({
      user: 51,
      name: newCategory,
    });

    console.log("Add Category API:", res);

    if (res?.status) {
      alert("Category added successfully");

      setNewCategory("");

      // reload categories
      fetchCategories();
    }
  } catch (err) {
    console.error("Add category error:", err);
  }
};

// Category PAGE list
const fetchCategories = async () => {
  try {
    const res = await getMenuCategoryList({ user: 51 });

    if (res?.status) {
      setCategoryList(res.data || []);
    }
  } catch (err) {
    console.error(err);
  }
};

// Dropdown categories
const fetchDropdownCategories = async () => {
  try {
    const res = await getMenuDropdownCategories({ user: 51 });

    if (res?.status) {
      setDropdownCategories(res.data || []);
    }
  } catch (err) {
    console.error(err);
  }
};

useEffect(() => {
  fetchCategories();
  fetchDropdownCategories();
}, []);

  const handleAddMenu = async () => {
  try {
    const payload = {
      category: newItemState.category,
      menu_name: newItemState.name,
      menu_description: newItemState.desc,
      is_veg: true, // or based on UI
      menu_price: newItemState.mrp,
      discounted_price: newItemState.price,
      label: newItemState.tags || "normal",
      user: 51,

      // VERY IMPORTANT 👇
      manu_image: newItemState.file, // fix below
    };

    const res = await addMerchantMenu(payload);

    console.log("Add menu response:", res);

    if (res?.status) {
      alert("Menu added successfully");

      // reset form
      setNewItemState(emptyItem);

      // reload list
      fetchMenu();
    }
  } catch (err) {
    console.error("Add menu error:", err);
  }
};

const fetchMenu = async () => {
  try {
    const res = await getMerchantMenu({
      user: 51,
    });

    console.log("Menu API:", res);

    if (res?.status) {
      const data = res?.data;

      if (Array.isArray(data)) {
        setMenuData(data);
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
};
  
useEffect(() => {
  if (activeTab === "items" && !menuLoaded) {
    fetchMenu();
    setMenuLoaded(true);
  }
}, [activeTab]);

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
    if (err) return alert(err);
    // numeric conversions
    it.mrp = Number(it.mrp || 0);
    it.price = Number(it.price || 0);
    if (it.discount === "" || it.discount === null) it.discount = discountFromPrices(it.mrp, it.price);
    it.discount = clampDiscount(it.discount);
    it.stock = Number(it.stock || 0);
    setItems([it, ...items]);
    // clear form by type
    if (it.type === "item") setNewItemState(emptyItem);
    if (it.type === "service") setNewServiceState(emptyService);
    if (it.type === "allinone") setNewAllInOneState(emptyAllInOne);
    setActiveTab("items");
  };

  const toggleAvailability = (id) =>
    setItems(items.map((i) => (i.id === id ? { ...i, available: !i.available } : i)));

  const deleteItem = (id) => {
    if (!confirm("Delete this item?")) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const openEdit = (item) => {
    setEditing({ ...item });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editing) return;
    const err = validateRequiredItem(editing);
    if (err) return alert(err);
    const updated = items.map((i) => (i.id === editing.id ? { ...editing, mrp: Number(editing.mrp || 0), price: Number(editing.price || 0) } : i));
    setItems(updated);
    setShowEditModal(false);
    setEditing(null);
  };

  /* ---------- Import / Export ---------- */
  const importJSON = (file, targetType = "items") => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!Array.isArray(parsed)) return alert("Invalid JSON: expected an array");
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
        alert("Invalid JSON file");
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
        stock: it.stock || "",
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
    else alert("No items to export (items.csv)");

    if (servicesCSV) downloadFile(servicesCSV, "services.csv");
    else alert("No services to export (services.csv)");

    if (allinoneCSV) downloadFile(allinoneCSV, "allinone.csv");
    else alert("No all-in-one to export (allinone.csv)");
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

  if (filterCategory) {
   list = list.filter((it) =>
  String(it.category) === String(filterCategory)
);
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
  const STOCK_THRESHOLD = 5;
  const lowStock = items.filter((i) => Number(i.stock || 0) < STOCK_THRESHOLD && i.type !== "service");
  const categoryPerformance = categoryList.map((cat) => {
  const name = cat.name || cat.category_name;

  const list = items.filter((it) => it.category === name);
  const revenue = list.reduce((s, it) => s + (Number(it.revenue || 0)), 0);

  return { category: name, revenue };
});

  const topSelling = [...items]
    .filter((i) => Number(i.revenue || 0) > 0)
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, 10);

  /* ---------- UI Rendering ---------- */
  return (
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
            { id: "add", label: "Add Item" },
            { id: "add-service", label: "Add Service" },            
            { id: "promotions", label: "Promotions" },
            { id: "insights", label: "Insights" },
          ].map((t) => (
            <button
              key={t.id}
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
    <h2 className="text-lg font-semibold mb-3">All Menus</h2>

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
          <option value="service">Services</option>          
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
          <option value="name_asc">Name A → Z</option>
          <option value="price_desc">Price High → Low</option>
          <option value="price_asc">Price Low → High</option>
        </select>
      </div>

      {/* ACTION BUTTONS — STACK ON MOBILE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
      </div>
    </div>

    {/* Item List */}
    <div className="mt-4 space-y-3">
      {filteredItems.length === 0 ? (
        <div className="text-gray-500 p-6 text-center">No items found</div>
      ) : (
        filteredItems.map((it, index) => (
  <div key={it.id || it.menu_id || index} className="flex items-center justify-between p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-4 flex-1">
  {it.manu_image ? (
    <img
      src={it.manu_image}
      alt="img"
      className="w-16 h-16 rounded object-cover"
    />
  ) : (
    <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">
      No Image
    </div>
  )}

  <div>
    <div>
  <div className="font-semibold">
    {it.menu_name}
  </div>

  <div className="text-sm text-gray-500">
    {it.category}
  </div>

  <div className="mt-1 flex items-center gap-2">
    <span className="text-lg font-bold">
      ₹{it.discounted_price || it.menu_price}
    </span>

    {it.discounted_price && (
      <span className="line-through text-gray-500 text-sm">
        ₹{it.menu_price}
      </span>
    )}
  </div>
</div>

    {it.type !== "service" && (
      <div className="mt-1 flex items-center gap-2">
        <span className="text-lg font-bold">₹{it.discounted_price || it.menu_price}</span>
        {it.mrp ? (
          <span className="line-through text-gray-500 text-sm">
            ₹{it.mrp}
          </span>
        ) : null}
        {it.discount ? (
          <span className="text-xs text-green-600">
            ({it.discount}% off)
          </span>
        ) : null}
      </div>
    )}

    <div className="text-xs text-gray-500 mt-1">
      {it.type === "service"
        ? `Slots/day: ${it.slots || 0}`
        : `Stock: ${it.stock ?? 0}`}
    </div>
  </div>
</div>

<div className="flex items-center gap-3">
  {/* Availability toggle */}
  <label className="inline-flex relative items-center cursor-pointer">
    <input
      type="checkbox"
      checked={!!it.available}
      onChange={() => toggleAvailability(it.id)}
      className="sr-only peer"
    />
    <div className="w-12 h-6 bg-gray-200 rounded-full peer-checked:bg-orange-500 transition-all"></div>
    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
  </label>

  {/* Edit button */}
  <button
    onClick={() => openEdit(it)}
    className="px-3 py-1 border rounded-xl text-sm flex items-center gap-2"
  >
    <Edit size={14} /> Edit
  </button>

  {/* Delete button */}
  <button
    onClick={() => deleteItem(it.id)}
    className="px-3 py-1 border rounded-xl text-sm text-red-600 flex items-center gap-2"
  >
    <Trash2 size={14} /> Delete
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
              <button onClick={handleAddCategory} className="px-4 py-2 bg-orange-500 text-white rounded-xl"><Plus /> Add</button>
              <label className="bg-amber-400 text-white px-3 py-2 rounded-xl text-sm cursor-pointer">
                Import
                <input type="file" accept=".json" hidden onChange={(e)=>{ if (!e.target.files?.[0]) return; importJSON(e.target.files[0], "categories"); }} />
              </label>
            </div>

            <div className="space-y-2">
              {categoryList.length === 0 ? (
              <div className="text-gray-500">No categories yet</div>
            ) : (
              categoryList.map((c, index) => (
                <div key={c.id || index} className="flex items-center justify-between p-3 border rounded-xl">
                  <div className="font-medium">
                    {c.name || c.category_name}
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
              <input placeholder="MRP (₹)" value={newItemState.mrp} onChange={(e)=>{ const d=onlyDigits(e.target.value); setNewItemState(s=>({...s,mrp:d, price: s.discount ? priceFromMrpDiscount(d, s.discount) : s.price})); }} className="p-2 border rounded-xl" />
              <input placeholder="Selling price (₹)" value={newItemState.price} onChange={(e)=>{ const d=onlyDigits(e.target.value); setNewItemState(s=>({...s, price:d, discount: clampDiscount(discountFromPrices(s.mrp, d))})); }} className="p-2 border rounded-xl" />
              <input placeholder="Discount (%)" value={newItemState.discount} onChange={(e)=>{ const d=clampDiscount(e.target.value); setNewItemState(s=>({...s, discount:d, price: priceFromMrpDiscount(s.mrp, d)})); }} className="p-2 border rounded-xl" />
              <input placeholder="Stock qty" value={newItemState.stock} onChange={(e)=>setNewItemState(s=>({...s, stock: onlyDigits(e.target.value)}))} className="p-2 border rounded-xl" />
              <input placeholder="Unit / measurement" value={newItemState.unit} onChange={(e)=>setNewItemState(s=>({...s, unit: e.target.value}))} className="p-2 border rounded-xl" />
            </div>

            <textarea placeholder="Description" value={newItemState.desc} onChange={(e)=>setNewItemState(s=>({...s, desc:e.target.value}))} className="w-full p-2 border rounded-xl mt-3" />
            <input placeholder="Tags (comma separated)" value={newItemState.tags} onChange={(e)=>setNewItemState(s=>({...s, tags: e.target.value}))} className="w-full p-2 border rounded-xl mt-2" />

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

            <div className="mt-2">
              <label className="w-full border p-2 rounded-xl flex items-center justify-between cursor-pointer">
                <span>{newItemState.image ? "Image selected" : "Upload photo"}</span>
                <input type="file" accept="image/*" hidden 
                onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

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
              <button onClick={handleAddMenu} className="px-4 py-2 bg-orange-500 text-white rounded-xl">Save Item</button>
              <button onClick={()=>setNewItemState(emptyItem)} className="px-4 py-2 border rounded-xl">Reset</button>
            </div>
          </div>
        )}

        {/* ===== Add Service ===== */}
        {activeTab === "add-service" && (
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
            </div> */}
             </div>
          </div>
        )}



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
              <button onClick={handleAddOffer} className="px-4 py-2 bg-orange-500 text-white rounded-xl">Save Coupon</button>
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
                <div className="text-2xl font-bold">{items.filter(i=>i.type==="item").length}</div>
                <div className="text-xs text-gray-500 mt-1">Services: {items.filter(i=>i.type==="service").length} • All-in-one: {items.filter(i=>i.type==="allinone").length}</div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50">
                <div className="text-sm text-gray-500">Low Stock Alerts</div>
                <div className="text-2xl font-bold">{lowStock.length}</div>
                <div className="text-xs text-gray-500 mt-1">Threshold: {STOCK_THRESHOLD}</div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50">
                <div className="text-sm text-gray-500">Top Sellers (by revenue)</div>
                <div className="text-2xl font-bold">{topSelling.length}</div>
                <div className="text-xs text-gray-500 mt-1">Revenue data derived from `revenue` field on items</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-2xl shadow">
                <h4 className="font-semibold mb-2">Category Performance</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={categoryPerformance}>
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#fb923c" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-4 bg-white rounded-2xl shadow">
                <h4 className="font-semibold mb-2">Top Selling Items</h4>
                {topSelling.length ? topSelling.map((t)=>(
                  <div key={t.id} className="flex justify-between items-center py-1">
                    <div>{t.name}</div>
                    <div className="text-sm text-gray-600">₹{t.revenue}</div>
                  </div>
                )) : <div className="text-gray-500">No revenue data available</div>}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Edit modal (orange light backdrop instead of black) */}
      {showEditModal && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "linear-gradient(180deg, rgba(255,240,230,0.85), rgba(255,245,240,0.95))" }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Edit {editing.type}</h3>
              <button onClick={()=>{ setShowEditModal(false); setEditing(null); }} className="text-gray-500">Close</button>
            </div>

            <div className="space-y-3">
              <input value={editing.name || ""} onChange={(e)=>setEditing(prev=>({...prev, name: e.target.value}))} className="w-full p-2 border rounded-xl" />
              {editing.type !== "service" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input value={editing.mrp || ""} onChange={(e)=>{ const d=onlyDigits(e.target.value); setEditing(prev=>({...prev, mrp: d, price: prev.discount ? priceFromMrpDiscount(d, prev.discount) : prev.price })); }} placeholder="MRP (₹)" className="p-2 border rounded-xl" />
                  <input value={editing.price || ""} onChange={(e)=>{ const d=onlyDigits(e.target.value); setEditing(prev=>({...prev, price: d, discount: clampDiscount(discountFromPrices(prev.mrp, d))})); }} placeholder="Price (₹)" className="p-2 border rounded-xl" />
                  <input value={editing.discount || ""} onChange={(e)=>{ const d = clampDiscount(e.target.value); setEditing(prev=>({...prev, discount: d, price: priceFromMrpDiscount(prev.mrp, d)})); }} placeholder="Discount (%)" className="p-2 border rounded-xl" />
                </div>
              )}

              {editing.type === "service" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input value={editing.price || ""} onChange={(e)=>setEditing(prev=>({...prev, price: onlyDigits(e.target.value)}))} placeholder="Service Price (₹)" className="p-2 border rounded-xl" />
                  <input value={editing.duration || ""} onChange={(e)=>setEditing(prev=>({...prev, duration: onlyDigits(e.target.value)}))} placeholder="Duration (min)" className="p-2 border rounded-xl" />
                </div>
              )}

              <input value={editing.stock || ""} onChange={(e)=>setEditing(prev=>({...prev, stock: onlyDigits(e.target.value)}))} placeholder="Stock / slots" className="w-full p-2 border rounded-xl" />
              <textarea value={editing.desc || ""} onChange={(e)=>setEditing(prev=>({...prev, desc: e.target.value}))} className="w-full p-2 border rounded-xl" />
              <input value={editing.tags || ""} onChange={(e)=>setEditing(prev=>({...prev, tags: e.target.value}))} className="w-full p-2 border rounded-xl" />
              <select value={editing.category || ""} onChange={(e)=>setEditing(prev=>({...prev, category: e.target.value}))} className="w-full p-2 border rounded-xl">
                <option value="">Select Category</option>
               {categoryList.map((c, index) => (
              <div key={c.id || index} className="flex items-center justify-between p-3 border rounded-xl">
                <div className="font-medium">
                  {c.name || c.category_name}
                </div>
              </div>
            ))}
              </select>

              <div>
                <label className="w-full border p-2 rounded-xl flex items-center justify-between cursor-pointer">
                  <span>{editing.image ? "Image selected" : "Upload photo"}</span>
                  <input type="file" accept="image/*" hidden onChange={(e)=>{ if (!e.target.files?.[0]) return; setEditing(prev=>({...prev, image: URL.createObjectURL(e.target.files[0])})); }} />
                </label>
                {editing.image && <img src={editing.image} alt="preview" className="mt-2 w-28 h-28 object-cover rounded" />}
              </div>

              <div className="flex gap-2">
                <button onClick={saveEdit} className="px-4 py-2 bg-orange-500 text-white rounded-xl">Save Changes</button>
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

    </div>
  );
}
