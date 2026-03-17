import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCards } from "../data/cards";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard Overview</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 italic">Welcome, {user?.name || "Admin"}</span>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
            A
          </div>
          <button
            onClick={handleLogout}
            className="py-2 px-4 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors text-sm font-medium text-red-700"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg">Magazine</h3>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-400">Se încarcă...</div>
          ) : stores.length === 0 ? (
            <div className="p-6 text-center text-gray-400">Nu există magazine înregistrate.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    {Object.keys(stores[0]).map((col) => (
                      <th key={col} className="px-6 py-3 font-semibold tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stores.map((store, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      {Object.values(store).map((val, i) => (
                        <td key={i} className="px-6 py-4 text-gray-700">
                          {val ?? "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}