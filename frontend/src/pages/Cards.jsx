import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getUserCards } from "../data/cards";

function MyLoyaltyCard({ card, onClick }) {
  const MAX_POINTS = 6;
  const points = card.points ?? 0;

  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
      onClick={() => onClick(card.id)}
    >
      <div
        className="w-full h-36 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${card.background_url})` }}
      >
        <div className="absolute inset-0 bg-black/30" />
        {card.logo_url && (
          <img
            src={card.logo_url}
            alt={card.name}
            className="absolute top-3 right-3 w-11 h-11 rounded-lg object-cover border-2 border-white shadow-md"
          />
        )}
        <div className="absolute bottom-3 left-3">
          <p className="text-white font-bold text-base leading-tight drop-shadow">
            {card.name}
          </p>
          <p className="text-white/80 text-xs font-medium">{card.category}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Loyalty Progress
          </p>
          <p className="text-xs font-bold text-indigo-600">
            {points}/{MAX_POINTS} ☕
          </p>
        </div>

        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {[...Array(MAX_POINTS)].map((_, i) => (
            <div
              key={i}
              className={`h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                i < points
                  ? "bg-indigo-50 border-2 border-indigo-500"
                  : "bg-gray-50 border-2 border-dashed border-gray-200"
              }`}
            >
              {i < points ? "☕" : <span className="text-gray-300 text-xs">·</span>}
            </div>
          ))}
        </div>

        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${(points / MAX_POINTS) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          {MAX_POINTS - points === 0
            ? "🎉 You've earned a free coffee!"
            : `${MAX_POINTS - points} more stamp${MAX_POINTS - points === 1 ? "" : "s"} to a free coffee`}
        </p>
      </div>
    </div>
  );
}

export default function Cards() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    getUserCards().then((data) => {
      setCards(data);
      setLoading(false);
    });
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex-1 overflow-y-auto px-5 py-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">My Cards</h2>
          <span className="text-sm text-gray-400 font-medium">
            {cards.length} {cards.length === 1 ? "card" : "cards"}
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-8">
          Your loyalty cards from coffee shops you've joined.
        </p>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading your cards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="text-6xl">☕</span>
            <h3 className="text-xl font-bold text-gray-800">No cards yet</h3>
            <p className="text-gray-400 text-sm text-center max-w-xs">
              Visit a coffee shop and claim your first loyalty card to start earning rewards.
            </p>
            <button
              onClick={() => navigate("/home")}
              className="mt-2 px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Get Loyalty Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cards.map((card) => (
              <MyLoyaltyCard
                key={card.card_id}
                card={card}
                onClick={(id) => navigate(`/card/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
