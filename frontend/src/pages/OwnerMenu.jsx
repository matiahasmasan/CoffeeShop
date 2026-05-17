import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPen,
  faTrash,
  faPlus,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import SearchBar from "../components/SearchBar";
import Sidebar from "../components/Sidebar";
import ViewMenuItemModal from "../components/ViewMenuItemModal";
import EditMenuItemModal from "../components/EditMenuItemModal";
import DeleteMenuItemModal from "../components/DeleteMenuItemModal";
import { OWNER_LINKS } from "../constants/ownerLinks";

const API = import.meta.env.VITE_API_URL;

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export default function OwnerMenu() {
  const [user] = useState(() => {
    const s = localStorage.getItem("user");
    return s ? JSON.parse(s) : null;
  });

  const [storeName, setStoreName] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal state
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    if (!user?.store_id) return;
    fetch(`${API}/api/stores/${user.store_id}`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => setStoreName(d.name ?? null))
      .catch(() => {});
  }, [user?.store_id]);

  const fetchMenuItems = () => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/owner/menu`, { headers: authHeader() })
      .then((r) => {
        if (!r.ok) throw new Error("Eroare la preluarea meniurilor.");
        return r.json();
      })
      .then((d) => setMenuItems(d.items ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const filtered = menuItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.categoryName?.toLowerCase().includes(q)
    );
  });

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
          {storeName ?? "..."} - Menu Management
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Menu Items{" "}
            <span className="text-sm font-normal text-gray-400">
              ({menuItems.length})
            </span>
          </h3>
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Add Product
          </button>
        </div>

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search products..."
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
                onClick={fetchMenuItems}
                className="text-sm px-4 py-1.5 bg-gray-800 text-white rounded-md hover:bg-gray-700"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex justify-center items-center py-16 text-gray-400 text-sm">
              {searchQuery
                ? "No products match your search."
                : "No products yet."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Product Name
                  </th>
                  <th className="hidden md:table-cell text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="hidden sm:table-cell text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Price
                  </th>
                  <th className="hidden lg:table-cell text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Description
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="font-medium text-gray-800">
                        {item.name}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-5 py-3 text-gray-600">
                      {item.categoryName || "—"}
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3 text-gray-600 font-semibold">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="hidden lg:table-cell px-5 py-3 text-gray-600 text-xs">
                      {item.description
                        ? item.description.substring(0, 50) + "..."
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          item.available
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.available ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          title="View"
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => setViewItem(item)}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          title="Edit"
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => setEditItem(item)}
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button
                          title="Delete"
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          onClick={() => setDeleteItem(item)}
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
      <ViewMenuItemModal item={viewItem} onClose={() => setViewItem(null)} />
      <EditMenuItemModal
        item={editItem}
        onClose={() => setEditItem(null)}
        onUpdated={fetchMenuItems}
      />
      <DeleteMenuItemModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onDeleted={fetchMenuItems}
      />
    </div>
  );
}
