// src/pages/RatingsPage
import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Star,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  MessageSquare,
  Flag,
  BarChart3,
  RefreshCcw,
  Pin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  getMerchantRating,
  getMerchantReviews,
} from "../services/ratingsApi";
import { getMerchantReviewInsights } from "../services/ratingsApi";
import { getMerchantChats } from "../services/ratingsApi";


// LocalStorage key for reviews (you chose option A)


export default function RatingsPage() {
  const navigate = useNavigate();

  // UI state
  const [activeTab, setActiveTab] = useState(() => {
  return localStorage.getItem("ratings_active_tab") || "overview";
});
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({});
  const [replyText, setReplyText] = useState({});
  const [filterStar, setFilterStar] = useState(0); // 0 = all
  const [searchQ, setSearchQ] = useState("");
  const [insights, setInsights] = useState([]);
  const [insightFilter, setInsightFilter] = useState("month");
  const [chats, setChats] = useState([]);
  const [pinnedMetrics, setPinnedMetrics] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("merchant_pinned_metrics") || "[]");
    } catch { return [] }
  });

  const fetchChats = async () => {
  try {
    const res = await getMerchantChats({ user: 50 });

    console.log("Chats API:", res);

    if (res?.status) {
      setChats(res.data || []);
    }
  } catch (err) {
    console.error("Chats error:", err);
  }
};


  const fetchInsights = async () => {
  try {
    const res = await getMerchantReviewInsights({
      user: 50,
      filter: insightFilter,
    });

    console.log("Insights API:", res);

    if (res?.status) {
      setInsights(res.data || []);
    }
  } catch (err) {
    console.error("Insights error:", err);
  }
};

  const fetchRatings = async () => {
  try {
    const res = await getMerchantRating({ user: 51 });

    console.log("Rating API:", res);

    if (res?.status) {
      setRatingSummary(res.data || {});
    }
  } catch (err) {
    console.error("Rating error:", err);
  }
};

const fetchReviews = async () => {
  try {
    const res = await getMerchantReviews({ user: 51 });

    console.log("Reviews API:", res);

    if (res?.status) {
      setReviews(
  (res.data || []).map((item) => ({
    id: item.id,
    rating: item.ratings,
    text: item.remark,
    items: item.items?.join(", "),
    name: "Customer", // fallback (backend not giving)
    date: new Date().toISOString(), // fallback
    status: "",
  }))
);
    }
  } catch (err) {
    console.error("Reviews error:", err);
  }
};

// useEffect(() => {
//   fetchRatings();
//   fetchReviews();
//   fetchInsights();
// }, []);

useEffect(() => {
  if (activeTab === "overview") {
    fetchRatings();
  }

  if (activeTab === "all") {
    fetchReviews();
  }

  if (activeTab === "insights") {
    fetchInsights();
  }

 if (activeTab === "replies") {
  fetchChats();
}
}, [activeTab]);

useEffect(() => {
  fetchInsights();
}, [insightFilter]);

  // live storage listener so updates from other tabs/apps reflect here

 
  // derived metrics
  const totalReviews = ratingSummary?.total_reviews || reviews.length;
  const averageRating = ratingSummary?.average_rating || 0;

  const starDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      const s = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
      dist[s - 1]++;
    });
    const sum = dist.reduce((a, b) => a + b, 0) || 1;
    return [5, 4, 3, 2, 1].map((stars, idx) => ({ stars, count: dist[5 - stars], percent: Math.round((dist[5 - stars] / sum) * 100) }));
  }, [reviews]);

  // simple daily trend for last 7 days (counts)

