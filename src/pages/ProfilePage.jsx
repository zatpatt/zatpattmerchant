// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import { User, Phone, CreditCard, FileText, Mail, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Merchant Profile Page
 * - Saves data to localStorage under key: merchant_profile
 * - Saves documents under merchant_profile.documents as data-urls (for demo)
 */

const STORAGE_KEY = "merchant_profile";

function maskAccount(acc = "") {
  if (!acc) return "";
  const last4 = acc.slice(-4);
  return acc.length > 4 ? `**** **** **** ${last4}` : acc;
}

function smallBarChart(data = []) {
  // returns max and scaled heights (used in markup)
  const max = Math.max(...data.map((d) => d.value), 1);
  return data.map((d) => ({ ...d, pct: Math.round((d.value / max) * 100) }));
}

export default function ProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(() => {
  try {
    const storedProfile = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      storeName: "",
      address: "",
      hours: "09:00 - 21:00",
      contact: "",
      email: "",
      description: "",
      logo: "",
      ownerName: "",
      merchantId: `M-${Math.floor(1000 + Math.random() * 9000)}`,
      kycStatus: "Pending",
      gst: "",
      online: true,
      deliveryRadius: 3,
      etaMins: 30,
      minOrder: 50,
      paymentMethods: {
        cod: true,
        card: true,
        upi: true,
      },
      performance: {
        rating: 4.5,
        weeklySales: [1200, 1500, 800, 1700, 2200, 3000, 2500],
        completed: 1240,
        cancellations: 12,
      },
      payout: {
        bankName: "",
        account: "",
        upi: "",
        verified: false,
      },
      documents: {
        license: "",
        gst: "",
        idProof: "",
      },
    };

    // get the login number
    const loginNumber = localStorage.getItem("merchantLoginNumber");
    return {
      ...storedProfile,
      contact: storedProfile.contact || loginNumber || "",
    };
  } catch (e) {
    return {};
  }
});

  // derived
  const completionScore = (() => {
    const required = [
      "storeName",
      "address",
      "contact",
      "email",
      "ownerName",
      "payout.bankName",
      "payout.account",
    ];
    let filled = 0;
    required.forEach((key) => {
      if (key.includes(".")) {
        const [a, b] = key.split(".");
        if (profile[a] && profile[a][b]) filled++;
      } else {
        if (profile[key]) filled++;
      }
    });
    return Math.round((filled / required.length) * 100);
  })();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  // small helpers
  const update = (path, value) => {
    setProfile((p) => {
      const next = { ...p };
      if (path.includes(".")) {
        const [a, b] = path.split(".");
        next[a] = { ...(next[a] || {}), [b]: value };
      } else {
        next[path] = value;
      }
      return next;
    });
  };

  const onFileChange = async (e, docKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update(`documents.${docKey}`, reader.result);
      // if logo uploading
      if (docKey === "logo") {
        update("logo", reader.result);
      }
      // auto set KYC if all docs present (demo)
      setTimeout(() => {
        const docs = {
          license: profile.documents.license || (docKey === "license" && reader.result),
          gst: profile.documents.gst || (docKey === "gst" && reader.result),
          idProof: profile.documents.idProof || (docKey === "idProof" && reader.result),
        };
        if (docs.license && docs.gst && docs.idProof) {
          update("kycStatus", "Verified");
        }
      }, 200);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    alert("Profile saved ✓");
  };

  const handleBankVerify = () => {
    // simulate verification
    update("payout.verified", true);
    alert("Bank details verified (demo)");
  };

