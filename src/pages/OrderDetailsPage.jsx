// src/pages/OrderDetailsPage.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { NotificationContext } from "../context/NotificationContext";
// Update import at top
// Update import at top
import {
  getMerchantOrderDetail,
  acceptOrderMerchant,
  updateOrderStatus,
  updatePreparingStatus,
  updatePreparedStatus,    // ← adad this
} from "../services/merchantOrders";

/*
 OrderDetailsPage:
 - Shows order details
 - If status === "New": slide to accept -> shows TimeStepper popup (0-50) -> set Preparing
 - If status === "Preparing": Slide to Mark Prepared -> becomes "Prepared"
 - If status === "Prepared": NO further action (as requested)
*/

function SlideConfirm({ label, onConfirm }) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => { if (ref.current) setW(ref.current.clientWidth); }, []);
  return (
    <div ref={ref} className="w-full bg-gray-100 rounded-full p-1 relative select-none">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: Math.max(0, w - 56) }}
        dragElastic={0.1}
        onDragEnd={(e, info) => {
          const threshold = Math.max(0, (w - 56) * 0.6);
          if (info.point.x >= threshold) onConfirm();
        }}
        className="w-14 h-12 bg-white rounded-full shadow-md flex items-center justify-center cursor-grab"
      >
        ▶
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-sm text-gray-600">{label}</div>
    </div>
  );
}

