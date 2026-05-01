import React, { useState } from "react";
import Modal from "./Modal";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export default function DeleteBaristaModal({ barista, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!barista) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`${API}/api/owner/baristas/${barista.id}`, {
        method: "DELETE",
        headers: authHeader(),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.mesaj ?? "Failed to delete barista.");
        return;
      }

      onDeleted();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={!!barista}
      onClose={onClose}
      title="Remove Barista"
      size="sm"
      danger
    >
      <p className="text-sm text-gray-600 leading-relaxed">
        Are you sure you want to remove{" "}
        <span className="font-semibold text-gray-800">
          {barista.firstName} {barista.lastName}
        </span>{" "}
        from your store? This action cannot be undone.
      </p>

      {error && (
        <p className="mt-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Footer */}
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onClose}
          disabled={deleting}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {deleting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Removing…
            </>
          ) : (
            "Remove"
          )}
        </button>
      </div>
    </Modal>
  );
}
