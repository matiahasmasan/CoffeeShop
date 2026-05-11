import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoyaltyCard from "../components/LoyaltyCard";
import SearchBar from "../components/SearchBar";
import SortWidget from "../components/SortWidget";
import FilterWidget from "../components/FilterWidget";
import LikedWidget from "../components/LikedWidget";
import { getCards, likeStore, unlikeStore } from "../data/cards";

const PAGE_SIZE = 8;

export default function Wallet() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [filter, setFilter] = useState("all");
  const [likedOnly, setLikedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("az");
  const [cards, setCards] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [user] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });

  const ratingParam = filter === "4+" ? 4 : filter === "3+" ? 3 : 0;

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    const fetchFirstPage = async () => {
      setLoading(true);
      const { stores, total } = await getCards({
        limit: PAGE_SIZE,
        offset: 0,
        search: debouncedSearch,
        rating: ratingParam,
        liked: likedOnly,
        sort: sortBy,
      });
      if (cancelled) return;
      setCards(stores);
      setTotal(total);
      setOffset(stores.length);
      setLoading(false);
    };
    fetchFirstPage();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, ratingParam, likedOnly, sortBy]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const { stores } = await getCards({
      limit: PAGE_SIZE,
      offset,
      search: debouncedSearch,
      rating: ratingParam,
      liked: likedOnly,
      sort: sortBy,
    });
    setCards((prev) => [...prev, ...stores]);
    setOffset((prev) => prev + stores.length);
    setLoadingMore(false);
  };

  const handleCardClick = (cardId) => navigate(`/card/${cardId}`);

  const handleToggleLike = async (cardId) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    if (card.is_liked) {
      await unlikeStore(cardId);
      if (likedOnly) {
        setCards((prev) => prev.filter((c) => c.id !== cardId));
        setTotal((prev) => Math.max(0, prev - 1));
        setOffset((prev) => Math.max(0, prev - 1));
      } else {
        setCards((prev) =>
          prev.map((c) => (c.id === cardId ? { ...c, is_liked: 0 } : c)),
        );
      }
    } else {
      await likeStore(cardId);
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, is_liked: 1 } : c)),
      );
    }
  };

  const canLoadMore = cards.length < total;

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
          ) : cards.length === 0 ? (
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
                {cards.map((card) => (
                  <LoyaltyCard
                    key={card.id}
                    card={card}
                    onCardClick={handleCardClick}
                    isLiked={!!card.is_liked}
                    onToggleLike={handleToggleLike}
                  />
                ))}
              </div>
              {canLoadMore && (
                <div className="text-center mt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-2.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                  >
                    {loadingMore
                      ? "Loading..."
                      : `Show more (${total - cards.length} remaining)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
