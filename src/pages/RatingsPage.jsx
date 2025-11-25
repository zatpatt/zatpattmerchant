import React, { useState } from "react";
import { ArrowLeft, Star, TrendingUp, TrendingDown, Download, Filter, MessageSquare, Flag, BarChart3, RefreshCcw, Pin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function RatingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [replyText, setReplyText] = useState({});
  const [pinnedMetrics, setPinnedMetrics] = useState([]);
  const [reviews, setReviews] = useState([
    {
      id: 1,
      name: "Rahul Sharma",
      image: "https://i.pravatar.cc/40?img=1",
      rating: 5,
      text: "Great packaging and fast delivery!",
      items: "Amul Butter 100g, Bread Pack",
      date: "Nov 10, 2025",
      replied: false,
      verified: true,
    },
    {
      id: 2,
      name: "Priya Patel",
      image: "https://i.pravatar.cc/40?img=2",
      rating: 3,
      text: "Product was fine but delivery was delayed.",
      items: "Tata Salt 1kg",
      date: "Nov 9, 2025",
      replied: true,
      verified: true,
    },
  ]);

  const ratingData = [
    { name: "Mon", rating: 4.5 },
    { name: "Tue", rating: 4.6 },
    { name: "Wed", rating: 4.4 },
    { name: "Thu", rating: 4.7 },
    { name: "Fri", rating: 4.8 },
    { name: "Sat", rating: 4.9 },
    { name: "Sun", rating: 4.6 },
  ];

  const starDistribution = [
    { stars: 5, percent: 72 },
    { stars: 4, percent: 18 },
    { stars: 3, percent: 6 },
    { stars: 2, percent: 3 },
    { stars: 1, percent: 1 },
  ];

  const averageRating = 4.6;
  const totalReviews = 245;
  const trendUp = true;

  const handleReply = (id) => {
    if (!replyText[id]) return;
    setReviews(
      reviews.map((r) =>
        r.id === id ? { ...r, replied: true } : r
      )
    );
    alert("Reply sent successfully!");
    setReplyText({ ...replyText, [id]: "" });
  };

  const togglePin = (metric) => {
    setPinnedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

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
        <h1 className="text-xl font-semibold">Ratings & Reviews</h1>
      </div>

      {/* Tabs */}
      <div className="flex justify-around bg-white border-b sticky top-0 z-10">
        {["overview", "all", "insights", "replies"].map((tab) => (
          <button
            key={tab}
            className={`py-3 px-4 text-sm font-medium ${
              activeTab === tab
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "overview" && "⭐ Overview"}
            {tab === "all" && "💬 All Reviews"}
            {tab === "insights" && "📊 Insights"}
            {tab === "replies" && "🛠️ Manage Replies"}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="p-5 space-y-6">
          {/* Overall Summary */}
          <div className="bg-white p-5 rounded-2xl shadow relative">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-bold text-orange-500">
                  {averageRating} <span className="text-gray-500 text-2xl">/ 5</span>
                </h2>
                <p className="text-sm text-gray-600">
                  Based on {totalReviews} reviews
                </p>
              </div>
              <div>
                {trendUp ? (
                  <TrendingUp className="text-green-500" />
                ) : (
                  <TrendingDown className="text-red-500" />
                )}
              </div>
            </div>

            {/* Pin Metric */}
            <button
              onClick={() => togglePin("averageRating")}
              className="absolute top-3 right-3 text-gray-400 hover:text-orange-500"
            >
              <Pin size={18} />
            </button>

            {/* Star Distribution */}
            <div className="mt-5 space-y-2">
              {starDistribution.map((s) => (
                <div key={s.stars} className="flex items-center gap-2">
                  <span className="w-12 text-sm">{s.stars}★</span>
                  <div className="flex-1 bg-gray-200 h-2 rounded">
                    <div
                      className="bg-orange-400 h-2 rounded"
                      style={{ width: `${s.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">
                    {s.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-2xl shadow space-y-2">
            <p>💬 Most customers love your packaging and delivery speed.</p>
            <p>⚠️ 3 recent reviews mentioned late deliveries.</p>
            <p>📈 Rating improved by +0.3 in the last 7 days!</p>
            <p>🏆 Top product this month: Milk — revenue +12%</p>
          </div>

          {/* Pinned Metrics */}
          {pinnedMetrics.length > 0 && (
            <div className="bg-white p-4 rounded-2xl shadow space-y-2">
              <h3 className="font-semibold">📌 Pinned Metrics</h3>
              {pinnedMetrics.includes("averageRating") && (
                <p>⭐ Average Rating: {averageRating}/5</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* All Reviews Tab */}
      {activeTab === "all" && (
        <div className="p-5 space-y-4">
          {/* Filter & Sort */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3 text-sm">
              <button className="flex items-center gap-1 border px-3 py-1 rounded-full">
                <Filter size={16} /> Filter
              </button>
              <button className="flex items-center gap-1 border px-3 py-1 rounded-full">
                <RefreshCcw size={16} /> Sort
              </button>
            </div>
            <button className="flex items-center gap-1 border px-3 py-1 rounded-full">
              <Download size={16} /> Export
            </button>
          </div>

          {/* Review Cards */}
          {reviews.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-2xl shadow"
            >
              <div className="flex items-center gap-3">
                <img src={r.image} alt={r.name} className="w-10 h-10 rounded-full" />
                <div>
                  <h3 className="font-medium">{r.name}</h3>
                  <p className="text-xs text-gray-500">{r.date}</p>
                </div>
              </div>
              <div className="flex items-center mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < r.rating ? "orange" : "none"}
                    stroke="orange"
                  />
                ))}
              </div>
              <p className="text-sm text-gray-700 mt-2">{r.text}</p>
              <p className="text-xs text-gray-500 mt-1">🛍️ {r.items}</p>

              <div className="flex gap-3 mt-3">
                <button
                  onClick={() =>
                    setReplyText({ ...replyText, [r.id]: replyText[r.id] || "" })
                  }
                  className="flex items-center gap-1 text-sm text-orange-600"
                >
                  <MessageSquare size={14} /> Reply
                </button>
                <button className="flex items-center gap-1 text-sm text-gray-500">
                  <Flag size={14} /> Report
                </button>
              </div>

              {replyText[r.id] !== undefined && (
                <div className="mt-3">
                  <textarea
                    value={replyText[r.id]}
                    onChange={(e) =>
                      setReplyText({ ...replyText, [r.id]: e.target.value })
                    }
                    className="w-full border rounded-xl p-2 text-sm"
                    placeholder="Write your reply..."
                  />
                  <button
                    onClick={() => handleReply(r.id)}
                    className="bg-orange-500 text-white px-3 py-1 rounded-lg mt-2 text-sm"
                  >
                    Send Reply
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === "insights" && (
        <div className="p-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow">
            <h3 className="font-semibold mb-3">📈 Rating Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ratingData}>
                <XAxis dataKey="name" />
                <YAxis domain={[4.0, 5.0]} />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="#f97316" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
            {/* Export Trends */}
            <button className="mt-3 flex items-center gap-2 border px-3 py-2 rounded-xl text-sm">
              <Download size={16} /> Export Rating Trends
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow">
            <h3 className="font-semibold mb-3">💥 Top-rated Products</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>🥛 Amul Butter 100g — ⭐ 4.9</li>
              <li>🍞 Bread Pack — ⭐ 4.8</li>
              <li>🧂 Tata Salt 1kg — ⭐ 4.6</li>
            </ul>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow">
            <h3 className="font-semibold mb-3">❗ Low-rated Items</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>🍫 Dairy Milk 25g — ⭐ 3.2</li>
              <li>🍪 Biscuit Pack — ⭐ 3.5</li>
            </ul>
          </div>
        </div>
      )}

      {/* Manage Replies Tab */}
      {activeTab === "replies" && (
        <div className="p-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow">
            <h3 className="font-semibold mb-3">🧾 Reply Management</h3>
            <p className="text-sm text-gray-600 mb-3">
              Manage all customer replies and mark as resolved.
            </p>
            {reviews
              .filter((r) => r.replied)
              .map((r) => (
                <div key={r.id} className="border-t py-3">
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-gray-500 mb-2">{r.text}</p>
                  <button className="text-orange-600 text-sm border px-3 py-1 rounded-xl">
                    Mark as Resolved
                  </button>
                </div>
              ))}
          </div>

          <div className="bg-white p-5 rounded-2xl shadow space-y-2">
            <h3 className="font-semibold">📤 Export & Reports</h3>
            <button className="flex items-center gap-2 border px-3 py-2 rounded-xl text-sm w-full justify-center">
              <Download size={16} /> Export Reviews (CSV)
            </button>
            <button className="flex items-center gap-2 border px-3 py-2 rounded-xl text-sm w-full justify-center">
              <BarChart3 size={16} /> Generate Monthly Report
            </button>
            <button className="flex items-center gap-2 border px-3 py-2 rounded-xl text-sm w-full justify-center">
              <Download size={16} /> Export Insights
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
