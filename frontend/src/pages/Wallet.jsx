import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoyaltyCard from "../components/LoyaltyCard";
import SearchBar from "../components/SearchBar";
import SortWidget from "../components/SortWidget";
import FilterWidget from "../components/FilterWidget";
import LikedWidget from "../components/LikedWidget";
import {
  getCards,
  getLikedStores,
  likeStore,
  unlikeStore,
} from "../data/cards";

export default function Wallet() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [filter, setFilter] = useState("all");
  const [likedOnly, setLikedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("az");
  const [cards, setCards] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [user] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });

  const filteredCards = cards
    .filter((card) => {
      const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRating =
        filter === "all" ||
        (filter === "4+" && (card.rating ?? 0) >= 4) ||
        (filter === "3+" && (card.rating ?? 0) >= 3);
      const matchesLiked = !likedOnly || likedIds.has(card.id);
      return matchesSearch && matchesRating && matchesLiked;
    })
    .sort((a, b) => {
      if (sortBy === "az") return a.name.localeCompare(b.name);
      if (sortBy === "za") return b.name.localeCompare(a.name);
      if (sortBy === "rating-desc") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === "rating-asc") return (a.rating ?? 0) - (b.rating ?? 0);
      return 0;
    });

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      const [allCards, liked] = await Promise.all([getCards(), getLikedStores()]);
      setCards(allCards);
      setLikedIds(new Set(liked.map((s) => s.id)));
      setLoading(false);
    };
    fetchCards();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const handleCardClick = (cardId) => navigate(`/card/${cardId}`);

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
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome {user?.firstName || "Coffee Lover"}!
            </h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Choose a coffee shop to view its loyalty card and details.
          </p>

          <div className="flex items-center gap-2 mb-3">
            <SortWidget sortBy={sortBy} onChange={setSortBy} />
            <FilterWidget filter={filter} onChange={setFilter} />
            <LikedWidget likedOnly={likedOnly} onChange={setLikedOnly} />
          </div>

          <div className="mb-4">
            <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading coffee shops...</p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {likedOnly ? "No liked coffee shops yet" : "No coffee shops found"}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {likedOnly
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
