// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import { ArrowLeft } from "lucide-react";
import {
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  getMerchantProfile,
  addMerchantDetails,
  editMerchantProfile,
  requestProfileEdit
} from "../services/profileApi";
import toast from "react-hot-toast";

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
// const ONLINE_STATUS_KEY = "merchantOnlineStatus";

function maskAccount(acc = "") {
  if (!acc) return "";
  const last4 = acc.slice(-4);
  return acc.length > 4 ? `**** **** **** ${last4}` : acc;
}

const getImageUrl = (value) => {
  if (!value) return "";

  if (value instanceof File) {
    return URL.createObjectURL(value);
  }

  if (typeof value !== "string") {
    return "";
  }

  if (
    value.startsWith("http") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  return `${import.meta.env.VITE_API_URL}${value}`;
};


export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [requestLoading, setRequestLoading] =
  useState(false);

  const handleRequestProfileEdit = async () => {

  if (requestLoading) return;

  try {

    setRequestLoading(true);

    const res =
      await requestProfileEdit();

    if (res?.status) {

      setEditRequested(true);

      toast.success(
        "Profile update request sent successfully"
      );

    } else {

      toast.error(
        res?.message ||
        "Failed to send request"
      );

    }

  } catch (error) {

    console.log(error);

    toast.error(
      "Unable to send request"
    );

  } finally {

    setRequestLoading(false);

  }
};

// const USER_ID =
//   localStorage.getItem("user_id");

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
        
        opening_time:
          profileFrom.opening_time || "09:00 AM",

        closing_time:
          profileFrom.closing_time || "09:00 PM",

        contact: loginNumber,
        email: profileFrom.email || "",
        merchant_discreption: profileFrom.merchant_discreption || "",
        logo: profileFrom.logo || "",
        ownerName: profileFrom.ownerName || "",
        kycStatus: profileFrom.kycStatus || "",
        gst: profileFrom.gst || "",
        // online: (localStorage.getItem(ONLINE_STATUS_KEY) || (profileFrom.online === false ? "false" : "true")) === "true",
        deliveryRadius: profileFrom.deliveryRadius ?? 3,
        // etaMins: profileFrom.etaMins ?? 30,
        minOrder: profileFrom.minOrder ?? 50,
        paymentMethods: {
          cod: true, // enforce COD only
        },
        // performance: profileFrom.performance || {
        //   rating: 0,
        //   weeklySales: [0, 0, 0, 0, 0, 0, 0],
        //   completed: 0,
        //   cancellations: 0,
        // },
        payout: profileFrom.payout || {
          bankName: "",
          account: "",
          ifsc: "",
          upi: "",
          // verified: false,
        },
        documents: profileFrom.documents || {},
      };
    } catch (e) {
      return {
        storeName: "",
        address: "",
        opening_time: "09:00 AM",
        closing_time: "09:00 PM",
        contact: localStorage.getItem(LOGIN_NUMBER_KEY) || "",
        email: "",
        description: "",
        logo: "",
        ownerName: "",
        kycStatus: "Pending",
        gst: "",
        online: true,
        deliveryRadius: 3,
        // etaMins: 30,
        minOrder: 50,
        paymentMethods: { cod: true },
        //performance: { rating: 0, weeklySales: [0, 0, 0, 0, 0, 0, 0], completed: 0, cancellations: 0 },
        payout: { bankName: "", account: "", upi: "" }, //verified: false 
        documents: {},
      };
    }
  };

const [isProfileExists, setIsProfileExists] = useState(false);

const [kycVerified, setKycVerified] =
  useState(true);

const fetchProfileFromAPI = async () => {

  if (!USER_ID) return;

  if (loading) return;

  try {

    setLoading(true);

    const res =
      await getMerchantProfile({
        user: USER_ID,
      });

    if (
      res?.status &&
      res?.data
    ) {

      
      const data =
        res.data;

     const profileExists =
      !!(
        data.owner_name ||
        data.address ||
        data.gst_number ||
        data.fssai_number
      );

      setCanEdit(
        data.can_edit || false
      );

      setEditRequested(
        data.edit_requested || false
      );

      setKycVerified(
        data.kyc_status === true
      );

    setIsProfileExists(
      profileExists
    );


      // ✅ SAVE REAL COMPLETION %
      localStorage.setItem(
        "profile_completion",
        String(
          data.profile_completion || 0
        )
      );

      setCompletionScore(
        data.profile_completion || 0
      );

      console.log("API DATA", data);
      console.log("GST", data.gst_certificate);
      console.log("PAN", data.pan_card);
      console.log("FSSAI", data.fssai_certificate);
      console.log("AADHAAR", data.aadhaar_card);
      console.log("LOGO", data.logo);

      setProfile((prev) => ({
        ...prev,

        storeName:
          data.first_name || "",

         opening_time:
            data.opening_time
              ? convertTo12Hour(data.opening_time)
              : "09:00 AM",

          closing_time:
            data.closing_time
              ? convertTo12Hour(data.closing_time)
              : "09:00 PM",

        address:
          data.address || prev.address,

        city:
          data.city || prev.city,

        area:
          data.area || prev.area,

        state:
          data.state || prev.state,

        pincode:
          data.pincode || prev.pincode,

        contact:
          data.mobile || "",

        email:
          data.email || "",

        ownerName: 
          data.owner_name || "",

        merchant_discreption:
          data.merchant_discreption || "",

        // ownerName:
        //   data.owner_name || "",

        // first_name:
        //   data.first_name || "",

        // last_name:
        //   data.last_name || "",

        // gender:
        //   data.gender || "",

        // dob:
        //   data.dob || "",

        commission_value:
          data.commission_value || "",

        food:
          data.food || "",

        latitude:
          prev.latitude ||
          data.latitude ||
          "",

        longitude:
          prev.longitude ||
          data.longitude ||
          "",

        aadhaar_number:
          data.aadhaar_number || "",

        // profile_photo:
        //   data.profile_photo || "",

        deliveryRadius:
          data.servicable_radius_km || "",

        // etaMins:
        //   data.estimated_delivery_time || 30,

        minOrder:
          data.minimum_order_amount || 50,

        payout: {
          bankName:
            data.bank_name || "",

          account:
            data.account_number || "",

          re_account_number:
            data.re_account_number || "",

          ifsc: 
          data.ifsc_code || "",

          upi:
            data.upi_id || "",

          // verified: true,
        },

        gst:
          data.gst_number || "",

        fssai:
          data.fssai_number || "",

        pan:
          data.pan_number || "",

        logo:
          data.logo || "",

        // performance: {
        //   ...prev.performance,

        //   rating:
        //     data.avg_rating || 0,

        //   completed:
        //     data.completed_orders || 0,

        //   cancellations:
        //     data.cancelled_orders || 0,
        // },

          kycStatus: data.kyc_status
    ? "Verified"
    : "Pending",

        documents: {
          gst:
            data.gst_certificate || "",

          fssai:
            data.fssai_certificate || "",

          pan:
            data.pan_card || "",

          // license:
          //   data.business_certificate || "",

          aadhaar:
            data.aadhaar_card || "",
        },
      }));
    }

  } catch (error) {

    
    setIsProfileExists(false);

    console.log(error);

  } finally {

    setLoading(false);

  }
};

const USER_ID =
  localStorage.getItem(
    "user_id"
  );

// 1. REMOVE HARDCODED USER_ID

// Find:

// const USER_ID = 88;

// REPLACE WITH:

