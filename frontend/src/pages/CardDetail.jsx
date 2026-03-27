import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CardHeader from "../components/CardHeader";
import CardMap from "../components/CardMap";
import SocialLinks from "../components/SocialLinks";
import LoyaltyPoints from "../components/LoyaltyPoints";
import {
  getCardById,
  claimCard,
  getLikedStores,
  likeStore,
  unlikeStore,
} from "../data/cards";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

export default function CardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const fetchCard = async () => {
      setLoading(true);
      const data = await getCardById(id);

      if (data && typeof data.links === "string") {
        try {
          data.links = JSON.parse(data.links);
        } catch (error) {
          console.error("Error parsing links:", error);
          data.links = null;
        }
      }

      setCard(data);
      setLoading(false);
    };
    const fetchLiked = async () => {
      const liked = await getLikedStores();
      setLiked(liked.some((s) => s.id === Number(id)));
    };
    fetchCard();
    fetchLiked();
  }, [id]);

  const toggleLike = async () => {
    if (liked) {
      await unlikeStore(id);
    } else {
      await likeStore(id);
    }
    setLiked(!liked);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Card not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <CardHeader card={card} />

      <div className="flex-1 overflow-y-auto px-5 py-6 max-w-2xl mx-auto w-full">
        {/* CE PUII MEI FACEM CU CATEGORY? */}
        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-2">
          {card.category}
        </p>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-gray-900">{card.name}</h1>
          <button
            onClick={toggleLike}
            className="p-2 rounded-full transition-colors hover:bg-gray-100"
            aria-label={liked ? "Unlike store" : "Like store"}
          >
            <FontAwesomeIcon
              icon={faHeart}
              className={`text-2xl ${liked ? "text-purple-600" : "text-gray-300"}`}
            />
          </button>
        </div>

        <div className="flex items-center gap-2 text-gray-600 mb-6">
          <span>📍</span>
          <p className="text-sm">{card.address}</p>
        </div>

        <div
          className="w-full h-56 rounded-lg overflow-hidden mb-6"
          style={{
            backgroundImage: `url(${card.background_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {card.card_id ? (
          <LoyaltyPoints currentPoints={card.points} maxPoints={6} />
        ) : (
          <button
            onClick={async () => {
              await claimCard(id);
              const data = await getCardById(id); // refresh
              setCard(data);
            }}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition mb-6"
          >
            ☕ Get Loyalty Card
          </button>
        )}

        <div className="bg-white rounded-lg p-6 mb-6">
          <p className="text-gray-700 text-sm leading-relaxed mb-6">
            {card.description}
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Hours</h3>
              <p className="text-gray-600 text-sm">{card.hours}</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Phone</h3>
              <p className="text-gray-600 text-sm">{card.phone}</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Email</h3>
              <p className="text-gray-600 text-sm">{card.email}</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-3">
                Follow Us
              </h3>
              <SocialLinks links={card.links} />
            </div>
            <CardMap mapsLink={card.maps_link} shopName={card.name} />
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
