// src/pages/EarningsPage.jsx
import React, { useState, useEffect} from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import { Download, ArrowUp, ArrowDown, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Sample data
const summaryData = [
  { title: "Today's Earnings", amount: 1240, trend: "up" },
  { title: "This Week's Earnings", amount: 8450, trend: "up" },
  { title: "This Month's Earnings", amount: 32500, trend: "down" },
  { title: "Pending Payouts", amount: 2800, trend: "up" },
  { title: "Lifetime Earnings", amount: 245000, trend: "up" },
];

const lineData = [
  { day: "Mon", earnings: 1000 },
  { day: "Tue", earnings: 1500 },
  { day: "Wed", earnings: 1200 },
  { day: "Thu", earnings: 1700 },
  { day: "Fri", earnings: 900 },
  { day: "Sat", earnings: 2000 },
  { day: "Sun", earnings: 1600 },
];

const barData = [
  { week: "Week 1", earnings: 4500 },
  { week: "Week 2", earnings: 5200 },
  { week: "Week 3", earnings: 6000 },
  { week: "Week 4", earnings: 7500 },
];

const pieData = [
  { name: "Grocery", value: 4000 },
  { name: "Snacks", value: 3000 },
  { name: "Dairy", value: 2000 },
  { name: "Beverages", value: 1500 },
];

// Dummy Marketing data
const couponData = [
  { name: "Discount 10%", usage: 120 },
  { name: "Discount 20%", usage: 80 },
  { name: "Free Delivery", usage: 45 },
];

const revenueData = [
  { name: "Promo 1", revenue: 5000 },
  { name: "Promo 2", revenue: 3200 },
  { name: "Promo 3", revenue: 2100 },
];

const referralData = [
  { name: "User A", referred: 5 },
  { name: "User B", referred: 3 },
  { name: "User C", referred: 2 },
];

// Analytics data
const salesSummary = [
  { title: "Today", value: 1240, trend: "up" },
  { title: "This Week", value: 8450, trend: "up" },
  { title: "This Month", value: 32500, trend: "down" },
  { title: "Lifetime", value: 245000, trend: "up" },
];

const revenueTrend = [
  { day: "Mon", revenue: 1000 },
  { day: "Tue", revenue: 1500 },
  { day: "Wed", revenue: 1200 },
  { day: "Thu", revenue: 1700 },
  { day: "Fri", revenue: 900 },
  { day: "Sat", revenue: 2000 },
  { day: "Sun", revenue: 1600 },
];

const ordersTrend = [
  { week: "Week 1", orders: 45 },
  { week: "Week 2", orders: 52 },
  { week: "Week 3", orders: 60 },
  { week: "Week 4", orders: 75 },
];

const categoryDistribution = [
  { name: "Grocery", value: 4000 },
  { name: "Snacks", value: 3000 },
  { name: "Dairy", value: 2000 },
  { name: "Beverages", value: 1500 },
];

const customerDistribution = [
  { name: "Repeat", value: 60 },
  { name: "New", value: 40 },
];

const COLORS = ["#FF7F50", "#FFA500", "#FFD700", "#FFB347", "#4F46E5", "#3B82F6"];

const transactionsSample = [
  {
    date: "10 Nov", id: "#ZYT123", amount: 250, commission: 25, net: 225, status: "Paid", mode: "UPI",
    items: [{ name: "Milk", qty: 2, price: 50 }, { name: "Bread", qty: 1, price: 150 }]
  },
  {
    date: "09 Nov", id: "#ZYT124", amount: 500, commission: 50, net: 450, status: "Pending", mode: "Bank Transfer",
    items: [{ name: "Chips", qty: 5, price: 100 }]
  },
];

export default function EarningsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [transactions, setTransactions] = useState(transactionsSample);
  const [filters, setFilters] = useState({ status: "All", mode: "All", dateRange: "All" });
  const [sortKey, setSortKey] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  // Marketing tab states
const [dateRange, setDateRange] = useState("last7days");
const [campaignType, setCampaignType] = useState("all");
// Analytics tab states
const [analyticsDateRange, setAnalyticsDateRange] = useState("This Week");
const [analyticsCategoryFilter, setAnalyticsCategoryFilter] = useState("All");
const [forecastRevenue, setForecastRevenue] = useState(0);
useEffect(() => {
  const avgRevenue = revenueTrend.reduce((sum, d) => sum + d.revenue, 0) / revenueTrend.length;
  setForecastRevenue(Math.round(avgRevenue * 7));
}, [revenueTrend]);

  const navigate = useNavigate();

  const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  // Filter & sort transactions
  const filteredTransactions = transactions
    .filter(tx => (filters.status === "All" || tx.status === filters.status))
    .filter(tx => (filters.mode === "All" || tx.mode === filters.mode));

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortKey) return 0;
    if (sortKey === "amount") return b.amount - a.amount;
    if (sortKey === "commission") return b.commission - a.commission;
    if (sortKey === "recent") return new Date(b.date) - new Date(a.date);
    return 0;
  });

  // CSV download
  const downloadCSV = () => {
    const header = ["Date","Order ID","Amount","Commission","Net Received","Status","Payment Mode"];
    const rows = sortedTransactions.map(tx => [tx.date, tx.id, tx.amount, tx.commission, tx.net, tx.status, tx.mode]);
    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download","earnings.csv");
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#fff9f4]">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white p-4 flex items-center justify-between">
        {/* White circle back button */}
        <button
  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black"
  onClick={() => navigate(-1)}
>
  <ArrowLeft size={20} />
</button>
        <h1 className="text-lg font-bold">Merchant Earnings</h1>
        <div>
          <span className="mr-3">👤 Merchant Name</span>
          <span>🔔 2</span>
        </div>
      </div>

      <div className="p-5">
        {/* Tabs */}
        <div className="flex space-x-3 mb-5 flex-wrap">
          {["overview", "payouts", "history", "insights", "marketing", "reports"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-2xl font-semibold ${
                activeTab === tab ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white" : "bg-white text-gray-700 shadow"
              }`}
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

{/* Overview (Analytics Content) */}
{activeTab === "overview" && (
  <div className="min-h-screen bg-[#fff9f4] space-y-6">
    {/* Filters */}
    <div className="flex items-center space-x-3">
      <select
        value={analyticsDateRange}
        onChange={(e) => setAnalyticsDateRange(e.target.value)}
        className="p-2 border rounded"
      >
        <option>Today</option>
        <option>This Week</option>
        <option>This Month</option>
        <option>Custom</option>
      </select>
      <select
        value={analyticsCategoryFilter}
        onChange={(e) => setAnalyticsCategoryFilter(e.target.value)}
        className="p-2 border rounded"
      >
        <option>All</option>
        <option>Grocery</option>
        <option>Snacks</option>
        <option>Dairy</option>
        <option>Beverages</option>
      </select>
      <button
        onClick={downloadCSV}
        className="ml-auto flex items-center px-3 py-2 bg-orange-500 text-white rounded-xl"
      >
        <Download size={16} className="mr-1" /> Export CSV
      </button>
    </div>

    {/* Sales Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {salesSummary.map((s) => (
        <div key={s.title} className="bg-white p-4 rounded-2xl shadow flex flex-col">
          <p className="text-gray-500">{s.title}</p>
          <div className="flex items-center mt-1">
            <span className="text-xl font-bold">₹{s.value}</span>
            {s.trend === "up" ? (
              <ArrowUp className="text-green-500 ml-2" />
            ) : (
              <ArrowDown className="text-red-500 ml-2" />
            )}
          </div>
        </div>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-2xl shadow">
        <h3 className="font-semibold mb-2">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={revenueTrend}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#FFA500"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow">
        <h3 className="font-semibold mb-2">Orders Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ordersTrend}>
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="orders" fill="#FF7F50" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow">
        <h3 className="font-semibold mb-2">Category Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={categoryDistribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label
            >
              {categoryDistribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Forecast */}
    <div className="bg-white p-4 rounded-2xl shadow flex justify-between items-center">
      <h3 className="font-semibold">Forecast: Next Week Revenue</h3>
      <span className="text-orange-500 font-bold">₹{forecastRevenue}</span>
    </div>

    {/* Comparisons */}
    <div className="bg-white p-4 rounded-2xl shadow space-y-1">
      <h3 className="font-semibold mb-2">Comparisons</h3>
      <p>
        Week-over-Week Growth: <span className="text-green-500">+12%</span>
      </p>
      <p>
        Month-over-Month Growth: <span className="text-red-500">-5%</span>
      </p>
    </div>

    {/* Customer Analytics */}
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Customer Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow">
          <h3 className="font-semibold mb-2">Repeat vs New Customers</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={customerDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label
              >
                {customerDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <h3 className="font-semibold mb-2">Top Customers</h3>
          <ul className="text-gray-700 space-y-1">
            <li>John Doe - ₹2,500</li>
            <li>Jane Smith - ₹1,800</li>
            <li>Ravi Kumar - ₹1,500</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
)}

        {/* Payouts Tab */}
        {activeTab === "payouts" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow flex flex-col space-y-2">
              <h3 className="font-semibold">Payout & Commission Breakdown</h3>
              <p>Commission Rate: 10%</p>
              <p>Platform Fee: ₹50 per payout</p>
              <p>Net Payable: ₹2,800</p>
              <p>Next Payout Date: 12 Nov</p>
              <p>Payment Method: Bank Transfer</p>
              <div className="flex space-x-3 mt-2">
                <button className="bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold">💸 Request Payout</button>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Pending</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Completed</span>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-3">
            <div className="flex flex-wrap space-x-3 mb-2 items-center">
              <select
                className="p-2 border rounded"
                value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option>All</option>
                <option>Paid</option>
                <option>Pending</option>
              </select>
              <select
                className="p-2 border rounded"
                value={filters.mode} onChange={(e) => setFilters(prev => ({ ...prev, mode: e.target.value }))}
              >
                <option>All</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
              </select>
              <select
                className="p-2 border rounded"
                value={filters.dateRange} onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              >
                <option>All Dates</option>
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>
              <select
                className="p-2 border rounded"
                value={sortKey || ""} onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="">Sort By</option>
                <option value="amount">Amount</option>
                <option value="commission">Commission</option>
                <option value="recent">Most Recent</option>
              </select>
              <button onClick={downloadCSV} className="ml-auto flex items-center px-3 py-2 bg-orange-500 text-white rounded-xl">
                <Download size={16} className="mr-1" /> CSV
              </button>
            </div>

            <div className="overflow-x-auto bg-white p-4 rounded-2xl shadow">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    {["Date", "Order ID", "Amount", "Commission", "Net Received", "Status", "Payment Mode"].map((col) => (
                      <th key={col} className="py-2 px-4 text-left text-gray-600">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((tx, idx) => (
                    <React.Fragment key={idx}>
                      <tr onClick={() => toggleRow(tx.id)} className="border-b hover:bg-gray-50 cursor-pointer">
                        <td className="py-2 px-4">{tx.date}</td>
                        <td className="py-2 px-4">{tx.id}</td>
                        <td className="py-2 px-4">₹{tx.amount}</td>
                        <td className="py-2 px-4">₹{tx.commission}</td>
                        <td className="py-2 px-4">₹{tx.net}</td>
                        <td className="py-2 px-4">{tx.status === "Paid" ? "✅ Paid" : "🕒 Pending"}</td>
                        <td className="py-2 px-4">{tx.mode}</td>
                      </tr>
                      {expandedRows[tx.id] && (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="p-3">
                            <div className="space-y-1">
                              <h4 className="font-semibold">Items:</h4>
                              {tx.items.map((item, i) => (
                                <p key={i} className="text-gray-700 text-sm">{item.name} x{item.qty} - ₹{item.price}</p>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow">
              <h3 className="font-semibold mb-2">Weekly Summary</h3>
              <ul className="space-y-1 text-gray-700">
                <li>📈 Earnings grew +12% this week</li>
                <li>🛒 Most sales on weekends</li>
                <li>💵 Average order value: ₹410</li>
                <li>🏆 Top category: Beverages (₹1,500)</li>
                <li>🔥 Highest earning day: Sunday</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow">
              <h3 className="font-semibold mb-2">Alerts & Notifications</h3>
              <ul className="space-y-1 text-gray-700">
                <li>🔔 ₹1,200 payout processed today</li>
                <li>🕒 2 payouts pending approval</li>
                <li>⚠️ Commission changed to 12% starting Dec</li>
              </ul>
            </div>
          </div>
        )}

{/* Marketing Tab */}
{activeTab === "marketing" && (
  <div className="min-h-screen bg-[#fff9f4] p-5 space-y-6">
    {/* Filters */}
    <div className="flex gap-3 items-center mb-4">
      <select
        className="p-2 border rounded"
        value={dateRange}
        onChange={(e) => setDateRange(e.target.value)}
      >
        <option value="last7days">Last 7 Days</option>
        <option value="last30days">Last 30 Days</option>
        <option value="custom">Custom Range</option>
      </select>
      <select
        className="p-2 border rounded"
        value={campaignType}
        onChange={(e) => setCampaignType(e.target.value)}
      >
        <option value="all">All Campaigns</option>
        <option value="promo">Promotions</option>
        <option value="coupon">Coupons</option>
        <option value="referral">Referrals</option>
      </select>
      <button className="ml-auto flex items-center px-3 py-2 bg-orange-500 text-white rounded-xl">
        <Download size={16} className="mr-1" /> Export CSV
      </button>
    </div>

    {/* Discount / Coupon Usage */}
    <div className="bg-white p-5 rounded-2xl shadow">
      <h3 className="font-semibold mb-3">💰 Coupon / Discount Usage</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={couponData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="usage" fill="#f97316" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Revenue from Promotions */}
    <div className="bg-white p-5 rounded-2xl shadow">
      <h3 className="font-semibold mb-3">📈 Revenue from Promotions</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={revenueData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="revenue" fill="#f97316" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Referral Program Metrics */}
    <div className="bg-white p-5 rounded-2xl shadow">
      <h3 className="font-semibold mb-3">👥 Top Referrers</h3>
      <ul className="text-sm text-gray-700 space-y-1">
        {referralData.map((r, idx) => (
          <li key={idx}>
            {r.name} — {r.referred} referrals
          </li>
        ))}
      </ul>
    </div>

    {/* Top Campaigns Overview */}
    <div className="bg-white p-5 rounded-2xl shadow">
      <h3 className="font-semibold mb-3">🏆 Top Campaigns</h3>
      <ul className="text-sm text-gray-700 space-y-1">
        {revenueData.map((c, idx) => (
          <li key={idx}>
            {c.name} — ₹{c.revenue} revenue
          </li>
        ))}
      </ul>
    </div>
  </div>
)}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow flex flex-col space-y-2">
              <h3 className="font-semibold">Settlement & Bank Info</h3>
              <p>Bank Name: HDFC Bank</p>
              <p>Account Number: ****5678</p>
              <p>IFSC / UPI ID: HDFC0001234 / merchant@upi</p>
              <p>Settlement Schedule: Every Monday & Thursday 🔒</p>
              <button className="mt-2 bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold">Edit / Verify Bank</button>
            </div>
            <div className="flex space-x-3">
              <button className="bg-white text-orange-500 border border-orange-500 px-4 py-2 rounded-xl flex items-center space-x-2">
                <Download size={16} /> Export CSV
              </button>
              <button className="bg-white text-orange-500 border border-orange-500 px-4 py-2 rounded-xl flex items-center space-x-2">
                <Download size={16} /> Generate PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
