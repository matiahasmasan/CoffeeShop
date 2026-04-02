import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CardHeader from "../components/CardHeader";
import CardMap from "../components/CardMap";
import SocialLinks from "../components/SocialLinks";
import LoyaltyPoints from "../components/LoyaltyPoints";
import StarRating from "../components/StarRating";
import {
  getCardById,
  claimCard,
  getLikedStores,
  likeStore,
  unlikeStore,
} from "../data/cards";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

function ImageScroller({ images }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(null);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-56 rounded-lg overflow-hidden mb-4 bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400 text-sm">No images</span>
      </div>
    );
  }

  const prev = () => setCurrent((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setCurrent((i) => (i === images.length - 1 ? 0 : i + 1));

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) next();
    else if (diff < -40) prev();
    touchStartX.current = null;
  };

  return (
    <div className="w-full h-56 rounded-lg overflow-hidden mb-4 relative select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <img
        src={images[current]}
        alt={`Photo ${current + 1}`}
        className="w-full h-full object-cover"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ›
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [reviewSummary, setReviewSummary] = useState({ avg: 0, count: 0 });

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
    const fetchReviews = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setReviewSummary({ avg, count: data.length });
      }
    };

    fetchCard();
    fetchLiked();
    fetchReviews();
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

        <div className="flex items-center gap-1 mb-3">
          <StarRating value={reviewSummary.avg} />
          {reviewSummary.count > 0 && (
            <span className="text-sm text-gray-500 ml-1">
              {reviewSummary.avg.toFixed(1)}
            </span>
          )}
          <button
            onClick={() => navigate(`/card/${id}/reviews`)}
            className="text-sm text-indigo-500 hover:underline ml-1"
          >
            {reviewSummary.count} {reviewSummary.count === 1 ? "review" : "reviews"}
          </button>
        </div>

        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <span>📍</span>
          <p className="text-sm">{card.address}</p>
        </div>

        <ImageScroller images={card.images} />

        {card.card_id ? (
          <LoyaltyPoints currentPoints={card.points} maxPoints={6} />
        ) : (
          <button
            onClick={async () => {
              await claimCard(id);
              const data = await getCardById(id); // refresh
              setCard(data);
            }}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition mb-4"
          >
            ☕ Get Loyalty Card
          </button>
        )}

        <div className="bg-white rounded-lg p-6 mb-4">
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
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
