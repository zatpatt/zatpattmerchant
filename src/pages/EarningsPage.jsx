// src/pages/EarningsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Download, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getEarningsOverview,
  requestMerchantPayout,
  getPendingPayouts,
  getPayoutHistory,
  getOrdersHistory,       // ✅ NEW
  getMerchantInsights     // ✅ NEW
} from "../services/earningsApi";


/**
 * EarningsPage.jsx
 * - All analytics are derived live from localStorage 'merchant_orders'
 * - Payout requests stored in 'merchant_payout_requests'
 * - Reports export CSV + print-as-PDF (new window)
 *
 * Note: Replace localStorage interactions with your backend API for production.
 */

const COLORS = ["#FF7F50", "#FFA500", "#FFD700", "#FFB347", "#4F46E5", "#3B82F6"];

function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem("merchant_orders") || "[]");
  } catch {
    return [];
  }
}

function savePayoutRequests(list) {
  try {
    localStorage.setItem("merchant_payout_requests", JSON.stringify(list));
  } catch {}
}

function loadPayoutRequests() {
  try {
    return JSON.parse(localStorage.getItem("merchant_payout_requests") || "[]");
  } catch {
    return [];
  }
}

export default function EarningsPage() {
  const navigate = useNavigate();

  // live orders
  const [orders, setOrders] = useState(() => loadOrders());
  // payout requests
  const [payoutRequests, setPayoutRequests] = useState(() =>
    loadPayoutRequests()
  );

const [activeTab, setActiveTab] = useState(() => {
  return localStorage.getItem("earnings_active_tab") || "overview";
});

useEffect(() => {
  localStorage.setItem("earnings_active_tab", activeTab);
}, [activeTab]);


const [overviewLoaded, setOverviewLoaded] = useState(false);
const [payoutLoaded, setPayoutLoaded] = useState(false);
const [lifetimeSales, setLifetimeSales] = useState(0);
  // Overview filters
  const [overviewRange, setOverviewRange] = useState("Today"); // Today | This Week | This Month | Custom
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [pendingAmount, setPendingAmount] = useState(0);
  const [payoutHistory, setPayoutHistory] = useState([]);

  // History filters
  const [historyStatus, setHistoryStatus] = useState("All"); // All | Paid | Pending
  const [historySort, setHistorySort] = useState("date"); // date | amount

  // Insights filters
  const [insightsRange, setInsightsRange] = useState("Today"); // Today | This Week | This Month | Custom
  const [insightsCustomDate, setInsightsCustomDate] = useState("");

  // Marketing / reports states
  const [reportRange, setReportRange] = useState("Today"); // for exports etc.

  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [historyData, setHistoryData] = useState([]);
  const [insightsData, setInsightsData] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [insightsLoaded, setInsightsLoaded] = useState(false);

  const [totalOrders, setTotalOrders] = useState(0);

 useEffect(() => {
  if (activeTab === "overview" && !overviewLoaded) {
    fetchOverview();
    setOverviewLoaded(true);
  }

  if (activeTab === "payouts" && !payoutLoaded) {
    fetchPayoutData();
    setPayoutLoaded(true);
  }

  if (activeTab === "history" && !historyLoaded) {
    fetchHistory();
    setHistoryLoaded(true);
  }

  if (activeTab === "insights" && !insightsLoaded) {
    fetchInsights();
    setInsightsLoaded(true);
  }
}, [activeTab]);

const fetchHistory = async () => {
  try {
    const res = await getOrdersHistory({
      user: 50,
      start_date: "",
      end_date: "",
    });

    console.log("History API:", res);

    if (res?.status) {
      const historyRes = res?.data;

      // ✅ SET TOTAL ORDERS
      setTotalOrders(historyRes?.total_orders || 0);

      // ✅ SET LIST
      if (Array.isArray(historyRes)) {
        setHistoryData(historyRes);
      } else if (Array.isArray(historyRes?.orders)) {
        setHistoryData(historyRes.orders);
      } else {
        setHistoryData([]);
      }
    }
  } catch (err) {
    console.error("History API error:", err);
  }
};

const fetchInsights = async () => {
  try {
    const res = await getMerchantInsights({
      user: 50,
    });

    console.log("Insights API:", res);

    if (res?.status) {
      setInsightsData(res.data);
    }
  } catch (err) {
    console.error("Insights API error:", err);
  }
};

const fetchPayoutData = async () => {
  try {
    // ✅ 1. CALL API (THIS WAS MISSING)
    const pendingRes = await getPendingPayouts({ user: 50 });

    console.log("Pending API:", pendingRes);

   const pendingData = pendingRes?.data;

    setPendingAmount(pendingData?.pending || 0);

    // 🔥 IMPORTANT FIX
    setLifetimeSales(pendingData?.["lifetime sales"] || 0);

    // ✅ 2. CALL HISTORY API
    const historyRes = await getPayoutHistory({ user: 50 });

    console.log("History API:", historyRes);

    const historyData = historyRes?.data;

    if (Array.isArray(historyData)) {
    setPayoutHistory(historyData);
    } else if (historyData && typeof historyData === "object") {
      setPayoutHistory([historyData]); // ✅ wrap single object into array
    } else {
      setPayoutHistory([]);
    }

  } catch (err) {
    console.error("Payout API error:", err);
  }
};

const getFilterPayload = () => {
  if (overviewRange === "Today") {
    return { filter: "today" };
  }

  if (overviewRange === "This Week") {
    return { filter: "this_week" };
  }

  if (overviewRange === "This Month") {
    return { filter: "this_month" };
  }

  if (overviewRange === "Custom" && customFrom && customTo) {
    return {
      start_date: customFrom,
      end_date: customTo,
    };
  }

  return { filter: "today" }; // fallback
};

  const fetchOverview = async () => {
  try {
    setLoading(true);

    const payload = getFilterPayload();

    const res = await getEarningsOverview({
      user: 50,
      ...payload,
    });

    if (res?.status) {
      setOverviewData(res.data);
    }
  } catch (err) {
    console.error("Earnings API error:", err);
  } finally {
    setLoading(false);
  }
};

  // Live update from storage (other tabs)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "merchant_orders") {
        setOrders(loadOrders());
      }
      if (e.key === "merchant_payout_requests") {
        setPayoutRequests(loadPayoutRequests());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // whenever orders change, recalc payout requests maybe (we don't auto-create requests)
  useEffect(() => {
    setOrders(loadOrders());
  }, []);

  // -----------------------
  // Helper date utilities
  // -----------------------
  const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const startOfWeek = () => {
    const d = new Date();
    const day = d.getDay(); // 0 Sun .. 6 Sat
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // make Monday first
    const m = new Date(d.setDate(diff));
    m.setHours(0, 0, 0, 0);
    return m;
  };
  const startOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const inRange = (iso, from, to) => {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    if (from && t < from.getTime()) return false;
    if (to && t > to.getTime()) return false;
    return true;
  };

  // -----------------------
  // Derived analytics
  // -----------------------
  // parse orders into normalized list
  const normalizedOrders = useMemo(() => {
    return (orders || []).map((o) => ({
      ...o,
      amount: Number(o.amount || 0),
      placedAtISO: o.placedAt || o.timestamp || o.createdAt || new Date().toISOString(),
      paidToMerchant: !!o.paidToMerchant, // boolean
    }));
  }, [orders]);

  // utility to get totals for a chosen range string or custom date range
  const computeRangeTotals = (range, fromCustom, toCustom) => {
    let from = null;
    let to = null;
    const now = new Date();
    if (range === "Today") {
      from = startOfToday();
      to = new Date(now.getTime() + 24 * 3600 * 1000 - 1);
    } else if (range === "This Week") {
      from = startOfWeek();
      to = new Date(now.getTime() + 24 * 3600 * 1000 - 1);
    } else if (range === "This Month") {
      from = startOfMonth();
      to = new Date(now.getTime() + 24 * 3600 * 1000 - 1);
    } else if (range === "Custom" && fromCustom && toCustom) {
      from = new Date(fromCustom);
      from.setHours(0, 0, 0, 0);
      to = new Date(toCustom);
      to.setHours(23, 59, 59, 999);
    }
    const list = normalizedOrders.filter((o) =>
      inRange(o.placedAtISO, from, to)
    );
    const ordersCount = list.length;
    const sales = list.reduce((s, x) => s + (x.amount || 0), 0);
    const completed = list.filter(
      (x) => String(x.status || "").toLowerCase() === "delivered" || String(x.status || "").toLowerCase() === "completed"
    );
    const completedRevenue = completed.reduce((s, x) => s + (x.amount || 0), 0);
    const avgOrderValue = completed.length ? +(completedRevenue / completed.length).toFixed(2) : 0;
    return { list, ordersCount, sales, completedRevenue, avgOrderValue };
  };

  const overviewTotals = useMemo(() => {
    return computeRangeTotals(overviewRange, customFrom, customTo);
  }, [overviewRange, customFrom, customTo, normalizedOrders]);

  // pending payouts: sum of completed orders not yet paidToMerchant OR explicit flag
  const pendingPayoutsAmount = useMemo(() => {
    // prefer orders' paidToMerchant, fallback to saved payoutRequests
    const incomplete = normalizedOrders.filter(
      (o) =>
        (String(o.status || "").toLowerCase() === "delivered" ||
          String(o.status || "").toLowerCase() === "completed") &&
        !o.paidToMerchant
    );
    const sum = incomplete.reduce((s, o) => s + (o.amount || 0), 0);
    return sum;
  }, [normalizedOrders]);


  // transactions for history => delivered/completed orders appear as transaction rows
 

  // history filtered/sorted
  

  // insights: hourly 0-23 aggregation for selected range



  // marketing derived metrics (lightweight)

  // generate CSV for reports
 

  // -----------------------
  // Payout flow
  // -----------------------
  const requestPayout = async () => {
  try {
    const res = await requestMerchantPayout({
      user: 50,
      send_request: true,
    });

    if (res?.status) {
      alert("Payout requested ✅");
      fetchPayoutData(); // refresh
    }
  } catch (err) {
    console.error(err);
  }
};

  // Demo: admin approve first pending request
  const adminApproveFirst = () => {
    const all = loadPayoutRequests();
    const idx = all.findIndex((r) => r.status === "Pending");
    if (idx === -1) {
      alert("No pending requests");
      return;
    }
    all[idx].status = "Completed";
    all[idx].processedAt = new Date().toISOString();
    savePayoutRequests(all);
    setPayoutRequests(all);
    // mark orders as paidToMerchant true for demo (all completed orders)
    const updatedOrders = normalizedOrders.map((o) =>
      (String(o.status || "").toLowerCase() === "delivered" || String(o.status || "").toLowerCase() === "completed")
        ? { ...o, paidToMerchant: true }
        : o
    );
    try {
      localStorage.setItem("merchant_orders", JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
    } catch {}
    alert("Admin approved payout (demo) — completed and marked delivered orders as paid.");
  };

  // -----------------------
  // Exports helpers
  // -----------------------
  const exportOrdersCSV = (range = "Today") => {
    const { list } = computeRangeTotals(range, customFrom, customTo);
    if (!list.length) {
      alert("No orders in selected range");
      return;
    }
    const rows = list.map((o) => ({
      id: o.id,
      placedAt: o.placedAtISO,
      status: o.status,
      amount: o.amount,
      customer: o.customer || "",
      payment: o.payment || "",
    }));
    exportCSV(rows, `orders-${range.toLowerCase()}.csv`);
  };

  // -----------------------
  // UI
  // -----------------------
  return (
    <div className="min-h-screen bg-[#fff9f4]">
      {/* Header: simplified (no merchant name or notifications) */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white p-4 flex items-center justify-between">
        <button
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Earnings & Reports</h1>
        <div className="opacity-80 text-sm">Overview • Payouts • Reports</div>
      </div>

      <div className="p-5 max-w-6xl mx-auto space-y-6">
       {/* Tabs */}
<div className="flex flex-wrap gap-2 mb-5">
  {["overview", "payouts", "history", "insights"].map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`
        px-4 py-2 rounded-2xl font-semibold mr-1 mb-2
        ${activeTab === tab
          ? "bg-orange-500 text-white shadow-md scale-95"
          : "bg-white text-gray-700 shadow"
        }
      `}
    >
      {tab === "overview" && "Overview 💰"}
      {tab === "payouts" && "Payouts 🏦"}
      {tab === "history" && "History 🧾"}
      {tab === "insights" && "Insights 📊"}
      {tab === "marketing" && "Marketing 📣"}
      {tab === "reports" && "Reports 📂"}
    </button>
  ))}
</div>

        {/* ====== Overview (default visible) ====== */}
        <section id="section-overview" className={`${activeTab === "overview" ? "" : "hidden"}`}>
          <div className="bg-white p-4 rounded-2xl shadow space-y-4">
            <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold">Overview</h3>

              <select
                value={overviewRange}
                onChange={(e) => setOverviewRange(e.target.value)}
                className="p-2 border rounded"
              >
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>Custom</option>
              </select>

              {overviewRange === "Custom" && (
                <>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="p-2 border rounded"
                  />
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="p-2 border rounded"
                  />
                </>
              )}

              <button
                onClick={() => exportOrdersCSV(overviewRange)}
                className="ml-auto flex items-center px-3 py-2 bg-orange-500 text-white rounded-xl"
              >
                <Download size={16} className="mr-1" /> Export CSV
              </button>
            </div>

            {/* summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-orange-50 p-4 rounded-2xl">
                <div className="text-sm text-gray-500">Orders</div>
                <div className="text-2xl font-bold">{overviewData?.orders}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl">
                <div className="text-sm text-gray-500">Sales</div>
                <div className="text-2xl font-bold">₹{overviewData?.sales}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl">
                <div className="text-sm text-gray-500">Completed Revenue</div>
                <div className="text-2xl font-bold">₹{overviewData?.completed_revenue}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl">
                <div className="text-sm text-gray-500">Avg Order Value</div>
                <div className="text-2xl font-bold">₹{overviewData?.avg}</div>
              </div>
            </div>

            {/* charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow">
                <h4 className="font-semibold mb-2">Revenue Trend</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart
                    data={overviewData?.revenue_trend?.map(item => ({
                    date: new Date(item.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    }),
                    earnings: item.sales
                  }))}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                  >
                    <XAxis
                    dataKey="date" // or "day"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                    minTickGap={20}
                  />
                    <YAxis />
                    <Tooltip />
                    <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow">
                <h4 className="font-semibold mb-2">Orders Trend</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart 
                  data={overviewData?.order_trend?.map(item => ({
                  day: new Date(item.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  }),
                  orders: item.orders
                }))}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                    <XAxis
                      dataKey="day" // or "day"
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                      minTickGap={20}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar
                    dataKey="orders"
                    fill="#FF7F50"
                    radius={[6, 6, 0, 0]}
                  />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              
            </div>
          </div>
        </section>

        {/* ====== Payouts ====== */}
       <section id="section-payouts" className={`${activeTab === "payouts" ? "" : "hidden"}`}>
          <div className="bg-white p-4 rounded-2xl shadow space-y-4">
            <h3 className="text-lg font-semibold">Payouts</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-orange-50 p-4 rounded-2xl">
                <div className="text-sm text-gray-500">Pending Payouts</div>
                <div className="text-2xl font-bold">₹{pendingAmount}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl">
                <div className="text-sm text-gray-500">Available for Request</div>
                <div className="text-2xl font-bold">₹{pendingAmount}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl">
                <div className="text-sm text-gray-500">Lifetime Sales</div>
                <div className="text-2xl font-bold">₹{lifetimeSales}</div>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <button
  onClick={requestPayout}
  disabled={!pendingAmount}
  className={`px-4 py-2 rounded-xl text-white 
    ${pendingAmount > 0 ? "bg-orange-500" : "bg-gray-400 cursor-not-allowed"}`}
>
  Request Payout (₹{pendingAmount})
</button>

              <button
                onClick={() => adminApproveFirst()}
                className="px-4 py-2 bg-gray-200 rounded-xl"
                title="Demo: simulate admin approval for testing"
              >
                Simulate Admin Approve (demo)
              </button>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Payout Requests</h4>
              {payoutHistory.length === 0 ? (
                <div className="text-gray-500">No payout requests yet.</div>
              ) : (
                <div className="space-y-2">
                 <div className="overflow-x-auto">
  <table className="min-w-full table-auto">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-2 text-left">Date</th>
        <th className="px-4 py-2 text-left">Amount</th>
        <th className="px-4 py-2 text-left">Status</th>
      </tr>
    </thead>
    <tbody>
      {payoutHistory.map((item, i) => (
       <tr key={i} className="border-b">
        <td className="px-4 py-2">
          {item.end_date ? new Date(item.end_date).toLocaleString() : "-"}
        </td>

        <td className="px-4 py-2">
          ₹{item.paid_amount || 0}
        </td>

        <td className="px-4 py-2">
          <span className="px-2 py-1 rounded text-sm bg-yellow-100 text-yellow-700">
            {item.transaction_id ? "Completed" : "Pending"}
          </span>
        </td>
      </tr>
      ))}
    </tbody>
  </table>
</div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ====== History ====== */}
      <section id="section-history" className={`${activeTab === "history" ? "" : "hidden"}`}>
          <div className="bg-white p-4 rounded-2xl shadow space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold">History</h3>
              <select
                value={historyStatus}
                onChange={(e) => setHistoryStatus(e.target.value)}
                className="p-2 border rounded"
              >
                <option>All</option>
                <option>Paid</option>
                <option>Pending</option>
              </select>

              <select
                value={historySort}
                onChange={(e) => setHistorySort(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="date">Sort by: Date</option>
                <option value="amount">Sort by: Amount</option>
              </select>

              <button
                onClick={() => {
                  if (!historyData.length) { alert("No transactions to export"); return; }
                  exportCSV(
                  historyData.map(item => ({
                  date: item.created_at,
                  order_id: item.order_id,
                  amount: item.amount,
                  status: item.status,
                  payment_mode: item.payment_mode
                })),
                "history.csv"
              );
                }}
                className="ml-auto px-3 py-2 bg-orange-500 text-white rounded-xl flex items-center gap-2"
              >
                <Download size={16} /> Export
              </button>
            </div>

          <div className="text-sm text-gray-600">
            Total Orders: {totalOrders}
          </div>

            <div className="overflow-x-auto bg-white p-4 rounded-2xl shadow">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 text-left">Date</th>
                    <th className="py-2 px-4 text-left">Order ID</th>
                    <th className="py-2 px-4 text-left">Amount</th>
                    <th className="py-2 px-4 text-left">Status</th>
                    <th className="py-2 px-4 text-left">Payment Mode</th>
                  </tr>
                </thead>
                <tbody>
                {historyData.map((item, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "-"}
                    </td>

                    <td className="py-2 px-4">
                      {item.order_id || "-"}
                    </td>

                    <td className="py-2 px-4">
                      ₹{item.amount || 0}
                    </td>

                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        item.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {item.status || "Pending"}
                      </span>
                    </td>

                    <td className="py-2 px-4">
                      {item.payment_mode || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ====== Insights ====== */}
     <section id="section-insights" className={`${activeTab === "insights" ? "" : "hidden"}`}>
          <div className="bg-white p-4 rounded-2xl shadow space-y-4">
           <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold">Insights</h3>
              <select value={insightsRange} onChange={(e) => setInsightsRange(e.target.value)} className="p-2 border rounded">
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>Custom</option>
              </select>
              {insightsRange === "Custom" && (
                <input type="date" value={insightsCustomDate} onChange={(e)=>setInsightsCustomDate(e.target.value)} className="p-2 border rounded" />
              )}
              <button onClick={() => exportOrdersCSV(insightsRange)} className="ml-auto px-3 py-2 bg-orange-500 text-white rounded-xl flex items-center gap-2"><Download size={16} /> Export</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow">
                <h4 className="font-semibold mb-2">Orders per Hour (0–23)</h4>
                <ResponsiveContainer width="100%" height={220}>
                 <BarChart data={insightsData?.hourly_orders || []}>
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#FF7F50" />
                </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow">
                <h4 className="font-semibold mb-2">Quick Insights</h4>
                <ul className="text-gray-700 space-y-1">
                <li>Total Orders: {insightsData?.total_orders || 0}</li>
                <li>Total Sales: ₹{insightsData?.total_sales || 0}</li>
                <li>Avg Order Value: ₹{insightsData?.avg_order_value || 0}</li>
                <li>Peak Hour: {insightsData?.peak_hour || "-"}</li>
              </ul>
              </div>
            </div>
          </div>
        </section>


      </div>
    </div>
  );
}