import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoyaltyCard from "../components/LoyaltyCard";
import SearchBar from "../components/SearchBar";
import { getCards, getLikedStores, likeStore, unlikeStore } from "../data/cards";

export default function Wallet() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [filter, setFilter] = useState("all");
  const [cards, setCards] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });

  const filteredCards = cards.filter((card) => {
    const matchesSearch = card.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || likedIds.has(card.id);
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      const [allCards, liked] = await Promise.all([
        getCards(),
        getLikedStores(),
      ]);
      setCards(allCards);
      setLikedIds(new Set(liked.map((s) => s.id)));
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

  const handleToggleLike = async (cardId) => {
    if (likedIds.has(cardId)) {
      await unlikeStore(cardId);
      setLikedIds((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    } else {
      await likeStore(cardId);
      setLikedIds((prev) => new Set(prev).add(cardId));
    }
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
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("liked")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === "liked"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              ♥ Liked
            </button>
          </div>
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
              <p className="text-gray-500 text-lg">
                {filter === "liked"
                  ? "No liked coffee shops yet"
                  : "No coffee shops found"}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {filter === "liked"
                  ? "Open a coffee shop and tap the heart to save it"
                  : "Try adjusting your search"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {filteredCards.map((card) => (
                <LoyaltyCard
                  key={card.id}
                  card={card}
                  onCardClick={handleCardClick}
                  isLiked={likedIds.has(card.id)}
                  onToggleLike={handleToggleLike}
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
