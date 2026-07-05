//src\pages\OtpPage.jsx

import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { saveAuthData } from "../utils/auth";
import { verifyOtp } from "../services/otpApi";
import api from "../services/api";
import toast from "react-hot-toast";

export default function OtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useContext(LanguageContext);

  // Get number from LoginPage (ensure it shows +91 prefix)
  const mobile = location.state?.mobile || "";

  const mobileNumber = mobile
    ? `+91 ${mobile}`
    : "+91 XXXXX XXXXX";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [resendVisible, setResendVisible] = useState(false);

  const [verifyLoading, setVerifyLoading] =
  useState(false);

  const [resendLoading, setResendLoading] =
  useState(false);

  const inputsRef = useRef([]);

  // handle OTP input and navigation
  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next box if number entered
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  // Handle backspace/delete properly
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

// paste handler: paste full code if user pastes into first box
  const handlePaste = (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    const digits = pasted.replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length === 0) return;
    const newOtp = [...otp];
    for (let i = 0; i < digits.length; i++) newOtp[i] = digits[i];
    setOtp(newOtp);
    const next = Math.min(digits.length, 5);
    inputsRef.current[next].focus();
    e.preventDefault();
  };

  // resend timer logic
  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(countdown);
    } else {
      setResendVisible(true);
    }
  }, [timer]);

// ✅ Verify handler — now redirects to /home when OTP is valid
  const handleVerify = async () => {

  // PREVENT MULTIPLE CLICKS
  if (verifyLoading) return;

  const code = otp.join("");

  if (code.length !== 6) {
    toast.error("Please enter 6 digits");
    return;
  }

  try {

    setVerifyLoading(true);

    const data =
      await verifyOtp({
        mobile:
          location.state?.mobile,
        otp: code,
      });

    if (!data.status) {

      toast.error(
      data.message ||
      "OTP verification failed"
    );
      return;
    }

    const accessToken =
      data.access ||
      data.accessToken ||
      data.token;

    const refreshToken =
      data.refresh ||
      data.refreshToken ||
      "";

    if (!accessToken) {

      toast.error(
        "Token missing in response."
      );

      return;
    }

    saveAuthData({
      access: accessToken,
      refresh: refreshToken,
      user: data.user || null,
    });

    localStorage.setItem(
        "profile_completion",
        data.profile_completion || 0
      );

      localStorage.setItem(
        "user_id",
        data.user.id
      );
      toast.success(
        "OTP verified successfully"
      );

    if (data.user?.id) {
      localStorage.setItem(
        "user_id",
        data.user.id
      );
    }

    navigate("/dashboard", {
  replace: true,
});

  } catch (err) {

    console.error(err);

    toast.error(
        "Server error. Please try again."
      );

  } finally {

  setVerifyLoading(false);

}
};


 const handleResend = async () => {

  if (
    resendLoading ||
    timer > 0
  ) return;

  try {

    setResendLoading(true);

    setTimer(30);

    setResendVisible(false);

    await api.post(
      "/api/v1/users/admin/request-otp/",
      {
        mobile:
          location.state?.mobile,
      }
    );

    toast.success(
  "OTP resent successfully"
);

  } catch (e) {

    console.error(e);

    toast.error(
      "Failed to resend OTP"
    );

    setResendVisible(true);

  } finally {

  setResendLoading(false);

}
};


  // check if all 6 digits entered
  const isOtpComplete = otp.every((digit) => digit !== "");

  
useEffect(() => {
  if (!location.state?.mobile) {
    navigate("/");
  }
}, [location.state, navigate]); // ✅ correct deps


  return (
  <div className="min-h-screen flex flex-col bg-[#fff6ed]">
    {/* 🔸 HEADER */}
<header className="bg-orange-500 text-white py-4 px-6 relative">
  {/* Minimal Back Button */}
   <button

  disabled={verifyLoading}

  onClick={() => {

    if (verifyLoading) return;

    navigate(-1);

  }}
   className={`
  absolute top-3 left-3 z-20
  p-2 rounded-full bg-white shadow
  transition

  ${
    verifyLoading
      ? "opacity-50 cursor-not-allowed pointer-events-none"
      : "hover:bg-gray-100"
  }
`}
  >
    <ArrowLeft className="w-5 h-5 text-orange-500" />
  </button>

  <h1 className="text-lg font-bold text-center">OTP Verification</h1>
</header>

    {/* MAIN BODY */}
    <div className="flex flex-col justify-center items-center flex-grow px-4">
      {/* Gradient Border Wrapper */}
      <div className="w-full max-w-md p-[2px] rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 shadow-lg">
        {/* Inner White Card */}
        <div className="bg-white rounded-xl p-8">
          <p className="text-center text-gray-600 mb-6">
            We have sent a{" "}
            <span className="font-semibold text-orange-500">
              verification code
            </span>{" "}
            to
          </p>

          <p className="text-center text-lg font-bold text-gray-800 mb-6">
            {mobileNumber}
          </p>

          {/* OTP BOXES */}
          <div className="flex justify-center space-x-3 mb-6">
            {otp.map((digit, index) => (
              <input
              disabled={verifyLoading}
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                ref={(el) => (inputsRef.current[index] = el)}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`
                  w-10 h-10 text-center
                  text-lg border border-gray-300
                  rounded-md transition-all

                  ${
                    verifyLoading
                      ? "bg-gray-100 opacity-70 cursor-not-allowed pointer-events-none"
                      : "focus:outline-none focus:border-orange-500"
                  }
                `}
              />
            ))}
          </div>

          {/* TIMER / RESEND */}
          <div className="text-center mb-6">
            {!resendVisible ? (
              <p className="text-gray-500">Resend SMS in {timer}s</p>
            ) : (
             <button
              onClick={handleResend}
              disabled={
                resendLoading ||
                timer > 0
              }
                className={`
                text-orange-500 font-semibold
                hover:underline transition-all

                ${
                  resendLoading
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : ""
                }
              `}
              >
               {
                resendLoading
                  ? "Sending..."
                  : "Resend Code"
              }
              </button>
            )}
          </div>

          {/* VERIFY BUTTON */}
          <button
            onClick={handleVerify}
            disabled={
            !isOtpComplete ||
            verifyLoading
          }
            className={`
            w-full py-2 rounded-md
            font-semibold mb-6
            transition duration-300

            ${
              isOtpComplete &&
              !verifyLoading
                ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md"
                : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-70 pointer-events-none"
            }
          `}
          >
           {
            verifyLoading
              ? "Verifying..."
              : "Verify OTP"
          }
          </button>

          {/* BACK BUTTON */}
          <div className="text-center">
            <button
            disabled={verifyLoading}
            onClick={() => {

              if (verifyLoading) return;

              navigate("/");
            }}
            
              className={`border border-orange-500 text-orange-500 px-4 py-2 rounded-md hover:bg-orange-500 hover:text-white transition duration-300
              ${
                verifyLoading
                  ? "opacity-50 cursor-not-allowed pointer-events-none"
                  : ""
              }
              `}
            >
              Go back to login methods
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

}
