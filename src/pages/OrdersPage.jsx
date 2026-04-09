// src/pages/OrdersPage.jsx
import React, { useEffect, useMemo, useState, useRef, useContext } from "react";
import { ArrowLeft, Phone, MessageCircle, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationContext } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { getMerchantOrders } from "../services/merchantOrders";
import { useLocation } from "react-router-dom";

/*
 CLEAN ORDERS PAGE (MINIMAL VERSION)
 Tabs Only: New, Preparing, Prepared
 Filters Only: Search + Payment
 Details → Navigates to /order/:id
*/

const makeDemoOrder = (id, status = "New", minutesAgo = 2) => {
  const now = Date.now();
  const when = new Date(now - minutesAgo * 60 * 1000).toISOString();
  return {
    id: `ZYT${id}`,
    customer: `Guest ${id}`,
    phone: `98${String(70000000 + (id % 9999999)).slice(0, 8)}`,
    address: `${id} Market Lane`,
    placedAt: when,
    amount: Math.floor(120 + Math.random() * 800),
    items: [
      { name: "Amul Butter 100g", qty: 1, price: 90 },
      { name: "Bread Pack", qty: 1, price: 45 },
    ],
    payment: Math.random() > 0.4 ? "Prepaid" : "COD",
    status,
    etaMins: 15,
    notes: Math.random() > 0.8 ? "No onion, please" : "",
    timeline: [{ when, status: "Placed" }],
  };
};

