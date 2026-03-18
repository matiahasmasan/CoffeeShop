import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddStore() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    logo_url: "",
    background_url: "",
    description: "",
    hours: "",
    phone: "",
    email: "",
    instagram: "",
    facebook: "",
    website: "",
    maps_link: "",
    rating: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mesaj || "Eroare la upload.");
      setForm((prev) => ({ ...prev, [field]: data.url }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const links = {};
    if (form.instagram) links.instagram = form.instagram;
    if (form.facebook) links.facebook = form.facebook;
    if (form.website) links.website = form.website;

    const payload = {
      name: form.name,
      address: form.address,
      logo_url: form.logo_url || null,
      background_url: form.background_url || null,
      description: form.description || null,
      hours: form.hours || null,
      phone: form.phone || null,
      email: form.email || null,
      links: Object.keys(links).length > 0 ? JSON.stringify(links) : null,
      maps_link: form.maps_link || null,
      rating: form.rating || null,
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mesaj || "Eroare la adăugare.");

      navigate("/adminDashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "name", label: "Nume *", required: true },
    { name: "address", label: "Adresă *", required: true },
    { name: "description", label: "Descriere", textarea: true },
    { name: "hours", label: "Program (ex: Lun-Vin 08:00-22:00)" },
    { name: "phone", label: "Telefon" },
    { name: "email", label: "Email" },
    { name: "instagram", label: "Instagram URL" },
    { name: "facebook", label: "Facebook URL" },
    { name: "website", label: "Website URL" },
    { name: "maps_link", label: "Google Maps URL" },
    { name: "rating", label: "Rating (0-5)", type: "number" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8">
        <h2 className="text-xl font-semibold text-gray-800">Adaugă Magazin</h2>
        <button
          onClick={() => navigate("/adminDashboard")}
          className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-600"
        >
          ← Înapoi
        </button>
      </header>

      <main className="flex-1 p-8 max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Logo Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Logo
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageUpload(e, "logo_url")}
                className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
              {form.logo_url && (
                <img src={form.logo_url} alt="Logo preview" className="mt-2 h-16 w-16 object-cover rounded-lg border border-gray-200" />
              )}
            </div>

            {/* Background Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Background
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageUpload(e, "background_url")}
                className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
              {form.background_url && (
                <img src={form.background_url} alt="Background preview" className="mt-2 h-24 w-full object-cover rounded-lg border border-gray-200" />
              )}
            </div>

            {fields.map(({ name, label, required, textarea, type }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {label}
                </label>
                {textarea ? (
                  <textarea
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    required={required}
                    rows={3}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-none"
                  />
                ) : (
                  <input
                    type={type || "text"}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    required={required}
                    min={type === "number" ? 0 : undefined}
                    max={type === "number" ? 5 : undefined}
                    step={type === "number" ? 0.1 : undefined}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg transition-colors text-sm font-medium text-white"
              >
                {loading ? "Se salvează..." : "Adaugă Magazin"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/adminDashboard")}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-600"
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}