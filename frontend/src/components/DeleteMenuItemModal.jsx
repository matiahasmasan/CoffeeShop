import React, { useState } from "react";
import Modal from "./Modal";

const API = import.meta.env.VITE_API_URL;

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export default function DeleteMenuItemModal({ item, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!item) return null;

  const handleDelete = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/owner/menu/${item.id}`, {
        method: "DELETE",
        headers: authHeader(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mesaj || "Failed to delete product.");
      }

      onDeleted?.();
      onClose();
    } catch (err) {
      console.error("Error deleting menu item:", err);
      setError(err.message || "Failed to delete product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title="Delete Product"
      size="md"
      danger
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{item.name}</span>? This action cannot
          be undone.
        </p>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
