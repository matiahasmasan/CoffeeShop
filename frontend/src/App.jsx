import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ProtectedRoute } from "./middleware/auth.jsx";
import "./App.css";

const API = import.meta.env.VITE_API_URL;

// Function for deleting expired or invalid token from localStorage
// and redirection to /login
function useSessionGuard() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/api/likes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          if (window.location.pathname !== "/login") {
            window.location.replace("/login");
          }
        }
      })
      .catch(() => {});
  }, []);
}
import Register from "./pages/Register";
import Login from "./pages/Login";
import Wallet from "./pages/Wallet";
import Map from "./pages/Map";
import Settings from "./pages/Settings";
import CardDetail from "./pages/CardDetail";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminTransactions from "./pages/AdminTransactions.jsx";
import OwnerDashboard from "./pages/OwnerDashboard.jsx";
import OwnerMenu from "./pages/OwnerMenu.jsx";
import BaristaDashboard from "./pages/BaristaDashboard.jsx";
import AddStore from "./pages/AddStore.jsx";
import QRPage from "./pages/QRPage.jsx";
import Cards from "./pages/Cards.jsx";

function App() {
  useSessionGuard();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/qr" element={<QRPage />} />
        <Route
          path="/owner-dashboard"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/menu"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <OwnerMenu />
            </ProtectedRoute>
          }
        />

        <Route
          path="/barista-dashboard"
          element={
            <ProtectedRoute allowedRoles={[4]}>
              <BaristaDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute allowedRoles={[2]}>
              <Wallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cards"
          element={
            <ProtectedRoute>
              <Cards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <Map />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/card/:id"
          element={
            <ProtectedRoute>
              <CardDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/adminDashboard"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/add-store"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <AddStore />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/edit-store/:id"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <AddStore />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/transactions"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <AdminTransactions />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