/* --- Tiny Toast Provider --- */
const ToastContext = React.createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => remove(id), 3000);
  };
  const remove = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-black text-white px-4 py-2 rounded-md shadow"
            >
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export default function OrdersPage() {
  const notificationCtx = useContext(NotificationContext || {});
  const toast = React.useContext(ToastContext) || { push: (m) => console.log(m) };
  const navigate = useNavigate();
  // Inside component, add:
  const location = useLocation();

  // merchant profile
  const merchantProfile = (() => {
    try {
      return JSON.parse(localStorage.getItem("merchant_profile") || "{}");
    } catch {
      return {};
    }
  })();

  const merchantPhone =
    merchantProfile?.phone ||
    merchantProfile?.mobile ||
    localStorage.getItem("merchant_phone") ||
    "";

  // orders
  // const [orders, setOrders] = useState(() => {
  //   try {
  //     const saved = JSON.parse(localStorage.getItem("merchant_orders") || "null");
  //     if (Array.isArray(saved) && saved.length) return saved;
  //   } catch {}
  //   const seed = [
  //     makeDemoOrder(1001, "New", 2),
  //     makeDemoOrder(1002, "Preparing", 8),
  //     makeDemoOrder(1003, "Prepared", 18),
  //   ];
  //   localStorage.setItem("merchant_orders", JSON.stringify(seed));
  //   return seed;
  // });

  const [orders, setOrders] = useState([]);
const userId = 50;

/* REQUIRED TABS ONLY */
const tabs = ["New", "Accepted", "Preparing", "Prepared"];

const [activeTab, setActiveTab] = useState(location.state?.tab || "New");
const [query, setQuery] = useState("");
const [paymentFilter, setPaymentFilter] = useState("");

useEffect(() => {
  let isMounted = true;

  const fetchOrders = async () => {
  try {
    // In OrdersPage.jsx — inside fetchOrders

const statusMap = {
  New: "new",           // ← back to "new"
  Accepted: "accepted",
  Preparing: "preparing",
  Prepared: "prepared",
};


    const status = statusMap[activeTab];
    const paymentStatus = paymentFilter ? paymentFilter.toLowerCase() : "";

    const res = await getMerchantOrders(userId, status, paymentStatus);

    if (res?.status && isMounted) {
      setOrders(
        (res.data || []).map((o) => {
          // Map API status back to UI tab label

     
const statusToTab = {
  new: "New",           // ← back to "new"
  accepted: "Accepted",
  preparing: "Preparing",
  prepared: "Prepared",
};
          return {
            id: o.order_id,
            customer: o.customer_name,
            phone: o.customer_phone,
            amount: o.total_amount,
            payment: o.payment_status,
            placedAt: o.created_at || o.created_on,
            status: statusToTab[o.status] ?? activeTab, // fallback to current tab
          };
        })
      );
    }
  } catch (error) {
    console.error("Orders fetch error", error);
  }
};

  fetchOrders();

  return () => {
    isMounted = false;
  };
}, [activeTab, paymentFilter]);


  const persist = (next) => {
    setOrders(next);
    localStorage.setItem("merchant_orders", JSON.stringify(next));
  };

  /* REQUIRED TABS ONLY */
  // const tabs = ["New", "Preparing", "Prepared"];

  // const [activeTab, setActiveTab] = useState("New");
  // const [query, setQuery] = useState("");
  // const [paymentFilter, setPaymentFilter] = useState("");

  const highlightedNewIds = useRef(new Set());
  const incomingRef = useRef(null);

  // Incoming order simulation
  // useEffect(() => {
  //   if (incomingRef.current) clearInterval(incomingRef.current);

  //   incomingRef.current = setInterval(() => {
  //     const id = Math.floor(10000 + Math.random() * 90000);
  //     const o = makeDemoOrder(id, "New", 0);
  //     const next = [o, ...orders];
  //     persist(next);

  //     highlightedNewIds.current.add(o.id);
  //     setTimeout(() => highlightedNewIds.current.delete(o.id), 3000);

  //     toast.push(`New order ${o.id}`);
  //     notificationCtx?.addNotification?.(`New order ${o.id}`);

  //     if (merchantPhone) {
  //       try {
  //         window.open(`tel:${merchantPhone}`);
  //       } catch {}
  //     }
  //   }, 18000);

  //   return () => clearInterval(incomingRef.current);
  // }, [orders, merchantPhone]);

  // const ordersByTab = useMemo(() => {
  //   const map = {}; tabs.forEach((t) => (map[t] = []));
  //   orders.forEach((o) => (map[o.status] || map["New"]).push(o));
  //   return map;
  // }, [orders]);

 const filtered = useMemo(() => {
  const q = query.trim().toLowerCase();

  return orders.filter((o) => {
    if (q) {
      const hay = `${o.id} ${o.customer} ${o.phone}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (
      paymentFilter &&
      o.payment?.toLowerCase() !== paymentFilter.toLowerCase()
    ) {
      return false;
    }

    return true;
  });
}, [orders, query, paymentFilter]);


  return (
    <ToastProvider>
      <div className="min-h-screen bg-orange-50 flex flex-col">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white p-4 flex items-center justify-between shadow">
          <div className="flex items-center gap-4">
            <div
              onClick={() => window.history.back()}
              className="bg-white rounded-full p-2 cursor-pointer"
            >
              <ArrowLeft className="text-black" />
            </div>
            <div>
              <div className="text-sm opacity-90">Hello,</div>
              <div className="font-semibold text-lg">
                {merchantProfile?.storeName || "Merchant Store"}
              </div>
            </div>
          </div>

          <div className="text-sm opacity-90">
            Calls: <span className="font-semibold">{merchantPhone || "N/A"}</span>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
          
          {/* TABS + SEARCH */}
          <div className="bg-white rounded-2xl p-4 shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

              {/* Only 3 tabs */}
              <div className="flex items-center gap-2 overflow-x-auto">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-3 py-2 rounded-xl ${
                      activeTab === t ? "bg-orange-400 text-white" : "bg-white border"
                    }`}
                  >
                    {t}
                    {activeTab === t && (
                      <span className="ml-2 text-xs text-gray-600">
                        {orders.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search & Payment */}
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-xl px-2">
                  <Search className="text-gray-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search order, customer, phone"
                    className="px-2 py-2 text-sm outline-none"
                  />
                </div>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="border rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">All payments</option>
                  <option value="prepaid">Prepaid</option>
                  <option value="cod">COD</option>
                </select>
              </div>
            </div>
          </div>

          {/* ORDER LIST */}
          <div>
            {filtered.length === 0 ? (
              <div className="bg-white p-6 text-center text-gray-500 rounded-2xl shadow">
                No orders found
              </div>
            ) : (
              filtered.map((o) => {
                const isNew = highlightedNewIds.current.has(o.id);

                return (
                  <motion.div
                    key={o.id}
                    animate={
                      isNew
                        ? { boxShadow: "0 6px 26px rgba(249,115,22,0.35)" }
                        : { boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }
                    }
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl p-4 shadow mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold">#{o.id}</p>
                      <p className="text-xs text-gray-600">
                        {o.placedAt ? new Date(o.placedAt).toLocaleString() : "-"}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        {o.customer} • {o.phone}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">₹{o.amount}</p>
                      <p className="text-xs text-gray-400">{o.payment}</p>
                    </div>

                    <button
                    onClick={() => navigate(`/order/${o.id}`)}
                    className="px-3 py-1 border rounded-xl text-sm"
                  >
                    Details
                  </button>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}