const weeklyChart = smallBarChart(
  ((profile?.performance?.weeklySales) || []).map((v, i) => ({
    label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i] || `D${i + 1}`,
    value: v
  }))
);

  const logout = () => {
    // keep merchant_profile maybe, but clear auth keys
    localStorage.removeItem("merchantAuth");
    // redirect to login
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <PageHeader title="Profile" />

      <div className="p-6 max-w-5xl mx-auto w-full space-y-6 pb-40">
        {/* Greeting + preview card */}
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1 bg-white rounded-2xl p-4 shadow space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-lg bg-orange-50 flex items-center justify-center overflow-hidden">
                {profile.logo ? (
                  <img src={profile.logo} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-orange-500 font-bold">LOGO</div>
                )}
              </div>
              <div>
                <div className="text-sm text-gray-500">Store Preview</div>
                <div className="text-xl font-semibold">{profile.storeName || "Your Store"}</div>
                <div className="text-sm text-gray-600">{profile.description || "Store description goes here."}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="text-sm"><strong>Address</strong><div className="text-gray-600">{profile.address || "Not set"}</div></div>
              <div className="text-sm"><strong>Contact</strong><div className="text-gray-600">{profile.contact || "Not set"}</div></div>
              <div className="text-sm"><strong>Hours</strong><div className="text-gray-600">{profile.hours}</div></div>
              <div className="text-sm"><strong>KYC Status</strong><div className="text-gray-600">{profile.kycStatus}</div></div>
            </div>
          </div>

          <div className="w-full md:w-80 bg-white rounded-2xl p-4 shadow">
            <div className="text-sm text-gray-500">Profile Completion</div>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-4">
              <div className="h-4 rounded-full bg-gradient-to-r from-orange-400 to-amber-400" style={{ width: `${completionScore}%` }} />
            </div>
            <div className="text-xs text-gray-500 mt-2">{completionScore}% complete</div>

            <div className="mt-4">
              <div className="text-sm text-gray-500">Average Rating</div>
              <div className="text-2xl font-bold">{profile?.performance?.rating || 0} / 5</div>
              <div className="text-sm text-gray-500 mt-2">Orders completed: <strong>{profile?.performance?.completed || 0}</strong></div>
              <div className="text-sm text-gray-500">Cancellations: <strong>{profile?.performance?.cancellations || 0}</strong></div>
            </div>
          </div>
        </div>

        {/* 1. Store Information */}
        <section className="bg-white rounded-2xl p-4 shadow space-y-3">
          <h3 className="font-semibold text-lg">🏪 Store Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Store Name</span>
              <input value={profile.storeName} onChange={(e)=>update("storeName", e.target.value)} placeholder="Store name" className="mt-1 p-2 border rounded-xl" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Store Address</span>
              <input value={profile.address} onChange={(e)=>update("address", e.target.value)} placeholder="Full address" className="mt-1 p-2 border rounded-xl" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Operating Hours</span>
              <input value={profile.hours} onChange={(e)=>update("hours", e.target.value)} placeholder="09:00 - 21:00" className="mt-1 p-2 border rounded-xl" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Contact Number</span>
              <input value={profile.contact} onChange={(e)=>update("contact", e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="10-digit number" className="mt-1 p-2 border rounded-xl" />
            </label>

            <label className="flex flex-col md:col-span-2">
              <span className="text-sm text-gray-600">Email Address</span>
              <input value={profile.email} onChange={(e)=>update("email", e.target.value)} placeholder="store@example.com" className="mt-1 p-2 border rounded-xl" />
            </label>

            <label className="flex flex-col md:col-span-2">
              <span className="text-sm text-gray-600">Store Description</span>
              <textarea value={profile.description} onChange={(e)=>update("description", e.target.value)} placeholder="Short description for customers" className="mt-1 p-2 border rounded-xl" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Store Logo / Banner</span>
              <input type="file" accept="image/*" onChange={(e)=> {
                const file = e.target.files?.[0]; if(!file) return;
                const r = new FileReader(); r.onload = ()=> update("logo", r.result); r.readAsDataURL(file);
              }} className="mt-1" />
            </label>
          </div>
        </section>

        {/* 2. Owner / Account Details */}
        <section className="bg-white rounded-2xl p-4 shadow space-y-3">
          <h3 className="font-semibold text-lg">👤 Owner / Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Owner Name</span>
              <input value={profile.ownerName} onChange={(e)=>update("ownerName", e.target.value)} className="mt-1 p-2 border rounded-xl" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Registered Phone</span>
              <input value={profile.contact} onChange={(e)=>update("contact", e.target.value.replace(/\D/g,"").slice(0,10))} className="mt-1 p-2 border rounded-xl" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Merchant ID</span>
              <input value={profile.merchantId} readOnly className="mt-1 p-2 border rounded-xl bg-gray-50" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">GST / Business PAN (optional)</span>
              <input value={profile.gst} onChange={(e)=>update("gst", e.target.value)} className="mt-1 p-2 border rounded-xl" />
            </label>
          </div>
        </section>

        {/* 3. Business Settings */}
        <section className="bg-white rounded-2xl p-4 shadow space-y-3">
          <h3 className="font-semibold text-lg">⚙️ Business Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Online / Offline</div>
                <div className="text-xs text-gray-500">Accept orders</div>
              </div>
              <button onClick={()=>update("online", !profile.online)} className={`w-16 h-8 flex items-center rounded-full p-1 ${profile.online ? "bg-orange-400" : "bg-gray-300"}`}>
                <div className={`bg-white w-6 h-6 rounded-full transform ${profile.online ? "translate-x-8" : "translate-x-0"}`} />
              </button>
            </div>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Delivery Radius (km)</span>
              <input type="number" value={profile.deliveryRadius} onChange={(e)=>update("deliveryRadius", Number(e.target.value))} className="mt-1 p-2 border rounded-xl" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Estimated Delivery Time (mins)</span>
              <input type="number" value={profile.etaMins} onChange={(e)=>update("etaMins", Number(e.target.value))} className="mt-1 p-2 border rounded-xl" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Minimum Order Amount (₹)</span>
              <input type="number" value={profile.minOrder} onChange={(e)=>update("minOrder", Number(e.target.value))} className="mt-1 p-2 border rounded-xl" />
            </label>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={profile?.paymentMethods?.cod} onChange={(e)=>update("paymentMethods", {...profile.paymentMethods, cod: e.target.checked})} />
                <span className="text-sm">Cash on Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={profile?.paymentMethods?.card} onChange={(e)=>update("paymentMethods", {...profile.paymentMethods, card: e.target.checked})} />
                <span className="text-sm">Card / POS</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={profile?.paymentMethods?.upi} onChange={(e)=>update("paymentMethods", {...profile.paymentMethods, upi: e.target.checked})} />
                <span className="text-sm">UPI</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Performance Metrics */}
        <section className="bg-white rounded-2xl p-4 shadow space-y-3">
          <h3 className="font-semibold text-lg">📈 Performance Metrics</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <div className="text-sm text-gray-600">Avg Rating</div>
              <div className="text-2xl font-bold">{profile?.performance?.rating || 0}</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <div className="text-sm text-gray-600">Orders Completed</div>
              <div className="text-2xl font-bold">{profile?.performance?.completed}</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <div className="text-sm text-gray-600">Cancellations</div>
              <div className="text-2xl font-bold">{profile?.performance?.cancellations}</div>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-sm text-gray-600 mb-2">Weekly Sales</div>
            <div className="flex items-end gap-2 h-28">
              {weeklyChart.map((d, idx)=> (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full rounded-t-md" style={{height: `${d.pct}%`, background: "linear-gradient(180deg,#fb923c,#f97316)"}} />
                  <div className="text-xs text-gray-600 mt-1">{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Payout & Banking Info */}
        <section className="bg-white rounded-2xl p-4 shadow space-y-3">
          <h3 className="font-semibold text-lg">💰 Payout & Banking Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Bank Name</span>
              <input value={profile?.payout?.bankName} onChange={(e)=>update("payout.bankName", e.target.value)} className="mt-1 p-2 border rounded-xl" />
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Account Number</span>
              <input value={profile?.payout?.account} onChange={(e)=>update("payout.account", e.target.value.replace(/\s/g,""))} className="mt-1 p-2 border rounded-xl" />
              <div className="text-xs text-gray-500 mt-1">Displayed masked: {maskAccount(profile?.payout?.account)}</div>
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">UPI ID</span>
              <input value={profile?.payout?.upi} onChange={(e)=>update("payout.upi", e.target.value)} className="mt-1 p-2 border rounded-xl" />
            </label>

            <div className="flex items-center gap-3">
              <button onClick={handleBankVerify} disabled={profile?.payout?.verified} className={`px-4 py-2 rounded-xl ${profile?.payout?.verified ? "bg-gray-300" : "bg-orange-500 text-white"}`}>
                {profile?.payout?.verified ? "Verified" : "Verify Bank"}
              </button>
              <button onClick={()=> { update("payout.verified", false); alert("Request for re-verification sent (demo)") }} className="px-3 py-2 rounded-xl border">Request Reverify</button>
            </div>
          </div>
        </section>

        {/* 6. Documents */}
        <section className="bg-white rounded-2xl p-4 shadow space-y-3">
          <h3 className="font-semibold text-lg">🪪 Documents (upload)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 border rounded-xl">
              <div className="text-sm text-gray-600">Business License</div>
              <input type="file" accept="image/*,.pdf" onChange={(e)=>onFileChange(e, "license")} className="mt-2" />
              {profile?.documents?.license && <img src={profile?.documents?.license} alt="lic" className="mt-2 w-full h-24 object-cover rounded" />}
            </div>
            <div className="p-3 border rounded-xl">
              <div className="text-sm text-gray-600">GST Certificate</div>
              <input type="file" accept="image/*,.pdf" onChange={(e)=>onFileChange(e, "gst")} className="mt-2" />
              {profile?.documents?.gst && <img src={profile?.documents?.gst} alt="gst" className="mt-2 w-full h-24 object-cover rounded" />}
            </div>
            <div className="p-3 border rounded-xl">
              <div className="text-sm text-gray-600">ID Proof (PAN / Aadhaar)</div>
              <input type="file" accept="image/*,.pdf" onChange={(e)=>onFileChange(e, "idProof")} className="mt-2" />
              {profile?.documents?.idProof && <img src={profile?.documents?.idProof} alt="id" className="mt-2 w-full h-24 object-cover rounded" />}
            </div>
          </div>
        </section>

        {/* 7. Support & Legal */}
        <section className="bg-white rounded-2xl p-4 shadow space-y-3">
          <h3 className="font-semibold text-lg">📞 Support & Legal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-gray-600">Help & Support</div>
              <div className="mt-2 flex gap-2">
                <button onClick={()=>alert("Opening chat (demo)")} className="px-3 py-2 rounded-xl bg-orange-500 text-white">Chat with support</button>
                <button onClick={()=> window.open("tel:+911234567890")} className="px-3 py-2 rounded-xl border">Call</button>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Legal</div>
              <div className="mt-2 flex gap-2">
                <button onClick={()=>alert("Open Terms (demo)")} className="px-3 py-2 rounded-xl border">Terms & Conditions</button>
                <button onClick={()=>alert("Open Privacy (demo)")} className="px-3 py-2 rounded-xl border">Privacy Policy</button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">Account actions</div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-xl">Save</button>
              <button onClick={logout} className="px-4 py-2 rounded-xl border text-red-500">Logout</button>
            </div>
          </div>
        </section>
      </div>

      </div>
  );
}

/* Small inline icons used so we don't strictly require new icon packages below.
   If you already have lucide-react installed, you can replace these with proper imports.
*/
function WalletIcon(){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="stroke-current"><path d="M3 7h15a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 10v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function StarIcon(){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="stroke-current"><path d="M12 17.3L5.6 20l1.1-6.4L2 9.5l6.5-1L12 2.5l3.5 6 6.5 1-4.7 4.1L18.4 20z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg> }
