import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoyaltyCard from "../components/LoyaltyCard";
import SearchBar from "../components/SearchBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpAZ, faFilter } from "@fortawesome/free-solid-svg-icons";
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
  const [sortBy, setSortBy] = useState("az");
  const [cards, setCards] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const sortRef = useRef(null);
  const filterRef = useRef(null);
  const [user] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target))
        setSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target))
        setFilterOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCards = cards
    .filter((card) => {
      const matchesSearch = card.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesFilter = filter === "all" || likedIds.has(card.id);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) =>
      sortBy === "az"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    );

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
            {/* Sort dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => {
                  setSortOpen((o) => !o);
                  setFilterOpen(false);
                }}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                  sortOpen
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <FontAwesomeIcon icon={faArrowUpAZ} />
              </button>
              {sortOpen && (
                <div className="absolute left-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                  <button
                    onClick={() => {
                      setSortBy("az");
                      setSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      sortBy === "az"
                        ? "bg-indigo-50 text-indigo-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    A → Z
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("za");
                      setSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      sortBy === "za"
                        ? "bg-indigo-50 text-indigo-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Z → A
                  </button>
                </div>
              )}
            </div>

            {/* Filter dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => {
                  setFilterOpen((o) => !o);
                  setSortOpen(false);
                }}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                  filterOpen
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <FontAwesomeIcon icon={faFilter} />
              </button>
              {filterOpen && (
                <div className="absolute left-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                  <button
                    onClick={() => {
                      setFilter("all");
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      filter === "all"
                        ? "bg-indigo-50 text-indigo-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      setFilter("liked");
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      filter === "liked"
                        ? "bg-indigo-50 text-indigo-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    ♥ Liked
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

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
