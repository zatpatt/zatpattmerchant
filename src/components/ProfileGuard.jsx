// src/components/ProfileGuard.jsx

import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function ProfileGuard() {

  useEffect(() => {

    toast.error(
      "Please complete your profile first"
    );

  }, []);

  return (
    <Navigate
      to="/profile"
      replace
    />
  );
}