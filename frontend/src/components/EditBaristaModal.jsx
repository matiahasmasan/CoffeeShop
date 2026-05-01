import React, { useEffect, useState } from "react";
import Modal from "./Modal";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export default function EditBaristaModal({ barista, onClose, onUpdated }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Populate fields when the barista prop changes
  useEffect(() => {
    if (barista) {
      setForm({
        firstName: barista.firstName ?? "",
        lastName: barista.lastName ?? "",
        email: barista.email ?? "",
        phone: barista.phone ?? "",
      });
      setError(null);
    }
  }, [barista]);

  if (!barista) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${API}/api/owner/baristas/${barista.id}`, {
        method: "PUT",
        headers: authHeader(),
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.mesaj ?? "Failed to update barista.");
        return;
      }

      onUpdated();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, name, type = "text", placeholder }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
      />
    </div>
  );

  return (
    <Modal isOpen={!!barista} onClose={onClose} title="Edit Barista" size="md">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <InputField label="First Name" name="firstName" placeholder="John" />
          <InputField label="Last Name" name="lastName" placeholder="Doe" />
        </div>
        <InputField
          label="Email"
          name="email"
          type="email"
          placeholder="john@example.com"
        />
        <InputField label="Phone" name="phone" placeholder="+40 700 000 000" />

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </Modal>
  );
}
