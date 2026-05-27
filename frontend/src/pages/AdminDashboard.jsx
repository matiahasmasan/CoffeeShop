import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faPlus } from "@fortawesome/free-solid-svg-icons";
import { getCards } from "../data/cards";
import SearchBar from "../components/SearchBar";
import Sidebar from "../components/Sidebar";
import { ADMIN_LINKS } from "../constants/adminLinks";

const API = import.meta.env.VITE_API_URL;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [users, setUsers] = useState([]);
  const [managingStoreId, setManagingStoreId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingStores, setPendingStores] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!token || (storedUser && storedUser.role_id !== 1)) {
      navigate("/");
    } else {
      setUser(storedUser);
    }
  }, [navigate]);
  // test
  const refreshStores = async () => {
    const { stores } = await getCards({ limit: 1000 });
    setStores(stores);
  };

  const fetchPending = async () => {
    setPendingLoading(true);
    const { stores } = await getCards({ status: "pending", limit: 1000 });
    setPendingStores(stores);
    setPendingLoading(false);
  };

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      await refreshStores();
      setLoading(false);
    };
    fetchStores();
    fetchPending();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error("Error fetching users", err);
      }
    };
    if (user?.role_id === 1) {
      fetchUsers();
    }
  }, [user]);

  const handleLogout = () => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    localStorage.clear();
    if (rememberedEmail) {
      localStorage.setItem("rememberedEmail", rememberedEmail);
    }
    navigate("/");
  };

  const toggleRow = (idx) => {
    setExpandedRow(expandedRow === idx ? null : idx);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this store?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/stores/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error deleting store.");
      setStores((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleModerate = async (id, action) => {
    const label = action === "approve" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${label} this submission?`))
      return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/stores/${id}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mesaj || "Action failed.");
      setPendingStores((prev) => prev.filter((s) => s.id !== id));
      if (action === "approve") {
        await refreshStores();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignOwner = async (storeId) => {
    if (!selectedUserId) {
      alert("Please select a user.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/store-staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: selectedUserId,
          store_id: storeId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("User assigned successfully!");
        const assignedUser = users.find(
          (u) => u.id === parseInt(selectedUserId, 10),
        );
        if (assignedUser) {
          setStores((prevStores) =>
            prevStores.map((store) =>
              store.id === storeId
                ? {
                    ...store,
                    owner_id: assignedUser.id,
                    ownerFirstName: assignedUser.firstName,
                    ownerLastName: assignedUser.lastName,
                  }
                : store,
            ),
          );
        }
        setManagingStoreId(null);
        setSelectedUserId("");
      } else {
        alert(data.mesaj || "Error assigning user.");
      }
    } catch (err) {
      alert("Connection error. Please try again.");
    }
  };

  const PRIMARY_KEYS = ["id", "name", "address"];

  const filteredStores = stores.filter((store) =>
    (store.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        storeName="Admin"
        links={ADMIN_LINKS}
      />

      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
        <h2 className="text-xl font-semibold text-gray-800">Admin Dashboard</h2>
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <FontAwesomeIcon icon={faBars} className="text-lg" />
        </button>
      </header>

      <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Shops{" "}
            <span className="text-sm font-normal text-gray-400">
              ({stores.length})
            </span>
          </h3>
          <button
            onClick={() => navigate("/admin/add-store")}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Add Store
          </button>
        </div>

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search shops..."
        />
        {/* Pending business submissions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg">
              Pending submissions
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({pendingStores.length})
              </span>
            </h3>
          </div>

          {pendingLoading ? (
            <div className="p-6 text-center text-gray-400">Loading...</div>
          ) : pendingStores.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              No pending submissions.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {pendingStores.map((store) => (
                <li
                  key={store.id}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {store.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {store.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleModerate(store.id, "approve")}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleModerate(store.id, "reject")}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16 text-gray-400 text-sm">
              Loading...
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="flex justify-center items-center py-16 text-gray-400 text-sm">
              {searchQuery
                ? "No shops match your search."
                : "No existing shops."}
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
                      Name
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Address
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Details
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Owner
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Edit
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStores.slice(0, visibleCount).map((store, idx) => {
                    const isExpanded = expandedRow === idx;

                    const extraEntries = Object.entries(store).filter(
                      ([key]) => !PRIMARY_KEYS.includes(key),
                    );

                    return (
                      <React.Fragment key={idx}>
                        <tr
                          key={`row-${idx}`}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-5 py-3 text-gray-700 font-mono text-xs">
                            {store.id ?? "-"}
                          </td>
                          <td className="px-5 py-3 text-gray-800 font-medium">
                            {store.name ?? "-"}
                          </td>
                          <td className="px-5 py-3 text-gray-600">
                            {store.address ?? "-"}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => toggleRow(idx)}
                              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                                isExpanded
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
                              }`}
                            >
                              {isExpanded ? "▲ Hide" : "▼ More"}
                            </button>
                          </td>
                          <td className="px-5 py-3">
                            {managingStoreId === store.id ? (
                              <div className="flex flex-col gap-2 min-w-[160px]">
                                <select
                                  value={selectedUserId}
                                  onChange={(e) =>
                                    setSelectedUserId(e.target.value)
                                  }
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                  <option value="">-- Choose an user --</option>
                                  {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.firstName} {u.lastName} ({u.email})
                                    </option>
                                  ))}
                                </select>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleAssignOwner(store.id)}
                                    className="flex-1 px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setManagingStoreId(null);
                                      setSelectedUserId("");
                                    }}
                                    className="flex-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setManagingStoreId(store.id);
                                  setSelectedUserId(
                                    store.owner_id
                                      ? String(store.owner_id)
                                      : "",
                                  );
                                }}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
                              >
                                {store.ownerFirstName
                                  ? `${store.ownerFirstName} ${store.ownerLastName}`
                                  : "Manage Owner"}
                              </button>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() =>
                                navigate(`/admin/edit-store/${store.id}`)
                              }
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all"
                            >
                              Edit
                            </button>
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => handleDelete(store.id)}
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr
                            key={`details-${idx}`}
                            className="bg-indigo-50/40"
                          >
                            <td colSpan={7} className="px-6 py-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                                {extraEntries.length > 0 ? (
                                  extraEntries.map(([key, val]) => (
                                    <div
                                      key={key}
                                      className="flex flex-col gap-0.5 min-w-0"
                                    >
                                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                        {key}
                                      </span>
                                      <span className="text-sm text-gray-700 break-all">
                                        {val ?? "-"}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-sm text-gray-400 italic">
                                    No additional information.
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              {visibleCount < filteredStores.length && (
                <div className="p-4 border-t border-gray-200 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 5)}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Show more ({filteredStores.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
