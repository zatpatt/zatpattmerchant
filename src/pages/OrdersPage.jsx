// src/pages/OrdersPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Phone, MessageCircle, DownloadCloud, RefreshCcw, Search, Filter, X } from "lucide-react";
import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

/**
 * Professional Merchant Orders Page (UI-first, easy to upgrade to API-backed)
 *
 * - Tabs: New / Preparing / Out / Delivered / Cancelled / Insights
 * - Top summary metrics with mini chart
 * - Search, filters, bulk actions, auto-refresh
 * - Order cards with Accept / Reject / Prepare / Out / Deliver / Cancel actions
 * - Detailed order modal with invoice, timeline, call/chat, notes
 * - Export CSV and mock reports
 *
 * To convert to backend-ready: replace mock data/hooks with fetch calls (see comments).
 */

const SAMPLE_ORDERS = (() => {
  // small helper to create sample orders
  const now = Date.now();
  const make = (id, status, minutesAgo = 5) => ({
    id: `ZYT${id}`,
    customer: `Customer ${id}`,
    phone: `98${String(70000000 + (id % 9999999)).slice(0, 8)}`,
    address: `${id} Market Lane, City`,
    placedAt: new Date(now - minutesAgo * 60 * 1000).toISOString(),
    amount: Math.floor(120 + Math.random() * 800),
    items: [
      { name: "Amul Butter 100g", qty: 1, price: 90 },
      { name: "Bread Pack", qty: 1, price: 45 },
    ],
    partner: status === "Out for Delivery" ? { name: "Rider Rahul", phone: "9876543210" } : null,
    payment: Math.random() > 0.3 ? "Prepaid" : "COD",
    status,
    etaMins: 20 + Math.floor(Math.random() * 20),
    notes: Math.random() > 0.8 ? "No onion, please" : "",
    timeline: [
      { when: new Date(now - (minutesAgo + 2) * 60 * 1000).toISOString(), status: "Placed" },
    ],
    isHighValue: Math.random() > 0.9,
  });

  return [
    make(1001, "New", 2),
    make(1002, "Preparing", 8),
    make(1003, "Out for Delivery", 18),
    make(1004, "Delivered", 45),
    make(1005, "Cancelled", 60),
    make(1006, "New", 1),
    make(1007, "Preparing", 10),
  ];
})();

