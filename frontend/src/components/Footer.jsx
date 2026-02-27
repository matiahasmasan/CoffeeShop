import HomeIcon from "./icons/HomeIcon";
import MapIcon from "./icons/MapIcon";
import SettingsIcon from "./icons/SettingsIcon";

export default function Footer({ activeTab, onTabChange }) {
  return (
    <div className="flex justify-around bg-white border-t border-gray-200 sticky bottom-0">
      <button
        className={`flex flex-col items-center gap-1.5 py-3 px-5 border-none bg-none cursor-pointer transition-colors ${
          activeTab === "home" ? "text-indigo-500" : "text-gray-400"
        }`}
        onClick={() => onTabChange("home")}
      >
        <HomeIcon />
        <span className="text-xs font-medium">Home</span>
      </button>
      <button
        className={`flex flex-col items-center gap-1.5 py-3 px-5 border-none bg-none cursor-pointer transition-colors ${
          activeTab === "map" ? "text-indigo-500" : "text-gray-400"
        }`}
        onClick={() => onTabChange("map")}
      >
        <MapIcon />
        <span className="text-xs font-medium">Map</span>
      </button>
      <button
        className={`flex flex-col items-center gap-1.5 py-3 px-5 border-none bg-none cursor-pointer transition-colors ${
          activeTab === "settings" ? "text-indigo-500" : "text-gray-400"
        }`}
        onClick={() => onTabChange("settings")}
      >
        <SettingsIcon />
        <span className="text-xs font-medium">Settings</span>
      </button>
    </div>
  );
}
