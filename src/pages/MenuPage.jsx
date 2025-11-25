// src/pages/MenuPage.jsx
import React, { useState, useEffect } from "react";
import { Plus, Trash2, ArrowLeft, RefreshCw, Edit } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios"; // For AI API calls (optional - will fail gracefully if no key)

/**
 MenuPage.jsx
 - Adds: MRP (original struck price) + Selling Price
 - Validations: digits-only prices, discount 0-100, required fields gating Save
 - Availability toggle becomes orange when active
 - Edit modal includes MRP & Selling Price (you requested YES)
 - AI suggestion hook preserved (uses openai if key provided)
*/

const CATS_KEY = "merchant_categories";
const ITEMS_KEY = "merchant_items";

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState("items");
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [newCategory, setNewCategory] = useState("");

{[
  { id: "items", label: "All Items" },
  { id: "categories", label: "Categories" },
  { id: "add", label: "Add Item" },
  { id: "add-service", label: "Add Service" },  // <-- new tab
  { id: "promotions", label: "Promotions" },
  { id: "insights", label: "Insights" },
].map((tab) => (
  <button key={tab.id}
    onClick={() => setActiveTab(tab.id)}
    className={`flex-1 py-3 text-sm font-medium ${activeTab === tab.id ? "text-orange-600 border-b-2 border-orange-500" : "text-gray-500"}`}>
    {tab.label}
  </button>
))}

const emptyService = {
  name: "",
  price: "",
  duration: "",
  slots: "",
  desc: "",
  category: "",
  tags: "",
  image: ""
};

