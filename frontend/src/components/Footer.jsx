import { useLocation, useNavigate } from "react-router-dom";
import HomeIcon from "./icons/HomeIcon";
import CardIcon from "./icons/CardIcon";
import QRIcon from "./icons/QRIcon";
import SettingsIcon from "./icons/SettingsIcon";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex justify-around bg-white border-t border-gray-200 sticky bottom-0">
      <button
        className={`flex flex-col items-center gap-1.5 py-3 px-5 border-none bg-none cursor-pointer transition-colors ${
          isActive("/home") ? "text-indigo-500" : "text-gray-400"
        }`}
        onClick={() => navigate("/home")}
      >
        <HomeIcon />
        <span className="text-xs font-medium">Home</span>
      </button>
      <button
        className={`flex flex-col items-center gap-1.5 py-3 px-5 border-none bg-none cursor-pointer transition-colors ${
          isActive("/cards") ? "text-indigo-500" : "text-gray-400"
        }`}
        onClick={() => navigate("/cards")}
      >
        <CardIcon />
        <span className="text-xs font-medium">Cards</span>
      </button>
      <button
        className={`flex flex-col items-center gap-1.5 py-3 px-5 border-none bg-none cursor-pointer transition-colors ${
          isActive("/qr") ? "text-indigo-500" : "text-gray-400"
        }`}
        onClick={() => navigate("/qr")}
      >
        <QRIcon />
        <span className="text-xs font-medium">QR</span>
      </button>
<button
        className={`flex flex-col items-center gap-1.5 py-3 px-5 border-none bg-none cursor-pointer transition-colors ${
          isActive("/settings") ? "text-indigo-500" : "text-gray-400"
        }`}
        onClick={() => navigate("/settings")}
      >
        <SettingsIcon />
        <span className="text-xs font-medium">Settings</span>
      </button>
    </div>
  );
}
