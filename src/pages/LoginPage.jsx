//src\pages\LoginPage.jsx

import React, { useContext, useEffect, useState } from "react";
import HeaderImg from "../assets/Header/Header.png";
import { LanguageContext } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import { requestOtp } from "../services/authApi";

export default function LoginPage() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useContext(LanguageContext);

  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  
useEffect(() => {
  if (localStorage.getItem("accessToken")) {
    navigate("/dashboard", { replace: true }); // ✅ merchant home is /dashboard
  }
}, []);

  /* ---------------- VALIDATION ---------------- */
  useEffect(() => {
    const newErrors = {};

    const isValidMobile = /^[0-9]{10}$/.test(mobile);
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Mobile (Required)
    if (!mobile) {
      newErrors.mobile = "Mobile number is required";
    } else if (!isValidMobile) {
      newErrors.mobile = "Enter a valid 10-digit mobile number";
    }

    // Email (Optional)
    if (email && !isValidEmail) {
      newErrors.email = "Enter a valid email address";
    }

    // Referral Code (Optional)
    if (referralCode && !/^[A-Z0-9]{6}$/.test(referralCode)) {
      newErrors.referralCode =
        "Referral code must be 6 characters (A–Z, 0–9)";
    }

    setErrors(newErrors);

    setIsFormValid(
      isValidMobile &&
        (!email || isValidEmail) &&
        (!referralCode || /^[A-Z0-9]{6}$/.test(referralCode))
    );
  }, [mobile, email, referralCode]);

  /* ---------------- CONTINUE ---------------- */
 const handleContinue = async (e) => {
  e.preventDefault();
  if (!isFormValid) return;

  try {
    const payload = {
      mobile, // ✅ ONLY MOBILE
    };

    const data = await requestOtp(payload);

    if (!data.status) {
      alert(data.message || "Failed to send OTP");
      return;
    }

    // ✅ Navigate to OTP page
    navigate("/otp", {
      state: {
        mobile,
        email,         // keep if you want later
        referralCode,  // keep if you want later
      },
    });
  } catch (err) {
    console.error(err);
    alert("Server error. Please try again.");
  }
};




  return (
    <div className="min-h-screen flex flex-col bg-[#fff6ed] relative overflow-hidden">
      {/* Header */}
      <header className="relative w-full">
        <img
          src={HeaderImg}
          alt="Header"
          className="w-full h-[260px] sm:h-[320px] object-cover animate-zoomOut"
        />

        <div className="absolute right-4 top-4 z-20">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm shadow-sm"
          >
            <option value="en">English</option>
            {/* <option value="hi">हिन्दी</option>
            <option value="mr">मराठी</option> */}
          </select>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-start justify-center px-4 relative -mt-16 z-30 pb-10">
        <div className="w-full max-w-xl p-[2px] rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 shadow-lg">
          <div className="bg-white rounded-xl p-6 sm:p-8">            
            <h2 className="text-center text-xl sm:text-2xl font-semibold mb-4 border-b border-orange-500 pb-2">
              Merchant Login
            </h2>

            <form onSubmit={handleContinue} className="space-y-4">
              {/* MOBILE */}
              <div>
                <label className="text-sm text-gray-700">
                  Mobile Number <span className="text-red-600">*</span>
                </label>
                <input
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
                {errors.mobile && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.mobile}
                  </p>
                )}
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-sm text-gray-700">
                   Email {/* <span className="text-gray-400">(optional)</span> */}
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  placeholder="Enter email address"
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
                {errors.email && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* REFERRAL */}
              {/* <div>
                <label className="text-sm text-gray-700">
                  Referral Code{" "}
                  <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  value={referralCode}
                  onChange={(e) =>
                    setReferralCode(e.target.value.toUpperCase())
                  }
                  placeholder="Enter referral code"
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
                {errors.referralCode && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.referralCode}
                  </p>
                )}
              </div> */}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={!isFormValid}
                className={`w-full py-2.5 rounded-md text-white font-semibold text-sm transition ${
                  isFormValid
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {t("continue")}
              </button>

              {/* OR */}
              <div className="flex items-center justify-center my-2 gap-3">
                <hr className="flex-1 border-orange-500" />
                <span className="text-xs text-gray-400">OR</span>
                <hr className="flex-1 border-orange-500" />
              </div>

              {/* GOOGLE */}
              <div className="flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-2 px-3 shadow-sm bg-white hover:bg-gray-50 transition cursor-pointer">
                <img
                  src="https://www.svgrepo.com/show/355037/google.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t("continueWithGoogle")}
                </span>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 text-white text-center py-4 pb-6 text-sm mt-auto">
        {t("footer")}
      </footer>
    </div>
  );
}
