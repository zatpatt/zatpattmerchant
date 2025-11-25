import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LanguageContext } from "../context/LanguageContext";
import HeaderImg from "../assets/Header/Header.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { lang, t, setLang } = useContext(LanguageContext);
  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState("");

  const handleContinue = () => {
    if (mobile.length !== 10) return;
    localStorage.setItem("merchant_profile", JSON.stringify({ mobile }));
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    localStorage.setItem("merchant_otp", otp);
    alert(`OTP for login: ${otp}`);
    navigate("/otp");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fff6ed] relative">
      <header className="relative w-full">
        <img src={HeaderImg} alt="Header" className="w-full h-[220px] object-cover animate-zoomOut" />
        <div className="absolute right-4 top-4 z-20">
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm shadow-sm">
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 -mt-20 z-30">
        <div className="w-full max-w-md p-[2px] rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 shadow-lg">
          <div className="bg-white rounded-xl p-8 sm:p-10 text-center">
            <h1 className="text-2xl font-bold text-orange-500 mb-6">{t("MERCHANT LOGIN")}</h1>

            <div className="space-y-4">
              <div className="flex gap-2">
                <select className="border border-gray-300 rounded-xl px-2 py-2 bg-white text-sm">
                  <option value="+91">🇮🇳 +91</option>
                </select>
                <input
                  placeholder={t("mobile")}
                  value={mobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setMobile(val);
                    if (val.length > 0 && !/^\d{10}$/.test(val)) setMobileError("Enter a valid 10-digit number");
                    else setMobileError("");
                  }}
                  className="flex-1 border border-orange-400 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
              {mobileError && <p className="text-red-500 text-sm mt-1">{mobileError}</p>
              }

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleContinue}
                disabled={mobile.length !== 10}
                className={`w-full mt-6 text-white py-3 rounded-xl font-semibold ${mobile.length === 10 ? "bg-orange-500 hover:bg-orange-600" : "bg-gray-300 cursor-not-allowed"}`}
              >
                {t("continue")}
              </motion.button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-orange-500 text-white text-center py-3 mt-auto text-sm">
        {t("footer")}
      </footer>
    </div>
  );
}