const [newService, setNewService] = useState(emptyService);

  const emptyItem = {
    name: "",
    mrp: "", // Original (struck) price - digits only
    price: "", // Selling price - digits only
    discount: "", // percent 0-100
    stock: "",
    desc: "",
    tags: "",
    category: "",
    unit: "",
    image: ""
  };

  const [newItem, setNewItem] = useState(emptyItem);
  const [isLive, setIsLive] = useState(true);
  const [schedule, setSchedule] = useState({ start: "", end: "" });

  // AI Suggestions
  const [loadingAI, setLoadingAI] = useState(false);

  // Edit modal
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const savedCats = JSON.parse(localStorage.getItem(CATS_KEY) || "[]");
    const savedItems = JSON.parse(localStorage.getItem(ITEMS_KEY) || "[]");
    setCategories(savedCats);
    setItems(savedItems);
  }, []);

  useEffect(() => {
    localStorage.setItem(CATS_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  }, [items]);

  // === AI Suggestions for Item Details (fires when user stops typing item name) ===
  useEffect(() => {
    if (!newItem.name) return;
    // debounce
    const id = setTimeout(() => {
      fetchAISuggestions(newItem.name);
    }, 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newItem.name]);

  // === helper validators & calculations ===
  const onlyDigits = (val) => val.replace(/\D/g, "");

  // clamp discount 0..100 and return numeric string
  const clampDiscount = (v) => {
    const n = Number(v || 0);
    if (isNaN(n)) return "0";
    if (n < 0) return "0";
    if (n > 100) return "100";
    return String(Math.round(n));
  };

  // calculate discount percent from mrp & price
  const discountFromPrices = (mrp, price) => {
    const m = Number(mrp || 0);
    const p = Number(price || 0);
    if (!m || m <= 0) return 0;
    const d = Math.round(((m - p) / m) * 100);
    return Math.max(0, Math.min(100, d));
  };

  // calculate selling price from mrp & discount
  const priceFromMrpDiscount = (mrp, discount) => {
    const m = Number(mrp || 0);
    const d = Number(discount || 0);
    if (!m) return 0;
    return Math.round(m * (1 - d / 100));
  };

  // Save button enabled only when required fields present
  const isSaveEnabled = (item = newItem) => {
    return (
      item.name.trim() &&
      item.category.trim() &&
      item.stock.toString().trim() &&
      item.desc.trim() &&
      item.tags.trim() &&
      item.image &&
      item.mrp.toString().trim() &&
      item.price.toString().trim()
    );
  };

  // AI Suggestion function (uses OpenAI chat completions endpoint). Will fail gracefully without key.
  const fetchAISuggestions = async (itemName) => {
    if (!itemName || !itemName.trim()) return;
    setLoadingAI(true);
    try {
      // Attempt to use VITE_OPENAI_API_KEY (vite) else REACT_APP_OPENAI_API_KEY
      const key = import.meta?.env?.VITE_OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;
      if (!key) {
        // No API key: skip and return
        setLoadingAI(false);
        return;
      }

      const prompt = `I am adding a food item "${itemName}". Suggest:
- Category
- Tags (comma separated)
- Short description (15-30 words)
- An example public image URL for that food (not copyrighted characters)
Provide response in strict JSON: { "category": "", "tags": "", "description": "", "image": "" }`;

      const resp = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini", // fallback model string (user can change); keep generic
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 400
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json"
          }
        }
      );

      const content = resp.data?.choices?.[0]?.message?.content;
      if (!content) {
        setLoadingAI(false);
        return;
      }
      // parse JSON even if there's extra text
      const jsonText = content.trim().replace(/^[\s\S]*?{/, "{").replace(/}[\s\S]*?$/, "}");
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (e) {
        // try to extract JSON with regex
        const match = content.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : null;
      }
      if (parsed) {
        setNewItem((prev) => ({
          ...prev,
          category: parsed.category || prev.category,
          tags: parsed.tags || prev.tags,
          desc: parsed.description || prev.desc,
          image: parsed.image || prev.image
        }));
      }
    } catch (err) {
      console.warn("AI suggestion failed:", err?.message || err);
    } finally {
      setLoadingAI(false);
    }
  };

  // ===== category helpers =====
  const addCategory = () => {
    if (!newCategory.trim()) return;
    setCategories([...categories, { id: Date.now(), name: newCategory, visible: true }]);
    setNewCategory("");
  };
  const toggleCategory = (id) => setCategories(categories.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  const deleteCategory = (id) => setCategories(categories.filter(c => c.id !== id));

  // ===== items CRUD =====
  const addItem = () => {
    if (!isSaveEnabled(newItem)) {
      alert("Please fill required fields (name, category, stock, description, tags, photo, MRP and price).");
      return;
    }
    const itemToSave = {
      ...newItem,
      id: Date.now(),
      available: true,
      mrp: Number(newItem.mrp || 0),
      price: Number(newItem.price || 0),
      discount: Number(clampDiscount(newItem.discount || discountFromPrices(newItem.mrp, newItem.price)))
    };
    setItems([itemToSave, ...items]);
    setNewItem(emptyItem);
    setActiveTab("items");
  };

  const toggleAvailability = (id) => {
    setItems(items.map(i => i.id === id ? { ...i, available: !i.available } : i));
  };

  const deleteItem = (id) => {
    if (!confirm("Delete this item?")) return;
    setItems(items.filter(i => i.id !== id));
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "menu_data.json";
    link.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // insights
  const STOCK_THRESHOLD = 5;
  const topSelling = [...items].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 5);
  const lowStock = items.filter(i => parseInt(i.stock || 0) < STOCK_THRESHOLD);
  const totalStock = items.reduce((sum, i) => sum + (parseInt(i.stock || 0) || 0), 0);

  const categoryPerformance = categories.map(cat => {
    const catItems = items.filter(i => i.category === cat.name);
    const totalRevenue = catItems.reduce((sum, i) => sum + (i.revenue || 0), 0);
    return { category: cat.name, revenue: totalRevenue };
  });

  const restockItem = (id) => {
    const qty = parseInt(prompt("Enter quantity to restock:", "10"));
    if (!qty || qty <= 0) return;
    setItems(items.map(i => i.id === id ? { ...i, stock: (parseInt(i.stock || 0) + qty) } : i));
  };

  // ===== edit modal handlers =====
  const openEditModal = (item) => {
    setEditingItem({ ...item }); // clone
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingItem) return;
    // validation like add
    if (!isSaveEnabled(editingItem)) {
      alert("Please fill required fields in edit (name, category, stock, description, tags, photo, MRP and price).");
      return;
    }
    const updated = items.map(i => i.id === editingItem.id ? {
      ...editingItem,
      mrp: Number(editingItem.mrp || 0),
      price: Number(editingItem.price || 0),
      discount: Number(clampDiscount(editingItem.discount || discountFromPrices(editingItem.mrp, editingItem.price)))
    } : i);
    setItems(updated);
    setShowEditModal(false);
    setEditingItem(null);
  };

  // small input helpers for newItem (apply digits-only, compute derived)
  const onNewMrpChange = (v) => {
    const digits = onlyDigits(v);
    const discount = newItem.discount ? Number(clampDiscount(newItem.discount)) : discountFromPrices(digits, newItem.price);
    const newPrice = newItem.discount ? priceFromMrpDiscount(digits, discount) : newItem.price;
    setNewItem(prev => ({ ...prev, mrp: digits, price: String(newPrice), discount: String(discount) }));
  };

  const onNewPriceChange = (v) => {
    const digits = onlyDigits(v);
    const disc = discountFromPrices(newItem.mrp, digits);
    setNewItem(prev => ({ ...prev, price: digits, discount: String(disc) }));
  };

  const onNewDiscountChange = (v) => {
    const d = clampDiscount(v);
    const p = priceFromMrpDiscount(newItem.mrp, d);
    setNewItem(prev => ({ ...prev, discount: d, price: String(p) }));
  };

  // edit item field handlers
  const onEditMrpChange = (v) => {
    const digits = onlyDigits(v);
    const disc = editingItem.discount ? Number(clampDiscount(editingItem.discount)) : discountFromPrices(digits, editingItem.price);
    const priceCalc = editingItem.discount ? priceFromMrpDiscount(digits, disc) : editingItem.price;
    setEditingItem(prev => ({ ...prev, mrp: digits, price: String(priceCalc), discount: String(disc) }));
  };
  const onEditPriceChange = (v) => {
    const digits = onlyDigits(v);
    const disc = discountFromPrices(editingItem.mrp, digits);
    setEditingItem(prev => ({ ...prev, price: digits, discount: String(disc) }));
  };
  const onEditDiscountChange = (v) => {
    const d = clampDiscount(v);
    const p = priceFromMrpDiscount(editingItem.mrp, d);
    setEditingItem(prev => ({ ...prev, discount: d, price: String(p) }));
  };

  return (
    <div className="min-h-screen bg-[#fff9f4] text-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white p-5 flex justify-between items-center">
        <button
          onClick={() => window.history.back()}
          className="bg-white text-black rounded-full p-2 shadow-md hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold">📋 Menu Management</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsLive(!isLive)} className={`px-4 py-2 rounded-xl ${isLive ? "bg-orange-500" : "bg-gray-500"}`}>
            {isLive ? "🟢 Live" : "🔴 Paused"}
          </button>
          <button onClick={() => alert("Schedule saved!")} className="bg-white text-orange-500 px-3 py-2 rounded-xl">⏱️ Schedule</button>
        </div>
      </div>

      {/* Tabs */}
