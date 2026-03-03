import { useLocation, useNavigate } from "react-router-dom";
import HomeIcon from "./icons/HomeIcon";
import MapIcon from "./icons/MapIcon";
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
          isActive("/map") ? "text-indigo-500" : "text-gray-400"
        }`}
        onClick={() => navigate("/map")}
      >
        <MapIcon />
        <span className="text-xs font-medium">Map</span>
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
