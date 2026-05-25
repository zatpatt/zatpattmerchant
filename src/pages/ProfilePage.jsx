// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getMerchantProfile,
  addMerchantDetails,
  editWorkingHours
} from "../services/profileApi";


/**
 * ProfilePage.jsx (updated)
 *
 * Changes applied:
 * - Reads initial account details from signup storage: "merchantAccount" (preferred)
 *   falls back to older "merchant_profile" or "merchantSignupData".
 * - Registered phone number is read-only (comes from signup/login).
 * - Merchant ID removed completely.
 * - Online/Offline status is stored in "merchantOnlineStatus" in localStorage and kept in sync
 *   so Dashboard and Profile read the same value.
 * - Payment methods trimmed: only COD visible and enforced (cannot be turned off).
 * - All other fields save to "merchant_profile" for backward compatibility.
 * - Saves live to localStorage and listens to external changes (storage event).
 *
 * Paste-ready. Replace PageHeader import if your project uses a different header component.
 */

const PROFILE_KEY = "merchant_profile";
const ACCOUNT_KEY = "merchantAccount"; // expected signup storage (option 1)
const LOGIN_NUMBER_KEY = "merchantLoginNumber";
const ONLINE_STATUS_KEY = "merchantOnlineStatus";

function maskAccount(acc = "") {
  if (!acc) return "";
  const last4 = acc.slice(-4);
  return acc.length > 4 ? `**** **** **** ${last4}` : acc;
}

