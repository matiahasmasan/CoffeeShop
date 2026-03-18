import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoyaltyCard from "../components/LoyaltyCard";
import SearchBar from "../components/SearchBar";
import { getCards } from "../data/cards";

export default function Wallet() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });

  const filteredCards = cards.filter((card) =>
    card.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex-1 overflow-y-auto px-5 py-8 max-w-5xl mx-auto w-full">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome {user?.firstName || "Coffee Lover"}!
            </h2>
          </div>
          <p className="text-gray-500 text-sm mb-8">
            Choose a coffee shop to view its loyalty card and details.
          </p>
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading coffee shops...</p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No coffee shops found</p>
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your search
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {filteredCards.map((card) => (
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