// const USER_ID =
//   localStorage.getItem("user_id");

// const parts = time24.split(":");
// let hours = parseInt(parts[0]);
// const minutes = parts[1];

const isProfileLocked =
  isProfileExists &&
  !kycVerified;


const [canEdit, setCanEdit] =
  useState(false);

const [editRequested, setEditRequested] =
  useState(false);

  const disableRequestEdit =
  !kycVerified ||
  editRequested ||
  requestLoading;

const getButtonLabel = () => {

  if (!isProfileExists) {
    return "Save Details";
  }

   if (!kycVerified)
    return "KYC Pending";
  
  if (canEdit) {
    return "Save Edit";
  }

  if (editRequested) {
    return "Edit Request Sent";
  }

  return "Request Edit";
};


const handleMainButton = async () => {

  if (!isProfileExists) {
    await handleSave();
    return;
  }

  if (!kycVerified && !canEdit) {
    toast.error(
      "Your verification is pending"
    );
    return;
  }

  if (canEdit) {
    await handleSave();
    return;
  }

  if (!editRequested) {
    await handleRequestProfileEdit();
  }
};  


const REGEX = {
  MOBILE: /^[6-9][0-9]{9}$/,

  STORE_NAME:
  /^[A-Za-z0-9][A-Za-z0-9&.' -]{1,99}$/,

  EMAIL:
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  PINCODE:
    /^[1-9][0-9]{5}$/,

  PAN:
    /^[A-Z]{5}[0-9]{4}[A-Z]$/,

  GSTIN:
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,

  FSSAI:
  /^[0-9]{14}$/,

  UPI:
  /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z]{2,64}$/,

  ACCOUNT: 
  /^(?!0+$)[0-9]{9,18}$/,

  IFSC:
    /^[A-Z]{4}0[A-Z0-9]{6}$/,

  AADHAAR:
    /^[0-9]{12}$/,

  NAME: 
  /^[A-Za-z][A-Za-z .'-]{1,99}$/
};

const [confirmAccountNumber, setConfirmAccountNumber] =
  useState("");

const [saving, setSaving] = useState(false);
const [loading, setLoading] = useState(false);
const [profile, setProfile] = useState(() => loadInitialProfile());

useEffect(() => {

  if (!location.state) return;

  setProfile(prev => ({
    ...prev,

    latitude:
      location.state.latitude,

    longitude:
      location.state.longitude,

    address:
      location.state.location,

    area:
      location.state.area,

    city:
      location.state.city,
  }));

}, [location.state]);

// const [hoursLoading, setHoursLoading] =
//   useState(false);

// const [bankLoading, setBankLoading] =
//   useState(false);

// const [onlineLoading, setOnlineLoading] =
//   useState(false);

  const [previewUrls, setPreviewUrls] =
  useState({});

useEffect(() => {

  fetchProfileFromAPI();

}, []);

  // keep local state onlineStatus for smooth toggling and sync with localStorage
  // const [online, setOnline] = useState(profile.online);

  // compute completion score
  // const completionScore = (() => {
  //   const required = [
  //     "storeName",
  //     "address",
  //     "contact",
  //     "email",
  //     "ownerName",
  //     "payout.bankName",
  //     "payout.account",
  //   ];
  //   let filled = 0;
  //   required.forEach((key) => {
  //     if (key.includes(".")) {
  //       const [a, b] = key.split(".");
  //       if (profile[a] && profile[a][b]) filled++;
  //     } else {
  //       if (profile[key]) filled++;
  //     }
  //   });
  //   return Math.round((filled / required.length) * 100);
  // })();

  // write profile changes to storage (and mirror merchantAccount for signup continuity)
 useEffect(() => {

  const timeout = setTimeout(() => {

    try {

      if (
        !profile.storeName &&
        !profile.contact
      ) return;

      localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify(profile)
      );

      localStorage.setItem(
        ACCOUNT_KEY,
        JSON.stringify({
          storeName:
            profile.storeName,
          email:
            profile.email,
          phone:
            profile.contact,
        })
      );

    } catch (e) {}

  }, 400);

  return () =>
    clearTimeout(timeout);

}, [profile]);

  // sync online status to localStorage and keep profile.online in sync
  // useEffect(() => {
  //   try {
  //     localStorage.setItem(ONLINE_STATUS_KEY, online ? "true" : "false");
  //   } catch {}
  //   setProfile((p) => ({ ...p, online }));
  // }, [online]);

  // listen to storage events so dashboard/profile across tabs stay in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key) return;
      // if (e.key === ONLINE_STATUS_KEY) {
      //   setOnline(e.newValue === "true");
      // }
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
    
  const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
];

if (
  !allowedTypes.includes(file.type)
) {
  toast.error(
    "Only JPG, PNG, WEBP and PDF allowed"
  );
  return;
}

if (
  file.size > MAX_FILE_SIZE
) {
  toast.error(
    "File size must be below 5MB"
  );
  return;
}
    const reader = new FileReader();
    reader.onload = () => {
      // Save image/data-url
      if (docKey === "logo") {
        update("logo", file);
      } else {
        update(`documents.${docKey}`, file);
      }

      // auto-verify demo KYC if all docs present
      // setTimeout(() => {
      //   const docs = {
      //     license: profile.documents?.license || (docKey === "license" && reader.result),
      //     gst: profile.documents?.gst || (docKey === "gst" && reader.result),
      //     idProof: profile.documents?.idProof || (docKey === "idProof" && reader.result),
      //   };
      //   if (docs.license && docs.gst && docs.idProof) {
      //     update("kycStatus", "Verified");
      //   }
      // }, 200);
    };
    reader.readAsDataURL(file);
  };

  const getMissingFields = () => {
  const missing = [];

  if (!profile.storeName?.trim())
    missing.push("Store Name");

  if (!profile.email?.trim())
    missing.push("Email");

  if (!profile.address?.trim())
    missing.push("Address");

  if (!profile.city?.trim())
    missing.push("City");

  if (!profile.state?.trim())
    missing.push("State");

  if (!profile.pincode?.trim())
    missing.push("Pincode");

  if (!profile.ownerName?.trim())
    missing.push("Owner Name");

  if (!profile.gst?.trim())
    missing.push("GST Number");

  if (!profile.fssai?.trim())
    missing.push("FSSAI Number");

  if (!profile.pan?.trim())
    missing.push("PAN Number");

  if (!profile.aadhaar_number?.trim())
    missing.push("Aadhaar Number");

  if (!profile.payout?.bankName?.trim())
    missing.push("Bank Name");

  if (!profile.payout?.account?.trim())
    missing.push("Account Number");

  if (!profile.payout?.ifsc?.trim())
    missing.push("IFSC Code");

  if (!profile.payout?.upi?.trim())
    missing.push("UPI ID");

  if (!profile?.documents?.gst)
    missing.push("GST Certificate");

  if (!profile?.documents?.fssai)
    missing.push("FSSAI Certificate");

  if (!profile?.documents?.pan)
    missing.push("PAN Card");

  if (!profile?.documents?.aadhaar)
    missing.push("Aadhaar Card");

  return missing;
};

const missingFields = getMissingFields();

