import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoyaltyCard from "../components/LoyaltyCard";
import { cards } from "../data/cards";

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");

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
