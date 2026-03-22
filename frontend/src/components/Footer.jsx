import { useLocation, useNavigate } from "react-router-dom";
import HomeIcon from "./icons/HomeIcon";
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
        <span className="text-xs font-medium">Cards</span>
      </button>
      <button
        className={`flex flex-col items-center gap-1.5 py-3 px-5 border-none bg-none cursor-pointer transition-colors ${
          isActive("/qr") ? "text-indigo-500" : "text-gray-400"
        }`}
        onClick={() => navigate("/qr")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="3" height="3" />
          <line x1="18" y1="14" x2="21" y2="14" />
          <line x1="21" y1="14" x2="21" y2="17" />
          <line x1="18" y1="21" x2="21" y2="21" />
        </svg>
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
