import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

function initials(first, last) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    const s = localStorage.getItem("user");
    return s ? JSON.parse(s) : null;
  });

  const [storeName, setStoreName] = useState(null);
  const [baristas, setBaristas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?.store_id) return;
    fetch(`${API}/api/stores/${user.store_id}`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => setStoreName(d.name ?? null))
      .catch(() => {});
  }, [user?.store_id]);

  const fetchBaristas = () => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/owner/baristas`, { headers: authHeader() })
      .then((r) => {
        if (!r.ok) throw new Error("Eroare la preluarea bariștilor.");
        return r.json();
      })
      .then((d) => setBaristas(d.baristas ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBaristas();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const filtered = baristas.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.firstName?.toLowerCase().includes(q) ||
      b.lastName?.toLowerCase().includes(q) ||
      b.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8">
        <h2 className="text-xl font-semibold text-gray-800">
          {storeName ?? "..."} owner
        </h2>
        <div className="flex items-center gap-4">
          <LogoutButton onClick={handleLogout} />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
        {/* Title + search */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Baristas{" "}
            <span className="text-sm font-normal text-gray-400">
              ({baristas.length})
            </span>
          </h3>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
        </div>

        {/* Table card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16 text-gray-400 text-sm">
              Loading...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={fetchBaristas}
                className="text-sm px-4 py-1.5 bg-gray-800 text-white rounded-md hover:bg-gray-700"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex justify-center items-center py-16 text-gray-400 text-sm">
              {search ? "No baristas match your search." : "No baristas yet."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Barista", "Email", "Phone", "Member since"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    {/* Name + avatar */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {initials(b.firstName, b.lastName)}
                        </div>
                        <span className="font-medium text-gray-800">
                          {b.firstName} {b.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{b.email}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {b.phone || "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {formatDate(b.joined_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