export default function ProfilePage() {
  const navigate = useNavigate();

  // load initial stored account/profile
  const loadInitialProfile = () => {
    try {
      // Preferred: merchantAccount from signup (option 1)
      const acct = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null");
      const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");

      // fallback keys some projects used previously
      const signupFallback = JSON.parse(localStorage.getItem("merchantSignupData") || "null");
      const profileFrom = acct || stored || signupFallback || {};

      // phone from login (guaranteed source)
      const loginNumber = localStorage.getItem(LOGIN_NUMBER_KEY) || profileFrom.contact || profileFrom.phone || "";

      // normalize the returned object with safe defaults
      return {
        storeName: profileFrom.storeName || profileFrom.store || "",
        address: profileFrom.address || "",
        hours: profileFrom.hours || "09:00 - 21:00",
        contact: loginNumber,
        email: profileFrom.email || "",
        description: profileFrom.description || "",
        logo: profileFrom.logo || "",
        ownerName: profileFrom.ownerName || "",
        kycStatus: profileFrom.kycStatus || "Pending",
        gst: profileFrom.gst || "",
        online: (localStorage.getItem(ONLINE_STATUS_KEY) || (profileFrom.online === false ? "false" : "true")) === "true",
        deliveryRadius: profileFrom.deliveryRadius ?? 3,
        etaMins: profileFrom.etaMins ?? 30,
        minOrder: profileFrom.minOrder ?? 50,
        paymentMethods: {
          cod: true, // enforce COD only
        },
        performance: profileFrom.performance || {
          rating: 0,
          weeklySales: [0, 0, 0, 0, 0, 0, 0],
          completed: 0,
          cancellations: 0,
        },
        payout: profileFrom.payout || { bankName: "", account: "", upi: "", verified: false },
        documents: profileFrom.documents || {},
      };
    } catch (e) {
      return {
        storeName: "",
        address: "",
        hours: "09:00 - 21:00",
        contact: localStorage.getItem(LOGIN_NUMBER_KEY) || "",
        email: "",
        description: "",
        logo: "",
        ownerName: "",
        kycStatus: "Pending",
        gst: "",
        online: true,
        deliveryRadius: 3,
        etaMins: 30,
        minOrder: 50,
        paymentMethods: { cod: true },
        performance: { rating: 0, weeklySales: [0, 0, 0, 0, 0, 0, 0], completed: 0, cancellations: 0 },
        payout: { bankName: "", account: "", upi: "", verified: false },
        documents: {},
      };
    }
  };

const [isProfileExists, setIsProfileExists] = useState(false);

const fetchProfileFromAPI = async () => {
  try {
    setLoading(true);

    const res = await getMerchantProfile({
      user: USER_ID,
    });

    if (res?.status && res?.data) {
      const data = res.data;

      setProfile((prev) => ({
        ...prev,

        storeName: data.full_name || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",

        contact: data.mobile || "",
        email: data.email || "",

        ownerName: data.owner_name || "",

        first_name: data.first_name || "",
        last_name: data.last_name || "",
        gender: data.gender || "",
        dob: data.dob || "",
        merchant_type: data.merchant_type || "",

        commission_type: data.commission_type || "",
        food: data.food || "",
        longitude: data.longitude || "",
        latitude: data.latitude || "",

        aadhaar_number: data.aadhaar_number || "",

        profile_photo: data.profile_photo || "",

        deliveryRadius: data.servicable_radius_km || 3,
        etaMins: data.estimated_delivery_time || 30,
        minOrder: data.minimum_order_amount || 50,

        payout: {
          bankName: data.bank_name || "",
          account: data.account_number || "",
          upi: data.upi_id || "",
          verified: true,
        },
        gst: data.gst_number || "",
        fssai: data.fssai_number || "",
        pan: data.pan_number || "",

        logo: data.logo || "",

        performance: {
          ...prev.performance,
          rating: data.avg_rating || 0,
          completed: data.completed_orders || 0,
          cancellations: data.cancelled_orders || 0,
        },

       documents: {
        gst: data.gst_certificate || "",
        fssai: data.fssai_certificate || "",
        pan: data.pan_card || "",
        license: data.business_certificate || "",
        aadhaar: data.aadhaar_card || "",
      },
      }));
    }
  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
  }
};

const USER_ID = 88;
const [saving, setSaving] = useState(false);
const [loading, setLoading] = useState(true);
const [profile, setProfile] = useState(() => loadInitialProfile());



useEffect(() => {
  fetchProfileFromAPI();
}, []);

  // keep local state onlineStatus for smooth toggling and sync with localStorage
  const [online, setOnline] = useState(profile.online);

  // compute completion score
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

  // write profile changes to storage (and mirror merchantAccount for signup continuity)
 useEffect(() => {
  try {
    if (!profile.storeName && !profile.contact) return;

    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

    localStorage.setItem(
      ACCOUNT_KEY,
      JSON.stringify({
        storeName: profile.storeName,
        email: profile.email,
        phone: profile.contact,
      })
    );
  } catch (e) {}
}, [profile]);

  // sync online status to localStorage and keep profile.online in sync
  useEffect(() => {
    try {
      localStorage.setItem(ONLINE_STATUS_KEY, online ? "true" : "false");
    } catch {}
    setProfile((p) => ({ ...p, online }));
  }, [online]);

  // listen to storage events so dashboard/profile across tabs stay in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key) return;
      if (e.key === ONLINE_STATUS_KEY) {
        setOnline(e.newValue === "true");
      }
      if (e.key === PROFILE_KEY || e.key === ACCOUNT_KEY || e.key === LOGIN_NUMBER_KEY) {
        setProfile(loadInitialProfile());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // Save image/data-url
      if (docKey === "logo") {
        update("logo", file);
      } else {
        update(`documents.${docKey}`, file);
      }

      // auto-verify demo KYC if all docs present
      setTimeout(() => {
        const docs = {
          license: profile.documents?.license || (docKey === "license" && reader.result),
          gst: profile.documents?.gst || (docKey === "gst" && reader.result),
          idProof: profile.documents?.idProof || (docKey === "idProof" && reader.result),
        };
        if (docs.license && docs.gst && docs.idProof) {
          update("kycStatus", "Verified");
        }
      }, 200);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
  if (!profile.email) return alert("Email required"), false;
  if (!profile.address) return alert("Address required"), false;
  if (!profile.city) return alert("City required"), false;
  if (!profile.state) return alert("State required"), false;
  if (!profile.pincode) return alert("Pincode required"), false;
  if (!profile.merchant_type) return alert("Merchant Type required"), false;
  // if (!profile.ownerName) return alert("Owner Name required"), false;
  if (!profile.gst) return alert("GST Number required"), false;
  if (!profile.fssai) return alert("FSSAI Number required"), false;
  if (!profile.pan) return alert("PAN Number required"), false;
  if (!profile.first_name) return alert("First Name required"), false;
  if (!profile.last_name) return alert("Last Name required"), false;
  if (!profile.gender) return alert("Gender required"), false;
  if (!profile.dob) return alert("DOB required"), false;
  if (!profile.profile_photo) return alert("Profile Photo required"), false;

  if (!profile.payout.bankName) return alert("Bank Name required"), false;
  if (!profile.payout.account) return alert("Account Number required"), false;
  if (!profile.payout.upi) return alert("UPI ID required"), false;

if (!profile.documents.license)
 return alert("Business Certificate required"), false;

if (!profile.documents.aadhaar)
 return alert("Aadhaar Card required"), false;
  if (!profile?.documents?.gst)
    return alert("GST Certificate required"), false;

  if (!profile?.documents?.fssai)
    return alert("FSSAI Certificate required"), false;

  if (!profile?.documents?.pan)
    return alert("PAN Card required"), false;

  return true;
};

const handleSave = async () => {
  try {
    if (!validateForm()) return;

    setSaving(true);

 const payload = {
  user: USER_ID,

  address: profile.address,
  city: profile.city,
  state: profile.state,
  pincode: profile.pincode,
  merchant_type: profile.merchant_type,

  owner_name: `${profile.first_name} ${profile.last_name}`,
  first_name: profile.first_name,
  last_name: profile.last_name,
  email: profile.email,
  gender: profile.gender,
  dob: profile.dob,

  gst_number: profile.gst,
  fssai_number: profile.fssai,
  pan_number: profile.pan,
  aadhaar_number: profile.aadhaar_number,

  commission_type: profile.commission_type,
  food: profile.food,
  longitude: profile.longitude,
  latitude: profile.latitude,
  servicable_radius_km: profile.deliveryRadius,

  bank_name: profile.payout.bankName,
  account_number: profile.payout.account,
  upi_id: profile.payout.upi,

  estimated_delivery_time: profile.etaMins,
  minimum_order_amount: profile.minOrder,

  profile_photo: profile.profile_photo,
  logo: profile.logo,

  gst_certificate: profile.documents.gst,
  fssai_certificate: profile.documents.fssai,
  pan_card: profile.documents.pan,
  business_certificate: profile.documents.license,
  aadhaar_card: profile.documents.aadhaar,
};

    const res = await addMerchantDetails(payload);

    if (res?.status) {
      alert("Saved Successfully");
      fetchProfileFromAPI();
    } else {
      alert("Save Failed");
    }
  } catch (error) {
    console.log(error);
  } finally {
    setSaving(false);
  }
};


//     export const editMerchantProfile = async (payload) => {
//   const formData = new FormData();

//   const appendIfExists = (key, value) => {
//     if (value !== undefined && value !== null) {
//       formData.append(key, value);
//     }
//   };

//   appendIfExists("user", payload.user);
//   appendIfExists("full_name", payload.full_name);
//   appendIfExists("address", payload.address);
//   appendIfExists("mobile", payload.mobile);
//   appendIfExists("email", payload.email);

//   appendIfExists("gst_number", payload.gst_number);
//   appendIfExists("fssai_number", payload.fssai_number);
//   appendIfExists("pan_number", payload.pan_number);

//   appendIfExists("servicable_radius_km", payload.servicable_radius_km);

//   appendIfExists("account_number", payload.account_number);
//   appendIfExists("owner_name", payload.owner_name);
//   appendIfExists("upi_id", payload.upi_id);
//   appendIfExists("bank_name", payload.bank_name);

//   appendIfExists("city", payload.city);
//   appendIfExists("state", payload.state);
//   appendIfExists("pincode", payload.pincode);

//   // ✅ ONLY append file if it's actually a FILE
//   if (payload.logo instanceof File) {
//     formData.append("logo", payload.logo);
//   }

//   const res = await api.post(
//     "/api/v1/common/orders/edit-profile-merchant/",
//     formData,
//     {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     }
//   );

//   return res.data;
// };
  
const handleSaveWorkingHours = async () => {
  try {
    const [opening, closing] = profile.hours.split(" - ");

    const payload = {
      user: USER_ID,
      working_hrs: [
        {
          day: 1,
          opening_time: opening + ":00",
          closing_time: closing + ":00",
        },
      ],
    };

    const res = await editWorkingHours(payload);

    if (res?.status) {
      alert("Hours Updated");
    }
  } catch (error) {
    console.log(error);
  }
};


  const handleBankVerify = () => {
    update("payout.verified", true);
    alert("Bank details verified (demo)");
  };

  const weeklyChart = (() => {
    const arr = (profile?.performance?.weeklySales) || [0,0,0,0,0,0,0];
    const max = Math.max(...arr, 1);
    return arr.map((v, i) => ({
      label: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i] || `D${i+1}`,
      pct: Math.round((v / max) * 100),
    }));
  })();

 const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user_id");

  window.location.href = "/";
};

  // Prevent editing of phone (from signup/login). But allow storeName/email editing as requested.
  // Payment methods: enforce COD only
  // Merchant ID removed

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
                  <img
                  src={
                    profile.logo instanceof File
                      ? URL.createObjectURL(profile.logo)
                      : profile.logo
                  }
                  alt="logo"
                  className="w-full h-full object-cover"
                />
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
              {/* storeName editable (coming from signup but allowed to edit here) */}
              <input value={profile.storeName} onChange={(e)=>update("storeName", e.target.value)} placeholder="Store name" className="mt-1 p-2 border rounded-xl" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Store Address</span>
              <input value={profile.address} onChange={(e)=>update("address", e.target.value)} placeholder="Full address" className="mt-1 p-2 border rounded-xl" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">City</span>
              <input
                value={profile.city || ""}
                onChange={(e)=>
                update(
                  "city",
                  e.target.value.replace(/[^A-Za-z ]/g, "")
                )
              }
                placeholder="Enter city"
                className="mt-1 p-2 border rounded-xl"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">State</span>
              <input
                value={profile.state || ""}
                onChange={(e)=>
                update(
                  "state",
                  e.target.value.replace(/[^A-Za-z ]/g, "")
                )
              }
                placeholder="Enter state"
                className="mt-1 p-2 border rounded-xl"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Pincode</span>
              <input
                value={profile.pincode || ""}
                onChange={(e)=>
                update(
                  "pincode",
                  e.target.value.replace(/\D/g, "").slice(0,6)
                )
              }
                placeholder="Enter pincode"
                className="mt-1 p-2 border rounded-xl"
              />
            </label>

           <label className="flex flex-col">
            <span className="text-sm text-gray-600">Merchant Type</span>

            <input
              value={profile.merchant_type || ""}
              onChange={(e)=>
                update(
                  "merchant_type",
                  e.target.value.replace(/[^A-Za-z ]/g,"")
                )
              }
              placeholder="Enter merchant type"
              className="mt-1 p-2 border rounded-xl"
            />
          </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Operating Hours</span>
              <input value={profile.hours} onChange={(e)=>update("hours", e.target.value)} placeholder="09:00 - 21:00" className="mt-1 p-2 border rounded-xl" />
              <button
              type="button"
              onClick={handleSaveWorkingHours}
              className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-xl"
            >
              Save Hours
            </button>
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Contact Number (read-only)</span>
              {/* contact is read-only */}
              <input value={profile.contact} readOnly className="mt-1 p-2 border rounded-xl bg-gray-50" />
            </label>

            <label className="flex flex-col md:col-span-2">
              <span className="text-sm text-gray-600">Email Address</span>
              {/* email editable (comes from signup) */}
              <input value={profile.email} onChange={(e)=>update("email", e.target.value)} placeholder="store@example.com" className="mt-1 p-2 border rounded-xl" />
            </label>

            <label className="flex flex-col md:col-span-2">
              <span className="text-sm text-gray-600">Store Description</span>
              <textarea value={profile.description} onChange={(e)=>update("description", e.target.value)} placeholder="Short description for customers" className="mt-1 p-2 border rounded-xl" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Store Logo / Banner</span>
              <input type="file" accept="image/*"onChange={(e)=> {
                const file = e.target.files?.[0];
                if (!file) return;

                update("logo", file); // ✅ ONLY THIS
              }} className="mt-1" />
            </label>
          </div>
        </section>

