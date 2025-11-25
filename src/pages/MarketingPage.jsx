// src/pages/MarketingPage.jsx
import React, { useState } from "react";
import { ArrowLeft, Download, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function MarketingPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("last7days");
  const [campaignType, setCampaignType] = useState("all");

  // Dummy data
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

  return (
    <div className="min-h-screen bg-[#fff9f4] p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow rounded-2xl">
        <div
          onClick={() => navigate(-1)}
          className="bg-white rounded-full p-2 cursor-pointer"
        >
          <ArrowLeft className="text-black" size={20} />
        </div>
        <h1 className="text-xl font-semibold">Marketing & Promotions</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <button className="flex items-center gap-1 border px-3 py-1 rounded-full">
          <Filter size={16} /> {dateRange === "last7days" ? "Last 7 Days" : "Custom Range"}
        </button>
        <button className="flex items-center gap-1 border px-3 py-1 rounded-full">
          <Filter size={16} /> {campaignType === "all" ? "All Campaigns" : campaignType}
        </button>
        <button className="flex items-center gap-1 border px-3 py-1 rounded-full">
          <Download size={16} /> Export CSV
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
  );
}
