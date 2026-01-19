//src\components\PageHeader.jsx
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PageHeader({ title }) {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white py-4 px-5 flex items-center justify-between rounded-none shadow-none">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="bg-white text-black rounded-full p-2 shadow-md hover:bg-gray-100 transition"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Title */}
      <h1 className="text-lg font-semibold flex-1 text-center pr-10">
        {title}
      </h1>
    </div>
  );
}
