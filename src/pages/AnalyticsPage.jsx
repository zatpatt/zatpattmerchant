// src/pages/AnalyticsPage.jsx
import React, { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import { ArrowLeft, Download, ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Sample Data
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

const topProducts = [
  { name: "Milk", quantity: 120, revenue: 3600 },
  { name: "Bread", quantity: 100, revenue: 2500 },
  { name: "Chips", quantity: 90, revenue: 1800 },
];

const lowProducts = [
  { name: "Cheese", stock: 5 },
  { name: "Butter", stock: 3 },
];

const alerts = [
  "🚀 Your sales grew 15% this week",
  "⚠️ 2 products running low in stock",
  "💸 ₹1,200 payout processed today",
];

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("This Week");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [forecastRevenue, setForecastRevenue] = useState(0);

  useEffect(() => {
    // Simple next-week revenue forecast: avg of last 7 days * 7
    const avgRevenue = revenueTrend.reduce((sum, d) => sum + d.revenue, 0) / revenueTrend.length;
    setForecastRevenue(Math.round(avgRevenue * 7));
  }, [revenueTrend]);

  const downloadCSV = () => {
    const header = ["Metric", "Value"];
    const rows = salesSummary.map(s => [s.title, s.value]);
    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download","analytics.csv");
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#fff9f4]">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white p-4 flex items-center justify-between">
        <button
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Merchant Analytics</h1>
        <div>
          <span className="mr-3">👤 Merchant Name</span>
          <span>🔔 2</span>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Filters */}
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="p-2 border rounded"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>Custom</option>
          </select>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option>All</option>
            <option>Grocery</option>
            <option>Snacks</option>
            <option>Dairy</option>
            <option>Beverages</option>
          </select>
          <button onClick={downloadCSV} className="ml-auto flex items-center px-3 py-2 bg-orange-500 text-white rounded-xl">
            <Download size={16} className="mr-1" /> Export CSV
          </button>
        </div>

        {/* Sales Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {salesSummary.map(s => (
            <div key={s.title} className="bg-white p-4 rounded-2xl shadow flex flex-col">
              <p className="text-gray-500">{s.title}</p>
              <div className="flex items-center mt-1">
                <span className="text-xl font-bold">₹{s.value}</span>
                {s.trend === "up" ? <ArrowUp className="text-green-500 ml-2" /> : <ArrowDown className="text-red-500 ml-2" />}
              </div>
            </div>
          ))}
        </div>

        {/* Charts: Revenue / Orders / Category */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow">
            <h3 className="font-semibold mb-2">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueTrend}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#FFA500" strokeWidth={2} />
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
                <Pie data={categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

        {/* Week-over-Week / Month-over-Month Comparison */}
        <div className="bg-white p-4 rounded-2xl shadow space-y-1">
          <h3 className="font-semibold mb-2">Comparisons</h3>
          <p>Week-over-Week Growth: <span className="text-green-500">+12%</span></p>
          <p>Month-over-Month Growth: <span className="text-red-500">-5%</span></p>
        </div>

        {/* Existing Customer / Product Analytics */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Customer Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow">
              <h3 className="font-semibold mb-2">Repeat vs New Customers</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={customerDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                    {customerDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
    </div>
  );
}