<div className="flex justify-around bg-white shadow sticky top-0 z-10">
  {[
    { id: "items", label: "All Items" },
    { id: "categories", label: "Categories" },
    { id: "add", label: "Add Item" },
    { id: "add-service", label: "Add Service" }, // <-- add this
    { id: "promotions", label: "Promotions" },
    { id: "insights", label: "Insights" },
  ].map((tab) => (
    <button key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`flex-1 py-3 text-sm font-medium ${activeTab === tab.id ? "text-orange-600 border-b-2 border-orange-500" : "text-gray-500"}`}>
      {tab.label}
    </button>
  ))}
</div>

      <div className="p-5">
        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div>
            <h2 className="text-lg font-semibold mb-3">📂 Manage Categories</h2>
            <div className="flex gap-2 mb-4">
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New Category"
                className="flex-1 border p-2 rounded-xl" />
              <button onClick={addCategory} className="bg-orange-500 text-white px-4 rounded-xl"><Plus size={18} /></button>
            </div>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow">
                  <div>{cat.name}</div>
                  <div className="flex gap-3">
                    <button onClick={() => toggleCategory(cat.id)}>{cat.visible ? "👁️" : "🚫"}</button>
                    <button onClick={() => deleteCategory(cat.id)}><Trash2 size={18} className="text-red-500" /></button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p className="text-gray-400">No categories yet.</p>}
            </div>
          </div>
        )}

        {/* All Items Tab */}
        {activeTab === "items" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">🍴 All Items</h2>
              <div className="flex gap-3">
                <button onClick={exportData} className="bg-orange-500 text-white px-3 py-2 rounded-xl text-sm">📤 Export</button>
                <label className="bg-amber-400 text-white px-3 py-2 rounded-xl text-sm cursor-pointer">
                  📥 Import <input type="file" accept=".json" hidden onChange={importData} />
                </label>
                <button onClick={() => setItems([])} className="bg-red-400 text-white px-3 py-2 rounded-xl text-sm">🗑️ Clear</button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.category} • {item.unit || ""}</div>
                    <div className="mt-1">
                      <span className="text-lg font-bold">₹{item.price}</span>
                      {item.mrp ? (
                        <span className="text-sm text-gray-500 ml-3 line-through">₹{item.mrp}</span>
                      ) : null}
                      {item.discount ? <span className="text-xs ml-3 text-green-600">({item.discount}% off)</span> : null}
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    {/* orange switch when active */}
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input type="checkbox" checked={item.available} onChange={() => toggleAvailability(item.id)} className="sr-only peer" />
                      <div className="w-12 h-6 bg-gray-200 rounded-full peer-focus:ring-4 peer-focus:ring-orange-200 transition-all peer-checked:bg-orange-500"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                    </label>

                    <button onClick={() => openEditModal(item)} title="Edit" className="text-gray-600 hover:text-orange-500">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => deleteItem(item.id)}><Trash2 size={18} className="text-red-500" /></button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-center text-gray-400 py-5">No items yet. Add one!</p>}
            </div>
          </div>
        )}

        {/* Add Item Tab */}
        {activeTab === "add" && (
          <div>
            <h2 className="text-lg font-semibold mb-3">➕ Add New Item</h2>
            <div className="space-y-3 bg-white p-4 rounded-2xl shadow">
              <input placeholder="Item Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full border p-2 rounded-xl" />
              {loadingAI && <p className="text-sm text-gray-500">Fetching AI suggestions...</p>}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input placeholder="MRP (₹)" value={newItem.mrp} onChange={(e) => onNewMrpChange(e.target.value)} className="w-full border p-2 rounded-xl" />
                <input placeholder="Selling Price (₹)" value={newItem.price} onChange={(e) => onNewPriceChange(e.target.value)} className="w-full border p-2 rounded-xl" />
                <input placeholder="Discount (%)" value={newItem.discount} onChange={(e) => onNewDiscountChange(e.target.value)} className="w-full border p-2 rounded-xl" />
              </div>

              <input placeholder="Stock Qty" value={newItem.stock} onChange={(e) => setNewItem({ ...newItem, stock: onlyDigits(e.target.value) })} className="w-full border p-2 rounded-xl" />
              <textarea placeholder="Description" value={newItem.desc} onChange={(e) => setNewItem({ ...newItem, desc: e.target.value })} className="w-full border p-2 rounded-xl" />
              <input placeholder="Tags (comma separated)" value={newItem.tags} onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })} className="w-full border p-2 rounded-xl" />
              <input placeholder="Unit / Measurement" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} className="w-full border p-2 rounded-xl" />
              <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="w-full border p-2 rounded-xl">
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c.id}>{c.name}</option>)}
              </select>

              <div>
                <label className="w-full border p-2 rounded-xl flex items-center justify-between cursor-pointer">
                  <span>{newItem.image ? "Image selected" : "Upload photo"}</span>
                  <input type="file" accept="image/*" onChange={(e) => {
                    if (!e.target.files?.[0]) return;
                    setNewItem({ ...newItem, image: URL.createObjectURL(e.target.files[0]) });
                  }} className="hidden" />
                </label>
                {newItem.image && <img src={newItem.image} alt="preview" className="mt-2 w-28 h-28 object-cover rounded" />}
              </div>

              <button
                onClick={addItem}
                disabled={!isSaveEnabled()}
                className={`w-full py-2 rounded-xl mt-2 font-semibold ${isSaveEnabled() ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
              >
                Save Item
              </button>
            </div>
          </div>
        )}

{/* Add Service Tab */}
{activeTab === "add-service" && (
  <div>
    <h2 className="text-lg font-semibold mb-3">➕ Add New Service</h2>
    <div className="space-y-3 bg-white p-4 rounded-2xl shadow">
      <input placeholder="Service Name"
        value={newService.name}
        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
        className="w-full border p-2 rounded-xl" />

      <input placeholder="Service Price (₹)"
        value={newService.price}
        onChange={(e) => setNewService({ ...newService, price: onlyDigits(e.target.value) })}
        className="w-full border p-2 rounded-xl" />

      <input placeholder="Duration (minutes)"
        value={newService.duration}
        onChange={(e) => setNewService({ ...newService, duration: onlyDigits(e.target.value) })}
        className="w-full border p-2 rounded-xl" />

      <input placeholder="Max Slots / Day"
        value={newService.slots}
        onChange={(e) => setNewService({ ...newService, slots: onlyDigits(e.target.value) })}
        className="w-full border p-2 rounded-xl" />

      <textarea placeholder="Description"
        value={newService.desc}
        onChange={(e) => setNewService({ ...newService, desc: e.target.value })}
        className="w-full border p-2 rounded-xl" />

      <input placeholder="Tags (comma separated)"
        value={newService.tags}
        onChange={(e) => setNewService({ ...newService, tags: e.target.value })}
        className="w-full border p-2 rounded-xl" />

      <select value={newService.category} onChange={(e) => setNewService({ ...newService, category: e.target.value })} className="w-full border p-2 rounded-xl">
        <option value="">Select Category</option>
        {categories.map(c => <option key={c.id}>{c.name}</option>)}
      </select>

      <div>
        <label className="w-full border p-2 rounded-xl flex items-center justify-between cursor-pointer">
          <span>{newService.image ? "Image selected" : "Upload photo"}</span>
          <input type="file" accept="image/*" onChange={(e) => {
            if (!e.target.files?.[0]) return;
            setNewService({ ...newService, image: URL.createObjectURL(e.target.files[0]) });
          }} className="hidden" />
        </label>
        {newService.image && <img src={newService.image} alt="preview" className="mt-2 w-28 h-28 object-cover rounded" />}
      </div>

      <button
        onClick={() => {
          if (!newService.name || !newService.price || !newService.duration) {
            alert("Please fill required fields for service.");
            return;
          }
          const serviceToSave = {
            ...newService,
            id: Date.now(),
            type: "service",
            available: true,
            price: Number(newService.price)
          };
          setItems([serviceToSave, ...items]);
          setNewService(emptyService);
          setActiveTab("items");
        }}
        className="w-full py-2 rounded-xl mt-2 font-semibold bg-orange-500 text-white"
      >
        Save Service
      </button>
    </div>
  </div>
)}

        {/* Promotions Tab */}
        {activeTab === "promotions" && (
          <div>
            <h2 className="text-lg font-semibold mb-3">🎁 Promotions & Add-ons</h2>
            <p className="text-gray-500 mb-3">Create combos, featured items, and special deals.</p>
            <div className="bg-white p-4 rounded-2xl shadow space-y-3">
              <button className="w-full bg-amber-400 text-white py-2 rounded-xl">Add Combo / Bundle</button>
              <button className="w-full bg-orange-500 text-white py-2 rounded-xl">Add Add-on Item</button>
              <button className="w-full bg-green-500 text-white py-2 rounded-xl">Set Featured Item</button>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div>
            <h2 className="text-lg font-semibold mb-3">📊 Menu Insights</h2>
            {/* Total Stock */}
            <div className="bg-white p-4 rounded-2xl shadow mb-5 flex justify-between items-center">
              <h3 className="font-medium">📦 Total Stock Available</h3>
              <span className="font-bold text-orange-500">{totalStock}</span>
            </div>

            {/* Top Selling */}
            <div className="bg-white p-4 rounded-2xl shadow mb-5">
              <h3 className="font-medium mb-2">🔥 Top Selling Products</h3>
              {topSelling.length ? topSelling.map((i) => (
                <div key={i.id} className="flex justify-between items-center mb-1">
                  <span>• {i.name} ({i.units || i.quantity || 0} sold) - ₹{i.revenue || 0}</span>
                </div>
              )) : <p>Data not available</p>}
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-white p-4 rounded-2xl shadow mb-5">
              <h3 className="font-medium mb-2">🧊 Low Stock Alerts</h3>
              {lowStock.length ? lowStock.map((i) => (
                <div key={i.id} className="flex justify-between items-center mb-1">
                  <span className="text-red-500 font-medium">• {i.name} ({i.stock})</span>
                  <button onClick={() => restockItem(i.id)} className="text-green-500 text-sm flex items-center gap-1"><RefreshCw size={14} /> Restock</button>
                </div>
              )) : <p>All good!</p>}
            </div>

            {/* Category Performance */}
            <div className="bg-white p-4 rounded-2xl shadow mb-5">
              <h3 className="font-medium mb-2">📈 Category Performance</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryPerformance}>
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#fb923c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Edit Item</h3>
              <button onClick={() => { setShowEditModal(false); setEditingItem(null); }} className="text-gray-500">Close</button>
            </div>

            <div className="space-y-3">
              <input value={editingItem.name} onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))} className="w-full border p-2 rounded-xl" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input value={editingItem.mrp} onChange={(e) => onEditMrpChange(e.target.value)} className="w-full border p-2 rounded-xl" placeholder="MRP (₹)" />
                <input value={editingItem.price} onChange={(e) => onEditPriceChange(e.target.value)} className="w-full border p-2 rounded-xl" placeholder="Selling Price (₹)" />
                <input value={editingItem.discount} onChange={(e) => onEditDiscountChange(e.target.value)} className="w-full border p-2 rounded-xl" placeholder="Discount (%)" />
              </div>

              <input value={editingItem.stock} onChange={(e) => setEditingItem(prev => ({ ...prev, stock: onlyDigits(e.target.value) }))} className="w-full border p-2 rounded-xl" />
              <textarea value={editingItem.desc} onChange={(e) => setEditingItem(prev => ({ ...prev, desc: e.target.value }))} className="w-full border p-2 rounded-xl" />
              <input value={editingItem.tags} onChange={(e) => setEditingItem(prev => ({ ...prev, tags: e.target.value }))} className="w-full border p-2 rounded-xl" />
              <select value={editingItem.category} onChange={(e) => setEditingItem(prev => ({ ...prev, category: e.target.value }))} className="w-full border p-2 rounded-xl">
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id}>{c.name}</option>)}
              </select>
              <div>
                <label className="w-full border p-2 rounded-xl flex items-center justify-between cursor-pointer">
                  <span>{editingItem.image ? "Image selected" : "Upload photo"}</span>
                  <input type="file" accept="image/*" onChange={(e) => {
                    if (!e.target.files?.[0]) return;
                    setEditingItem(prev => ({ ...prev, image: URL.createObjectURL(e.target.files[0]) }));
                  }} className="hidden" />
                </label>
                {editingItem.image && <img src={editingItem.image} alt="preview" className="mt-2 w-28 h-28 object-cover rounded" />}
              </div>

              <div className="flex gap-3">
                <button onClick={saveEdit} className={`flex-1 py-2 rounded-xl ${isSaveEnabled(editingItem) ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`} disabled={!isSaveEnabled(editingItem)}>Save Changes</button>
                <button onClick={() => { setShowEditModal(false); setEditingItem(null); }} className="flex-1 py-2 rounded-xl border">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
