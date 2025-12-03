import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LanguageContext } from "../context/LanguageContext";
import HeaderImg from "../assets/Header/Header.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { lang, t, setLang } = useContext(LanguageContext);

  // Inputs
  const [identifier, setIdentifier] = useState(""); // mobile or email
  const [password, setPassword] = useState("");

  // Errors
  const [error, setError] = useState("");

  // Validator
  const validate = () => {
    let ok = true;

    // Identify type
    const isEmail = identifier.includes("@");
    const isMobile = /^\d{10}$/.test(identifier);

    if (!isEmail && !isMobile) {
      setError("Enter valid Email or 10-digit Mobile Number");
      ok = false;
    } else {
      setError("");
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      ok = false;
    }

    return ok;
  };

  const handleLogin = () => {
    if (!validate()) return;

    const isEmail = identifier.includes("@");
    const isMobile = /^\d{10}$/.test(identifier);
   
      // Email + Password login
      localStorage.setItem(
        "merchant_profile",
        JSON.stringify({ email: identifier, password })
      );
      alert("Login successful!");
      navigate("/dashboard");
    };

  return (
    <div className="min-h-screen flex flex-col bg-[#fff6ed] relative">
      {/* Header */}
      <header className="relative w-full">
        <img
          src={HeaderImg}
          alt="Header"
          className="w-full h-[220px] object-cover animate-zoomOut"
        />

        {/* Language Picker */}
        <div className="absolute right-4 top-4 z-20">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm shadow-sm"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-start justify-center px-4 -mt-20 z-30">
        <div className="w-full max-w-md p-[2px] rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 shadow-lg">
          <div className="bg-white rounded-xl p-8 sm:p-10 text-center">
            <h1 className="text-2xl font-bold text-orange-500 mb-6">
              MERCHANT LOGIN
            </h1>

            {/* Single Input Login */}
            <div className="space-y-4">
              <input
                placeholder="Email or Mobile Number"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value.trim());
                  setError("");
                }}
                className="w-full border border-orange-400 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
              />

              <input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="w-full border border-orange-400 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            {/* LOGIN BUTTON */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLogin}
              className="w-full mt-6 text-white py-3 rounded-xl font-semibold bg-orange-500 hover:bg-orange-600 transition"
            >
              LOGIN
            </motion.button>

            {/* SIGN UP LINK */}
            <p className="mt-4 text-sm text-gray-600">
              Don’t have an account?{" "}
              <span
                onClick={() => navigate("/signup")}
                className="text-orange-500 font-semibold cursor-pointer"
              >
                Sign Up
              </span>
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-orange-500 text-white text-center py-3 mt-auto text-sm">
        © Zatpatt • All Rights Reserved 2025
      </footer>
    </div>
  );
}
