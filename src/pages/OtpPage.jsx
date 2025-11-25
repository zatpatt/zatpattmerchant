import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function OtpPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const stored = JSON.parse(localStorage.getItem("merchant_profile") || "{}");
  const mobile = stored.mobile || "";

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleVerify = () => {
    const storedOtp = localStorage.getItem("merchant_otp");
    if (otp === storedOtp) {
      localStorage.setItem("merchant_auth", "true");
      navigate("/dashboard");
    } else {
      setError("Invalid OTP");
    }
  };

  const handleResend = () => {
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    localStorage.setItem("merchant_otp", newOtp);
    alert(`OTP resent: ${newOtp}`);
    setTimer(30);
    setCanResend(false);
    setOtp("");
  };

  return (
    <div className="min-h-screen bg-[#fff6ed] flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-sm p-[2px] rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 shadow-lg">
        <motion.div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-700 mb-2">We have sent a verification code to</p>
          <p className="text-black font-semibold text-lg mb-4">+91 {mobile}</p>

          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="0000"
            className="w-full border border-orange-400 rounded-xl px-3 py-2 text-center focus:ring-2 focus:ring-orange-400 outline-none"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <motion.button whileTap={{ scale: 0.95 }} onClick={handleVerify} className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold">
            Verify OTP
          </motion.button>

          <div className="mt-3 text-sm text-gray-600">
            {canResend ? (
              <button onClick={handleResend} className="text-orange-500 font-semibold hover:underline">Resend OTP</button>
            ) : (
              <span>Resend SMS in {timer}s</span>
            )}
          </div>

          <button onClick={() => navigate("/")} className="mt-3 text-orange-500 hover:underline">Change Number</button>
        </motion.div>
      </div>
    </div>
  );
}
