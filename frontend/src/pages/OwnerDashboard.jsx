import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8">
        <h2 className="text-xl font-semibold text-gray-800">
          Owner Dashboard (Magazin: {user?.store_id})
        </h2>
        <div className="flex items-center gap-4">
          <LogoutButton onClick={handleLogout} />
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 text-lg">
            <span className="text-sm text-gray-600 italic">
              Welcome, {user?.firstName || "Owner"}
            </span>
          </h3>
        </div>
      </main>
    </div>
  );
}