{/* 2. Owner / Account Details */}
<section className="bg-white rounded-2xl p-4 shadow space-y-3">
  <h3 className="font-semibold text-lg">👤 Owner / Account Details</h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    {/* First Name */}
    <label className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">First Name</span>
      <input
        value={profile.first_name || ""}
        onChange={(e) =>
          update(
            "first_name",
            e.target.value.replace(/[^A-Za-z ]/g, "")
          )
        }
        placeholder="Enter first name"
        className="p-2 border rounded-xl"
      />
    </label>

    {/* Last Name */}
    <label className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">Last Name</span>
      <input
        value={profile.last_name || ""}
        onChange={(e) =>
          update(
            "last_name",
            e.target.value.replace(/[^A-Za-z ]/g, "")
          )
        }
        placeholder="Enter last name"
        className="p-2 border rounded-xl"
      />
    </label>

    {/* Gender */}
    <label className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">Gender</span>
      <select
        value={profile.gender || ""}
        onChange={(e) => update("gender", e.target.value)}
        className="p-2 border rounded-xl"
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
    </label>

    {/* DOB */}
    <label className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">Date of Birth</span>
      <input
        type="date"
        value={profile.dob || ""}
        onChange={(e) => update("dob", e.target.value)}
        className="p-2 border rounded-xl"
      />
    </label>

    {/* Profile Photo */}
    <label className="flex flex-col md:col-span-2">
      <span className="text-sm text-gray-600 mb-1">Profile Photo</span>

      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          update("profile_photo", e.target.files?.[0])
        }
        className="p-2 border rounded-xl"
      />

      {profile.profile_photo && (
        <img
          src={
            profile.profile_photo instanceof File
              ? URL.createObjectURL(profile.profile_photo)
              : profile.profile_photo
          }
          alt="Profile"
          className="w-24 h-24 mt-3 rounded-xl object-cover border"
        />
      )}
    </label>

    {/* Registered Phone */}
    <label className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">
        Registered Phone
      </span>

      <input
        value={profile.contact}
        readOnly
        className="p-2 border rounded-xl bg-gray-100"
      />
    </label>

    {/* GST */}
    <label className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">
        GST Number
      </span>

      <input
        value={profile.gst || ""}
        onChange={(e) =>
          update("gst", e.target.value.toUpperCase())
        }
        placeholder="Enter GST Number"
        className="p-2 border rounded-xl"
      />
    </label>

    {/* FSSAI */}
    <label className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">
        FSSAI Number
      </span>

      <input
        value={profile.fssai || ""}
        onChange={(e) =>
          update("fssai", e.target.value.toUpperCase())
        }
        placeholder="Enter FSSAI Number"
        className="p-2 border rounded-xl"
      />
    </label>

    {/* PAN */}
    <label className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">
        PAN Number
      </span>

      <input
        value={profile.pan || ""}
        onChange={(e) =>
          update("pan", e.target.value.toUpperCase())
        }
        placeholder="Enter PAN Number"
        className="p-2 border rounded-xl"
      />
    </label>

