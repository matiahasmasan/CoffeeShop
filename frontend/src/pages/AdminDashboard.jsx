import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCards } from "../data/cards";
import LogoutButton from "../components/LogoutButton";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [users, setUsers] = useState([]);
  const [managingStoreId, setManagingStoreId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!token || (storedUser && storedUser.role_id !== 1)) {
      navigate("/");
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      const data = await getCards();
      setStores(data);
      setLoading(false);
    };
    fetchStores();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error("Eroare preluare utilizatori", err);
      }
    };
    if (user?.role_id === 1) {
      fetchUsers();
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const toggleRow = (idx) => {
    setExpandedRow(expandedRow === idx ? null : idx);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ești sigur că vrei să ștergi acest magazin?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/stores/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Eroare la ștergere.");
      setStores((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignOwner = async (storeId) => {
    if (!selectedUserId) {
      alert("Te rog să alegi un utilizator.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/store-staff", {
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
        alert("Utilizator asociat cu succes!");
        setManagingStoreId(null);
        setSelectedUserId("");
      } else {
        alert(data.mesaj || "Eroare la asociere.");
      }
    } catch (err) {
      alert("Eroare de conexiune la server.");
    }
  };

  const PRIMARY_KEYS = ["id", "name", "address"];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8">
        <h2 className="text-xl font-semibold text-gray-800">
          CoffeeShop Dashboard
        </h2>
        <div className="flex items-center gap-4">
          <LogoutButton onClick={handleLogout} />
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate("/admin/add-store")}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm font-medium text-white"
          >
            + Adaugă Magazin
          </button>
        </div>

        {/* <div className="flex items-center mb-4">
          <button
            onClick={() => navigate("/admin/add-store")}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm font-medium text-white"
          >
            + Adaugă Magazin
          </button>
        </div> */}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg">Shops</h3>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-400">Se încarcă...</div>
          ) : stores.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              No existing shops.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 font-semibold tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 font-semibold tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 font-semibold tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 font-semibold tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 font-semibold tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 font-semibold tracking-wider">
                      Edit
                    </th>
                    <th className="px-6 py-3 font-semibold tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stores.slice(0, visibleCount).map((store, idx) => {
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
                          <td className="px-6 py-4 text-gray-700 font-mono text-xs">
                            {store.id ?? "-"}
                          </td>
                          <td className="px-6 py-4 text-gray-800 font-medium">
                            {store.name ?? "-"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {store.address ?? "-"}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleRow(idx)}
                              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                                isExpanded
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
                              }`}
                            >
                              {isExpanded ? "▲ Ascunde" : "▼ Mai mult"}
                            </button>
                          </td>
                          <td className="px-6 py-4">
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
                                onClick={() => setManagingStoreId(store.id)}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
                              >
                                Gestionare Owner
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() =>
                                navigate(`/admin/edit-store/${store.id}`)
                              }
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all"
                            >
                              Editează
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDelete(store.id)}
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                            >
                              Șterge
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr
                            key={`details-${idx}`}
                            className="bg-indigo-50/40"
                          >
                            <td colSpan={7} className="px-8 py-4">
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
                                    Nu există informații suplimentare.
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
              {visibleCount < stores.length && (
                <div className="p-4 border-t border-gray-100 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 5)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Afișează mai multe ({stores.length - visibleCount} rămase)
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
