import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPen,
  faTrash,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import LogoutButton from "../components/LogoutButton";
import SearchBar from "../components/SearchBar";
import ViewBaristaModal from "../components/ViewBaristaModal";
import EditBaristaModal from "../components/EditBaristaModal";
import DeleteBaristaModal from "../components/DeleteBaristaModal";
import AddBaristaModal from "../components/AddBaristaModal";

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
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [viewBarista, setViewBarista] = useState(null);
  const [editBarista, setEditBarista] = useState(null);
  const [deleteBarista, setDeleteBarista] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

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
    const q = searchQuery.toLowerCase();
    return (
      b.firstName?.toLowerCase().includes(q) ||
      b.lastName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {storeName ?? "..."} Dashboard
        </h2>
        <div className="flex items-center gap-4">
          <LogoutButton onClick={handleLogout} />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-6 max-w-3xl w-full mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Baristas{" "}
            <span className="text-sm font-normal text-gray-400">
              ({baristas.length})
            </span>
          </h3>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Add Barista
          </button>
        </div>

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search baristas..."
        />

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
              {searchQuery
                ? "No baristas match your search."
                : "No baristas yet."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Barista", "Actions"].map((h) => (
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
                    <td className="px-5 py-3">
                      <span className="font-medium text-gray-800">
                        {b.firstName} {b.lastName}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          title="View"
                          className="text-blue-400 hover:text-blue-700 transition-colors"
                          onClick={() => setViewBarista(b)}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          title="Edit"
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          onClick={() => setEditBarista(b)}
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button
                          title="Delete"
                          className="text-blue-800 hover:text-red-600 transition-colors"
                          onClick={() => setDeleteBarista(b)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modals */}
      <ViewBaristaModal
        barista={viewBarista}
        onClose={() => setViewBarista(null)}
      />
      <EditBaristaModal
        barista={editBarista}
        onClose={() => setEditBarista(null)}
        onUpdated={fetchBaristas}
      />
      <DeleteBaristaModal
        barista={deleteBarista}
        onClose={() => setDeleteBarista(null)}
        onDeleted={fetchBaristas}
      />
      <AddBaristaModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={fetchBaristas}
      />
    </div>
  );
}