const canSave =
  missingFields.length === 0;
  

 const validateForm = () => {

  if (!profile.storeName?.trim()) {
  toast.error("Store Name is required");
  return false;
}

if (
  profile.storeName.trim().length < 2
) {
  toast.error(
    "Store Name must be at least 2 characters"
  );
  return false;
}

if (
  profile.storeName.trim().length > 100
) {
  toast.error(
    "Store Name cannot exceed 100 characters"
  );
  return false;
}

if (
  !REGEX.STORE_NAME.test(
    profile.storeName.trim()
  )
) {
  toast.error(
    "Store Name contains invalid characters"
  );
  return false;
}



if (!profile.email?.trim()) {
  toast.error("Email is required");
  return false;
}

if (
  !REGEX.EMAIL.test(
    profile.email.trim()
  )
) {
  toast.error(
    "Please enter a valid email address"
  );
  return false;
}



  if (!profile.address) {
    toast.error("Address required");
    return false;
  }



  if (!profile.city) {
    toast.error("City required");
    return false;
  }



  if (!profile.state) {
    toast.error("State required");
    return false;
  }



  if (!REGEX.PINCODE.test(profile.pincode)) {
  toast.error(
    "Enter valid 6 digit pincode"
  );
  return false;
}



if (!profile.ownerName?.trim()) {
  toast.error("Owner Name is required");
  return false;
}

if (
  profile.ownerName.trim().length < 2
) {
  toast.error(
    "Owner Name must be at least 2 characters"
  );
  return false;
}

if (
  profile.ownerName.trim().length > 100
) {
  toast.error(
    "Owner Name cannot exceed 100 characters"
  );
  return false;
}

if (
  !REGEX.NAME.test(
    profile.ownerName.trim()
  )
) {
  toast.error(
    "Invalid Owner Name"
  );
  return false;
}



if (!REGEX.MOBILE.test(profile.contact)) {
  toast.error(
    "Mobile number must be 10 digits and start with 6-9"
  );
  return false;
}

  if (
  convertTo24Hour(
    profile.opening_time
  ) >=
  convertTo24Hour(
    profile.closing_time
  )
) {
  toast.error(
    "Closing time must be after opening time"
  );
  return false;
}



if (
  !REGEX.AADHAAR.test(
    profile.aadhaar_number
  )
) {
  toast.error(
    "Aadhaar must be 12 digits"
  );
  return false;
}



  // if (!profile.merchant_type) {
  //   toast.error("Merchant Type required");
  //   return false;
  // }



 if (!profile.gst?.trim()) {
  toast.error("GSTIN is required");
  return false;
}

if (profile.gst.trim().length !== 15) {
  toast.error(
    "GSTIN must be exactly 15 characters"
  );
  return false;
}

if (
  !REGEX.GSTIN.test(
    profile.gst.trim().toUpperCase()
  )
) {
  toast.error(
    "Invalid GSTIN format"
  );
  return false;
}



if (!profile.fssai?.trim()) {
  toast.error(
    "FSSAI License Number is required"
  );
  return false;
}

if (profile.fssai.trim().length !== 14) {
  toast.error(
    "FSSAI License Number must be exactly 14 digits"
  );
  return false;
}

if (
  !REGEX.FSSAI.test(
    profile.fssai.trim()
  )
) {
  toast.error(
    "Invalid FSSAI License Number"
  );
  return false;
}



 if (!profile.pan?.trim()) {
  toast.error("PAN Card Number is required");
  return false;
}

if (profile.pan.trim().length !== 10) {
  toast.error(
    "PAN Card Number must be exactly 10 characters"
  );
  return false;
}

if (
  !REGEX.PAN.test(
    profile.pan.trim().toUpperCase()
  )
) {
  toast.error(
    "Invalid PAN Card Number format"
  );
  return false;
}



  // if (!profile.first_name) {
  //   toast.error("First Name required");
  //   return false;
  // }

  // if (!profile.last_name) {
  //   toast.error("Last Name required");
  //   return false;
  // }

  // if (!profile.gender) {
  //   toast.error("Gender required");
  //   return false;
  // }

  // if (!profile.dob) {
  //   toast.error("DOB required");
  //   return false;
  // }

  // if (!profile.profile_photo) {
  //   toast.error("Profile Photo required");
  //   return false;
  // }



if (!profile.payout.bankName) {
  toast.error("Bank Name required");
  return false;
}

if (
  profile.payout.bankName.length < 2
) {
  toast.error(
    "Invalid Bank Name"
  );
  return false;
}



if (!profile.payout.account?.trim()) {
  toast.error(
    "Bank Account Number is required"
  );
  return false;
}

if (
  profile.payout.account.length < 9 ||
  profile.payout.account.length > 18
) {
  toast.error(
    "Bank Account Number must be between 9 and 18 digits"
  );
  return false;
}

if (
  !REGEX.ACCOUNT.test(
    profile.payout.account
  )
) {
  toast.error(
    "Bank Account Number must contain digits only"
  );
  return false;
}


if (
  profile.payout.account !==
  profile.payout.re_account_number
) {
  toast.error(
    "Account Number and Re-enter Account Number must match"
  );
  return false;
}


 if (!profile.payout.upi?.trim()) {
  toast.error("UPI ID is required");
  return false;
}

if (
  profile.payout.upi.split("@").length !== 2
) {
  toast.error(
    "UPI ID must contain exactly one @"
  );
  return false;
}

if (
  !REGEX.UPI.test(
    profile.payout.upi.trim()
  )
) {
  toast.error(
    "Invalid UPI ID format"
  );
  return false;
}



 if (!profile.payout.ifsc?.trim()) {
  toast.error("IFSC Code is required");
  return false;
}

const ifsc =
  profile.payout.ifsc
    .trim()
    .toUpperCase();

if (ifsc.length !== 11) {
  toast.error(
    "IFSC Code must be exactly 11 characters"
  );
  return false;
}

if (!REGEX.IFSC.test(ifsc)) {
  toast.error(
    "Invalid IFSC Code format"
  );
  return false;
}



if (
  profile.deliveryRadius < 1 ||
  profile.deliveryRadius > 5
) {
  toast.error(
    "Delivery radius must be between 1 and 5 km"
  );
  return false;
}



if (
  Number(profile.minOrder) < 50
) {
  toast.error(
    "Minimum order amount must be at least ₹50"
  );
  return false;
}



  // if (!profile.documents.license) {
  //   toast.error("Business Certificate required");
  //   return false;
  // }

  if (!profile.documents.aadhaar) {
    toast.error("Aadhaar Card required");
    return false;
  }



  if (!profile?.documents?.gst) {
    toast.error("GST Certificate required");
    return false;
  }



  if (!profile?.documents?.fssai) {
    toast.error("FSSAI Certificate required");
    return false;
  }



  if (!profile?.documents?.pan) {
    toast.error("PAN Card required");
    return false;
  }


if (
  !profile.latitude ||
  !profile.longitude
) {

  toast.error(
    "Please select store location from map"
  );

  return false;
}


  return true;
};

