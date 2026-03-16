import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));

    // Verificăm dacă user-ul este logat și dacă are rol de admin
    // Presupunem că rolul 1 este Admin (bazat pe logica ta de login unde 2 era user)
    if (!token || (storedUser && storedUser.role_id !== 1)) {
      navigate("/");
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-linear-to-b from-indigo-600 to-purple-800 text-white hidden md:flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-indigo-400/30 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-indigo-600 text-sm">CS</div>
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="px-4 py-3 bg-white/10 rounded-lg cursor-pointer font-medium">Dashboard</div>
          <div className="px-4 py-3 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">Products</div>
          <div className="px-4 py-3 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">Orders</div>
          <div className="px-4 py-3 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">Customers</div>
        </nav>
        <div className="p-4 border-t border-indigo-400/30">
          <button 
            onClick={handleLogout}
            className="w-full py-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors text-sm font-medium"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold text-gray-800">Dashboard Overview</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 italic">Welcome, {user?.name || "Admin"}</span>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
              A
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Total Sales", value: "€1,240.00", color: "text-green-600" },
              { label: "Active Orders", value: "12", color: "text-indigo-600" },
              { label: "Total Products", value: "48", color: "text-purple-600" },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Recent Activity / Table Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="font-bold text-gray-800">Recent Coffee Orders</h3>
            </div>
            <div className="p-6 h-64 flex flex-col items-center justify-center text-gray-400 border-dashed border-2 border-gray-50 m-4 rounded-lg">
              <p>No recent orders to display.</p>
              <button className="mt-2 text-indigo-500 hover:underline text-sm font-medium">
                Refresh data
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}