const ratingTrend = useMemo(() => {
  const list = [];

  insights.forEach((item) => {
    item.date_wise?.forEach((d) => {
      list.push({
        name: new Date(d.date).toLocaleDateString(),
        rating: d.ratings,
      });
    });
  });

  return list;
}, [insights]);


  // listing + filters for All Reviews tab
  const filteredReviews = useMemo(() => {
    let list = [...reviews];
    if (filterStar > 0) list = list.filter((r) => Math.round(Number(r.rating) || 0) === filterStar);
    if (searchQ && searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      list = list.filter((r) => {
        const hay = `${r.name || ""} ${r.text || r.review || ""} ${r.items || ""} ${r.status || ""}`.toLowerCase();
        return hay.includes(q) || String(r.id).toLowerCase().includes(q);
      });
    }
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [reviews, filterStar, searchQ]);

  // handlers
  const handleReplySend = (id) => {
    const txt = (replyText[id] || "").trim();
    if (!txt) {
      alert("Reply is empty");
      return;
    }
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, replied: true, merchantReply: txt } : r)));
    setReplyText((p) => ({ ...p, [id]: "" }));
  };

  const togglePin = (metric) => {
    const next = pinnedMetrics.includes(metric) ? pinnedMetrics.filter((m) => m !== metric) : [...pinnedMetrics, metric];
    setPinnedMetrics(next);
    try { localStorage.setItem("merchant_pinned_metrics", JSON.stringify(next)); } catch {}
  };

  const markResolved = (id) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, replied: true, resolved: true } : r)));
  };

  const reportReview = (id) => {
    if (!confirm("Report this review as inappropriate?")) return;
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reported: true } : r)));
    alert("Reported — admin will review.");
  };

  const exportReviewsCSV = () => {
    if (!reviews.length) return alert("No reviews to export");
    const keys = ["id", "name", "rating", "text", "items", "date", "status", "replied", "merchantReply"];
    const rows = [keys.join(",")].concat(reviews.map((r) => keys.map((k) => `"${String((r[k] === undefined || r[k] === null) ? "" : r[k]).replace(/"/g, '""')}"`).join(",")));
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `reviews-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  // small helper to seed demo reviews when none exist (optional)
  const seedDemo = () => {
    const demo = [
      { id: 1, name: "Rahul Sharma", image: "https://i.pravatar.cc/40?img=1", rating: 5, text: "Great packaging and fast delivery!", items: "Amul Butter 100g, Bread Pack", date: new Date().toISOString(), replied: false, verified: true, status: "Delivered" },
      { id: 2, name: "Priya Patel", image: "https://i.pravatar.cc/40?img=2", rating: 3, text: "Product was fine but delivery was delayed.", items: "Tata Salt 1kg", date: new Date(Date.now()-86400000).toISOString(), replied: true, verified: true, merchantReply: "Sorry for the delay, we'll improve.", status: "Delivered" },
    ];
    setReviews(demo);
  };

  const filterLabelMap = {
  week: "This Week",
  month: "This Month",
};


  return (
    <div className="min-h-screen bg-[#fff9f4]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow">
        <div onClick={() => navigate(-1)} className="bg-white rounded-full p-2 cursor-pointer">
          <ArrowLeft className="text-black" size={20} />
        </div>
        <h1 className="text-xl font-semibold">Ratings & Reviews</h1>
        <div className="ml-auto text-sm opacity-90">Live updates from API</div>
      </div>

      {/* Tabs */}
      <div className="flex justify-around bg-white border-b sticky top-0 z-10">
        {["overview", "all", "insights", "replies"].map((tab) => (
          <button
            key={tab}
            className={`py-3 px-4 text-sm font-medium ${activeTab === tab ? "border-b-2 border-orange-500 text-orange-600" : "text-gray-500"}`}
            onClick={() => {
            setActiveTab(tab);
            localStorage.setItem("ratings_active_tab", tab);
          }}
          >
            {tab === "overview" && "⭐ Overview"}
            {tab === "all" && "💬 All Reviews"}
            {tab === "insights" && "📊 Insights"}
            {tab === "replies" && "🛠️ Manage Replies"}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {activeTab === "overview" && (
        <div className="p-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow relative">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-bold text-orange-500">{averageRating} <span className="text-gray-500 text-2xl">/ 5</span></h2>
                <p className="text-sm text-gray-600">Based on {totalReviews} reviews</p>
              </div>
              <div>{ratingTrend?.length > 0 && ratingTrend.some(d => d.rating) && (ratingTrend?.[ratingTrend.length - 1]?.rating || 0 >= (ratingTrend?.[ratingTrend.length - 1]?.rating || 0||0) ? <TrendingUp className="text-green-500" /> : <TrendingDown className="text-red-500" />)}</div>
            </div>

            <button onClick={() => togglePin("averageRating")} className="absolute top-3 right-3 text-gray-400 hover:text-orange-500"><Pin size={18} /></button>

            <div className="mt-5 space-y-2">
              {starDistribution.map((s) => (
                <div key={s.stars} className="flex items-center gap-2">
                  <span className="w-12 text-sm">{s.stars}★</span>
                  <div className="flex-1 bg-gray-200 h-2 rounded overflow-hidden">
                    <div className="bg-orange-400 h-2 rounded" style={{ width: `${s.percent}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{s.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-2xl shadow space-y-2">
            <p>💬 Most customers love your packaging and delivery speed.</p>
            <p>⚠️ Reviews mentioning delivery delays: {reviews.filter(r => (r.text||"").toLowerCase().includes("delay") || (r.text||"").toLowerCase().includes("late")).length}</p>
            <p>📈 Rating change (7d): {(() => {
              const first = ratingTrend?.[0]?.rating || 0;
              const last = ratingTrend?.[ratingTrend.length - 1]?.rating || 0;
               return (last - first).toFixed(2);
            })()}</p>
          </div>

          {pinnedMetrics.length > 0 && (
            <div className="bg-white p-4 rounded-2xl shadow space-y-2">
              <h3 className="font-semibold">📌 Pinned Metrics</h3>
              {pinnedMetrics.includes("averageRating") && <p>⭐ Average Rating: {averageRating}/5</p>}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={exportReviewsCSV} className="px-3 py-2 bg-orange-500 text-white rounded-xl flex items-center gap-2"><Download size={16} /> Export CSV</button>
            <button onClick={() => setReviews([])} className="px-3 py-2 bg-red-100 text-red-600 rounded-xl">Clear Reviews</button>
            <button onClick={seedDemo} className="px-3 py-2 bg-gray-100 rounded-xl">Seed Demo</button>
          </div>
        </div>
      )}

      {activeTab === "all" && (
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex gap-2 items-center">
              <select value={filterStar} onChange={(e) => setFilterStar(Number(e.target.value))} className="px-3 py-2 border rounded-xl text-sm">
                <option value={0}>All stars</option>
                <option value={5}>5★</option>
                <option value={4}>4★</option>
                <option value={3}>3★</option>
                <option value={2}>2★</option>
                <option value={1}>1★</option>
              </select>

              <button className="flex items-center gap-1 border px-3 py-1 rounded-full text-sm"><Filter size={16} /> Filter</button>
              <button className="flex items-center gap-1 border px-3 py-1 rounded-full text-sm"><RefreshCcw size={16} /> Sort</button>
            </div>

            <div className="ml-auto flex gap-2 items-center">
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search reviews, items, name" className="px-3 py-2 border rounded-xl text-sm" />
              <button onClick={exportReviewsCSV} className="flex items-center gap-2 border px-3 py-1 rounded-xl text-sm"><Download size={16} /> Export</button>
            </div>
          </div>

          {filteredReviews.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-2xl shadow">
              <div className="flex items-start gap-3">
                <img src={r.image || `https://i.pravatar.cc/40?u=${r.id}`} alt={r.name || r.user_name || "User"} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{r.name || r.user_name || "User"} <span className="text-xs text-gray-400 ml-2">{r.status || ''}</span></div>
                      <p className="text-xs text-gray-500">{new Date(r.created_at || r.date).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{r.rating}★</div>
                      <div className="text-xs text-gray-500">{r.verified ? 'Verified' : ''}</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mt-3">{r.text || r.review}</p>
                  {r.items && <p className="text-xs text-gray-500 mt-1">🛍️ {r.items}</p>}

                  {r.merchantReply && <div className="mt-3 p-3 bg-gray-50 rounded"> <strong className="text-sm">Your reply:</strong> <div className="text-sm text-gray-700 mt-1">{r.merchantReply}</div> </div>}

                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setReplyText((p)=>({ ...p, [r.id]: p[r.id] ?? "" }))} className="flex items-center gap-1 text-sm text-orange-600"><MessageSquare size={14} /> Reply</button>
                    <button onClick={() => reportReview(r.id)} className="flex items-center gap-1 text-sm text-gray-500"><Flag size={14} /> Report</button>
                  </div>

                  {replyText[r.id] !== undefined && (
                    <div className="mt-3">
                      <textarea value={replyText[r.id]} onChange={(e)=>setReplyText((p)=>({ ...p, [r.id]: e.target.value }))} className="w-full border rounded-xl p-2 text-sm" placeholder="Write your reply..." />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleReplySend(r.id)} className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm">Send Reply</button>
                        <button onClick={() => setReplyText((p)=>({ ...p, [r.id]: undefined }))} className="px-3 py-1 border rounded-lg text-sm">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {filteredReviews.length === 0 && <div className="text-gray-500 p-6 text-center">No reviews found</div>}
        </div>
      )}

      {activeTab === "insights" && (
        <div className="p-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow">
           <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">📈 Rating Trend ({filterLabelMap[insightFilter]})</h3>

          <select
            value={insightFilter}
            onChange={(e) => setInsightFilter(e.target.value)}
            className="border px-3 py-1 rounded-lg text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ratingTrend}>
                <XAxis dataKey="name" />
                <YAxis domain={[3.0, 5.0]} />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="#f97316" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <button onClick={() => exportReviewsCSV()} className="mt-3 flex items-center gap-2 border px-3 py-2 rounded-xl text-sm"><Download size={16} /> Export Rating Trends</button>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow">
            <h3 className="font-semibold mb-3">💥 Top-rated Products</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              {insights.flatMap((item) =>
              item.high_rated?.map((prod, idx) => (
                <li key={`${item.id}-high-${idx}`}>
                  • {prod} — ⭐ High Rated
                </li>
              ))
            )}
            </ul>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow">
            <h3 className="font-semibold mb-3">❗ Low-rated Items</h3>
            <ul className="text-sm text-gray-700 space-y-1">
             {insights.flatMap((item) =>
              item.low_rated?.map((prod, idx) => (
                <li key={`${item.id}-low-${idx}`}>
                  • {prod} — ⚠️ Low Rated
                </li>
              ))
            )}
            </ul>
          </div>
        </div>
      )}

      {activeTab === "replies" && (
        <div className="p-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow">
            <h3 className="font-semibold mb-3">🧾 Reply Management</h3>
            <p className="text-sm text-gray-600 mb-3">Manage replied reviews and mark resolved.</p>

           {chats.length === 0 && (
            <div className="text-gray-500">No messages yet.</div>
          )}

            {chats.map((chat) => (
             <div key={chat.order} className="border-t py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">
                    {chat.customer ? `User #${chat.customer}` : "Merchant"}
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(chat.timestamp).toLocaleDateString()}
                    </span>
                  </p>

                  <p className="text-xs text-gray-500">{chat.message}</p>

                  <div className="text-xs text-gray-500">
                    {chat.merchant_reply || "—"}
                  </div>
                    <div className="flex gap-2">
                      <button className="text-orange-600 text-sm border px-3 py-1 rounded-xl">
                      Mark Resolved
                    </button>

                    <button className="text-red-600 text-sm border px-3 py-1 rounded-xl">
                      Remove
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-5 rounded-2xl shadow space-y-2">
            <h3 className="font-semibold">📤 Export & Reports</h3>
            <button onClick={exportReviewsCSV} className="flex items-center gap-2 border px-3 py-2 rounded-xl text-sm w-full justify-center"><Download size={16} /> Export Reviews (CSV)</button>
            <button onClick={()=>alert('Generate Monthly Report (demo)')} className="flex items-center gap-2 border px-3 py-2 rounded-xl text-sm w-full justify-center"><BarChart3 size={16} /> Generate Monthly Report</button>
            <button onClick={()=>alert('Export Insights (demo)')} className="flex items-center gap-2 border px-3 py-2 rounded-xl text-sm w-full justify-center"><Download size={16} /> Export Insights</button>
          </div>
        </div>
      )}
    </div>
  );
}