const handleSave = async () => {

  if (saving) return;

  try {

    if (!validateForm()) return;

    setSaving(true);

    const payload = {
      user: USER_ID,

      
      address: profile.address,
      city: profile.city,
      state: profile.state,
      pincode: profile.pincode,


      opening_time:
        convertToApiTime(
          profile.opening_time
        ),

      closing_time:
        convertToApiTime(
          profile.closing_time
        ),

        area: profile.area,

        mobile: profile.contact,

        latitude:
          profile.latitude,

        longitude:
          profile.longitude,

        // estimated_delivery_time:
        //   profile.etaMins
        //     ? `00:${String(
        //         profile.etaMins
        //       ).padStart(2, "0")}:00`
        //     : "",

        is_online: true,


      merchant_discreption:
        profile.merchant_discreption,

      // owner_name:
      //   `${profile.first_name} ${profile.last_name}`,

      owner_name:
        profile.ownerName,

        first_name:
        profile.storeName,

      email:
        profile.email,

      // gender:
      //   profile.gender,

      // dob:
      //   profile.dob,

      gst_number:
        profile.gst,

      fssai_number:
        profile.fssai,

      pan_number:
        profile.pan,

      aadhaar_number:
        profile.aadhaar_number,

      // commission_type:
      //   profile.commission_type,

      food:
        profile.food,

      // longitude:
      //   profile.longitude,

      // latitude:
      //   profile.latitude,

      servicable_radius_km:
        profile.deliveryRadius,

      bank_name:
        profile.payout.bankName,

      re_account_number:
        profile.payout.re_account_number,

      account_number:
        profile.payout.account,

      ifsc_code:
        profile.payout.ifsc,

      upi_id:
        profile.payout.upi,

      // estimated_delivery_time:
      //   profile.etaMins,

      minimum_order_amount:
        profile.minOrder,

      profile_photo:
        profile.profile_photo,

      logo:
        profile.logo,

      gst_certificate:
        profile.documents.gst,

      fssai_certificate:
        profile.documents.fssai,

      pan_card:
        profile.documents.pan,

      // business_certificate:
      //   profile.documents.license,

      aadhaar_card:
        profile.documents.aadhaar,
    };

      let res;

      if (!isProfileExists) {

        res =
          await addMerchantDetails(
            payload
          );

      } else {

        res =
          await editMerchantProfile(
            payload
          );

      }

           if (res?.status) {

          if (canEdit) {

            setCanEdit(false);

            setEditRequested(false);

          }

      toast.success(
        "Profile saved successfully"
      );

      // ✅ REFRESH PROFILE
      await fetchProfileFromAPI();

        const updatedCompletion =
        Number(
          localStorage.getItem(
            "profile_completion"
          ) || 0
        );

        if (updatedCompletion === 100) {
          navigate("/dashboard");
        }


    } else {

      toast.error(
        res?.message ||
        "Failed to save profile"
      );

    }

  } catch (error) {

    console.log(error);

    toast.error(
      "Something went wrong"
    );

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
  
// const handleSaveWorkingHours =
// async () => {

//   if (hoursLoading) return;

//   try {

//     setHoursLoading(true);
  
//     const [opening, closing] = profile.hours.split(" - ");

//     const payload = {
//       user: USER_ID,
//       working_hrs: [
//         {
//           day: 1,
//           opening_time: opening + ":00",
//           closing_time: closing + ":00",
//         },
//       ],
//     };

//     const res = await editWorkingHours(payload);

//     if (res?.status) {
//      toast.success(
//       "Working hours updated"
//     );
//     }
//   } catch (error) {
//     console.log(error);
//     toast.error(
//       "Failed to update hours"
//     );
//   }
//  finally {

//   setHoursLoading(false);

// }
// };


//  const handleBankVerify = async () => {

//   if (
//     bankLoading ||
//     profile?.payout?.verified
//   ) return;

//   try {

//     setBankLoading(true);

//     update(
//       "payout.verified",
//       true
//     );
//     toast.success(
//   "Bank verified successfully"
// );

//   } finally {

//   setBankLoading(false);

// }
// };

  // const weeklyChart = (() => {
  //   const arr = (profile?.performance?.weeklySales) || [0,0,0,0,0,0,0];
  //   const max = Math.max(...arr, 1);
  //   return arr.map((v, i) => ({
  //     label: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i] || `D${i+1}`,
  //     pct: Math.round((v / max) * 100),
  //   }));
  // })();

 const logout = () => {

  if (saving) return;

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user_id");

  window.location.href = "/";
};

  // Prevent editing of phone (from signup/login). But allow storeName/email editing as requested.
  // Payment methods: enforce COD only
  // Merchant ID removed

//   const preview =
//   URL.createObjectURL(file);

// setPreviewUrls((prev) => ({
//   ...prev,
//   [docKey]: preview,
// }));

const convertToApiTime = (
  time12
) => {
  const [time, modifier] =
    time12.split(" ");

  let [hours, minutes] =
    time.split(":");

  hours = parseInt(hours);

  if (
    modifier === "PM" &&
    hours !== 12
  )
    hours += 12;

  if (
    modifier === "AM" &&
    hours === 12
  )
    hours = 0;

  return `${String(hours).padStart(
    2,
    "0"
  )}:${minutes}:00`;
};


const convertTo12Hour = (time24) => {
  if (!time24) return "";

  let [hours, minutes] =
    time24.split(":");

  hours = parseInt(hours);

  const ampm =
    hours >= 12 ? "PM" : "AM";

  hours = hours % 12;

  if (hours === 0)
    hours = 12;

  return `${String(hours).padStart(
    2,
    "0"
  )}:${minutes} ${ampm}`;
};

const convertTo24Hour = (
  time12
) => {
  if (!time12) return "";

  const [time, modifier] =
    time12.split(" ");

  let [hours, minutes] =
    time.split(":");

  hours = parseInt(hours);

  if (
    modifier === "PM" &&
    hours !== 12
  )
    hours += 12;

  if (
    modifier === "AM" &&
    hours === 12
  )
    hours = 0;

  return `${String(hours).padStart(
    2,
    "0"
  )}:${minutes}`;
};

   useEffect(() => {

  const savedLocation =
    localStorage.getItem(
      "merchant_location"
    );

  if (!savedLocation) return;

  const location =
    JSON.parse(savedLocation);

  setProfile(prev => ({
    ...prev,

    latitude:
      location.latitude,

    longitude:
      location.longitude,

    address:
      location.address,

    area:
      location.area,

    city:
      location.city,

    state:
      location.state,

    pincode:
      location.pincode,
  }));

}, []);

const [completionScore, setCompletionScore] =
  useState(0);

const [errors, setErrors] = useState({});

const validateField = (name, value) => {
  switch (name) {
    case "storeName":
      if (!value?.trim()) return "Store Name is required";
      if (value.trim().length < 2)
        return "Minimum 2 characters required";
      if (!REGEX.STORE_NAME.test(value.trim()))
        return "Invalid Store Name";
      return "";

    case "ownerName":
      if (!value?.trim()) return "Owner Name is required";
      if (value.trim().length < 2)
        return "Minimum 2 characters required";
      if (!REGEX.NAME.test(value.trim()))
        return "Invalid Owner Name";
      return "";

    case "email":
      if (!value?.trim()) return "Email is required";
      if (!REGEX.EMAIL.test(value.trim()))
        return "Invalid email address";
      return "";

    case "gst":
      if (!value) return "GSTIN is required";
      if (!REGEX.GSTIN.test(value))
        return "Invalid GSTIN format";
      return "";

    case "fssai":
      if (!value) return "FSSAI Number is required";
      if (!REGEX.FSSAI.test(value))
        return "FSSAI must be 14 digits";
      return "";

    case "pan":
      if (!value) return "PAN Number is required";
      if (!REGEX.PAN.test(value))
        return "Invalid PAN format";
      return "";

    case "aadhaar_number":
      if (!value) return "Aadhaar Number is required";
      if (!REGEX.AADHAAR.test(value))
        return "Aadhaar must be 12 digits";
      return "";

    case "bankName":
      if (!value?.trim())
        return "Bank Name is required";
      if (value.trim().length < 2)
        return "Invalid Bank Name";
      return "";

    case "account":
      if (!value)
        return "Account Number is required";
      if (!REGEX.ACCOUNT.test(value))
        return "Account Number must be 9-18 digits";
      return "";

    case "ifsc":
      if (!value)
        return "IFSC Code is required";
      if (!REGEX.IFSC.test(value))
        return "Invalid IFSC Code";
      return "";

    case "upi":
      if (!value)
        return "UPI ID is required";
      if (!REGEX.UPI.test(value))
        return "Invalid UPI ID";
      return "";

    default:
      return "";
  }
};

const handleValidatedChange = (
  field,
  value
) => {
  update(field, value);

  setErrors((prev) => ({
    ...prev,
    [field]: validateField(
      field,
      value
    ),
  }));
};


const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",

  // Union Territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];


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
                  src={getImageUrl(profile.logo)}
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
                <div className="text-sm text-gray-600">{profile.merchant_discreption || "Store description goes here."}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="text-sm"><strong>Address</strong><div className="text-gray-600">{profile.address || "Not set"}</div></div>
              <div className="text-sm"><strong>Contact</strong><div className="text-gray-600">{profile.contact || "Not set"}</div></div>
              <div className="text-sm"><strong>Hours</strong><div className="text-sm text-gray-600">
                  {profile.opening_time} - {profile.closing_time}
                </div></div>
              <div className="text-sm"><strong>KYC Status</strong>
              <div className="text-gray-600">
                  {
                    !isProfileExists
                      ? "-"
                      : profile.kycStatus
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-80 bg-white rounded-2xl p-4 shadow">
            <div className="text-sm text-gray-500">Profile Completion</div>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-4">
              <div className="h-4 rounded-full bg-gradient-to-r from-orange-400 to-amber-400" style={{ width: `${completionScore}%` }} />
            </div>
            <div className="text-xs text-gray-500 mt-2">{completionScore}% complete</div>

{isProfileExists && !kycVerified && (
  <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-xl">
    Your verification is pending.
    Please wait until verification is completed.
  </div>
)}

            {/* <div className="mt-4">
              <div className="text-sm text-gray-500">Average Rating</div>
              <div className="text-2xl font-bold">{profile?.performance?.rating || 0} / 5</div>
              <div className="text-sm text-gray-500 mt-2">Orders completed: <strong>{profile?.performance?.completed || 0}</strong></div>
              <div className="text-sm text-gray-500">Cancellations: <strong>{profile?.performance?.cancellations || 0}</strong></div>
            </div> */}
          </div>
        </div>

        {/* 1. Store Information */}
        <section className="bg-white rounded-2xl p-4 shadow space-y-3">
          <h3 className="font-semibold text-lg">🏪 Store Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Store Name</span>
              {/* storeName editable (coming from signup but allowed to edit here) */}
              <input
              value={profile.storeName || ""}
               disabled={
    saving ||
    isProfileLocked
  }
              maxLength={100}
              onChange={(e) =>
  handleValidatedChange(
    "storeName",
    e.target.value.replace(
      /[^A-Za-z0-9&.' -]/g,
      ""
    )
  )
}
              placeholder="Enter Store Name"
              className={`mt-1 p-2 border rounded-xl ${
  errors.storeName
    ? "border-red-500"
    : profile.storeName
    ? "border-black"
    : ""
}`}
            />
            {errors.storeName && (
  <p className="text-red-500 text-xs mt-1">
    {errors.storeName}
  </p>
)}
            </label>

           <label className="flex flex-col md:col-span-2">

<div className="md:col-span-2">

  <span className="text-sm text-gray-600">
    Store Location
  </span>

  <div
  onClick={() => {
    if (
      saving ||
      isProfileLocked
    )
      return;

    navigate("/location-map");
  }}
  className={`
    mt-2
    rounded-2xl
    border
    p-4
    bg-gray-50
    ${
      saving || isProfileLocked
        ? "cursor-not-allowed opacity-60"
        : "cursor-pointer"
    }
  `}
>

    {profile.latitude ? (

      <>
        <div className="text-orange-500 font-semibold">
          ✓ Location Selected
        </div>

        <div className="mt-2 text-sm">
          {profile.address}
        </div>

        <div className="text-xs text-gray-500 mt-1">
          {profile.area},
          {profile.city},
          {profile.state}
          {" - "}
          {profile.pincode}
        </div>
      </>

    ) : (

      <>
        <div className="text-orange-500 font-semibold">
          📍 Select Store Location
        </div>

        <div className="text-sm text-gray-500">
          Tap to choose store location
        </div>
      </>

    )}

  </div>

</div>
          </label>

          {/* {profile.latitude &&
          profile.longitude && (

            <div className="mt-2 text-sm text-green-600">

              Latitude:
              {profile.latitude}

              <br />

              Longitude:
              {profile.longitude}

            </div>

          )} */}

            <label className="flex flex-col">
            <span className="text-sm text-gray-600">Area</span>
              <input
                value={profile.area || ""}
                readOnly
                className="
                  mt-1 p-2 border rounded-xl
                  bg-gray-100
                  cursor-not-allowed
                "
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">City</span>
              <input
                value={profile.city || ""}
                readOnly
                className="
                  mt-1 p-2 border rounded-xl
                  bg-gray-100
                  cursor-not-allowed
                "
              />
            </label>


           <label className="flex flex-col">
              <span className="text-sm text-gray-600">State</span>

              <input
                value={profile.state || ""}
                readOnly
                className="
                  mt-1 p-2 border rounded-xl
                  bg-gray-100
                  cursor-not-allowed
                "
              />

              {/* <select
                value={profile.state || ""}
                disabled={saving}
                onChange={(e) =>
                  update("state", e.target.value)
                }
                className="mt-1 p-2 border rounded-xl"
              >
                <option value="">
                  Select State
                </option>

                {INDIAN_STATES.map((state) => (
                  <option
                    key={state}
                    value={state}
                  >
                    {state}
                  </option>
                ))}
              </select> */}
            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Pincode</span>
              <input
                value={profile.pincode || ""}
                readOnly
                className="
                  mt-1 p-2 border rounded-xl
                  bg-gray-100
                  cursor-not-allowed
                "
              />
            </label>

           {/* <label className="flex flex-col">
            <span className="text-sm text-gray-600">Merchant Type</span>

            <input
              value={profile.merchant_type || ""}
              disabled={saving}
              onChange={(e)=>
                update(
                  "merchant_type",
                  e.target.value.replace(/[^A-Za-z ]/g,"")
                )
              }
              placeholder="Enter merchant type"
              className="mt-1 p-2 border rounded-xl"
            />
          </label> */}

            {/* <label className="flex flex-col">
              <span className="text-sm text-gray-600">Operating Hours</span>
              <input value={profile.hours} 
              disabled={saving}
              onChange={(e)=>update("hours", e.target.value)} placeholder="09:00 - 21:00" className="mt-1 p-2 border rounded-xl" />
              <button
              type="button"
              onClick={handleSaveWorkingHours}
              disabled={hoursLoading}
              className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-xl"
            >
              {
                hoursLoading
                  ? "Saving..."
                  : "Save Hours"
              }
            </button>
            </label> */}

            {/* <label className="flex flex-col">
              <span className="text-sm text-gray-600">Contact Number (read-only)</span> */}
              {/* contact is read-only */}
              {/* <input value={profile.contact} readOnly 
              disabled={saving}
              className="mt-1 p-2 border rounded-xl bg-gray-50" />
            </label> */}

            <div className="flex flex-col md:col-span-2">
              <span className="text-sm text-gray-600 mb-2">
                Operating Hours
              </span>

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="text-xs text-gray-500">
                    Opening Time
                  </label>

                  <input
                    type="time"
                    value={convertTo24Hour(profile.opening_time)}
                     disabled={
    saving ||
    isProfileLocked
  }
                    onChange={(e) =>
                      update(
                        "opening_time",
                        convertTo12Hour(e.target.value)
                      )
                    }
                    className="mt-1 p-2 border rounded-xl w-full"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">
                    Closing Time
                  </label>

                  <input
                    type="time"
                    value={convertTo24Hour(profile.closing_time)}
                     disabled={
    saving ||
    isProfileLocked
  }
                    onChange={(e) =>
                      update(
                        "closing_time",
                        convertTo12Hour(e.target.value)
                      )
                    }
                    className="mt-1 p-2 border rounded-xl w-full"
                  />
                </div>

              </div>
            </div>

            <label className="flex flex-col md:col-span-2">
              <span className="text-sm text-gray-600">Email Address</span>
              {/* email editable (comes from signup) */}
              <input
              type="email"
              value={profile.email || ""}
               disabled={
    saving ||
    isProfileLocked
  }
              onChange={(e) =>
  handleValidatedChange(
    "email",
    e.target.value.trim().toLowerCase()
  )
}
              placeholder="store@example.com"
             className={`mt-1 p-2 border rounded-xl ${
  errors.email
    ? "border-red-500"
    : profile.email
    ? "border-black"
    : ""
}`}
            />
            {errors.email && (
  <p className="text-red-500 text-xs mt-1">
    {errors.email}
  </p>
)}
            </label>

            <label className="flex flex-col md:col-span-2">
              <span className="text-sm text-gray-600">Store Description</span>
              <textarea
                 disabled={
    saving ||
    isProfileLocked
  }
                value={profile.merchant_discreption || ""}
                onChange={(e) =>
                  update("merchant_discreption", e.target.value)
                }
                placeholder="Short description for customers"
                className="mt-1 p-2 border rounded-xl"
              />
            </label>

            <label className="flex flex-col">
  <span className="text-sm text-gray-600">
    Store Logo / Banner
  </span>

  <div className="p-1 border rounded-xl">
   {profile?.logo ? (
  <>
    <img
      src={getImageUrl(profile.logo)}
      alt="Store Logo"
      className="mt-2 w-full h-24 object-cover rounded"
    />

    {!isProfileLocked && (
      <input
        type="file"
        accept="image/*"
        onClick={(e) => {
          e.target.value = null;
        }}
       onChange={(e) =>
          onFileChange(e, "logo")
        }
        className="mt-2"
      />
    )}
  </>
) : (
  <input
    type="file"
    accept="image/*"
    disabled={
      saving ||
      isProfileLocked
    }
    onClick={(e) => {
      e.target.value = null;
    }}
    onChange={(e) =>
      onFileChange(e, "logo")
    }
    className="mt-1"
  />
)}
  </div>
</label>

          </div>
        </section>

{/* 2. Owner / Account Details */}
<section className="bg-white rounded-2xl p-4 shadow space-y-3">
  <h3 className="font-semibold text-lg">👤 Owner / Account Details</h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Owner Name */}
      <label className="flex flex-col md:col-span-2">
        <span className="text-sm text-gray-600 mb-1">
          Owner Name
        </span>

        <input
  value={profile.ownerName || ""}
   disabled={
    saving ||
    isProfileLocked
  }
  maxLength={100}
  onChange={(e) =>
  handleValidatedChange(
    "ownerName",
    e.target.value.replace(
      /[^A-Za-z .'-]/g,
      ""
    )
  )
}
  placeholder="Enter owner name"
 className={`p-2 border rounded-xl ${
  errors.ownerName
    ? "border-red-500"
    : profile.ownerName
    ? "border-black"
    : ""
}`}
/>
{errors.ownerName && (
  <p className="text-red-500 text-xs mt-1">
    {errors.ownerName}
  </p>
)}
      </label>

    {/* First Name */}
    {/* <label className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">First Name</span>
      <input
        value={profile.first_name || ""}
        disabled={saving}
        onChange={(e) =>
          update(
            "first_name",
            e.target.value.replace(/[^A-Za-z ]/g, "")
          )
        }
        placeholder="Enter first name"
        className="p-2 border rounded-xl"
      />
    </label> */}

    {/* Last Name */}
    {/* <label className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">Last Name</span>
      <input
        value={profile.last_name || ""}
        disabled={saving}
        onChange={(e) =>
          update(
            "last_name",
            e.target.value.replace(/[^A-Za-z ]/g, "")
          )
        }
        placeholder="Enter last name"
        className="p-2 border rounded-xl"
      />
    </label> */}

    {/* Gender */}
    {/* <label className="flex flex-col">
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
    </label> */}

    {/* DOB */}
    {/* <label className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">Date of Birth</span>
      <input
        type="date"
        disabled={saving}
        value={profile.dob || ""}
        onChange={(e) => update("dob", e.target.value)}
        className="p-2 border rounded-xl"
      />
    </label> */}

    {/* Profile Photo */}
    {/* <label className="flex flex-col md:col-span-2">
      <span className="text-sm text-gray-600 mb-1">Profile Photo</span>

      <input
        type="file"
        disabled={saving}
        onClick={(e) => {
        e.target.value = null;
      }}
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
              ? getImagePreview(profile.profile_photo)
              : profile.profile_photo
          }
          alt="Profile"
          className="w-24 h-24 mt-3 rounded-xl object-cover border"
        />
      )}
    </label> */}

    {/* Registered Phone */}
    <label className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">
        Registered Phone
      </span>

      <input
        value={profile.contact}
        readOnly
         disabled={
    saving ||
    isProfileLocked
  }
        className="p-2 border rounded-xl bg-gray-100"
      />
    </label>

    {/* GST */}
    <label className="flex flex-col">      
      <span className="text-sm text-gray-600 mb-1">
        GST Number
      </span>

 <input
  maxLength={15}
  value={profile.gst || ""}
   disabled={
    saving ||
    isProfileLocked
  }
  onChange={(e) =>
  handleValidatedChange(
    "gst",
    e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 15)
  )
}
  className={`
    p-2 border rounded-xl
    ${
      errors.gst
        ? "border-red-500"
        : profile.gst?.length
        ? "border-black"
        : ""
    }
  `}
/>

{errors.gst && (
  <p className="text-red-500 text-xs mt-1">
    {errors.gst}
  </p>
)}
    </label>

    {/* FSSAI */}
    <label className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">
        FSSAI Number
      </span>

 <input
  maxLength={14}
  value={profile.fssai || ""}
   disabled={
    saving ||
    isProfileLocked
  }
  onChange={(e) =>
    handleValidatedChange(
      "fssai",
      e.target.value
        .replace(/\D/g, "")
        .slice(0, 14)
    )
  }
  className={`
    p-2 border rounded-xl
    ${
      errors.fssai
        ? "border-red-500"
        : profile.fssai?.length
        ? "border-black"
        : ""
    }
  `}
/>

{errors.fssai && (
  <p className="text-red-500 text-xs mt-1">
    {errors.fssai}
  </p>
)}
    </label>

    {/* PAN */}
    <label className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">
        PAN Number
      </span>

 <input
  maxLength={10}
  value={profile.pan || ""}
   disabled={
    saving ||
    isProfileLocked
  }
  onChange={(e) =>
    handleValidatedChange(
      "pan",
      e.target.value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10)
    )
  }
  className={`p-2 border rounded-xl ${
    errors.pan
      ? "border-red-500"
      : profile.pan
      ? "border-black"
      : ""
  }`}
/>

{errors.pan && (
  <p className="text-red-500 text-xs mt-1">
    {errors.pan}
  </p>
)}
    </label>

{/* Aadhaar Number */}
<label className="flex flex-col">
  <span className="text-sm text-gray-600 mb-1">
    Aadhaar Number
  </span>

  <input
  maxLength={12}
  value={profile.aadhaar_number || ""}
   disabled={
    saving ||
    isProfileLocked
  }
  onChange={(e) =>
    handleValidatedChange(
      "aadhaar_number",
      e.target.value
        .replace(/\D/g, "")
        .slice(0, 12)
    )
  }
  className={`p-2 border rounded-xl ${
    errors.aadhaar_number
      ? "border-red-500"
      : profile.aadhaar_number
      ? "border-black"
      : ""
  }`}
/>

{errors.aadhaar_number && (
  <p className="text-red-500 text-xs mt-1">
    {errors.aadhaar_number}
  </p>
)}
</label>

  </div>
</section>

        {/* 3. Business Settings */}
        <section className="bg-white rounded-2xl p-4 shadow space-y-3">
          <h3 className="font-semibold text-lg">⚙️ Business Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            {/* <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Online / Offline</div>
                <div className="text-xs text-gray-500">Accept orders</div>
              </div>
              <button
                onClick={async () => {

                  if (onlineLoading) return;

                  try {

                    setOnlineLoading(true);

                    setOnline((s) => !s);

                  } finally {

                    setTimeout(() => {
                      setOnlineLoading(false);
                    }, 500);
                  }
                }}
                className={`w-16 h-8 flex items-center rounded-full p-1 ${
                  online
                    ? "bg-orange-500"
                    : "bg-gray-300"
                }

                ${
                  onlineLoading
                    ? "opacity-60 cursor-not-allowed pointer-events-none"
                    : ""
                }`}
                title="Toggle online/offline"
              >
                <div className={`bg-white w-6 h-6 rounded-full transform transition-all duration-300 ${online ? "translate-x-8" : "translate-x-0"}`} />
              </button>
            </div> */}

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Delivery Radius (km)</span>
              <select
              value={profile.deliveryRadius || 1}
               disabled={
    saving ||
    isProfileLocked
  }
              onChange={(e) =>
                update(
                  "deliveryRadius",
                  Number(e.target.value)
                )
              }
              className="mt-1 p-2 border rounded-xl"
            >
              <option value={1}>1 km</option>
              <option value={2}>2 km</option>
              <option value={3}>3 km</option>
              <option value={4}>4 km</option>
              <option value={5}>5 km</option>
            </select>
            </label>

            {/* <label className="flex flex-col">
              <span className="text-sm text-gray-600">Estimated Delivery Time (mins)</span>
              <input type="number" value={profile.etaMins} disabled={saving}
              onChange={(e)=>update("etaMins", Number(e.target.value))} className="mt-1 p-2 border rounded-xl" />
            </label> */}

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Minimum Order Amount (₹)</span>
              <input
                type="number"
                min={50}
                step={1}
                value={profile.minOrder}
                 disabled={
    saving ||
    isProfileLocked
  }
                onChange={(e) =>
                  update(
                    "minOrder",
                    Math.max(50, Number(e.target.value))
                  )
                }
                className="mt-1 p-2 border rounded-xl"
              />
            </label>

              {/* Commission value */}
              <label className="flex flex-col">
                <span className="text-sm text-gray-600">
                  Commission Value
                </span>

                <input
                 value={
                      profile.commission_value !== null &&
                      profile.commission_value !== undefined
                        ? profile.commission_value
                        : "Not Assigned"
                    }
                  readOnly
                  disabled
                  className="
                    mt-1 p-2 border rounded-xl
                    bg-gray-100 text-gray-600
                    cursor-not-allowed
                  "
                />
              </label>
              {/* Food */}
              <label className="flex flex-col">
                <span className="text-sm text-gray-600">
                  Food
                </span>

              <select
                  value={profile.food || ""}
                  disabled={
                    saving ||
                    isProfileLocked
                  }
                  onChange={(e) =>
                    update("food", e.target.value)
                  }
                  className="mt-1 p-2 border rounded-xl"
                >
                <option value="">
                  Select Food Type
                </option>

                <option value="veg">
                  Veg
                </option>

                <option value="non_veg">
                  Non Veg
                </option>

                <option value="Veg + Non-Veg">
                  Both
                </option>
              </select>
              </label>

              {/* Latitude */}
              {/* <label className="flex flex-col">
                <span className="text-sm text-gray-600">
                  Latitude
                </span>

                <input
                disabled={saving}
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
              </label> */}

              {/* Longitude */}
              {/* <label className="flex flex-col">
                <span className="text-sm text-gray-600">
                  Longitude
                </span>

                <input
                disabled={saving}
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
              </label> */}

            {/* <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" 
                disabled={saving}
                checked={true} readOnly />
                <span className="text-sm">Cash on Delivery (always available)</span>
              </div>

              <div className="text-sm text-gray-500">
                Card / POS and UPI are not available currently.
              </div>
            </div> */}
          </div>
        </section>

        {/* 4. Performance Metrics */}
        {/* <section className="bg-white rounded-2xl p-4 shadow space-y-3">
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
        </section> */}

        {/* 5. Payout & Banking Info */}
        <section className="bg-white rounded-2xl p-4 shadow space-y-3">
          <h3 className="font-semibold text-lg">💰 Payout & Banking Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Bank Name</span>
              <input value={profile?.payout?.bankName} 
               disabled={
    saving ||
    isProfileLocked
  }
              onChange={(e) => {
  update(
    "payout.bankName",
    e.target.value
  );

  setErrors(prev => ({
    ...prev,
    bankName: validateField(
      "bankName",
      e.target.value
    )
  }));
}}
 placeholder="Enter Bank Name"
            className="mt-1 p-2 border rounded-xl"
/>

{errors.bankName && (
  <p className="text-red-500 text-xs mt-1">
    {errors.bankName}
  </p>
)}
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Account Number</span>
             <input
            value={profile?.payout?.account || ""}
             disabled={
    saving ||
    isProfileLocked
  }
            maxLength={18}
            onChange={(e) => {
  const value =
    e.target.value
      .replace(/\D/g, "")
      .slice(0, 18);

  update(
    "payout.account",
    value
  );

  setErrors(prev => ({
    ...prev,
    account: validateField(
      "account",
      value
    )
  }));
}}
            placeholder="Enter Bank Account Number"
            className="mt-1 p-2 border rounded-xl"
          />

          {errors.account && (
  <p className="text-red-500 text-xs mt-1">
    {errors.account}
  </p>
)}

              <div className="text-xs text-gray-500 mt-1">Displayed masked: {maskAccount(profile?.payout?.account)}</div>
            </label>

<label className="flex flex-col">
  <span className="text-sm text-gray-600">
    Re-enter Account Number
  </span>

  <input
    value={profile?.payout?.re_account_number || ""}
     disabled={
    saving ||
    isProfileLocked
  }
    maxLength={18}
    onChange={(e) =>
      update(
        "payout.re_account_number",
        e.target.value
          .replace(/\D/g, "")
          .slice(0, 18)
      )
    }
    placeholder="Re-enter Account Number"
    className="mt-1 p-2 border rounded-xl"
  />

  {profile?.payout?.re_account_number &&
    profile?.payout?.account !==
      profile?.payout?.re_account_number && (
      <p className="text-red-500 text-xs mt-1">
        Account numbers do not match
      </p>
  )}
</label>


            <label className="flex flex-col">
              <span className="text-sm text-gray-600">
                IFSC Code
              </span>

              <input
              maxLength={11}
              value={profile?.payout?.ifsc || ""}
               disabled={
    saving ||
    isProfileLocked
  }
              onChange={(e) => {
  const value =
    e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 11);

  update(
    "payout.ifsc",
    value
  );

  setErrors(prev => ({
    ...prev,
    ifsc: validateField(
      "ifsc",
      value
    )
  }));
}}
              placeholder="Enter IFSC Code"
              className="mt-1 p-2 border rounded-xl"
            />

            {errors.ifsc && (
  <p className="text-red-500 text-xs mt-1">
    {errors.ifsc}
  </p>
)}

            </label>

            <label className="flex flex-col">
              <span className="text-sm text-gray-600">UPI ID</span>
             <input
              value={profile?.payout?.upi || ""}
               disabled={
    saving ||
    isProfileLocked
  }
              onChange={(e) => {
  const value =
    e.target.value
      .trim()
      .toLowerCase();

  update(
    "payout.upi",
    value
  );

  setErrors(prev => ({
    ...prev,
    upi: validateField(
      "upi",
      value
    )
  }));
}}
              placeholder="Enter UPI ID"
              className="mt-1 p-2 border rounded-xl"
            />

            {errors.upi && (
  <p className="text-red-500 text-xs mt-1">
    {errors.upi}
  </p>
)}

            </label>

          </div>
        </section>

        {/* 6. Documents */}
        <section className="bg-white rounded-2xl p-4 shadow space-y-3">
          <h3 className="font-semibold text-lg">🪪 Documents (upload)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* <div className="p-3 border rounded-xl">
              <div className="text-sm text-gray-600">Business License</div>
              <input type="file" 
              disabled={saving}            
              onClick={(e) => {
              e.target.value = null;
            }}
              accept="image/*,.pdf" onChange={(e)=>onFileChange(e, "license")} className="mt-2" />
              {profile?.documents?.license && <img
              src={
                profile?.documents?.license instanceof File
                  ? getImagePreview(profile.documents.license)
                  : profile.documents.license
              } alt="lic" className="mt-2 w-full h-24 object-cover rounded" />}
            </div> */}
            <div className="p-3 border rounded-xl">
              <div className="text-sm text-gray-600">GST Certificate</div>
              {profile.documents.gst ? (
  <>
    <img
      src={getImageUrl(
        profile.documents.gst
      )}
      alt="GST"
      className="h-32 rounded-xl"
    />

    <p className="text-green-600 text-sm mt-2">
      Uploaded
    </p>
  </>
) : (
  <input
    type="file"
    disabled={
      saving ||
      isProfileLocked
    }
    onChange={(e) =>
      onFileChange(e, "gst")
    }
  />
)}
            </div>

            <div className="p-3 border rounded-xl">
             <div className="text-sm text-gray-600">PAN Card</div>
{profile.documents.pan ? (
  <>
    <img
      src={getImageUrl(
        profile.documents.pan
      )}
      alt="PAN"
      className="h-32 rounded-xl"
    />

    <p className="text-green-600 text-sm mt-2">
      Uploaded
    </p>
  </>
) : (
  <input
    type="file"
    disabled={
      saving ||
      isProfileLocked
    }
    onChange={(e) =>
      onFileChange(e, "pan")
    }
  />
)}
            </div>


            <div className="p-3 border rounded-xl">
  <div className="text-sm text-gray-600">
    FSSAI Certificate
  </div>

  {profile.documents.fssai ? (
  <>
    <img
      src={getImageUrl(
        profile.documents.fssai
      )}
      alt="FSSAI"
      className="h-32 rounded-xl"
    />

    <p className="text-green-600 text-sm mt-2">
      Uploaded
    </p>
  </>
) : (
  <input
    type="file"
    disabled={
      saving ||
      isProfileLocked
    }
    onChange={(e) =>
      onFileChange(e, "fssai")
    }
  />
)}
</div>
{/* Aadhaar Card */}
<div className="p-3 border rounded-xl">
  <div className="text-sm text-gray-600">
    Aadhaar Card
  </div>

