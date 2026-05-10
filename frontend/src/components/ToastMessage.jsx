import React from "react";

export default function ToastMessage({ message, visible, type = "success" }) {
  if (!visible || !message) return null;

  const toneClass =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-green-200 bg-green-50 text-green-700";

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 pointer-events-none">
      <div
        className={`max-w-sm w-full rounded-xl border shadow-md px-4 py-3 text-sm font-medium ${toneClass}`}
      >
        {message}
      </div>
    </div>
  );
}
