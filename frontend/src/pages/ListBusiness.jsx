import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

const STEPS = ["Business details", "Menu", "Review"];

const DETAIL_FIELDS = [
  { name: "name", label: "Name *", required: true },
  { name: "address", label: "Address *", required: true },
  { name: "description", label: "Description", textarea: true },
  { name: "hours", label: "Hours (e.g. Mon-Fri 08:00-22:00)" },
  { name: "phone", label: "Phone" },
  { name: "email", label: "Email" },
  { name: "instagram", label: "Instagram URL" },
  { name: "facebook", label: "Facebook URL" },
  { name: "website", label: "Website URL" },
  { name: "maps_link", label: "Google Maps URL" },
];

export default function ListBusiness() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [pendingImages, setPendingImages] = useState([]); // { file, previewUrl }
  const [menu, setMenu] = useState([]); // [{ name, items: [{ name, description, price, available }] }]

  const [form, setForm] = useState({
    name: "",
    address: "",
    logo_url: "",
    description: "",
    hours: "",
    phone: "",
    email: "",
    instagram: "",
    facebook: "",
    website: "",
    maps_link: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ---------- Images ---------- */
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mesaj || "Error uploading image.");
      setForm((prev) => ({ ...prev, logo_url: data.url }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingImages((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeGalleryImage = (index) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---------- Menu builder ---------- */
  const addCategory = () => {
    setMenu((prev) => [...prev, { name: "", items: [] }]);
  };

  const removeCategory = (ci) => {
    setMenu((prev) => prev.filter((_, i) => i !== ci));
  };

  const updateCategoryName = (ci, value) => {
    setMenu((prev) =>
      prev.map((cat, i) => (i === ci ? { ...cat, name: value } : cat)),
    );
  };

  const addItem = (ci) => {
    setMenu((prev) =>
      prev.map((cat, i) =>
        i === ci
          ? {
              ...cat,
              items: [
                ...cat.items,
                { name: "", description: "", price: "", available: true },
              ],
            }
          : cat,
      ),
    );
  };

  const removeItem = (ci, ii) => {
    setMenu((prev) =>
      prev.map((cat, i) =>
        i === ci
          ? { ...cat, items: cat.items.filter((_, j) => j !== ii) }
          : cat,
      ),
    );
  };

  const updateItem = (ci, ii, field, value) => {
    setMenu((prev) =>
      prev.map((cat, i) =>
        i === ci
          ? {
              ...cat,
              items: cat.items.map((it, j) =>
                j === ii ? { ...it, [field]: value } : it,
              ),
            }
          : cat,
      ),
    );
  };

  /* ---------- Step navigation ---------- */
  const goNext = () => {
    setError(null);
    if (step === 1) {
      if (!form.name.trim() || !form.address.trim()) {
        setError("Name and address are required.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      const links = {};
      if (form.instagram) links.instagram = form.instagram;
      if (form.facebook) links.facebook = form.facebook;
      if (form.website) links.website = form.website;

      const cleanMenu = menu
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name.trim(),
          items: c.items
            .filter((it) => it.name.trim())
            .map((it) => ({
              name: it.name.trim(),
              description: it.description.trim() || null,
              price: Number(it.price) || 0,
              available: it.available,
            })),
        }));

      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        logo_url: form.logo_url || null,
        description: form.description || null,
        hours: form.hours || null,
        phone: form.phone || null,
        email: form.email || null,
        links: Object.keys(links).length > 0 ? JSON.stringify(links) : null,
        maps_link: form.maps_link || null,
        menu: cleanMenu,
      };

      const res = await fetch(`${API}/api/stores/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mesaj || "Error submitting request.");

      const storeId = data.id;
      if (pendingImages.length > 0 && storeId) {
        const formData = new FormData();
        pendingImages.forEach(({ file }) => formData.append("images", file));
        await fetch(`${API}/api/stores/${storeId}/images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Success screen ---------- */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-green-100 flex items-center justify-center text-2xl">
            ✓
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Request submitted!
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Your coffee shop will become visible once an administrator approves
            it. You will be upgraded to an owner account after approval.
          </p>
          <button
            onClick={() => navigate("/settings")}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm font-medium text-white"
          >
            Back to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8">
        <h2 className="text-xl font-semibold text-gray-800">
          List your business
        </h2>
        <button
          onClick={() => navigate("/settings")}
          className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-600"
        >
          ← Back
        </button>
      </header>

      <main className="flex-1 p-8 max-w-2xl mx-auto w-full">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((label, i) => {
            const index = i + 1;
            const active = index === step;
            const done = index < step;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      active
                        ? "bg-indigo-600 text-white"
                        : done
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {done ? "✓" : index}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      active ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < STEPS.length && (
                  <div className="flex-1 h-px bg-gray-200 mx-3" />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* STEP 1 — Business details */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Logo
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {form.logo_url && (
                  <img
                    src={form.logo_url}
                    alt="Logo preview"
                    className="mt-2 h-16 w-16 object-cover rounded-lg border border-gray-200"
                  />
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Gallery Images
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleGallerySelect}
                  className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {pendingImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pendingImages.map(({ previewUrl }, i) => (
                      <div key={i} className="relative">
                        <img
                          src={previewUrl}
                          alt={`Gallery ${i + 1}`}
                          className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(i)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {DETAIL_FIELDS.map(({ name, label, required, textarea }) => (
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
                      type="text"
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      required={required}
                      className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* STEP 2 — Menu */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-gray-500">
                Add your menu now, or skip this step and set it up later from
                your owner dashboard.
              </p>

              {menu.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                  No menu categories yet. This step is optional.
                </div>
              )}

              {menu.map((category, ci) => (
                <div
                  key={ci}
                  className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Category name (e.g. Coffee)"
                      value={category.name}
                      onChange={(e) => updateCategoryName(ci, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={() => removeCategory(ci)}
                      className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>

                  {category.items.map((item, ii) => (
                    <div
                      key={ii}
                      className="bg-gray-50 rounded-lg p-3 flex flex-col gap-2"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(ci, ii, "name", e.target.value)
                          }
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(ci, ii, "price", e.target.value)
                          }
                          className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(ci, ii, "description", e.target.value)
                        }
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={item.available}
                            onChange={(e) =>
                              updateItem(
                                ci,
                                ii,
                                "available",
                                e.target.checked,
                              )
                            }
                          />
                          Available
                        </label>
                        <button
                          type="button"
                          onClick={() => removeItem(ci, ii)}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Delete item
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addItem(ci)}
                    className="self-start text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    + Add item
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addCategory}
                className="self-start px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
              >
                + Add category
              </button>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-base font-semibold text-gray-800">
                Review your submission
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {DETAIL_FIELDS.map(({ name, label }) => (
                  <div key={name} className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {label.replace(" *", "")}
                    </span>
                    <span className="text-sm text-gray-700 break-words">
                      {form[name] || "—"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Images
                </span>
                <span className="text-sm text-gray-700">
                  {form.logo_url ? "1 logo" : "no logo"} ·{" "}
                  {pendingImages.length} gallery image
                  {pendingImages.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Menu
                </span>
                {menu.filter((c) => c.name.trim()).length === 0 ? (
                  <span className="text-sm text-gray-500">
                    No menu added (you can add it later).
                  </span>
                ) : (
                  menu
                    .filter((c) => c.name.trim())
                    .map((c, i) => (
                      <span key={i} className="text-sm text-gray-700">
                        {c.name} —{" "}
                        {c.items.filter((it) => it.name.trim()).length} item
                        {c.items.filter((it) => it.name.trim()).length === 1
                          ? ""
                          : "s"}
                      </span>
                    ))
                )}
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-indigo-700">
                Your request will be reviewed by an administrator before the
                coffee shop becomes visible.
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-6 mt-2 border-t border-gray-100">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-600"
              >
                Back
              </button>
            )}
            {step < STEPS.length ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm font-medium text-white"
              >
                {step === 2 && menu.length === 0 ? "Skip" : "Next"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg transition-colors text-sm font-medium text-white"
              >
                {loading ? "Submitting..." : "Submit request"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
