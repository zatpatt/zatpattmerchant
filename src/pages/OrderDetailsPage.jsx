// src/pages/OrderDetailsPage.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { NotificationContext } from "../context/NotificationContext";

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
          <button onClick={onClose} className="flex-1 border py-2 rounded-xl">Cancel</button>
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
    const all = JSON.parse(localStorage.getItem("merchant_orders") || "[]");
    const found = all.find(o => String(o.id) === String(id));
    setOrder(found || null);
  }, [id]);

  // persist helper
  const saveOrder = (updated) => {
    const all = JSON.parse(localStorage.getItem("merchant_orders") || "[]");
    const next = all.map(o => (String(o.id) === String(updated.id) ? updated : o));
    localStorage.setItem("merchant_orders", JSON.stringify(next));
    setOrder(updated);
    try { window.dispatchEvent(new StorageEvent("storage", { key: "merchant_orders", newValue: JSON.stringify(next) })); } catch {}
  };

  // Slide-to-Accept handler (for New)
  const onAcceptSlide = () => {
    // open time stepper to choose minutes
    setStepperInitial(order.etaMins || 15);
    setShowStepper(true);
  };

  const onStepperSave = (mins) => {
    // set Preparing with chosen mins
    const updated = {
      ...order,
      status: "Preparing",
      etaMins: mins,
      accepted: true,
      timeline: [...(order.timeline || []), { when: new Date().toISOString(), status: "Preparing" }],
    };
    saveOrder(updated);
    addNotification?.(`Order ${order.id} accepted - ${mins} mins`);
    setShowStepper(false);
  };

  const onMarkPrepared = () => {
    const updated = {
      ...order,
      status: "Prepared",
      preparedAt: new Date().toISOString(),
      timeline: [...(order.timeline || []), { when: new Date().toISOString(), status: "Prepared" }],
    };
    saveOrder(updated);
    addNotification?.(`Order ${order.id} marked Prepared`);
  };

  if (!order) {
    return (
      <div className="p-6 text-center text-gray-600">
        Order not found — go back.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff6ed]">
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white p-4 flex items-center gap-4 shadow">
        <div onClick={() => navigate(-1)} className="bg-white rounded-full p-2 cursor-pointer"><ArrowLeft className="text-black" /></div>
        <div>
          <div className="text-sm opacity-80">Order Details</div>
          <div className="font-semibold text-lg">#{order.id}</div>
        </div>
      </div>

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold text-lg mb-2">Customer Details</h2>
          <p className="text-gray-700">{order.customer}</p>
          <p className="text-gray-700">{order.phone}</p>
          <p className="text-gray-600 mt-1">{order.address}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold text-lg mb-2">Items</h2>
          {order.items.map((i, idx) => (
            <div key={idx} className="flex justify-between text-gray-700 py-1">
              <span>{i.name}</span>
              <span>{i.qty} × ₹{i.price}</span>
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
          {/* If New -> slide to accept -> time stepper */}
          {order.status === "New" && (
            <>
              <div className="text-sm text-gray-600">Slide to Accept Order</div>
              <div ref={(el) => el && setWidth(el.clientWidth)}>
                <SlideConfirm label="Slide to Accept" onConfirm={onAcceptSlide} />
              </div>
            </>
          )}

          {/* Preparing -> Slide to Mark Prepared */}
          {order.status === "Preparing" && (
            <>
              <div className="text-sm text-gray-600">Preparing — ETA: {order.etaMins || "--"} mins</div>
              <div>
                <SlideConfirm label="Slide to mark Prepared" onConfirm={onMarkPrepared} />
              </div>
            </>
          )}

          {/* Prepared -> show done (no more actions) */}
          {order.status === "Prepared" && (
            <div className="text-center py-4">
              <div className="text-lg font-semibold text-orange-500">Prepared</div>
              <div className="text-sm text-gray-600 mt-1">Wait For Delivery Partner For Pickup</div>
            </div>
          )}

          {/* Call & Chat */}
          <button onClick={() => { const m = (order.phone || ""); if (m) window.location.href = `tel:${m}`; else alert("No phone"); }} className="w-full border py-3 rounded-xl flex justify-center gap-2"><Phone /> Call</button>
          <button onClick={() => alert("Chat coming soon")} className="w-full border py-3 rounded-xl flex justify-center gap-2"><MessageCircle /> Chat</button>
        </div>
      </div>

      {showStepper && <TimeStepper initial={stepperInitial} onSave={onStepperSave} onClose={() => setShowStepper(false)} />}
    </div>
  );
}
