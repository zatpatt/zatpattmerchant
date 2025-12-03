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
const COUPONS_KEY = "merchant_coupons";

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
  const [categories, setCategories] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CATS_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ITEMS_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [coupons, setCoupons] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(COUPONS_KEY) || "[]");
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

  // ensure localStorage sync on changes
  useEffect(() => {
    localStorage.setItem(CATS_KEY, JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  }, [items]);
  useEffect(() => {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
  }, [coupons]);

  // live update if other tabs / windows change storage
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CATS_KEY) {
        setCategories(JSON.parse(e.newValue || "[]"));
      }
      if (e.key === ITEMS_KEY) {
        setItems(JSON.parse(e.newValue || "[]"));
      }
      if (e.key === COUPONS_KEY) {
        setCoupons(JSON.parse(e.newValue || "[]"));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ---------- Category CRUD ---------- */
  const addCategory = () => {
    const name = (newCategory || "").trim();
    if (!name) return alert("Category name required");
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase()))
      return alert("Category already exists");
    const cat = { id: Date.now(), name, visible: true };
    setCategories([cat, ...categories]);
    setNewCategory("");
  };
  const toggleCategoryVisibility = (id) =>
    setCategories(
      categories.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    );
  const deleteCategory = (id) => {
    if (!confirm("Delete category? Items under it will keep category string.")) return;
    setCategories(categories.filter((c) => c.id !== id));
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
  const addCoupon = () => {
    const c = { ...couponState };
    if (!c.code.trim()) return alert("Provide coupon code");
    if (c.kind !== "percent" && c.kind !== "flat") return alert("Invalid kind");
    if (!c.value || Number(c.value) <= 0) return alert("Value required");
    const exists = coupons.some((x) => x.code.toLowerCase() === c.code.toLowerCase());
    if (exists) return alert("Coupon code exists");
    const toSave = { ...c, id: Date.now(), value: Number(c.value || 0), minOrder: Number(c.minOrder || 0) };
    setCoupons([toSave, ...coupons]);
    setCouponState(emptyCoupon);
  };
  const deleteCoupon = (id) => {
    if (!confirm("Delete coupon?")) return;
    setCoupons(coupons.filter((c) => c.id !== id));
  };

  /* ---------- Derived data / filters / sorting ---------- */
 const visibleCategoryNames = useMemo(
  () => categories.filter((c) => c.visible).map((c) => c.name),
  [categories]
);

const filteredItems = useMemo(() => {
  let list = items.slice();

  // hide items in hidden categories
  list = list.filter((it) =>
    it.category ? visibleCategoryNames.includes(it.category) : true
  );

  if (filterType !== "all") list = list.filter((it) => it.type === filterType);
  if (filterCategory) list = list.filter((it) => it.category === filterCategory);

  if (searchQ.trim()) {
    const q = searchQ.trim().toLowerCase();
    list = list.filter((it) => {
      const hay = `${it.name} ${it.tags || ""} ${it.category || ""} ${it.desc || ""}`.toLowerCase();
      return hay.includes(q) || String(it.id).toLowerCase().includes(q);
    });
  }

  if (sortKey === "name_asc")
    list.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortKey === "price_desc")
    list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  else if (sortKey === "price_asc")
    list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));

  return list;
}, [items, filterType, filterCategory, searchQ, sortKey, visibleCategoryNames]);

  /* ---------- Insights ---------- */
  const STOCK_THRESHOLD = 5;
  const lowStock = items.filter((i) => Number(i.stock || 0) < STOCK_THRESHOLD && i.type !== "service");
  const categoryPerformance = categories.map((cat) => {
    const list = items.filter((it) => it.category === cat.name);
    const revenue = list.reduce((s, it) => s + (Number(it.revenue || 0)), 0);
    return { category: cat.name, revenue };
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
            { id: "items", label: "All Items" },
            { id: "categories", label: "Categories" },
            { id: "add", label: "Add Item" },
            { id: "add-service", label: "Add Service" },
            { id: "add-allinone", label: "Add All-in-one" },
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
       {/* ===== All Items ===== */}
{activeTab === "items" && (
  <div className="bg-white p-4 rounded-2xl shadow">

    {/* Title */}
    <h2 className="text-lg font-semibold mb-3">All Items</h2>

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
          <option value="allinone">All-in-one</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm min-w-[140px]"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}{c.visible ? "" : " (hidden)"}
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
        filteredItems.map((it) => (
          <div key={it.id} className="flex items-center justify-between p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-4 flex-1">
  {it.image ? (
    <img
      src={it.image}
      alt="img"
      className="w-16 h-16 rounded object-cover"
    />
  ) : (
    <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">
      No Image
    </div>
  )}

  <div>
    <div className="font-semibold">
      {it.name}
      <span className="text-xs text-gray-500 ml-2">[{it.type}]</span>
    </div>

    <div className="text-sm text-gray-500">
      {it.category} • {it.tags || "—"}
    </div>

    {it.type !== "service" && (
      <div className="mt-1 flex items-center gap-2">
        <span className="text-lg font-bold">₹{it.price}</span>
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
              <button onClick={addCategory} className="px-4 py-2 bg-orange-500 text-white rounded-xl"><Plus /> Add</button>
              <label className="bg-amber-400 text-white px-3 py-2 rounded-xl text-sm cursor-pointer">
                Import
                <input type="file" accept=".json" hidden onChange={(e)=>{ if (!e.target.files?.[0]) return; importJSON(e.target.files[0], "categories"); }} />
              </label>
            </div>

            <div className="space-y-2">
              {categories.length === 0 ? <div className="text-gray-500">No categories yet</div> : categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">({items.filter(it=>it.category===c.name).length} items)</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>toggleCategoryVisibility(c.id)} className="px-3 py-1 border rounded-xl text-sm">
                      {c.visible ? "Hide" : "Unhide"}
                    </button>
                    <button onClick={()=>deleteCategory(c.id)} className="px-3 py-1 border rounded-xl text-sm text-red-600"><Trash2 /></button>
                  </div>
                </div>
              ))}
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
              {categories.map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>

            <div className="mt-2">
              <label className="w-full border p-2 rounded-xl flex items-center justify-between cursor-pointer">
                <span>{newItemState.image ? "Image selected" : "Upload photo"}</span>
                <input type="file" accept="image/*" hidden onChange={(e)=>{ if (!e.target.files?.[0]) return; setNewItemState(s=>({...s, image: URL.createObjectURL(e.target.files[0])})); }} />
              </label>
              {newItemState.image && <img src={newItemState.image} alt="preview" className="mt-2 w-28 h-28 object-cover rounded" />}
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={()=>addNewItem({...newItemState, type:"item"})} className="px-4 py-2 bg-orange-500 text-white rounded-xl">Save Item</button>
              <button onClick={()=>setNewItemState(emptyItem)} className="px-4 py-2 border rounded-xl">Reset</button>
            </div>
          </div>
        )}

        {/* ===== Add Service ===== */}
        {activeTab === "add-service" && (
          <div className="bg-white p-4 rounded-2xl shadow">
            <h2 className="text-lg font-semibold">Add New Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <input placeholder="Service name" value={newServiceState.name} onChange={(e)=>setNewServiceState(s=>({...s, name:e.target.value}))} className="p-2 border rounded-xl" />
              <input placeholder="Service price (₹)" value={newServiceState.price} onChange={(e)=>setNewServiceState(s=>({...s, price: onlyDigits(e.target.value)}))} className="p-2 border rounded-xl" />
              <input placeholder="Time required (minutes)" value={newServiceState.duration} onChange={(e)=>setNewServiceState(s=>({...s, duration: onlyDigits(e.target.value)}))} className="p-2 border rounded-xl" />
              <input placeholder="Max slots / day" value={newServiceState.slots} onChange={(e)=>setNewServiceState(s=>({...s, slots: onlyDigits(e.target.value)}))} className="p-2 border rounded-xl" />
              <select value={newServiceState.category} onChange={(e)=>setNewServiceState(s=>({...s, category: e.target.value}))} className="p-2 border rounded-xl">
                <option value="">Select Category</option>
                {categories.map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
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
        )}

        {/* ===== Add All-in-one ===== */}
        {activeTab === "add-allinone" && (
          <div className="bg-white p-4 rounded-2xl shadow">
            <h2 className="text-lg font-semibold">Add All-in-one</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <input placeholder="Item name" value={newAllInOneState.name} onChange={(e)=>setNewAllInOneState(s=>({...s, name:e.target.value}))} className="p-2 border rounded-xl" />
              <input placeholder="MRP (₹)" value={newAllInOneState.mrp} onChange={(e)=>{ const d=onlyDigits(e.target.value); setNewAllInOneState(s=>({...s, mrp:d, price: s.discount ? priceFromMrpDiscount(d, s.discount) : s.price})); }} className="p-2 border rounded-xl" />
              <input placeholder="Selling price (₹)" value={newAllInOneState.price} onChange={(e)=>{ const d=onlyDigits(e.target.value); setNewAllInOneState(s=>({...s, price:d, discount: clampDiscount(discountFromPrices(s.mrp, d))})); }} className="p-2 border rounded-xl" />
              <input placeholder="Discount (%)" value={newAllInOneState.discount} onChange={(e)=>{ const d=clampDiscount(e.target.value); setNewAllInOneState(s=>({...s, discount:d, price: priceFromMrpDiscount(s.mrp, d)})); }} className="p-2 border rounded-xl" />
              <input placeholder="Stock qty" value={newAllInOneState.stock} onChange={(e)=>setNewAllInOneState(s=>({...s, stock: onlyDigits(e.target.value)}))} className="p-2 border rounded-xl" />
              <input placeholder="Unit / measurement" value={newAllInOneState.unit} onChange={(e)=>setNewAllInOneState(s=>({...s, unit: e.target.value}))} className="p-2 border rounded-xl" />
            </div>

            <textarea placeholder="Description" value={newAllInOneState.desc} onChange={(e)=>setNewAllInOneState(s=>({...s, desc:e.target.value}))} className="w-full p-2 border rounded-xl mt-3" />
            <input placeholder="Tags (comma separated)" value={newAllInOneState.tags} onChange={(e)=>setNewAllInOneState(s=>({...s, tags: e.target.value}))} className="w-full p-2 border rounded-xl mt-2" />

            <select value={newAllInOneState.category} onChange={(e)=>setNewAllInOneState(s=>({...s, category: e.target.value}))} className="w-full p-2 border rounded-xl mt-2">
              <option value="">Select Category</option>
              {categories.map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>

            <div className="mt-2">
              <label className="w-full border p-2 rounded-xl flex items-center justify-between cursor-pointer">
                <span>{newAllInOneState.image ? "Image selected" : "Upload photo"}</span>
                <input type="file" accept="image/*" hidden onChange={(e)=>{ if (!e.target.files?.[0]) return; setNewAllInOneState(s=>({...s, image: URL.createObjectURL(e.target.files[0])})); }} />
              </label>
              {newAllInOneState.image && <img src={newAllInOneState.image} alt="preview" className="mt-2 w-28 h-28 object-cover rounded" />}
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={()=>addNewItem({...newAllInOneState, type:"allinone"})} className="px-4 py-2 bg-orange-500 text-white rounded-xl">Save All-in-one Item</button>
              <button onClick={()=>setNewAllInOneState(emptyAllInOne)} className="px-4 py-2 border rounded-xl">Reset</button>
            </div>
          </div>
        )}

        {/* ===== Promotions (Coupons) ===== */}
        {activeTab === "promotions" && (
          <div className="bg-white p-4 rounded-2xl shadow space-y-4">
            <h2 className="text-lg font-semibold">Promotions & Coupons</h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input placeholder="Coupon code" value={couponState.code} onChange={(e)=>setCouponState(s=>({...s, code: e.target.value}))} className="p-2 border rounded-xl" />
              <select value={couponState.kind} onChange={(e)=>setCouponState(s=>({...s, kind: e.target.value}))} className="p-2 border rounded-xl">
                <option value="percent">Percent (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
              <input placeholder="Value" value={couponState.value} onChange={(e)=>setCouponState(s=>({...s, value: onlyDigits(e.target.value)}))} className="p-2 border rounded-xl" />
              <input placeholder="Min order (₹)" value={couponState.minOrder} onChange={(e)=>setCouponState(s=>({...s, minOrder: onlyDigits(e.target.value)}))} className="p-2 border rounded-xl" />
              <input type="date" value={couponState.expiry} onChange={(e)=>setCouponState(s=>({...s, expiry: e.target.value}))} className="p-2 border rounded-xl" />
            </div>

            <div className="flex gap-2">
              <button onClick={addCoupon} className="px-4 py-2 bg-orange-500 text-white rounded-xl">Save Coupon</button>
              <label className="bg-amber-400 text-white px-3 py-2 rounded-xl text-sm cursor-pointer">
                Import
                <input type="file" accept=".json" hidden onChange={(e)=>{ if (!e.target.files?.[0]) return; importJSON(e.target.files[0],"coupons"); }} />
              </label>
              <button onClick={()=>downloadFile(JSON.stringify(coupons, null, 2), "coupons.json", "application/json")} className="px-4 py-2 border rounded-xl flex items-center gap-2"><Download /> Export</button>
            </div>

            <div>
              {coupons.length === 0 ? <div className="text-gray-500">No coupons</div> : coupons.map((c)=>(
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-xl">
                  <div>
                    <div className="font-semibold">{c.code} <span className="text-xs text-gray-500">({c.kind === "percent" ? `${c.value}%` : `₹${c.value}`})</span></div>
                    <div className="text-xs text-gray-500">Min order: ₹{c.minOrder || 0} • Expiry: {c.expiry || "—"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>deleteCoupon(c.id)} className="px-3 py-1 border rounded-xl text-sm text-red-600"><Trash2 /></button>
                  </div>
                </div>
              ))}
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
                {categories.map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
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

    </div>
  );
}
