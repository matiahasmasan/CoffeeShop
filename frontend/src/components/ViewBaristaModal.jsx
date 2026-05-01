import React from "react";
import Modal from "./Modal";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export default function ViewBaristaModal({ barista, onClose }) {
  if (!barista) return null;

  const joinedDate = barista.joined_at
    ? new Date(barista.joined_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const Field = ({ label, value }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-gray-800">{value || "—"}</span>
    </div>
  );

  // Initials avatar
  const initials =
    `${barista.firstName?.[0] ?? ""}${barista.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <Modal
      isOpen={!!barista}
      onClose={onClose}
      title="Barista Details"
      size="md"
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-white text-lg font-semibold shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-base font-semibold text-gray-800">
            {barista.firstName} {barista.lastName}
          </p>
          <span className="text-xs text-gray-400">Barista</span>
        </div>
      </div>

      {/* Info fields */}
      <div className="grid grid-cols-1 divide-y divide-gray-100">
        <div className="flex flex-col gap-0.5 pb-4">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Email
          </span>
          <span className="text-sm text-gray-800">{barista.email || "—"}</span>
        </div>

        <div className="flex flex-col gap-0.5 py-4">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Phone
          </span>
          <span className="text-sm text-gray-800">{barista.phone || "—"}</span>
        </div>

        <div className="flex flex-col gap-0.5 pt-4">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Joined
          </span>
          <span className="text-sm text-gray-800">{joinedDate}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
