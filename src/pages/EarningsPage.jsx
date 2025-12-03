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

const [activeTab, setActiveTab] = useState("overview");

  // Overview filters
  const [overviewRange, setOverviewRange] = useState("Today"); // Today | This Week | This Month | Custom
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // History filters
  const [historyStatus, setHistoryStatus] = useState("All"); // All | Paid | Pending
  const [historySort, setHistorySort] = useState("date"); // date | amount

  // Insights filters
  const [insightsRange, setInsightsRange] = useState("Today"); // Today | This Week | This Month | Custom
  const [insightsCustomDate, setInsightsCustomDate] = useState("");

  // Marketing / reports states
  const [reportRange, setReportRange] = useState("Today"); // for exports etc.

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

  // lifetime / totals
  const lifetime = useMemo(() => {
    const totalOrders = normalizedOrders.length;
    const totalSales = normalizedOrders.reduce((s, o) => s + (o.amount || 0), 0);
    return { totalOrders, totalSales };
  }, [normalizedOrders]);

  // transactions for history => delivered/completed orders appear as transaction rows
  const transactions = useMemo(() => {
    return normalizedOrders
      .filter((o) => {
        const st = String(o.status || "").toLowerCase();
        return st === "delivered" || st === "completed";
      })
      .map((o) => ({
        date: o.placedAtISO,
        id: o.id,
        amount: o.amount,
        paid: !!o.paidToMerchant,
        paymentMode: o.payment || "Unknown",
        items: o.items || [],
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [normalizedOrders]);

  // history filtered/sorted
  const historyRows = useMemo(() => {
    let rows = transactions.slice();
    if (historyStatus === "Paid") rows = rows.filter((r) => r.paid);
    else if (historyStatus === "Pending") rows = rows.filter((r) => !r.paid);
    if (historySort === "amount") rows = rows.sort((a, b) => b.amount - a.amount);
    else rows = rows.sort((a, b) => new Date(b.date) - new Date(a.date));
    return rows;
  }, [transactions, historyStatus, historySort]);

  // insights: hourly 0-23 aggregation for selected range
  const insightsHourly = useMemo(() => {
    // produce array length 24 with orders counts
    let from = null;
    let to = null;
    const now = new Date();
    if (insightsRange === "Today") {
      from = startOfToday();
      to = new Date(now.getTime() + 24 * 3600 * 1000 - 1);
    } else if (insightsRange === "This Week") {
      from = startOfWeek();
      to = new Date(now.getTime() + 24 * 3600 * 1000 - 1);
    } else if (insightsRange === "This Month") {
      from = startOfMonth();
      to = new Date(now.getTime() + 24 * 3600 * 1000 - 1);
    } else if (insightsRange === "Custom" && insightsCustomDate) {
      const d = new Date(insightsCustomDate);
      from = new Date(d);
      from.setHours(0, 0, 0, 0);
      to = new Date(d);
      to.setHours(23, 59, 59, 999);
    } else {
      // default to today
      from = startOfToday();
      to = new Date(now.getTime() + 24 * 3600 * 1000 - 1);
    }

    // determine hourly bins across range — if range > 1 day we aggregate by 24-hour buckets across each day summed
    const hours = Array.from({ length: 24 }).map((_, i) => ({ hour: `${i}`, orders: 0 }));

    normalizedOrders.forEach((o) => {
      const dt = new Date(o.placedAtISO);
      if (dt >= from && dt <= to) {
        const h = dt.getHours();
        hours[h].orders += 1;
      }
    });

    return hours;
  }, [normalizedOrders, insightsRange, insightsCustomDate]);

  // marketing derived metrics (lightweight)
  const marketing = useMemo(() => {
    const customers = {};
    normalizedOrders.forEach((o) => {
      if (!o.customer) return;
      customers[o.customer] = (customers[o.customer] || 0) + 1;
    });
    const totalOrders = normalizedOrders.length;
    const repeat = Object.values(customers).filter((c) => c > 1).length;
    const uniqueCustomers = Object.keys(customers).length;
    // coupon usage if orders have coupon field
    const couponCounts = {};
    normalizedOrders.forEach((o) => {
      const cp = o.coupon || o.promo || null;
      if (cp) couponCounts[cp] = (couponCounts[cp] || 0) + 1;
    });
    return {
      totalOrders,
      repeatCustomers: repeat,
      uniqueCustomers,
      couponCounts,
    };
  }, [normalizedOrders]);

  // generate CSV for reports
  const exportCSV = (rows, filename = "report.csv") => {
    if (!rows || !rows.length) {
      alert("No rows to export");
      return;
    }
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(",")]
      .concat(
        rows.map((r) =>
          keys
            .map((k) =>
              `"${String(r[k] === null || r[k] === undefined ? "" : r[k]).replace(/"/g, '""')}"`
            )
            .join(",")
        )
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // generate printable PDF (opens new window for print)
  const generatePDF = (title, htmlContent) => {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      alert("Popup blocked — allow popups to generate PDF");
      return;
    }
    w.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; padding: 20px; color:#111 }
            h1 { color: #f97316 }
            table { width:100%; border-collapse: collapse; margin-top:10px }
            th, td { border:1px solid #ddd; padding:8px; text-align:left }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${htmlContent}
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  // -----------------------
  // Payout flow
  // -----------------------
  const requestPayout = (amount) => {
  amount = Number(amount);

  if (!amount || amount <= 0) {
    alert("You cannot request a payout of ₹0. Please complete orders first.");
    return;
  }

  const next = loadPayoutRequests();
  const id = `P${Date.now()}`;
  const req = {
    id,
    amount,
    requestedAt: new Date().toISOString(),
    status: "Pending",
  };

  next.unshift(req);
  savePayoutRequests(next);
  setPayoutRequests(next);

  alert(`Payout requested for ₹${amount}. Status: Pending`);
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
  {["overview", "payouts", "history", "insights", "marketing", "reports"].map((tab) => (
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
                <div className="text-2xl font-bold">{overviewTotals.ordersCount}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl">
                <div className="text-sm text-gray-500">Sales</div>
                <div className="text-2xl font-bold">₹{overviewTotals.sales}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl">
                <div className="text-sm text-gray-500">Completed Revenue</div>
                <div className="text-2xl font-bold">₹{overviewTotals.completedRevenue}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl">
                <div className="text-sm text-gray-500">Avg Order Value</div>
                <div className="text-2xl font-bold">₹{overviewTotals.avgOrderValue}</div>
              </div>
            </div>

            {/* charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow">
                <h4 className="font-semibold mb-2">Revenue Trend</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart
                    data={(() => {
                      // build 7-day trend ending today for "This Week", month for "This Month", else show last 7 days
                      const now = new Date();
                      const days = [];
                      const daysBack = overviewRange === "This Month" ? 30 : 7;
                      for (let i = daysBack - 1; i >= 0; i--) {
                        const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
                        const label = `${d.getDate()}/${d.getMonth() + 1}`;
                        const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
                        const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
                        const total = normalizedOrders
                          .filter((o) => {
                            const t = new Date(o.placedAtISO).getTime();
                            return t >= dayStart.getTime() && t <= dayEnd.getTime();
                          })
                          .reduce((s, x) => s + (x.amount || 0), 0);
                        days.push({ date: label, earnings: total });
                      }
                      return days;
                    })()}
                  >
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="earnings" stroke="#f97316" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow">
                <h4 className="font-semibold mb-2">Orders Trend (7-day)</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={(() => {
                    const now = new Date();
                    const days = [];
                    for (let i = 6; i >= 0; i--) {
                      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
                      const label = `${d.getDate()}/${d.getMonth() + 1}`;
                      const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
                      const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
                      const total = normalizedOrders.filter((o) => {
                        const t = new Date(o.placedAtISO).getTime();
                        return t >= dayStart.getTime() && t <= dayEnd.getTime();
                      }).length;
                      days.push({ day: label, orders: total });
                    }
                    return days;
                  })()}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#FF7F50" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow">
                <h4 className="font-semibold mb-2">Customer Distribution</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Repeat", value: marketing.repeatCustomers || 0 },
                        { name: "Unique", value: marketing.uniqueCustomers || 0 },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label
                    >
                      {[{},{ }].map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
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
                <div className="text-2xl font-bold">₹{pendingPayoutsAmount || 0}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl">
                <div className="text-sm text-gray-500">Available for Request</div>
                <div className="text-2xl font-bold">₹{pendingPayoutsAmount || 0}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl">
                <div className="text-sm text-gray-500">Lifetime Sales</div>
                <div className="text-2xl font-bold">₹{lifetime.totalSales}</div>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <button
  onClick={() => requestPayout(pendingPayoutsAmount)}
  disabled={!pendingPayoutsAmount || pendingPayoutsAmount <= 0}
  className={`px-4 py-2 rounded-xl text-white 
    ${pendingPayoutsAmount > 0 ? "bg-orange-500" : "bg-gray-400 cursor-not-allowed"}`}
>
  Request Payout (₹{pendingPayoutsAmount || 0})
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
              {payoutRequests.length === 0 ? (
                <div className="text-gray-500">No payout requests yet.</div>
              ) : (
                <div className="space-y-2">
                  {payoutRequests.map((r) => (
                    <div key={r.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <div className="font-semibold">Request {r.id}</div>
                        <div className="text-sm text-gray-600">₹{r.amount} • {new Date(r.requestedAt).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className={`px-3 py-1 rounded-full text-sm ${r.status === "Pending" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                          {r.status}
                        </div>
                        {r.status === "Completed" && r.processedAt && <div className="text-xs text-gray-500 mt-1">Processed: {new Date(r.processedAt).toLocaleString()}</div>}
                      </div>
                    </div>
                  ))}
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
                  if (!historyRows.length) { alert("No transactions to export"); return; }
                  exportCSV(historyRows.map(r => ({
                    date: r.date,
                    id: r.id,
                    amount: r.amount,
                    paid: r.paid ? "Paid" : "Pending",
                    paymentMode: r.paymentMode
                  })), "transactions.csv");
                }}
                className="ml-auto px-3 py-2 bg-orange-500 text-white rounded-xl flex items-center gap-2"
              >
                <Download size={16} /> Export
              </button>
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
                  {historyRows.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{new Date(tx.date).toLocaleString()}</td>
                      <td className="py-2 px-4">{tx.id}</td>
                      <td className="py-2 px-4">₹{tx.amount}</td>
                      <td className="py-2 px-4">{tx.paid ? "✅ Paid" : "🕒 Pending"}</td>
                      <td className="py-2 px-4">{tx.paymentMode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ====== Insights ====== */}
      <section id="section-insights " className={`${activeTab === "insights" ? "" : "hidden"}`}>
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
                  <BarChart data={insightsHourly.map(h => ({ hour: `${h.hour}:00`, orders: h.orders }))}>
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
                  <li>Orders in range: {insightsHourly.reduce((s, h) => s + h.orders, 0)}</li>
                  <li>Peak hour: {(() => {
                    const peak = insightsHourly.reduce((p, c) => (c.orders > (p.orders||0) ? c : p), {orders:0});
                    return peak && peak.orders ? `${peak.hour}:00 (${peak.orders})` : "—";
                  })()}</li>
                  <li>Average order value (delivered): ₹{(() => {
                    const delivered = normalizedOrders.filter(o => (String(o.status||"").toLowerCase()==="delivered"||String(o.status||"").toLowerCase()==="completed") && inRange(o.placedAtISO, insightsRange==="Custom" && insightsCustomDate ? new Date(new Date(insightsCustomDate).setHours(0,0,0,0)) : insightsRange==="Today" ? startOfToday() : insightsRange==="ThisWeek" ? startOfWeek() : startOfMonth(), new Date()) );
                    if (!delivered.length) return "—";
                    const sum = delivered.reduce((s,x)=>s+(x.amount||0),0);
                    return Math.round(sum/delivered.length);
                  })()}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ====== Marketing ====== */}
        <section id="section-marketing " className={`${activeTab === "marketing" ? "" : "hidden"}`}>
          <div className="bg-white p-4 rounded-2xl shadow space-y-4">
            <h3 className="text-lg font-semibold">Marketing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-orange-50 rounded-2xl">
                <div className="text-sm text-gray-600">Total Orders</div>
                <div className="text-2xl font-bold">{marketing.totalOrders}</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-2xl">
                <div className="text-sm text-gray-600">Unique Customers</div>
                <div className="text-2xl font-bold">{marketing.uniqueCustomers}</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-2xl">
                <div className="text-sm text-gray-600">Repeat Customers</div>
                <div className="text-2xl font-bold">{marketing.repeatCustomers}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold">Coupon / Promo Usage (derived)</h4>
              {Object.keys(marketing.couponCounts).length === 0 ? (
                <div className="text-gray-500">No coupon or promo usage data available in orders.</div>
              ) : (
                <ul className="space-y-1 text-gray-700">
                  {Object.entries(marketing.couponCounts).map(([k, v]) => (
                    <li key={k}>{k} — {v} uses</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* ====== Reports ====== */}
        <section id="section-reports " className={`${activeTab === "reports" ? "" : "hidden"}`}>
          <div className="bg-white p-4 rounded-2xl shadow space-y-4">
            <h3 className="text-lg font-semibold">Reports</h3>

           <div className="flex flex-wrap items-center gap-3">
              <select value={reportRange} onChange={(e)=>setReportRange(e.target.value)} className="p-2 border rounded">
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>All Time</option>
              </select>

              <button onClick={() => {
                // generate CSV of selected range
                const range = reportRange === "All Time" ? "This Month" : reportRange;
                const { list } = computeRangeTotals(reportRange, customFrom, customTo);
                const rows = list.map(o => ({ id: o.id, date: o.placedAtISO, status: o.status, amount: o.amount, customer: o.customer || "" }));
                exportCSV(rows, `orders-report-${reportRange.replace(/\s+/g,"-").toLowerCase()}.csv`);
              }} className="px-3 py-2 bg-orange-500 text-white rounded-xl flex items-center gap-2"><Download size={16} /> Export CSV</button>

              <button onClick={() => {
                // generate a printable report
                const { list } = computeRangeTotals(reportRange, customFrom, customTo);
                const html = `<table><thead><tr><th>Order</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>${list.map(o=>`<tr><td>${o.id}</td><td>${new Date(o.placedAtISO).toLocaleString()}</td><td>₹${o.amount}</td><td>${o.status}</td></tr>`).join("")}</tbody></table>`;
                generatePDF(`Orders report — ${reportRange}`, html);
              }} className="px-3 py-2 bg-white border rounded-xl">Generate PDF</button>
            </div>

            <div className="text-sm text-gray-600">Tip: Use exports to send reports to admin or accounting.</div>
          </div>
        </section>
      </div>
    </div>
  );
}