{profile.documents.aadhaar ? (
  <>
    <img
      src={getImageUrl(
        profile.documents.aadhaar
      )}
      alt="Aadhaar"
      className="h-32 rounded-xl"
    />

    <p className="text-green-600 text-sm mt-2">
      Uploaded
    </p>
  </>
) : (
  <input
    type="file"
    disabled={
      saving ||
      isProfileLocked
    }
    onChange={(e) =>
      onFileChange(e, "aadhaar")
    }
  />
)}
</div>
          </div>
        </section>

        {/* 7. Support & Legal */}
<section className="bg-white rounded-2xl p-5 shadow">

  {/* Account Actions */}
  <div>
    <h3 className="font-semibold text-lg mb-4">
      ⚡ Account Actions
    </h3>

    <div className="flex flex-wrap gap-3">

      <button
  onClick={() => {
    if (!canSave && !isProfileExists) {
      toast.error(
        `Please complete: ${missingFields
          .slice(0, 5)
          .join(", ")}${
          missingFields.length > 5
            ? ` +${missingFields.length - 5} more`
            : ""
        }`
      );
      return;
    }

    handleMainButton();
  }}
  disabled={!kycVerified}
  disabled={disableRequestEdit}
   disabled={
    saving ||
    isProfileLocked
  }
  className={`
    px-5 py-2 rounded-xl text-white
    ${
      
      !canSave && !isProfileExists
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-gradient-to-r from-orange-400 to-amber-400"
    }
  `}