{/* Aadhaar Number */}
<label className="flex flex-col">
  <span className="text-sm text-gray-600 mb-1">
    Aadhaar Number
  </span>

  <input
    value={profile.aadhaar_number || ""}
    onChange={(e) =>
      update(
        "aadhaar_number",
        e.target.value.replace(/\D/g, "").slice(0,12)
      )
    }
    placeholder="Enter Aadhaar Number"
    className="p-2 border rounded-xl"
  />
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
              <button
                onClick={() => setOnline((s) => !s)}
                className={`w-16 h-8 flex items-center rounded-full p-1 ${online ? "bg-orange-400" : "bg-gray-300"}`}
                title="Toggle online/offline"
              >
                <div className={`bg-white w-6 h-6 rounded-full transform ${online ? "translate-x-8" : "translate-x-0"}`} />
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

              {/* Commission Type */}
              <label className="flex flex-col">
                <span className="text-sm text-gray-600">
                  Commission Type
                </span>

                <input
                  value={profile.commission_type || ""}
                  onChange={(e)=>
                    update("commission_type", e.target.value)
                  }
                  placeholder="Enter commission type"
                  className="mt-1 p-2 border rounded-xl"
                />
              </label>

              {/* Food */}
              <label className="flex flex-col">
                <span className="text-sm text-gray-600">
                  Food
                </span>

                <input
                  value={profile.food || ""}
                  onChange={(e)=>
                    update("food", e.target.value)
                  }
                  placeholder="Veg / Non Veg / Both"
                  className="mt-1 p-2 border rounded-xl"
                />
              </label>

              {/* Latitude */}
              <label className="flex flex-col">
                <span className="text-sm text-gray-600">
                  Latitude
                </span>

                <input
                  value={profile.latitude || ""}
                  onChange={(e)=>
                    update(
                      "latitude",
                      e.target.value.replace(/[^0-9.-]/g,"")
                    )
                  }
                  placeholder="Enter latitude"
                  className="mt-1 p-2 border rounded-xl"
                />
              </label>

              {/* Longitude */}
              <label className="flex flex-col">
                <span className="text-sm text-gray-600">
                  Longitude
                </span>

                <input
                  value={profile.longitude || ""}
                  onChange={(e)=>
                    update(
                      "longitude",
                      e.target.value.replace(/[^0-9.-]/g,"")
                    )
                  }
                  placeholder="Enter longitude"
                  className="mt-1 p-2 border rounded-xl"
                />
              </label>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={true} readOnly />
                <span className="text-sm">Cash on Delivery (always available)</span>
              </div>

              <div className="text-sm text-gray-500">
                Card / POS and UPI are not available currently.
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
              <input value={profile?.payout?.account} onChange={(e)=>
              update(
                "payout.account",
                e.target.value.replace(/\D/g,"")
              )
              } className="mt-1 p-2 border rounded-xl" />
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
              {profile?.documents?.license && <img
              src={
                profile?.documents?.license instanceof File
                  ? URL.createObjectURL(profile.documents.license)
                  : profile.documents.license
              } alt="lic" className="mt-2 w-full h-24 object-cover rounded" />}
            </div>
            <div className="p-3 border rounded-xl">
              <div className="text-sm text-gray-600">GST Certificate</div>
              <input type="file" accept="image/*,.pdf" onChange={(e)=>onFileChange(e, "gst")} className="mt-2" />
              {profile?.documents?.gst && <img
              src={
                profile?.documents?.gst instanceof File
                  ? URL.createObjectURL(profile.documents.gst)
                  : profile.documents.gst
              } alt="gst" className="mt-2 w-full h-24 object-cover rounded" />}
            </div>
            <div className="p-3 border rounded-xl">
             <div className="text-sm text-gray-600">PAN Card</div>
              <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e)=>onFileChange(e, "pan")}
              className="mt-2"
              />
              {profile?.documents?.pan && <img
              src={
                profile?.documents?.pan instanceof File
                  ? URL.createObjectURL(profile.documents.pan)
                  : profile.documents.pan
              } alt="id" className="mt-2 w-full h-24 object-cover rounded" />}
            </div>
            <div className="p-3 border rounded-xl">
  <div className="text-sm text-gray-600">
    FSSAI Certificate
  </div>

  <input
    type="file"
    accept="image/*,.pdf"
    onChange={(e)=>onFileChange(e,"fssai")}
    className="mt-2"
  />

  {profile?.documents?.fssai && (
    <img
      src={
        profile.documents.fssai instanceof File
          ? URL.createObjectURL(profile.documents.fssai)
          : profile.documents.fssai
      }
      alt="fssai"
      className="mt-2 w-full h-24 object-cover rounded"
    />
  )}
</div>
{/* Aadhaar Card */}
<div className="p-3 border rounded-xl">
  <div className="text-sm text-gray-600">
    Aadhaar Card
  </div>

  <input
    type="file"
    accept="image/*,.pdf"
    onChange={(e)=>onFileChange(e,"aadhaar")}
    className="mt-2"
  />

  {profile?.documents?.aadhaar && (
    <img
      src={
        profile.documents.aadhaar instanceof File
          ? URL.createObjectURL(profile.documents.aadhaar)
          : profile.documents.aadhaar
      }
      alt="aadhaar"
      className="mt-2 w-full h-24 object-cover rounded"
    />
  )}
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
             <button
                onClick={handleSave}
                disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-xl">{saving ? "Saving..." : "Save Details"}
              </button>
              <button onClick={logout} className="px-4 py-2 rounded-xl border text-red-500">Logout</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
