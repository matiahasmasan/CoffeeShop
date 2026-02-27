import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoyaltyCard from "../components/LoyaltyCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");

  const [cards] = useState([
    {
      id: 1,
      name: "MAZO",
      address: "Strada Deals Groeului nr. 12",
      image:
        "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      name: "Bean & Bloom",
      address: "Strada Lalelelor 45, Bucuresti",
      image:
        "https://images.unsplash.com/photo-1495474472645-4022a926f25a?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      name: "Urban Roast",
      address: "Calea Victoriei 210, Bucuresti",
      image:
        "https://images.unsplash.com/photo-1559056199-641a0ac8b3f7?w=400&h=300&fit=crop",
    },
    {
      id: 4,
      name: "Morning Grind",
      address: "Bulevardul Unirii 75, Bucuresti",
      image:
        "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=300&fit=crop",
    },
  ]);

  const handleCardClick = (cardId) => {
    navigate(`/card/${cardId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

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
                <LoyaltyCard
                  key={card.id}
                  card={card}
                  onCardClick={handleCardClick}
                />
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

      <Footer activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
