import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeIcon from "../components/icons/HomeIcon";
import MapIcon from "../components/icons/MapIcon";
import SettingsIcon from "../components/icons/SettingsIcon";

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");

  const [cards] = useState([
    {
      id: 1,
      name: "MAZO",
      address: "Strada Deals Groeului nr. 12",
      points: 5,
      image:
        "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      name: "Bean & Bloom",
      address: "Strada Lalelelor 45, Bucuresti",
      points: 3,
      image:
        "https://images.unsplash.com/photo-1495474472645-4022a926f25a?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      name: "Urban Roast",
      address: "Calea Victoriei 210, Bucuresti",
      points: 4,
      image:
        "https://images.unsplash.com/photo-1559056199-641a0ac8b3f7?w=400&h=300&fit=crop",
    },
    {
      id: 4,
      name: "Morning Grind",
      address: "Bulevardul Unirii 75, Bucuresti",
      points: 2,
      image:
        "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=300&fit=crop",
    },
  ]);

  const handleCardClick = (cardId) => {
    navigate(`/card/${cardId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 max-w-5xl mx-auto px-5 py-5">
          <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-700 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-white">CS</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 m-0">CoffeeShop</h1>
            <p className="text-xs text-gray-500 m-0">Coffee, curated for you</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-8 max-w-5xl mx-auto w-full">
        {activeTab === "home" && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome client
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Choose a coffee shop to view its loyalty card and details.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
                  onClick={() => handleCardClick(card.id)}
                  role="button"
                  tabIndex="0"
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleCardClick(card.id)
                  }
                >
                  <div
                    className="w-full h-44 bg-cover bg-center relative overflow-hidden"
                    style={{ backgroundImage: `url(${card.image})` }}
                  >
                    <div className="absolute inset-0 bg-black/30 hover:bg-black/50 transition-colors" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {card.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      {card.address}
                    </p>
                    <div className="flex items-center justify-between">
                      <a
                        href="#details"
                        className="text-xs text-indigo-500 font-semibold hover:text-purple-700 transition-colors"
                      >
                        View details →
                      </a>
                      <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {card.points}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "map" && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Map</h2>
            <p className="text-gray-500">Coffee shop map view coming soon...</p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
            <p className="text-gray-500">Settings page coming soon...</p>
          </div>
        )}
      </div>

      <div className="flex justify-around bg-white border-t border-gray-200 sticky bottom-0">
        <button
          className={`flex flex-col items-center gap-1.5 py-3 px-5 border-none bg-none cursor-pointer transition-colors ${
            activeTab === "home" ? "text-indigo-500" : "text-gray-400"
          }`}
          onClick={() => setActiveTab("home")}
        >
          <HomeIcon />
          <span className="text-xs font-medium">Home</span>
        </button>
        <button
          className={`flex flex-col items-center gap-1.5 py-3 px-5 border-none bg-none cursor-pointer transition-colors ${
            activeTab === "map" ? "text-indigo-500" : "text-gray-400"
          }`}
          onClick={() => setActiveTab("map")}
        >
          <MapIcon />
          <span className="text-xs font-medium">Map</span>
        </button>
        <button
          className={`flex flex-col items-center gap-1.5 py-3 px-5 border-none bg-none cursor-pointer transition-colors ${
            activeTab === "settings" ? "text-indigo-500" : "text-gray-400"
          }`}
          onClick={() => setActiveTab("settings")}
        >
          <SettingsIcon />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