function formatTime(iso) {
  const d = new Date(iso);
  return `${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function csvDownload(filename, rows) {
  const keys = Object.keys(rows[0] || {});
  const csv = [keys.join(",")]
    .concat(rows.map((r) => keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OrdersPage() {
  // data state - mock initially
  const [orders, setOrders] = useState(() => {
    // In future replace with API fetch
    return SAMPLE_ORDERS;
  });

  // UI state
  const [activeTab, setActiveTab] = useState("New");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOrder, setModalOrder] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // simulate new incoming orders when autoRefresh true
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      const newOrder = {
        id: `ZYT${Math.floor(10000 + Math.random() * 90000)}`,
        customer: `Guest ${Math.floor(1 + Math.random() * 999)}`,
        phone: `98${String(Math.floor(70000000 + Math.random() * 9999999)).slice(0, 8)}`,
        address: `${Math.floor(1 + Math.random() * 200)} Market Lane`,
        placedAt: new Date().toISOString(),
        amount: Math.floor(100 + Math.random() * 1200),
        items: [{ name: "Milk 1L", qty: 1, price: 60 }],
        partner: null,
        payment: Math.random() > 0.4 ? "Prepaid" : "COD",
        status: "New",
        etaMins: 25,
        notes: "",
        timeline: [{ when: new Date().toISOString(), status: "Placed" }],
        isHighValue: Math.random() > 0.95,
      };
      setOrders((p) => [newOrder, ...p]);
      if (soundEnabled) {
        // tiny beep
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = 520;
        o.connect(ctx.destination);
        o.start();
        setTimeout(() => {
          o.stop();
          ctx.close();
        }, 120);
      }
    }, 20000);
    return () => clearInterval(id);
  }, [autoRefresh, soundEnabled]);

  // Derived lists
  const tabs = ["New", "Preparing", "Out for Delivery", "Delivered", "Cancelled", "Insights"];
  const ordersByTab = useMemo(() => {
    const map = {};
    tabs.forEach((t) => (map[t] = []));
    orders.forEach((o) => {
      if (tabs.includes(o.status)) map[o.status].push(o);
      else map["New"].push(o);
    });
    return map;
  }, [orders]);

  // aggregated metrics
  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    const todays = orders.filter((o) => new Date(o.placedAt).toDateString() === today);
    const totalOrdersToday = todays.length;
    const totalSales = todays.reduce((s, o) => s + (o.amount || 0), 0);
    const activeDeliveries = orders.filter((o) => o.status === "Out for Delivery").length;
    const cancelled = orders.filter((o) => o.status === "Cancelled").length;
    const avgDelivery = (() => {
  const delivered = orders.filter((o) => o.status === "Delivered");
  if (!delivered.length) return 0;
  // mock: compute average etaUsed by timeline (not exact)
  return Math.round(delivered.reduce((a, o) => a + (o.etaMins || 25), 0) / delivered.length);
})();
    const ratingAvg = 4.6; // placeholder, integrate with ratings
    // hourly mini chart
    const hours = Array.from({ length: 12 }).map((_, i) => ({
      hour: `${i + 9}h`,
      orders: Math.floor(Math.random() * 10),
    }));

    return { totalOrdersToday, totalSales, activeDeliveries, cancelled, avgDelivery, ratingAvg, hours };
  }, [orders]);

  // Search + filters applied list (for active tab)
  const filtered = useMemo(() => {
    if (activeTab === "Insights") return [];
    const list = ordersByTab[activeTab] || [];
    return list.filter((o) => {
      if (query && !`${o.id} ${o.customer} ${o.phone} ${o.address}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (statusFilter && o.status !== statusFilter) return false;
      if (paymentFilter && o.payment !== paymentFilter) return false;
      // date range filtering if provided
      if (dateRange.from && new Date(o.placedAt) < new Date(dateRange.from)) return false;
      if (dateRange.to && new Date(o.placedAt) > new Date(dateRange.to)) return false;
      return true;
    });
  }, [ordersByTab, activeTab, query, statusFilter, paymentFilter, dateRange]);

  // actions
  const updateOrderStatus = (id, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const timeline = [...(o.timeline || []), { when: new Date().toISOString(), status: newStatus }];
        return { ...o, status: newStatus, timeline };
      })
    );
  };

  const bulkUpdate = (newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (selectedIds.has(o.id) ? { ...o, status: newStatus, timeline: [...(o.timeline || []), { when: new Date().toISOString(), status: newStatus }] } : o))
    );
    setSelectedIds(new Set());
  };

  const toggleSelect = (id) => {
    setSelectedIds((s) => {
      const copy = new Set(s);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const openOrderModal = (order) => {
    setModalOrder(order);
    setIsModalOpen(true);
  };

  const closeOrderModal = () => {
    setModalOrder(null);
    setIsModalOpen(false);
  };

  const exportVisible = () => {
    const rows = filtered.map((o) => ({
      id: o.id,
      customer: o.customer,
      phone: o.phone,
      address: o.address,
      placedAt: o.placedAt,
      amount: o.amount,
      payment: o.payment,
      status: o.status,
    }));
    if (rows.length) csvDownload(`orders-${activeTab.toLowerCase()}.csv`, rows);
    else alert("No rows to export");
  };

  const addManualOrder = () => {
    // quick modal-less add for demo
    const id = `ZYT${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder = {
      id,
      customer: "Walk-in Customer",
      phone: "98xxxxxxx",
      address: "Counter / Walk-in",
      placedAt: new Date().toISOString(),
      amount: 199,
      items: [{ name: "Manual Item", qty: 1, price: 199 }],
      partner: null,
      payment: "Prepaid",
      status: "Preparing",
      etaMins: 20,
      notes: "Manual order",
      timeline: [{ when: new Date().toISOString(), status: "Placed" }],
    };
    setOrders((p) => [newOrder, ...p]);
    alert(`Manual order ${id} added`);
  };

  // Insights chart data
  const ordersTrend = useMemo(() => {
    return metrics.hours.map((h) => ({ name: h.hour, orders: h.orders }));
  }, [metrics]);

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      {/* header with white circle back + black arrow */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white p-4 flex items-center justify-between shadow">
        <div className="flex items-center gap-4">
          <div onClick={() => window.history.back()} className="bg-white rounded-full p-2 cursor-pointer">
            <ArrowLeft className="text-black" />
          </div>
          <div>
            <div className="text-sm opacity-90">Hello,</div>
            <div className="font-semibold">Merchant Store</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => { setAutoRefresh((v) => !v); }} className={`px-3 py-2 rounded-md ${autoRefresh ? "bg-white/20" : "bg-white/10"}`}>
            {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
          </button>
          <button onClick={() => setSoundEnabled((s) => !s)} className="px-3 py-2 rounded-md bg-white/20">
            {soundEnabled ? "🔔" : "🔕"}
          </button>
        </div>
      </div>

      <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
        {/* Top summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow">
            <div className="text-sm text-gray-500">Total Orders Today</div>
            <div className="text-2xl font-bold">{metrics.totalOrdersToday}</div>
            <div className="text-xs text-gray-400 mt-1">Updated live</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow">
            <div className="text-sm text-gray-500">Total Sales (Today)</div>
            <div className="text-2xl font-bold">₹{metrics.totalSales}</div>
            <div className="text-xs text-gray-400 mt-1">Avg delivery: {metrics.avgDelivery || "--"} mins</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Active Deliveries</div>
                <div className="text-2xl font-bold">{metrics.activeDeliveries}</div>
              </div>
              <div className="w-36 h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ordersTrend}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1">Rating avg: {metrics.ratingAvg} ⭐</div>
          </div>
        </div>

        {/* Controls: Tabs + Search + Filters + Bulk */}
        <div className="bg-white rounded-2xl p-4 shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-2 rounded-xl ${activeTab === t ? "bg-orange-400 text-white" : "bg-white border"}`}
                >
                  {t} {t !== "Insights" && <span className="ml-2 text-xs text-gray-600">{(ordersByTab[t] || []).length}</span>}
                </button>
              ))}
            </div>

            {/* Search & actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-xl px-2">
                <Search className="text-gray-500" />
                <input placeholder="Search order, customer, phone" value={query} onChange={(e) => setQuery(e.target.value)} className="px-2 py-2 outline-none text-sm" />
              </div>

              <div className="flex items-center gap-2">
                <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="border rounded-xl px-3 py-2 text-sm">
                  <option value="">All payments</option>
                  <option value="Prepaid">Prepaid</option>
                  <option value="COD">COD</option>
                </select>

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-xl px-3 py-2 text-sm">
                  <option value="">All statuses</option>
                  {["New", "Preparing", "Out for Delivery", "Delivered", "Cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

                <button className="px-3 py-2 border rounded-xl" onClick={() => { setQuery(""); setStatusFilter(""); setPaymentFilter(""); setDateRange({ from: "", to: "" }); }}>
                  <RefreshCcw size={16} />
                </button>

                <button onClick={exportVisible} className="px-3 py-2 bg-orange-400 text-white rounded-xl flex items-center gap-2">
                  <DownloadCloud size={16} /> Export
                </button>

                <button onClick={() => addManualOrder()} className="px-3 py-2 bg-white border rounded-xl">
                  + Add Manual Order
                </button>
              </div>
            </div>
          </div>

          {/* Bulk actions */}
          <div className="mt-3 flex items-center gap-3">
            <div>
              <input type="checkbox" checked={selectedIds.size > 0} onChange={(e) => {
                if (e.target.checked) setSelectedIds(new Set((filtered || []).map((o) => o.id)));
                else setSelectedIds(new Set());
              }} />{" "}
              <span className="text-sm text-gray-600">Select visible ({filtered.length})</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => bulkUpdate("Delivered")} disabled={!selectedIds.size} className="px-3 py-2 bg-green-500 text-white rounded-xl">Mark Delivered</button>
              <button onClick={() => bulkUpdate("Cancelled")} disabled={!selectedIds.size} className="px-3 py-2 bg-red-500 text-white rounded-xl">Mark Cancelled</button>
            </div>
            <div className="ml-auto text-sm text-gray-500">Auto-refresh: <button onClick={() => setAutoRefresh((v) => !v)} className="underline">{autoRefresh ? "On" : "Off"}</button></div>
          </div>
        </div>

        {/* Main content: list or insights */}
        {activeTab !== "Insights" ? (
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-500">No orders in this tab</div>
            ) : (
              filtered.map((o) => (
                <div key={o.id} className="bg-white rounded-2xl p-4 shadow flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-start gap-4 flex-1">
                    <input type="checkbox" checked={selectedIds.has(o.id)} onChange={() => toggleSelect(o.id)} />
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">#{o.id}</div>
                        <div className="text-xs text-gray-400">{formatTime(o.placedAt)}</div>
                        {o.isHighValue && <div className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800">High value</div>}
                      </div>
                      <div className="text-sm text-gray-600">{o.customer} • {o.phone}</div>
                      <div className="text-sm text-gray-600 mt-1">Items: {o.items.map(i => `${i.name} (${i.qty})`).join(", ")}</div>
                      <div className="text-xs text-gray-500 mt-1">Notes: {o.notes || "—"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">₹{o.amount}</div>
                      <div className="text-xs text-gray-400">{o.payment}</div>
                      <div className="text-xs text-gray-400">{o.status}</div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button onClick={() => { openOrderModal(o); }} className="px-3 py-1 border rounded-xl text-sm">Details</button>

                      {/* Action buttons depending on status */}
                      {o.status === "New" && (
                        <div className="flex gap-2">
                          <button onClick={() => updateOrderStatus(o.id, "Preparing")} className="px-3 py-1 bg-orange-400 text-white rounded-xl text-sm">Accept</button>
                          <button onClick={() => updateOrderStatus(o.id, "Cancelled")} className="px-3 py-1 bg-red-500 text-white rounded-xl text-sm">Reject</button>
                        </div>
                      )}

                      {o.status === "Preparing" && (
                        <div className="flex gap-2">
                          <button onClick={() => updateOrderStatus(o.id, "Out for Delivery")} className="px-3 py-1 bg-blue-500 text-white rounded-xl text-sm">Out for Delivery</button>
                        </div>
                      )}

                      {o.status === "Out for Delivery" && (
                        <div className="flex gap-2">
                          <button onClick={() => updateOrderStatus(o.id, "Delivered")} className="px-3 py-1 bg-green-500 text-white rounded-xl text-sm">Mark Delivered</button>
                        </div>
                      )}

                      <div className="flex gap-1 mt-1">
                        <button onClick={() => alert(`Call ${o.phone}`)} className="px-2 py-1 border rounded-full"><Phone size={14} /></button>
                        <button onClick={() => alert("Open chat (demo)")} className="px-2 py-1 border rounded-full"><MessageCircle size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Insights tab
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow">
              <h3 className="font-semibold mb-2">Orders Trend (hours)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ordersTrend}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow">
              <h3 className="font-semibold mb-2">Top Selling Items (mock)</h3>
              <ul className="space-y-2 text-sm">
                <li>1. Amul Butter 100g — 45 sold</li>
                <li>2. Bread Pack — 34 sold</li>
                <li>3. Milk 1L — 30 sold</li>
              </ul>
              <div className="mt-4">
                <button onClick={() => csvDownload("top-items.csv", [{ name: "Amul Butter", sold: 45 }, { name: "Bread", sold: 34 }])} className="px-3 py-2 bg-orange-400 text-white rounded-xl">Export Top Items</button>
              </div>
            </div>
          </div>
        )}

        {/* Order modal */}
        {isModalOpen && modalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-lg relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500">Order</div>
                  <div className="font-semibold text-lg">#{modalOrder.id}</div>
                  <div className="text-xs text-gray-500">{formatTime(modalOrder.placedAt)}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModalOrder((m) => ({ ...m, printed: true }))} className="px-3 py-2 border rounded-md">Download Invoice</button>
                  <div onClick={closeOrderModal} className="cursor-pointer p-2 rounded-full bg-gray-100"><X /></div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <h4 className="font-semibold">Customer</h4>
                  <div className="text-sm">{modalOrder.customer} • {modalOrder.phone}</div>
                  <div className="text-sm text-gray-600 mt-1">{modalOrder.address}</div>

                  <h4 className="mt-4 font-semibold">Items</h4>
                  <table className="w-full text-sm mt-2">
                    <thead className="text-left text-xs text-gray-500">
                      <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
                    </thead>
                    <tbody>
                      {modalOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-1">{it.name}</td>
                          <td>{it.qty}</td>
                          <td>₹{it.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 text-sm">Notes: {modalOrder.notes || "—"}</div>
                </div>

                <div>
                  <div className="bg-orange-50 p-3 rounded-xl">
                    <div className="text-sm text-gray-500">Summary</div>
                    <div className="text-2xl font-bold mt-1">₹{modalOrder.amount}</div>
                    <div className="text-xs text-gray-500 mt-1">Payment: {modalOrder.payment}</div>

                    <div className="mt-3 space-y-2">
                      <button onClick={() => updateOrderStatus(modalOrder.id, "Preparing")} className="w-full px-3 py-2 bg-orange-400 text-white rounded-xl">Mark Preparing</button>
                      <button onClick={() => updateOrderStatus(modalOrder.id, "Out for Delivery")} className="w-full px-3 py-2 bg-blue-500 text-white rounded-xl">Mark Out for Delivery</button>
                      <button onClick={() => updateOrderStatus(modalOrder.id, "Delivered")} className="w-full px-3 py-2 bg-green-500 text-white rounded-xl">Mark Delivered</button>
                      <button onClick={() => updateOrderStatus(modalOrder.id, "Cancelled")} className="w-full px-3 py-2 bg-red-500 text-white rounded-xl">Cancel Order</button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h5 className="text-sm font-semibold">Timeline</h5>
                    <div className="text-xs text-gray-500 space-y-1 mt-2">
                      {(modalOrder.timeline || []).map((t, i) => <div key={i}>{formatTime(t.when)} — {t.status}</div>)}
                    </div>
                  </div>

                  <div className="mt-4">
                    <button onClick={() => alert(`Call ${modalOrder.phone}`)} className="w-full px-3 py-2 border rounded-xl flex items-center gap-2 justify-center"><Phone /> Call</button>
                    <button onClick={() => alert("Open chat UI (demo)")} className="w-full px-3 py-2 mt-2 border rounded-xl flex items-center gap-2 justify-center"><MessageCircle /> Chat</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
