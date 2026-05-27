import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Sidebar from "../components/Sidebar";
import { OWNER_LINKS } from "../constants/ownerLinks";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dashboard stats (store-wide) + menu preview
  const [stats, setStats] = useState({
    scansToday: 0,
    pointsToday: 0,
    rewardsToday: 0,
    recent: [],
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/store/stats`, { headers: authHeader() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setStats(d);
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));

    fetch(`${API}/api/owner/menu`, { headers: authHeader() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.items) setMenuItems(d.items);
      })
      .catch(() => {})
      .finally(() => setMenuLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.store_id) return;
    fetch(`${API}/api/stores/${user.store_id}`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => setStoreName(d.name ?? null))
      .catch(() => {});
  }, [user?.store_id]);

  useEffect(() => {
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
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        storeName={storeName}
        links={OWNER_LINKS}
      />

      {/* Header */}
      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {storeName ?? "..."} Dashboard
        </h2>
        {/* Burger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <FontAwesomeIcon icon={faBars} className="text-lg" />
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
        {/* Welcome */}
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">
            Hello, {user?.firstName ?? "Owner"}!
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Here's how {storeName ?? "your store"} is doing today.
          </p>
        </div>

        {/* Store stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
              Scans today
            </p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {statsLoading ? "—" : stats.scansToday}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
              Points given
            </p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {statsLoading ? "—" : stats.pointsToday}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 col-span-2 sm:col-span-1">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
              Rewards claimed
            </p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {statsLoading ? "—" : stats.rewardsToday}
            </p>
          </div>
        </div>

        {/* Recent activity + Menu preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Recent activity */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">
                Recent activity
              </h4>
              <button
                onClick={() => navigate("/owner/transactions")}
                className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
              >
                View all
                <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
              </button>
            </div>
            {statsLoading ? (
              <div className="flex justify-center items-center py-12 text-gray-400 text-sm">
                Loading...
              </div>
            ) : stats.recent.length === 0 ? (
              <div className="flex justify-center items-center py-12 text-gray-400 text-sm">
                No activity yet.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {stats.recent.map((t) => {
                  const isEarn = t.type === "earn";
                  const customer =
                    [t.customerFirstName, t.customerLastName]
                      .filter(Boolean)
                      .join(" ")
                      .trim() || (t.user_id ? `#${t.user_id}` : "—");
                  const barista =
                    [t.baristaFirstName, t.baristaLastName]
                      .filter(Boolean)
                      .join(" ")
                      .trim() || "—";
                  const when = new Date(t.created_at);
                  const whenLabel = Number.isNaN(when.getTime())
                    ? ""
                    : when.toLocaleString();
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          isEarn
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {isEarn ? "Earn" : "Redeem"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {customer}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          by {barista} · {whenLabel}
                        </p>
                      </div>
                      <span
                        className={`font-mono text-sm shrink-0 ${
                          isEarn ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {isEarn ? "+" : "−"}
                        {t.points}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Menu preview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">
                Menu{" "}
                <span className="text-xs font-normal text-gray-400">
                  ({menuItems.length})
                </span>
              </h4>
              <button
                onClick={() => navigate("/owner/menu")}
                className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
              >
                Manage menu
                <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
              </button>
            </div>
            {menuLoading ? (
              <div className="flex justify-center items-center py-12 text-gray-400 text-sm">
                Loading...
              </div>
            ) : menuItems.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-3 text-sm">
                <p className="text-gray-400">No items in the menu yet.</p>
                <button
                  onClick={() => navigate("/owner/menu")}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Add first item
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {menuItems.slice(0, 5).map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {it.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {it.categoryName ?? "—"}
                        {!it.available && (
                          <span className="ml-2 text-amber-600">
                            · unavailable
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="font-mono text-sm text-gray-700 shrink-0">
                      {Number.isFinite(it.price) ? it.price.toFixed(2) : "—"}{" "}
                      lei
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Baristas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">
              Baristas{" "}
              <span className="text-xs font-normal text-gray-400">
                ({baristas.length})
              </span>
            </h4>
            <button
              onClick={() => navigate("/owner/baristas")}
              className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
            >
              Manage
              <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-12 text-gray-400 text-sm">
              Loading...
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-12 text-red-500 text-sm">
              {error}
            </div>
          ) : baristas.length === 0 ? (
            <div className="flex justify-center items-center py-12 text-gray-400 text-sm">
              No baristas yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {baristas.map((b) => {
                const initials =
                  `${b.firstName?.[0] ?? ""}${b.lastName?.[0] ?? ""}`.toUpperCase();
                return (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {b.firstName} {b.lastName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {b.email || "—"}
                        {b.phone && (
                          <span className="ml-2">· {b.phone}</span>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
