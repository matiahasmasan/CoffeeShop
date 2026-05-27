import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";
import { OWNER_LINKS } from "../constants/ownerLinks";
import { BARISTA_LINKS } from "../constants/baristaLinks";

const API = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 5;
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const fullName = (first, last) =>
  [first, last].filter(Boolean).join(" ").trim();

const formatDate = (raw) => {
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString();
};

export default function StoreTransactions() {
  const [user] = useState(() => {
    const s = localStorage.getItem("user");
    return s ? JSON.parse(s) : null;
  });

  const links = user?.role_id === 3 ? OWNER_LINKS : BARISTA_LINKS;

  const [storeName, setStoreName] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (!user?.store_id) return;
    fetch(`${API}/api/stores/${user.store_id}`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => setStoreName(d.name ?? null))
      .catch(() => {});
  }, [user?.store_id]);

  const fetchTransactions = () => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/store/transactions`, { headers: authHeader() })
      .then((r) => {
        if (!r.ok) throw new Error("Eroare la preluarea tranzacțiilor.");
        return r.json();
      })
      .then((d) => setTransactions(Array.isArray(d) ? d : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const q = searchQuery.toLowerCase();
  const filtered = transactions.filter((t) => {
    if (!q) return true;
    const customer = fullName(t.customerFirstName, t.customerLastName);
    const barista = fullName(t.baristaFirstName, t.baristaLastName);
    return (
      customer.toLowerCase().includes(q) ||
      barista.toLowerCase().includes(q) ||
      (t.type || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        storeName={storeName}
        links={links}
      />

      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
        <h2 className="text-xl font-semibold text-gray-800">Transactions</h2>
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <FontAwesomeIcon icon={faBars} className="text-lg" />
        </button>
      </header>

      <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            {storeName ? `${storeName} — transactions` : "Transactions"}{" "}
            <span className="text-sm font-normal text-gray-400">
              ({transactions.length})
            </span>
          </h3>
        </div>

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search by customer, barista or type..."
        />

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16 text-gray-400 text-sm">
              Loading...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={fetchTransactions}
                className="text-sm px-4 py-1.5 bg-gray-800 text-white rounded-md hover:bg-gray-700"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex justify-center items-center py-16 text-gray-400 text-sm">
              {searchQuery
                ? "No transactions match your search."
                : "No transactions yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      ID
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Barista
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Type
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageRows.map((t) => {
                    const customer =
                      fullName(t.customerFirstName, t.customerLastName) ||
                      (t.user_id ? `#${t.user_id}` : "—");
                    const barista =
                      fullName(t.baristaFirstName, t.baristaLastName) ||
                      (t.barista_id ? `#${t.barista_id}` : "—");
                    const isEarn = t.type === "earn";
                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                          {t.id}
                        </td>
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                          {formatDate(t.created_at)}
                        </td>
                        <td className="px-5 py-3 text-gray-800">{customer}</td>
                        <td className="px-5 py-3 text-gray-600">{barista}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              isEarn
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {isEarn ? "Earn" : "Redeem"}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-3 text-right font-mono text-sm ${
                            isEarn ? "text-emerald-700" : "text-amber-700"
                          }`}
                        >
                          {isEarn ? "+" : "−"}
                          {t.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 text-sm">
                <span className="text-gray-500">
                  Page {safePage} of {totalPages}{" "}
                  <span className="text-gray-400">
                    · {filtered.length} total
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={safePage >= totalPages}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
