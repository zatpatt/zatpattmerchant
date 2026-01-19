//src\pages\OtpPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";

export default function OtpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // get email stored during signup
  const pending = JSON.parse(localStorage.getItem("merchant_signup_temp") || "{}");
  const email = location.state?.email || pending.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);

  const [resendTimer, setResendTimer] = useState(30);
  const [verifying, setVerifying] = useState(false);

  // countdown for resend OTP
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // handle OTP changes
  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const token = otp.join("");

    if (token.length !== 6) {
      alert("Enter the 6-digit OTP sent to your email.");
      return;
    }

    setVerifying(true);

    // 🔥 VERIFY OTP USING SUPABASE
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    setVerifying(false);

    if (error) {
      alert("Invalid OTP. Try again.");
      return;
    }

    // SUCCESS — save auth
    localStorage.setItem("merchant_auth", "true");
    localStorage.removeItem("merchant_signup_temp");

    navigate("/dashboard");
  };

  // resend OTP
  const handleResend = async () => {
    await supabase.auth.resend({
      type: "signup",
      email,
    });

    setResendTimer(30);
    alert("OTP resent to your email.");
  };

  return (
    <div className="min-h-screen bg-[#fff6ed] flex justify-center items-center px-6">
      <div className="w-full max-w-sm p-[2px] rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 shadow-lg">

        <motion.div className="bg-white rounded-xl p-8 text-center">

          <p className="text-gray-700 mb-2">Enter the verification code sent to:</p>
          <p className="text-black font-semibold text-lg mb-4">{email}</p>

          {/* OTP INPUT BOXES */}
          <div className="flex justify-center space-x-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                value={digit}
                maxLength="1"
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-10 h-10 border text-lg text-center rounded-md border-gray-300 focus:border-orange-500"
              />
            ))}
          </div>

          {/* VERIFY BUTTON */}
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold"
          >
            {verifying ? "Verifying..." : "Verify OTP"}
          </button>

          {/* RESEND SECTION */}
          <div className="mt-3 text-sm text-gray-600">
            {resendTimer > 0 ? (
              <span>Resend OTP in {resendTimer}s</span>
            ) : (
              <button
                onClick={handleResend}
                className="text-orange-500 underline font-semibold"
              >
                Resend OTP
              </button>
            )}
          </div>

          <button
            onClick={() => navigate("/signup")}
            className="mt-3 text-orange-500 underline text-sm"
          >
            Change Email
          </button>

        </motion.div>
      </div>
    </div>
  );
}
