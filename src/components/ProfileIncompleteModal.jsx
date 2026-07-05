// src/components/ProfileIncompleteModal.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function ProfileIncompleteModal({
  open,
  onClose,
  message = "Please complete your profile details before you can use this feature or take your store online.",
}) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Complete Your Profile
        </h3>

        <p className="text-sm text-gray-600 mb-5">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              navigate("/profile");
            }}
            className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 text-white font-medium"
          >
            Go to Profile
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border text-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}