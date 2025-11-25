// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useContext } from "react";
import { Star, ShoppingBag, Wallet, BookOpen, ThumbsUp, User, Plus, DollarSign, BarChart3, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import Confetti from "react-confetti";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);

  const [online, setOnline] = useState(() => {
    const s = localStorage.getItem("merchantOnlineStatus");
    return s !== null ? s === "true" : true;
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [storeName, setStoreName] = useState(() => localStorage.getItem("merchant_storeName") || "My Store");
  const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem("merchant_orders") || "[]"));
  const [earnings, setEarnings] = useState(() => JSON.parse(localStorage.getItem("merchant_earnings") || "{}"));
  const [selectedTab, setSelectedTab] = useState("todayEarnings"); // default selected tab
  const [alerts, setAlerts] = useState([
    "💸 Payout of ₹1,500 processed today",
    "⚠️ Low stock on 3 products",
    "📈 High-value order received"
  ]);

  const toggleOnline = () => {
    const ns = !online;
    setOnline(ns);
    localStorage.setItem("merchantOnlineStatus", ns);
    if (ns) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  // Simulate incoming orders
  useEffect(() => {
    const id = setInterval(() => {
      if (!online) return;
      const newOrder = {
        id: Date.now(),
        customer: `Customer ${Math.floor(Math.random() * 100)}`,
        items: ["Item A", "Item B"],
        amount: Math.floor(150 + Math.random() * 500),
        status: ["Completed", "Pending", "Canceled", "Refunded"][Math.floor(Math.random() * 4)],
        timestamp: new Date().toLocaleTimeString(),
      };
      setOrders((p) => {
        const u = [newOrder, ...p];
        localStorage.setItem("merchant_orders", JSON.stringify(u));
        return u;
      });
      const cur = JSON.parse(localStorage.getItem("merchant_earnings") || "{}");
      cur.today = (cur.today || 0) + 1;
      cur.total = (cur.total || 0) + newOrder.amount;
      cur.pendingPayouts = cur.pendingPayouts || 5000;
      cur.newCustomers = cur.newCustomers || 5;
      cur.avgOrderValue = ((cur.total || 0) / ((cur.today || 1))).toFixed(2);
      localStorage.setItem("merchant_earnings", JSON.stringify(cur));
      setEarnings(cur);
    }, 20000);
    return () => clearInterval(id);
  }, [online]);

  // Example top-selling items
  const topSellingToday = [
    { name: "Paneer Roll", sales: 45 },
    { name: "Cold Coffee", sales: 37 },
    { name: "Veg Pizza", sales: 29 },
  ];

  const overallTopSelling = [
    { name: "Burger", sales: 280 },
    { name: "French Fries", sales: 240 },
    { name: "Momos", sales: 230 },
  ];

  // Live order status summary
  const orderStatusSummary = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {}
  );

 const tabs = [
    { id: "todayEarnings", label: "Today's Earnings", value: `₹${earnings.today || 0}` },
    { id: "todayOrders", label: "Today's Orders", value: orders.filter(o => new Date(o.timestamp).toDateString() === new Date().toDateString()).length },
    { id: "totalEarnings", label: "Total Earnings", value: `₹${earnings.total || 0}` },
    { id: "totalOrders", label: "Total Orders", value: orders.length },
    { id: "newCustomers", label: "New Customers", value: earnings.newCustomers || 0 },
    { id: "pendingPayouts", label: "Pending Payouts", value: `₹${earnings.pendingPayouts || 0}` },
    { id: "avgOrderValue", label: "Avg. Order Value", value: `₹${earnings.avgOrderValue || 0}` },
  ];

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col relative pb-32">
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white py-5 px-6 rounded-b-3xl shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-lg opacity-90">Hello 👋</h2>
          <h1 className="text-2xl font-bold">{storeName}</h1>
        </div>
        </div>

      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Online Toggle */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow">
          <span className="font-semibold">Status:</span>
          <div className="flex items-center gap-2">
            <div
              onClick={toggleOnline}
              className={`w-16 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                online ? "bg-orange-400" : "bg-gray-300"
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                  online ? "translate-x-8" : "translate-x-0"
                }`}
              />
            </div>
            <span className={`font-semibold ${online ? "text-orange-500" : "text-gray-500"}`}>
              {online ? "Online" : "Offline"}
            </span>
          </div>
        </div>

         {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`cursor-pointer px-4 py-2 rounded-2xl shadow ${
                selectedTab === tab.id ? "bg-orange-400 text-white" : "bg-orange-100 text-orange-700"
              }`}
            >
              <div className="text-sm">{tab.label}</div>
              <div className="font-bold text-lg">{tab.value}</div>
            </div>
          ))}
        </div>

        {/* Live Orders */}
        <div className="bg-white rounded-2xl p-4 shadow">
          <h3 className="text-lg font-semibold mb-3 text-orange-600">📦 Live Orders</h3>
          <div className="flex flex-wrap gap-4">
            {["Completed", "Pending", "Canceled", "Refunded"].map((status) => (
              <div key={status} className="bg-orange-50 p-3 rounded-xl flex-1 min-w-[120px]">
                <div className="text-sm text-gray-500">{status}</div>
                <div className="text-2xl font-bold">{orderStatusSummary[status] || 0}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl p-4 shadow">
          <h3 className="text-lg font-semibold mb-3 text-orange-600">⚠️ Alerts</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {alerts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        {/* Top Selling Today */}
        <div className="bg-white rounded-2xl p-4 shadow">
          <h3 className="text-lg font-semibold mb-3 text-orange-600">🔥 Top Selling Today</h3>
          <div className="space-y-2">
            {topSellingToday.map((item, i) => (
              <div key={i} className="flex justify-between bg-orange-50 p-3 rounded-xl">
                <span className="font-medium">{item.name}</span>
                <span className="font-semibold text-orange-500">{item.sales} sold</span>
              </div>
            ))}
          </div>
          </div>

        {/* Overall Top Selling */}
        <div className="bg-white rounded-2xl p-4 shadow">
          <h3 className="text-lg font-semibold mb-3 text-orange-600">🏆 Overall Top Selling</h3>
          <div className="space-y-2">
            {overallTopSelling.map((item, i) => (
              <div key={i} className="flex justify-between bg-orange-50 p-3 rounded-xl">
                <span className="font-medium">{item.name}</span>
                <span className="font-semibold text-orange-500">{item.sales} sold</span>
              </div>
            ))}
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