>
  {getButtonLabel()}
</button>

      {/* {isProfileExists && (
        <button
          onClick={handleRequestProfileEdit}
          disabled={requestLoading}
          className="
            px-5 py-2 rounded-xl
            bg-blue-600 text-white
          "
        >
          {requestLoading
            ? "Sending..."
            : "Request Profile Update"}
        </button>
      )} */}

      <button
        onClick={logout}
        className="
          px-5 py-2 rounded-xl
          border border-red-300
          text-red-600
        "
      >
        Logout
      </button>

    </div>
  </div>

  {/* Divider */}
  <div className="border-t my-6"></div>

  {/* Support & Legal */}
  <div>
    <h3 className="font-semibold text-lg mb-4">
      📞 Support & Legal
    </h3>

    <div className="flex flex-wrap gap-3">

      <button
        onClick={() =>
          toast("Support chat coming soon")
        }
        className="
          px-5 py-2 rounded-xl
          bg-orange-500 text-white
        "
      >
        Chat with Support
      </button>

      <button
        className="
          px-5 py-2 rounded-xl
          border
        "
      >
        Terms & Conditions
      </button>

      <button
        className="
          px-5 py-2 rounded-xl
          border
        "
      >
        Privacy Policy
      </button>

    </div>
  </div>

</section>
      </div>
    </div>
  );
}
