// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Star,
  ShoppingBag,
  Wallet,
  BookOpen,
  ThumbsUp,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import Confetti from "react-confetti";
import { getDashboardData } from "../services/dashboard";
import { getLiveOrders } from "../services/orders";

/**
 * Merchant Dashboard (ready to paste)
 *
 * Features:
 * - Header shows store name pulled from localStorage (merchant_profile.storeName or merchant_storeName).
 *   When a merchant signs up and saves storeName to localStorage, header will pick it up automatically.
 * - Online status defaults to OFFLINE after login/signup (merchantOnlineStatus = false by default).
 * - Live simulated incoming orders when online (for dev/testing) and persisted to localStorage.
 * - Proper logic for:
 *    - Today's earnings (sum of completed amounts today)
 *    - Today's orders (count orders placed today)
 *    - Total earnings (sum of all completed orders)
 *    - Total orders (count of all orders)
 *    - New customers (unique customers first seen today)
 *    - Pending payouts (calculated from orders with paidToMerchant === false OR stored merchant_earnings.pending)
 *    - Avg order value (for completed orders)
 * - Live order status summary (Completed, Pending, Canceled) and Ratings (avg rating computed)
 * - Alerts generated from live conditions (large order, low stock, high pending payouts)
 * - Top selling today & overall (computed from order items)
 * - Overall top-rated products (averaged from product ratings in orders)
 *
 * Notes:
 * - This is still a local/demo implementation using localStorage as the data store.
 * - Replace localStorage reads/writes with your backend API calls in production.
 */

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext || { t: (s) => s });
  const [dashboardData, setDashboardData] = useState({
    total_orders: 0,
    total_earning: 0,
    today_orders: 0,
    today_earning: 0,
  });
  const [loading, setLoading] = useState(true);
  
  const [liveOrders, setLiveOrders] = useState([]);
 const userId = 50;

  // --- Load initial store name from merchant_profile or merchant_storeName ---
  const getStoreNameFromStorage = () => {
    try {
      const profile = JSON.parse(localStorage.getItem("merchant_profile") || "{}");
      if (profile?.storeName) return profile.storeName;
      const s = localStorage.getItem("merchant_storeName");
      return s || "My Store";
    } catch {
      return localStorage.getItem("merchant_storeName") || "My Store";
    }
  };

  const [storeName, setStoreName] = useState(getStoreNameFromStorage());
  // Online status default: OFFLINE (explicitly false)
  const [online, setOnline] = useState(() => {
    const stored = localStorage.getItem("merchantOnlineStatus");
    // if not set, default OFFLINE
    return stored === "true" ? true : false;
  });

  const [showConfetti, setShowConfetti] = useState(false);

  // Orders state - persisted in localStorage key "merchant_orders"
  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("merchant_orders") || "[]");
    } catch {
      return [];
    }
  });

  // Earnings meta (optional persisted structure) - fallback to computed values
  const [earningsMeta, setEarningsMeta] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("merchant_earnings") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
  const fetchDashboard = async () => {
    try {
      const userId = 50;

      const res = await getDashboardData(userId);

      if (res.status) {
        setDashboardData(res.data);
      }
    } catch (error) {
      console.error("Dashboard error", error);
    } finally {
      setLoading(false);
    }
  };

  fetchDashboard();
}, []);


// useEffect(() => {
//   const fetchLiveOrders = async () => {
//     try {
//       const userId = localStorage.getItem("user_id");

//       const res = await getLiveOrders(userId);

//       if (res?.status) {
//         setLiveOrders(res.data || []);
//       }
//     } catch (error) {
//       console.error("Live orders error", error);
//     }
//   };

//   fetchLiveOrders();
// }, []);

