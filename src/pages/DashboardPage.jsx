// src/pages/DashboardPage.jsx

import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useRef,
} from "react";
import {
  ShoppingBag,
  Wallet,
  BookOpen,
  ThumbsUp,
  User,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import Confetti from "react-confetti";
import toast from "react-hot-toast";
import ProfileIncompleteModal from "../components/ProfileIncompleteModal";
import { isProfileComplete } from "../utils/profileGuard";
import {
  getDashboardData,
  updateMerchantOnlineStatus,
} from "../services/dashboard";
import { getLiveOrders } from "../services/orders";

export default function DashboardPage() {
  const navigate = useNavigate();

  const { t } = useContext(LanguageContext || { t: (s) => s });

  const userId = localStorage.getItem("user_id");

  const [loading, setLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState({
    total_orders: 0,
    total_earning: 0,
    today_orders: 0,
    today_earning: 0,
  });

  const [orders, setOrders] = useState([]);
  const [liveOrders, setLiveOrders] = useState([]);

  const [showConfetti, setShowConfetti] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
 
   // =========================
  // STORE NAME
  // =========================

  const getStoreNameFromStorage = () => {
    try {
      const profile = JSON.parse(
        localStorage.getItem("merchant_profile") || "{}"
      );

      if (profile?.storeName) {
        return profile.storeName;
      }

      return localStorage.getItem("merchant_storeName") || "My Store";
    } catch {
      return localStorage.getItem("merchant_storeName") || "My Store";
    }
  };

  const [storeName, setStoreName] = useState(
    getStoreNameFromStorage()
  );

  // =========================
  // ONLINE STATUS
  // =========================

  const [online, setOnline] = useState(() => {
    return localStorage.getItem("merchantOnlineStatus") === "true";
  });

  const [statusLoading, setStatusLoading] =
    useState(false);

  // =========================
  // FETCH DASHBOARD DATA
  // =========================

const [dashboardLoaded, setDashboardLoaded] =
  useState(false);

  useEffect(() => {

    if (dashboardLoaded) return;

    const fetchDashboard = async () => {
  
      try {
        const res = await getDashboardData(userId);

       if (res?.status) {

          setDashboardData(
            res.data || {}
          );

          setDashboardLoaded(true);

        } else {
          setDashboardData({
            total_orders: 0,
            total_earning: 0,
            today_orders: 0,
            today_earning: 0,
          });
        }
      } catch (error) {
        console.error(
        "Dashboard error",
        error
      );

      toast.error(
        "Failed to load dashboard"
      );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchDashboard();
    }
  }, [userId, dashboardLoaded]);

  // =========================
  // FETCH LIVE ORDERS
  // =========================

const [liveLoading, setLiveLoading] =
  useState(false);

  const liveLoadingRef =
  useRef(false);

  useEffect(() => {

  let isMounted = true;

    const fetchLiveOrders = async () => {

  if (liveLoadingRef.current) return;

      try {

  setLiveLoading(true);

  liveLoadingRef.current = true;

        const res = await getLiveOrders(userId);

        if (res?.status) {
          const data = Array.isArray(res.data) ? res.data : [];

          if (isMounted) {

          setLiveOrders(data);

          setOrders(data);

        }
        } else {
          if (isMounted) {

          setLiveOrders([]);

          setOrders([]);

        }
        }
      } catch (error) {
        console.error(
          "Live orders error",
          error
        );

        // toast.error(
        //   "Failed to load live orders"
        // );
        if (isMounted) {

          setLiveOrders([]);

          setOrders([]);

        }
      }
finally {

  setLiveLoading(false);

  liveLoadingRef.current = false;

}
    };

    if (userId) {
      fetchLiveOrders();
    }

    const interval = setInterval(() => {
      if (userId) {
        fetchLiveOrders();
      }
   }, 15000);

    return () => {

    isMounted = false;

    clearInterval(interval);

  };
  }, [userId]);
 
  // =========================
  // STATS
  // =========================

  const stats = useMemo(() => {
    let ratingSum = 0;
    let ratingCount = 0;

    const productSalesToday = {};
    const productSalesAll = {};
    const productRatings = {};

    const statusSummary = {
      Completed: 0,
      Pending: 0,
      Canceled: 0,
    };

    orders.forEach((o) => {
      // =========================
      // STATUS
      // =========================

      const status = (o.status || "").toLowerCase();

      if (status === "completed") {
        statusSummary.Completed += 1;
      }

      if (status === "pending") {
        statusSummary.Pending += 1;
      }

      if (status === "canceled") {
        statusSummary.Canceled += 1;
      }

      // =========================
      // RATING
      // =========================

      if (typeof o.rating === "number") {
        ratingSum += o.rating;
        ratingCount += 1;
      }

      // =========================
      // ITEMS
      // =========================

      const items = Array.isArray(o.items) ? o.items : [];

      items.forEach((it) => {
        const name =
          typeof it === "string"
            ? it
            : it?.name || "Unknown";

        productSalesToday[name] =
          (productSalesToday[name] || 0) + 1;

        productSalesAll[name] =
          (productSalesAll[name] || 0) + 1;

        if (typeof o.rating === "number") {
          productRatings[name] =
            productRatings[name] || {
              sum: 0,
              count: 0,
            };

          productRatings[name].sum += o.rating;
          productRatings[name].count += 1;
        }
      });
    });

    const avgRating =
      ratingCount > 0
        ? Number((ratingSum / ratingCount).toFixed(2))
        : 0;

    const topToday = Object.entries(productSalesToday)
      .map(([name, qty]) => ({
        name,
        sales: qty,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    const topOverall = Object.entries(productSalesAll)
      .map(([name, qty]) => ({
        name,
        sales: qty,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    const topRated = Object.entries(productRatings)
      .map(([name, value]) => ({
        name,
        rating: Number(
          (value.sum / value.count).toFixed(2)
        ),
        count: value.count,
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);

    return {
      avgRating,
      topToday,
      topOverall,
      topRated,
      statusSummary,
    };
  }, [orders]);

  // =========================
  // ALERTS
  // =========================

  const alerts = useMemo(() => {
    const arr = [];

    if (orders.length === 0) {
      arr.push("No live orders currently.");
    }

    return arr;
  }, [orders]);

  // =========================
  // TOGGLE ONLINE
  // =========================

const toggleOnline = async () => {

  if (!isProfileComplete()) {
    setShowProfileModal(true);
    return;
  }

  // PREVENT MULTIPLE CLICKS
  if (statusLoading) return;

  try {

    setStatusLoading(true);

    const nextStatus = !online;

    // OPTIMISTIC UI
    setOnline(nextStatus);

    localStorage.setItem(
      "merchantOnlineStatus",
      nextStatus ? "true" : "false"
    );

    const payload = {
      user: userId,
      is_online: nextStatus,
    };

    console.log(
      "ONLINE STATUS PAYLOAD",
      payload
    );

    const res =
      await updateMerchantOnlineStatus(
        payload
      );

    console.log(
      "ONLINE STATUS RESPONSE",
      res
    );

    toast.success(
    nextStatus
      ? "Store is Online"
      : "Store is Offline"
  );

    if (!res?.status) {
      throw new Error(
        "Failed to update status"
      );
    }

    // CONFETTI
    if (nextStatus) {

      setShowConfetti(true);

      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
    }

  } catch (err) {

    console.error(err);

    toast.error(
    "Failed to update store status"
    );

    // ROLLBACK UI
   setOnline((prev) => {

  const rollback = !prev;

  localStorage.setItem(
    "merchantOnlineStatus",
    rollback ? "true" : "false"
  );

  return rollback;

});

  } finally {

   setStatusLoading(false);
  }
};

  // =========================
  // STORAGE LISTENER
  // =========================

  useEffect(() => {
    const onStorage = (e) => {
      if (
        e.key === "merchant_profile" ||
        e.key === "merchant_storeName"
      ) {
        setStoreName(getStoreNameFromStorage());
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // =========================
  // STAT TILES
  // =========================

  const statTiles = [
    {
      id: "todayEarnings",
      label: "Today's Earnings",
      value: `₹${dashboardData?.today_earning || 0}`,
    },
    {
      id: "todayOrders",
      label: "Today's Orders",
      value: dashboardData?.today_orders || 0,
    },
    {
      id: "totalEarnings",
      label: "Total Earnings",
      value: `₹${dashboardData?.total_earning || 0}`,
    },
    {
      id: "totalOrders",
      label: "Total Orders",
      value: dashboardData?.total_orders || 0,
    },
  ];

  const statusList = [
    "Completed",
    "Pending",
    "Canceled",
  ];

// const handleProtectedNavigation =
// (path) => {

//   const completion =
//     Number(
//       localStorage.getItem(
//         "profile_completion"
//       ) || 0
//     );

//   if (completion < 100) {

//     toast.error(
//       "Complete your profile first"
//     );

//     navigate("/profile");

//     return;
//   }

//   navigate(path);
// };

const handleProtectedNavigation =
(path) => {

  if (!isProfileComplete()) {
    setShowProfileModal(true);
    return;
  }

  navigate(path);
};


  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
  <div className="min-h-screen flex items-center justify-center bg-orange-50">

    <div className="bg-white px-6 py-4 rounded-2xl shadow text-orange-500 font-semibold">

      Loading dashboard...

    </div>

  </div>
);
  }


  // =========================
  // UI
  // =========================

 return (
    <div className="min-h-screen bg-orange-50 flex flex-col relative pb-28">
      {showConfetti && <Confetti />}

      <ProfileIncompleteModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* HEADER */}

      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white py-5 px-6 rounded-b-3xl shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-lg opacity-90">
            Hello 👋
          </h2>

          <h1 className="text-2xl font-bold">
            {storeName}
          </h1>

          <div className="text-xs opacity-90 mt-1">
            Status:
            <span className="font-semibold ml-1">
              {online ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm">
            Quick actions
          </div>

          <div className="mt-2 flex gap-2 items-center">
{/*             <button
              onClick={toggleOnline}
              className={`px-3 py-1 rounded-full font-medium ${
                online
                  ? "bg-white text-orange-500"
                  : "bg-white/70 text-orange-700"
              }`}
            >
              {online
                ? "Go Offline"
                : "Go Online"}
            </button> */}
              <div className="flex items-center gap-3">

               <span
                  className={`
                    text-sm font-medium
                    transition-all
                    ${
                      statusLoading
                        ? "opacity-50"
                        : ""
                    }
                  `}
                >

                  {statusLoading
                    ? "Updating..."
                    : online
                      ? "Online"
                      : "Offline"}

                </span>

                <button
                type="button"
                onClick={toggleOnline}
                disabled={statusLoading}
                 className={`
                  relative inline-flex
                  h-7 w-14
                  items-center
                  rounded-full
                  transition-all duration-300

                  ${
                    statusLoading
                      ? "opacity-50 cursor-not-allowed pointer-events-none"
                      : ""
                  }

                  ${
                    online
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }
                `}
                >
                  <span
                    className={`
                      inline-block
                      h-5 w-5
                      transform
                      rounded-full
                      bg-white
                      transition-transform duration-300
                      shadow-md
                      ${
                        online
                          ? "translate-x-8"
                          : "translate-x-1"
                      }
                    `}
                  />
                </button>

              </div>
{/*             <button
              onClick={() => navigate("/orders")}
              className="px-3 py-1 rounded-full bg-white/20"
            >
              View Orders
            </button> */}
          </div>
        </div>
      </div>

      {/* MAIN */}

      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">

        {/* STATS */}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statTiles.map((s) => (
            <div
              key={s.id}
              className="bg-white p-4 rounded-2xl shadow text-center"
            >
              <div className="text-sm text-gray-500">
                {s.label}
              </div>

              <div className="text-2xl font-bold mt-2">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* LIVE ORDERS */}

        <div className="bg-white rounded-2xl p-4 shadow">

              {
              liveLoading && (
                <div className="text-xs text-orange-500 mb-2">
                  Refreshing orders...
                </div>
              )
            }

          <h3 className="text-lg font-semibold mb-3 text-orange-600">
            📦 Live Orders
          </h3>

          <div className="flex flex-wrap gap-4">
            {statusList.map((st) => (
              <div
                key={st}
                className="bg-orange-50 p-3 rounded-xl flex-1 min-w-[140px]"
              >
                <div className="text-sm text-gray-500">
                  {st}
                </div>

                <div className="text-2xl font-bold">
                  {stats.statusSummary[st] || 0}
                </div>
              </div>
            ))}

            <div className="bg-orange-50 p-3 rounded-xl min-w-[160px]">
              <div className="text-sm text-gray-500">
                Ratings (avg)
              </div>

              <div className="text-2xl font-bold">
                {stats.avgRating || "—"} ★
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {liveOrders.slice(0, 5).map((o) => (
              <div
                key={o.order_code}
                className="flex justify-between items-center border rounded-xl p-3"
              >
                <div>
                  <div className="font-semibold text-sm">
                    Order #{o.order_code}
                  </div>

                  <div className="text-xs text-gray-600">
                    {o.customer_name}
                  </div>

                  <div className="text-xs text-gray-700 mt-1">
                    Delivery Partner:
                    {" "}
                    {o.delivery_partner_name}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold">
                    ₹{o.total_amount}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {o.status}
                  </div>
                </div>
              </div>
            ))}

            {liveOrders.length === 0 && (
              <div className="text-gray-500">
                No live orders.
              </div>
            )}
          </div>
        </div>

        {/* ALERTS */}

        <div className="bg-white rounded-2xl p-4 shadow">
          <h3 className="text-lg font-semibold mb-3 text-orange-600">
            ⚠️ Alerts
          </h3>

          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {alerts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        {/* TOP SELLING */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* TODAY */}

          <div className="bg-white rounded-2xl p-4 shadow">
            <h3 className="text-lg font-semibold mb-3 text-orange-600">
              🔥 Top Selling Today
            </h3>

            {stats.topToday.length === 0 ? (
              <div className="text-gray-500">
                No sales today.
              </div>
            ) : (
              stats.topToday.map((it, idx) => (
                <div
                  key={it.name}
                  className="flex justify-between bg-orange-50 p-2 rounded-xl mb-2"
                >
                  <div className="font-medium">
                    {idx + 1}. {it.name}
                  </div>

                  <div className="font-semibold text-orange-500">
                    {it.sales} sold
                  </div>
                </div>
              ))
            )}
          </div>

          {/* OVERALL */}

          <div className="bg-white rounded-2xl p-4 shadow">
            <h3 className="text-lg font-semibold mb-3 text-orange-600">
              🏆 Overall Top Selling
            </h3>

            {stats.topOverall.length === 0 ? (
              <div className="text-gray-500">
                No sales yet.
              </div>
            ) : (
              stats.topOverall.map((it, idx) => (
                <div
                  key={it.name}
                  className="flex justify-between bg-orange-50 p-2 rounded-xl mb-2"
                >
                  <div className="font-medium">
                    {idx + 1}. {it.name}
                  </div>

                  <div className="font-semibold text-orange-500">
                    {it.sales} sold
                  </div>
                </div>
              ))
            )}
          </div>

          {/* TOP RATED */}

          <div className="bg-white rounded-2xl p-4 shadow">
            <h3 className="text-lg font-semibold mb-3 text-orange-600">
              ⭐ Overall Top Rated Products
            </h3>

            {stats.topRated.length === 0 ? (
              <div className="text-gray-500">
                No ratings yet.
              </div>
            ) : (
              stats.topRated.map((it, idx) => (
                <div
                  key={it.name}
                  className="flex justify-between bg-orange-50 p-2 rounded-xl mb-2"
                >
                  <div className="font-medium">
                    {idx + 1}. {it.name}
                  </div>

                  <div className="font-semibold text-orange-500">
                    {it.rating} ★ ({it.count})
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}

      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg flex justify-around py-3 rounded-t-3xl border-t">

        <button
          onClick={() =>
              handleProtectedNavigation(
                "/orders"
              )
            }
          className="flex flex-col items-center text-orange-500"
        >
          <ShoppingBag size={22} />
          <span className="text-xs">
            Orders
          </span>
        </button>

        <button
          onClick={() => handleProtectedNavigation("/earnings")}
          className="flex flex-col items-center text-orange-500"
        >
          <Wallet size={22} />
          <span className="text-xs">
            Earnings
          </span>
        </button>

        <button
          onClick={() => handleProtectedNavigation("/menu")}
          className="flex flex-col items-center text-orange-500"
        >
          <BookOpen size={22} />
          <span className="text-xs">
            Menu
          </span>
        </button>

        <button
          onClick={() => handleProtectedNavigation("/ratings")}
          className="flex flex-col items-center text-orange-500"
        >
          <ThumbsUp size={22} />
          <span className="text-xs">
            Ratings
          </span>
        </button>

        <button
          onClick={() => navigate("/profile")}
          className="flex flex-col items-center text-orange-500"
        >
          <User size={22} />
          <span className="text-xs">
            Profile
          </span>
        </button>
      </div>
    </div>
  );
}