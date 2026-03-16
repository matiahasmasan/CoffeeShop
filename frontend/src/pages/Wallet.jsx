import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoyaltyCard from "../components/LoyaltyCard";
import { getCards } from "../data/cards";

export default function Wallet() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      const data = await getCards();
      setCards(data);
      setLoading(false);
    };
    fetchCards();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleCardClick = (cardId) => {
    navigate(`/card/${cardId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex-1 overflow-y-auto px-5 py-8 max-w-5xl mx-auto w-full">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome {user?.firstName || "Coffee Lover"}!
            </h2>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                />
              </svg>
              Logout
            </button>
          </div>
          <p className="text-gray-500 text-sm mb-8">
            Choose a coffee shop to view its loyalty card and details.
          </p>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading coffee shops...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {cards.map((card) => (
                <LoyaltyCard
                  key={card.id}
                  card={card}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
