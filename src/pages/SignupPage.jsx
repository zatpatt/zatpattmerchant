// src/pages/SignupPage.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LanguageContext } from "../context/LanguageContext";
import HeaderImg from "../assets/Header/Header.png";

export default function SignupPage() {
  const navigate = useNavigate();
  const { lang, setLang } = useContext(LanguageContext);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});

  // VALIDATION FUNCTION
  const validate = () => {
    let temp = {};

    if (!firstName.trim()) temp.firstName = "First name required";
    if (!lastName.trim()) temp.lastName = "Last name required";
    if (!storeName.trim()) temp.storeName = "Store name required";

    if (!/^\S+@\S+\.\S+$/.test(email)) temp.email = "Enter valid email";

    if (!/^\d{10}$/.test(mobile)) temp.mobile = "Enter valid 10-digit number";

    if (password.length < 8)
      temp.password = "Password must be at least 8 characters";

    setErrors(temp);

    return Object.keys(temp).length === 0;
  };

  // IS BUTTON ACTIVE?
  const isFormValid =
    firstName &&
    lastName &&
    storeName &&
    /^\S+@\S+\.\S+$/.test(email) &&
    /^\d{10}$/.test(mobile) &&
    password.length >= 8;

  // HANDLE SIGNUP
  const handleSignup = () => {
    if (!validate()) return;

    // SAVE TEMP SIGNUP DATA BEFORE OTP
    localStorage.setItem(
      "merchant_signup_temp",
      JSON.stringify({
        firstName,
        lastName,
        storeName,
        email,
        mobile,
        password,
      })
    );

    // GENERATE OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem("merchant_email_otp", otp);

    alert(`Verification OTP sent to email: ${otp}`);

    navigate("/otp");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fff6ed] relative">
      {/* HEADER IMAGE */}
      <header className="relative w-full">
        <img
          src={HeaderImg}
          alt="Header"
          className="w-full h-[220px] sm:h-[300px] object-cover animate-zoomOut"
        />

        {/* LANGUAGE SELECT */}
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

      {/* SIGNUP CARD */}
      <main className="flex-1 flex items-start justify-center px-4 -mt-25 z-30">
        <div className="w-full max-w-md p-[2px] rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 shadow-lg">
          <div className="bg-white rounded-xl p-8 sm:p-10 text-center space-y-4">
            <h1 className="text-2xl font-bold text-orange-500 mb-6">SIGN UP</h1>

            {/* INPUTS */}
            <div className="space-y-3 text-left">

              {/* First Name */}
              <div>
                <input
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-orange-400 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
                />
                {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
              </div>

              {/* Last Name */}
              <div>
                <input
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-orange-400 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
                />
                {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
              </div>

              {/* Store Name */}
              <div>
                <input
                  placeholder="Store Name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full border border-orange-400 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
                />
                {errors.storeName && <p className="text-red-500 text-sm">{errors.storeName}</p>}
              </div>

              {/* Email */}
              <div>
                <input
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-orange-400 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
              </div>

              {/* Mobile Number */}
              <div>
                <input
                  placeholder="Mobile Number"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  className="w-full border border-orange-400 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
                />
                {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile}</p>}
              </div>

              {/* Password */}
              <div>
                <input
                  type="password"
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-orange-400 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
                />
                {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
              </div>

            </div>

            {/* CREATE ACCOUNT BUTTON */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSignup}
              disabled={!isFormValid}
              className={`w-full mt-4 text-white py-3 rounded-xl font-semibold transition
                ${isFormValid ? "bg-orange-500 hover:bg-orange-600" : "bg-gray-300 cursor-not-allowed"}
              `}
            >
              CREATE ACCOUNT
            </motion.button>

            {/* LOGIN LINK */}
            <p className="mt-4 text-sm text-gray-600">
              Already have an account?
              <span
                onClick={() => navigate("/login")}
                className="text-orange-500 font-semibold cursor-pointer"
              >
                {" "}Log In
              </span>
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-orange-500 text-white text-center py-3 mt-auto text-sm">
        © 2025 ZatPatt • All Rights Reserved
      </footer>
    </div>
  );
}
