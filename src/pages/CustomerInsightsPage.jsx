//src\pages\CustomerInsightsPage.jsx
import React, { useState } from "react";
import { ArrowLeft, PieChart, Users, MapPin, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function CustomerInsightsPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const [filterLoading, setFilterLoading] =
  useState(false);

  // Dummy data
  const customerTypeData = [
    { name: "New", value: 120 },
    { name: "Returning", value: 80 },
  ];

  const topCustomers = [
    { name: "Rahul Sharma", spent: 5200 },
    { name: "Priya Patel", spent: 4300 },
    { name: "Ankit Mehta", spent: 3900 },
  ];

  const topCities = [
    { city: "Mumbai", customers: 45 },
    { city: "Delhi", customers: 32 },
    { city: "Bengaluru", customers: 28 },
  ];

  const COLORS = ["#f97316", "#facc15"]; // orange / yellow

  const retentionRate = 65; // in %

  return (
    <div className="min-h-screen bg-[#fff9f4]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow">
        <div
          onClick={() => navigate(-1)}
          className="bg-white rounded-full p-2 cursor-pointer"
        >
          <ArrowLeft className="text-black" size={20} />
        </div>
        <h1 className="text-xl font-semibold">Customer Insights</h1>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-3 p-5 bg-white shadow rounded-2xl items-center">
        <Calendar size={16} />
        <input
          type="date"
          value={dateRange.start}
          onChange={async (e) => {
            disabled={filterLoading}
            if (filterLoading) return;

            try {

              setFilterLoading(true);

              setDateRange({
                ...dateRange,
                start: e.target.value,
              });

            } finally {

              setTimeout(() => {
                setFilterLoading(false);
              }, 400);
            }
          }}
          className={`
          border rounded-xl p-2 text-sm
          transition-all

          ${
            filterLoading
              ? "bg-gray-100 cursor-not-allowed opacity-70"
              : "bg-white"
          }
        `}
        />
        <span>to</span>
        
        {
        filterLoading && (
          <span className="text-xs text-orange-500">
            Loading...
          </span>
        )
      }
        <input
          type="date"
          value={dateRange.end}
          onChange={async (e) => {
            disabled={filterLoading}
            if (filterLoading) return;

            try {

              setFilterLoading(true);

              setDateRange({
                ...dateRange,
                end: e.target.value,
              });

            } finally {

              setTimeout(() => {
                setFilterLoading(false);
              }, 400);
            }
          }}
         className={`
          border rounded-xl p-2 text-sm
          transition-all

          ${
            filterLoading
              ? "bg-gray-100 cursor-not-allowed opacity-70"
              : "bg-white"
          }
        `}
        />
      </div>

      <div className="p-5 space-y-6">
        {/* New vs Returning Customers */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <PieChart size={18} /> New vs Returning Customers
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RePieChart>
              <Pie
                data={customerTypeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label
              >
                {customerTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Retention Rate */}
        <div className="bg-white p-5 rounded-2xl shadow flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-orange-500" />
            <div>
              <h3 className="font-semibold">Customer Retention Rate</h3>
              <p className="text-gray-500 text-sm">
                Percentage of returning customers
              </p>
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-500">{retentionRate}%</div>
        </div>

        {/* Top Customers / Biggest Spenders */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Users size={18} /> Top Customers
          </h3>
          <ul className="text-sm space-y-1">
            {topCustomers.map((c, i) => (
              <li key={i} className="flex justify-between">
                <span>{i + 1}. {c.name}</span>
                <span>₹{c.spent}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Geographical Distribution */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin size={18} /> Top Cities
          </h3>
          <ul className="text-sm space-y-1">
            {topCities.map((c, i) => (
              <li key={i} className="flex justify-between">
                <span>{i + 1}. {c.city}</span>
                <span>{c.customers} customers</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
