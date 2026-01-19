//src\pages\LoginPage.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LanguageContext } from "../context/LanguageContext";
import HeaderImg from "../assets/Header/Header.png";
import { supabase } from "../lib/supabase";  // ✅ FIXED PATH

export default function LoginPage() {
  const navigate = useNavigate();
  const { lang, t, setLang } = useContext(LanguageContext);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validate = () => {
    const isEmail = identifier.includes("@");

    if (!isEmail) {
      setError("Merchant login requires a valid email address.");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    return true;
  };

const handleLogin = async () => {
  if (!validate()) return;

  try {
    const { data, error: loginErr } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });

    if (loginErr) {
      setError(loginErr.message);
      return;
    }

    const user = data?.user;

    // 1️⃣ Check if email is verified
    const emailVerified =
      user.email_confirmed_at ||
      user.confirmed_at ||
      user.user_metadata?.email_confirmed_at;

    if (!emailVerified) {
      alert("Please verify your email. We sent you a verification code.");
      navigate("/otp", { state: { email: identifier } });
      return;
    }

    // 2️⃣ Check role
    if (user.user_metadata?.role !== "merchant") {
      setError("Only merchant accounts can log in here.");
      await supabase.auth.signOut();
      return;
    }

    // 3️⃣ SUCCESS → redirect
    localStorage.setItem("merchant_auth", "true");
    navigate("/dashboard");

  } catch (err) {
    console.error(err);
    setError("Login failed. Try again.");
  }
};

  return (
    <div className="min-h-screen flex flex-col bg-[#fff6ed] relative">
      <header className="relative w-full">
        <img
          src={HeaderImg}
          alt="Header"
          className="w-full h-[220px] object-cover animate-zoomOut"
        />

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

      <main className="flex-1 flex items-start justify-center px-4 -mt-20 z-30">
        <div className="w-full max-w-md p-[2px] rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 shadow-lg">
          <div className="bg-white rounded-xl p-8 sm:p-10 text-center">
            <h1 className="text-2xl font-bold text-orange-500 mb-6">
              MERCHANT LOGIN
            </h1>

            <div className="space-y-4">
              <input
                placeholder="Email Address"
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

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLogin}
              className="w-full mt-6 text-white py-3 rounded-xl font-semibold bg-orange-500 hover:bg-orange-600 transition"
            >
              LOGIN
            </motion.button>

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

      <footer className="bg-orange-500 text-white text-center py-3 mt-auto text-sm">
        © Zatpatt • All Rights Reserved 2025
      </footer>
    </div>
  );
}