function TimeStepper({ initial = 15, onSave, onClose }) {
  const [mins, setMins] = useState(initial);
  const inc = () => setMins(m => Math.min(50, m + 1));
  const dec = () => setMins(m => Math.max(0, m - 1));
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold">Set Preparation Time</h3>
        <p className="text-sm text-gray-600 mt-1">Select minutes (0–50)</p>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button onClick={dec} className="px-4 py-2 bg-gray-100 rounded-md">-</button>
          <div className="text-3xl font-bold">{mins} <span className="text-sm">min</span></div>
          <button onClick={inc} className="px-4 py-2 bg-gray-100 rounded-md">+</button>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={() => onSave(Math.min(50, Math.max(0, mins)))} className="flex-1 bg-orange-500 text-white py-2 rounded-xl">Save & Accept</button>
          <button
            onClick={() => onClose(true)} // pass flag
            className="flex-1 border py-2 rounded-xl"
          >
            Cancel
          </button>
        </div>

        <div className="text-xs text-gray-400 mt-3">Tip: set 0 for immediate prepare or set estimated time.</div>
      </motion.div>
    </div>
  );
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useContext(NotificationContext || {});
  const [order, setOrder] = useState(null);
  const [showStepper, setShowStepper] = useState(false);
  const [stepperInitial, setStepperInitial] = useState(15);
  const [width, setWidth] = useState(0);

  useEffect(() => {
  const fetchOrderDetail = async () => {
    try {
      const res = await getMerchantOrderDetail(id);

      if (res?.status) {
        const o = res.data;

 
setOrder({
  id: id,
  orderCode: o.order_code,
  customer: o.customer_name,
  phone: o.customer_mobile,
  deliveryPartner: o.delivery_partner_name,
  amount: o.total_amount,
  status: (o.status || "").toLowerCase().trim(), // ← normalize: lowercase + trim
  createdOn: o.created_on,
  remark: o.remark,
  items: (o.items || []).map((i) => ({
    name: i.product_name,
    qty: i.quantity,
    price: i.price,
    total: i.total_price,
  })),
  timeline: o.timeline || [],
  callAction: o.call_action,
});
      }
    } catch (err) {
      console.error("Order detail fetch error", err);
    }
  };

  fetchOrderDetail();
}, [id]);


  // persist helper
  // const saveOrder = (updated) => {
  //   const all = JSON.parse(localStorage.getItem("merchant_orders") || "[]");
  //   const next = all.map(o => (String(o.id) === String(updated.id) ? updated : o));
  //   localStorage.setItem("merchant_orders", JSON.stringify(next));
  //   setOrder(updated);
  //   try { window.dispatchEvent(new StorageEvent("storage", { key: "merchant_orders", newValue: JSON.stringify(next) })); } catch {}
  // };

  // Slide-to-Accept handler (for New)
  const onAcceptSlide = () => {
    // open time stepper to choose minutes
    setStepperInitial(order.etaMins || 15);
    setShowStepper(true);
  };

 const userId = 50;

 const formatTime = (mins) => {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}:00`;
};

const onStepperSave = async (mins) => {
  try {
    const payload = {
      order_id: order.id,
      timing: formatTime(mins),
      is_accept: true,
      user: userId,
    };

    const res = await acceptOrderMerchant(payload);

    if (res?.status) {
      setOrder((prev) => ({
        ...prev,
        status: "preparing",
        etaMins: mins,
        timeline: [
          ...(prev.timeline || []),
          { when: new Date().toISOString(), status: "Preparing" },
        ],
      }));

      addNotification?.(`Order ${order.id} accepted (${mins} mins)`);

      // ← ADD THIS: go back so the Preparing tab shows the order
      setTimeout(() => navigate(-1), 1500);
    }

    setShowStepper(false);
  } catch (err) {
    console.error("Accept error", err);
  }
};

const onCancelOrder = async () => {
  try {
    const payload = {
      order_id: order.id,
      timing: "00:00:00",
      is_accept: false,
      user: userId,
    };

    const res = await acceptOrderMerchant(payload);

    if (res?.status) {
      addNotification?.(`Order ${order.id} cancelled`);
      navigate(-1);
    }
  } catch (err) {
    console.error("Cancel error", err);
  }
};

// Replace onMarkPreparing entirely
const onMarkPreparing = async () => {
  try {
    const payload = {
      order_id: order.id,
      is_prepare: true,
      user: userId,
    };

    const res = await updatePreparingStatus(payload);  // ← use new function

    if (res?.status) {
      setOrder((prev) => ({
        ...prev,
        status: "preparing",
        timeline: [
          ...(prev.timeline || []),
          { when: new Date().toISOString(), status: "Preparing" },
        ],
      }));

      addNotification?.(`Order ${order.id} is now Preparing`);
      setTimeout(() => navigate("/orders", { state: { tab: "Preparing" } }), 1500);
    }
  } catch (err) {
    console.error("Preparing error", err.response?.data || err);
  }
};

 // Replace onMarkPrepared entirely
const onMarkPrepared = async () => {
  try {
    const payload = {
      order_id: Number(order.id),
      is_prepared: true,
      user: userId,
    };

    const res = await updatePreparedStatus(payload);  // ← use new function

    if (res?.status) {
      setOrder((prev) => ({
        ...prev,
        status: "prepared",
        preparedAt: new Date().toISOString(),
        timeline: [
          ...(prev.timeline || []),
          { when: new Date().toISOString(), status: "prepared" },
        ],
      }));

      addNotification?.(`Order ${order.id} marked Prepared`);
      setTimeout(() => navigate("/orders", { state: { tab: "Prepared" } }), 1500);
    }
  } catch (err) {
    console.error("Prepare error", err.response?.data || err);
  }
};

  if (!order) {
    return (
      <div className="p-6 text-center text-gray-600">
        Order not found — go back.
      </div>
    );
  }

  const handleCall = async () => {
  try {
    if (!order?.callAction) {
      alert("Call not available");
      return;
    }

    const res = await fetch(order.callAction.call_api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: order.callAction.order_id
      })
    });

    const data = await res.json();
    console.log("Call initiated", data);
  } catch (err) {
    console.error("Call error", err);
  }
};


  return (
    <div className="min-h-screen bg-[#fff6ed]">
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white p-4 flex items-center gap-4 shadow">
        <div onClick={() => navigate(-1)} className="bg-white rounded-full p-2 cursor-pointer"><ArrowLeft className="text-black" /></div>
        <div>
          <div className="text-sm opacity-80">Order Details</div>
          <div className="font-semibold text-lg">{order.orderCode}</div>
        </div>
      </div>

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold text-lg mb-2">Customer Details</h2>
          <p className="text-gray-700">{order.customer}</p>
          <p className="text-gray-700">{order.phone}</p>
          <p className="text-gray-600 mt-1">{order.remark || "No address provided"}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold text-lg mb-2">Items</h2>
          {(order.items || []).map((i, idx) => (
            <div key={idx} className="flex justify-between text-gray-700 py-1">
              <span>{i.name}</span>
              <span>{i.qty} × ₹{i.price} = ₹{i.total}</span>
            </div>
          ))}
          <div className="mt-3 font-bold text-right text-orange-600 text-lg">Total: ₹{order.amount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold text-lg mb-2">Timeline</h2>
          {(order.timeline || []).map((t, idx) => (
            <p key={idx} className="text-sm text-gray-600">{new Date(t.when).toLocaleString()} — {t.status}</p>
          ))}
        </div>

        <div className="bg-white p-4 rounded-xl shadow space-y-4">


  {/* status === "new" → Slide to Accept */}
  {/* status === "placed" → Slide to Accept */}
{order.status === "new" && (    // ← was "placed"
  <>
    <div className="text-sm text-gray-600">Slide to Accept Order</div>
    <div ref={(el) => el && setWidth(el.clientWidth)}>
      <SlideConfirm label="Slide to Accept" onConfirm={onAcceptSlide} />
    </div>
  </>
)}

  {/* status === "accepted" → Slide to Prepare */}
  {order.status === "accepted" && (
    <>
      <div className="text-sm text-gray-600">Order Accepted — Slide to start Preparing</div>
      <div>
        <SlideConfirm label="Slide to Prepare" onConfirm={onMarkPreparing} />
      </div>
    </>
  )}

  {/* status === "preparing" → Slide to Mark Prepared */}
  {order.status === "preparing" && (
    <>
      <div className="text-sm text-gray-600">Preparing — ETA: {order.etaMins || "--"} mins</div>
      <div>
        <SlideConfirm label="Slide to mark Prepared" onConfirm={onMarkPrepared} />
      </div>
    </>
  )}

  {/* status === "prepared" → Done */}
  {order.status === "prepared" && (
    <div className="text-center py-4">
      <div className="text-lg font-semibold text-orange-500">Prepared ✓</div>
      <div className="text-sm text-gray-600 mt-1">Wait For Delivery Partner For Pickup</div>
    </div>
  )}

  <button onClick={handleCall} className="w-full border py-3 rounded-xl flex justify-center gap-2">
    <Phone /> Call
  </button>
  <button onClick={() => alert("Chat coming soon")} className="w-full border py-3 rounded-xl flex justify-center gap-2">
    <MessageCircle /> Chat
  </button>

</div>

        
      </div>

      {showStepper && (
  <TimeStepper
    initial={stepperInitial}
    onSave={onStepperSave}
    onClose={(isCancel) => {
      if (isCancel) onCancelOrder();
      else setShowStepper(false);
    }}
  />
)}
    </div>
  );
}