useEffect(() => {
  const fetchLiveOrders = async () => {
    try {
      const res = await getLiveOrders(userId);

      if (res?.status) {
        setLiveOrders(res.data || []);
      }
    } catch (error) {
      console.error("Live orders error", error);
    }
  };

  fetchLiveOrders();

  const interval = setInterval(fetchLiveOrders, 10000);

  return () => clearInterval(interval);
}, [userId]);

  // Products catalog (for top-sellers). Stored in localStorage 'merchant_products' or default sample
  const defaultProducts = [
    { id: "p1", name: "Paneer Roll" },
    { id: "p2", name: "Cold Coffee" },
    { id: "p3", name: "Veg Pizza" },
    { id: "p4", name: "Burger" },
    { id: "p5", name: "French Fries" },
    { id: "p6", name: "Momos" },
  ];
  const [products] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("merchant_products") || "null");
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    // seed sample products (id + name)
    localStorage.setItem("merchant_products", JSON.stringify(defaultProducts));
    return defaultProducts;
  });

  // Persist helper for orders and earnings
  const persistOrders = (nextOrders) => {
    try {
      localStorage.setItem("merchant_orders", JSON.stringify(nextOrders));
    } catch {}
    setOrders(nextOrders);
  };
  const persistEarningsMeta = (meta) => {
    try {
      localStorage.setItem("merchant_earnings", JSON.stringify(meta));
    } catch {}
    setEarningsMeta(meta);
  };

  // --- Compute stats derived from orders ---
  const stats = useMemo(() => {
    const now = new Date();
    const todayKey = now.toDateString();

    let todayOrdersCount = 0;
    let todayEarnings = 0;
    const totalOrders = orders.length;
    let totalEarnings = 0;
    const customersSetToday = new Set();
    let completedOrdersCount = 0;
    let completedOrdersSum = 0;
    let pendingPayoutsCalc = 0; // sum of amounts not yet paid to merchant (paidToMerchant === false)
    let ratingSum = 0;
    let ratingCount = 0;

    const productSalesToday = {}; // { productName: qty }
    const productSalesAll = {}; // overall counts
    const productRatings = {}; // { productName: { sum, count } }

    orders.forEach((o) => {
      // normalize timestamp: if not ISO, handle fallback
      const orderDate = o.timestamp ? new Date(o.timestamp) : null;
      const isToday = orderDate && orderDate.toDateString() === todayKey;

      // Amount: ensure number
      const amount = Number(o.amount || 0);

      // Completed logic
      if ((o.status || "").toLowerCase() === "completed" || (o.status || "") === "Completed") {
        completedOrdersCount += 1;
        completedOrdersSum += amount;
      }

      // Total earnings counts completed orders only
      totalEarnings += o.status && (o.status === "Completed" || o.status === "completed") ? amount : 0;

      // Today's orders & earnings
      if (isToday) {
        todayOrdersCount += 1;
        if (o.status === "Completed" || o.status === "completed") todayEarnings += amount;
        if (o.customer) customersSetToday.add(o.customer);
      }

      // Pending payouts calc: orders marked completed but not yet paid to merchant
      // We'll rely on `paidToMerchant` boolean on orders; otherwise fallback to earningsMeta.pending
      if (o.status === "Completed" && !o.paidToMerchant) {
        pendingPayoutsCalc += amount;
      }

      // Ratings: if order has rating field (0-5) include in average
      if (typeof o.rating === "number") {
        ratingSum += o.rating;
        ratingCount += 1;
      }

      // Items -> product counts and product ratings per item (if rating exists on order)
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it) => {
        const name = typeof it === "string" ? it : it.name || "Unknown";
        // today
        if (isToday) productSalesToday[name] = (productSalesToday[name] || 0) + 1;
        // overall
        productSalesAll[name] = (productSalesAll[name] || 0) + 1;
        // product ratings
        if (typeof o.rating === "number") {
          productRatings[name] = productRatings[name] || { sum: 0, count: 0 };
          productRatings[name].sum += o.rating;
          productRatings[name].count += 1;
        }
      });
    });

    const avgOrderValue =
      completedOrdersCount > 0 ? Number((completedOrdersSum / completedOrdersCount).toFixed(2)) : 0;
    const avgRating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : 0;

    // If earningsMeta.pending exists, prefer it; else fallback to computed pendingPayoutsCalc
    const pendingPayouts = Number(earningsMeta.pending || pendingPayoutsCalc || 0);

    // Build top-selling arrays sorted
    const topToday = Object.entries(productSalesToday)
      .map(([name, qty]) => ({ name, sales: qty }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
    const topOverall = Object.entries(productSalesAll)
      .map(([name, qty]) => ({ name, sales: qty }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    // top-rated products overall
    const topRated = Object.entries(productRatings)
      .map(([name, { sum, count }]) => ({ name, rating: +(sum / count).toFixed(2), count }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);

    // order status summary (Normalized keys)
    const statusSummary = orders.reduce((acc, o) => {
      const st = (o.status || "Pending").toString();
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});

    return {
      todayOrdersCount,
      todayEarnings,
      totalOrders,
      totalEarnings,
      newCustomers: customersSetToday.size,
      pendingPayouts,
      avgOrderValue,
      avgRating,
      topToday,
      topOverall,
      topRated,
      statusSummary,
      completedOrdersCount,
    };
  }, [orders, earningsMeta]);

  // --- Alerts logic ---
  const alerts = useMemo(() => {
    const arr = [];
    // large pending payouts
    if ((stats.pendingPayouts || 0) > 5000) {
      arr.push(`💸 Pending payouts ₹${stats.pendingPayouts} need attention`);
    }
    // large order value / high avg
    if ((stats.avgOrderValue || 0) > 600) {
      arr.push(`📈 Average order value is high ₹${stats.avgOrderValue}`);
    }
    // low stock simulation: check if any product sales overall > threshold (just demo)
    const lowStockProducts = stats.topOverall.filter((p) => p.sales > 250); // demo condition
    if (lowStockProducts.length) {
      arr.push(`⚠️ Low stock on ${lowStockProducts.map((p) => p.name).join(", ")}`);
    }
    // notify if new customers > 10
    if ((stats.newCustomers || 0) > 10) {
      arr.push(`🎉 ${stats.newCustomers} new customers today`);
    }
    // fallback: show earnings meta notifications if any
    if (earningsMeta?.note) arr.push(earningsMeta.note);
    // keep at least one generic alert
    if (!arr.length) arr.push("No critical alerts — everything looks good.");
    return arr;
  }, [stats, earningsMeta]);

  // --- Simulate incoming orders while online (for demo) ---
  useEffect(() => {
    if (!online) return;
    const productNames = products.map((p) => p.name);
    const id = setInterval(() => {
      // create order
      const itemsCount = Math.floor(1 + Math.random() * 3);
      const items = [];
      for (let i = 0; i < itemsCount; i++) {
        items.push(productNames[Math.floor(Math.random() * productNames.length)]);
      }
      const amount = itemsCount * (100 + Math.floor(Math.random() * 300));
      const possibleStatuses = ["Pending", "Completed", "Canceled"];
      const status = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
      const rating = status === "Completed" && Math.random() > 0.4 ? +(3 + Math.random() * 2).toFixed(1) : undefined; // some completed have rating
      const order = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        customer: `Customer ${Math.floor(100 + Math.random() * 900)}`,
        items,
        amount,
        status,
        paidToMerchant: status === "Completed" ? false : false, // completed orders initially not paid
        rating,
        timestamp: new Date().toISOString(),
      };

      const nextOrders = [order, ...orders];
      persistOrders(nextOrders);

      // update earningsMeta quickly: increment total count & totals if completed
      const meta = { ...earningsMeta };
      meta.totalOrders = (meta.totalOrders || 0) + 1;
      if (status === "Completed") {
        meta.total = (Number(meta.total || 0) + amount);
        meta.today = (Number(meta.today || 0) + amount);
      }
      // keep pending default if not present
      meta.pending = meta.pending || 0;
      persistEarningsMeta(meta);
    }, 20000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, orders, earningsMeta, products]);

  // --- Toggle online with confetti + persist ---
  const toggleOnline = () => {
    const ns = !online;
    setOnline(ns);
    localStorage.setItem("merchantOnlineStatus", ns ? "true" : "false");
    if (ns) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  // --- When merchant_profile changes (storeName saved during signup), pick it up ---
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "merchant_profile" || e.key === "merchant_storeName") {
        setStoreName(getStoreNameFromStorage());
      }
      if (e.key === "merchant_orders") {
        try {
          setOrders(JSON.parse(e.newValue || "[]"));
        } catch {}
      }
      if (e.key === "merchant_earnings") {
        try {
          setEarningsMeta(JSON.parse(e.newValue || "{}"));
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Helper to mark pending payouts as paid by admin (demo function) ---
  const adminMarkPayoutsPaid = () => {
    // mark all completed orders as paidToMerchant true and clear pending meta
    const updated = orders.map((o) => (o.status === "Completed" ? { ...o, paidToMerchant: true } : o));
    persistOrders(updated);
    const meta = { ...earningsMeta, pending: 0 };
    persistEarningsMeta(meta);
    alert("All pending payouts marked paid (demo).");
  };

  // --- UI blocks for stats ---
  const statTiles = [
  {
    id: "todayEarnings",
    label: "Today's Earnings",
    value: `₹${dashboardData.today_earning}`,
  },
  {
    id: "todayOrders",
    label: "Today's Orders",
    value: dashboardData.today_orders,
  },
  {
    id: "totalEarnings",
    label: "Total Earnings",
    value: `₹${dashboardData.total_earning}`,
  },
  {
    id: "totalOrders",
    label: "Total Orders",
    value: dashboardData.total_orders,
  },
];

  // --- Order status list for live orders ---
  const statusList = ["Completed", "Pending", "Canceled"];

  
  if (loading) {
  return <div className="p-6">Loading dashboard...</div>;
}

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col relative pb-28">
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white py-5 px-6 rounded-b-3xl shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-lg opacity-90">Hello 👋</h2>
          <h1 className="text-2xl font-bold">{storeName}</h1>
          <div className="text-xs opacity-90 mt-1">Status: <span className="font-semibold">{online ? "Online" : "Offline"}</span></div>
        </div>

        <div className="text-right">
          <div className="text-sm">Quick actions</div>
          <div className="mt-2 flex gap-2 items-center">
            <button
              onClick={toggleOnline}
              className={`px-3 py-1 rounded-full font-medium ${online ? "bg-white text-orange-500" : "bg-white/70 text-orange-700"}`}
            >
              {online ? "Go Offline" : "Go Online"}
            </button>
            <button onClick={() => navigate("/orders")} className="px-3 py-1 rounded-full bg-white/20">
              View Orders
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {statTiles.map((s) => (
            <div key={s.id} className="bg-white p-4 rounded-2xl shadow text-center">
              <div className="text-sm text-gray-500">{s.label}</div>
              <div className="text-2xl font-bold mt-2">{s.value}</div>
            </div>
          ))}
        </div>
    
        {/* Live Orders Summary */}
        <div className="bg-white rounded-2xl p-4 shadow">
          <h3 className="text-lg font-semibold mb-3 text-orange-600">📦 Live Orders</h3>
          <div className="flex flex-wrap gap-4">
            {statusList.map((st) => (
              <div key={st} className="bg-orange-50 p-3 rounded-xl flex-1 min-w-[140px]">
                <div className="text-sm text-gray-500">{st}</div>
                <div className="text-2xl font-bold">{stats.statusSummary[st] || 0}</div>
              </div>
            ))}

            <div className="bg-orange-50 p-3 rounded-xl min-w-[160px]">
              <div className="text-sm text-gray-500">Ratings (avg)</div>
              <div className="text-2xl font-bold">{stats.avgRating || "—"} ★</div>
            </div>
          </div>

          {/* quick list of most recent 5 orders */}
          <div className="mt-4 space-y-3">
            {liveOrders.slice(0, 5).map((o) => (
             <div key={o.order_code} className="flex justify-between items-center border rounded-xl p-3">
  <div>
    <div className="font-semibold text-sm">Order #{o.order_code}</div>

    <div className="text-xs text-gray-600">
      {o.customer_name}
    </div>

    <div className="text-xs text-gray-700 mt-1">
      Delivery Partner: {o.delivery_partner_name}
    </div>
  </div>

  <div className="text-right">
    <div className="font-semibold">₹{o.total_amount}</div>

    <div className="text-xs text-gray-500 mt-1">
      {o.status}
    </div>
  </div>
</div>
            ))}
          {liveOrders.length === 0 && (
  <div className="text-gray-500">No live orders.</div>
)}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl p-4 shadow">
          <h3 className="text-lg font-semibold mb-3 text-orange-600">⚠️ Alerts</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {alerts.map((a, i) => (<li key={i}>{a}</li>))}
          </ul>

          <div className="mt-3 flex gap-2">
            <button onClick={adminMarkPayoutsPaid} className="px-3 py-1 bg-orange-500 text-white rounded-md">Mark payouts paid (demo)</button>
            <button onClick={() => alert("Open payout settings (demo)")} className="px-3 py-1 bg-gray-200 rounded-md">Payout settings</button>
          </div>
        </div>

        {/* Top selling & Rated */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top selling today */}
          <div className="bg-white rounded-2xl p-4 shadow">
            <h3 className="text-lg font-semibold mb-3 text-orange-600">🔥 Top Selling Today</h3>
            {stats.topToday.length === 0 ? (
              <div className="text-gray-500">No sales today.</div>
            ) : (
              stats.topToday.map((it, idx) => (
                <div key={it.name} className="flex justify-between bg-orange-50 p-2 rounded-xl mb-2">
                  <div className="font-medium">{idx + 1}. {it.name}</div>
                  <div className="font-semibold text-orange-500">{it.sales} sold</div>
                </div>
              ))
            )}
          </div>

          {/* Overall top selling */}
          <div className="bg-white rounded-2xl p-4 shadow">
            <h3 className="text-lg font-semibold mb-3 text-orange-600">🏆 Overall Top Selling</h3>
            {stats.topOverall.length === 0 ? (
              <div className="text-gray-500">No sales yet.</div>
            ) : (
              stats.topOverall.map((it, idx) => (
                <div key={it.name} className="flex justify-between bg-orange-50 p-2 rounded-xl mb-2">
                  <div className="font-medium">{idx + 1}. {it.name}</div>
                  <div className="font-semibold text-orange-500">{it.sales} sold</div>
                </div>
              ))
            )}
          </div>

          {/* Overall top-rated */}
          <div className="bg-white rounded-2xl p-4 shadow">
            <h3 className="text-lg font-semibold mb-3 text-orange-600">⭐ Overall Top Rated Products</h3>
            {stats.topRated.length === 0 ? (
              <div className="text-gray-500">No ratings yet.</div>
            ) : (
              stats.topRated.map((it, idx) => (
                <div key={it.name} className="flex justify-between bg-orange-50 p-2 rounded-xl mb-2">
                  <div className="font-medium">{idx + 1}. {it.name}</div>
                  <div className="font-semibold text-orange-500">{it.rating} ★ ({it.count})</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg flex justify-around py-3 rounded-t-3xl border-t">
        <button onClick={() => navigate("/orders")} className="flex flex-col items-center text-orange-500">
          <ShoppingBag size={22} />
          <span className="text-xs">Orders</span>
        </button>
        <button onClick={() => navigate("/earnings")} className="flex flex-col items-center text-orange-500">
          <Wallet size={22} />
          <span className="text-xs">Earnings</span>
        </button>
        <button onClick={() => navigate("/menu")} className="flex flex-col items-center text-orange-500">
          <BookOpen size={22} />
          <span className="text-xs">Menu</span>
        </button>
        <button onClick={() => navigate("/ratings")} className="flex flex-col items-center text-orange-500">
          <ThumbsUp size={22} />
          <span className="text-xs">Ratings</span>
        </button>
        <button onClick={() => navigate("/profile")} className="flex flex-col items-center text-orange-500">
          <User size={22} />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </div>
  );
}
