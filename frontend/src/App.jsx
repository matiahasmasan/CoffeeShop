import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ProtectedRoute } from "./middleware/auth.jsx";
import "./App.css";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Wallet from "./pages/Wallet";
import Map from "./pages/Map";
import Settings from "./pages/Settings";
import CardDetail from "./pages/CardDetail";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AddStore from "./pages/AddStore.jsx";
import QRPage from "./pages/QRPage.jsx";
import Cards from "./pages/Cards.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/qr" element={<QRPage />} />

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

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
