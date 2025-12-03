// src/pages/OtpPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function OtpPage() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Get signup temp info (email, names, store)
  const signupData = JSON.parse(localStorage.getItem("merchant_signup_temp") || "{}");
  const email = signupData.email || "your email";

  // Timer logic
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleVerify = () => {
    const storedOtp = localStorage.getItem("merchant_email_otp");

    if (otp === storedOtp) {
      // OTP correct → Save complete profile permanently
      localStorage.setItem(
        "merchant_profile",
        JSON.stringify({
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          storeName: signupData.storeName,
          email: signupData.email,
          password: signupData.password,
        })
      );

      // Mark authenticated
      localStorage.setItem("merchant_auth", "true");

      // Remove temp data
      localStorage.removeItem("merchant_signup_temp");
      localStorage.removeItem("merchant_email_otp");

      navigate("/dashboard");
    } else {
      setError("Invalid OTP");
    }
  };

  const handleResend = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem("merchant_email_otp", newOtp);
    alert(`OTP resent to email: ${newOtp}`);

    setTimer(30);
    setCanResend(false);
    setOtp("");
  };

  return (
    <div className="min-h-screen bg-[#fff6ed] flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-sm p-[2px] rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 shadow-lg">

        <motion.div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-700 mb-2">We have sent a verification code to</p>
          <p className="text-black font-semibold text-lg mb-4">{email}</p>

          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter 6-digit OTP"
            className="w-full border border-orange-400 rounded-xl px-3 py-2 text-center focus:ring-2 focus:ring-orange-400 outline-none"
          />

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleVerify}
            className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold"
          >
            Verify OTP
          </motion.button>

          <div className="mt-3 text-sm text-gray-600">
            {canResend ? (
              <button onClick={handleResend} className="text-orange-500 font-semibold hover:underline">
                Resend OTP
              </button>
            ) : (
              <span>Resend OTP in {timer}s</span>
            )}
          </div>

          <button
            onClick={() => navigate("/signup")}
            className="mt-3 text-orange-500 hover:underline text-sm"
          >
            Change Email
          </button>
        </motion.div>
      </div>
    </div>
  );
}
