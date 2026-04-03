import { useParams } from "react-router-dom";
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

const API = "http://localhost:8000";

function StarSelector({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className={`text-3xl transition-colors ${
            i <= (hovered || value) ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}


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
  const reviewsRef = useRef(null);
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const fetchReviews = async () => {
    setReviewsLoading(true);
    const res = await fetch(`${API}/api/reviews/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setReviews(Array.isArray(data) ? data : []);
    setReviewsLoading(false);
  };

  useEffect(() => {
    const fetchCard = async () => {
      setLoading(true);
      const data = await getCardById(id);

      if (data && typeof data.links === "string") {
        try {
          data.links = JSON.parse(data.links);
        } catch (err) {
          console.error("Error parsing links:", err);
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
    fetchReviews();
  }, [id]);

  useEffect(() => {
    const mine = reviews.find((r) => r.user_id === user?.id);
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment || "");
    }
  }, [reviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (rating === 0) {
      setError("Selectează un rating.");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`${API}/api/reviews/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rating, comment }),
    });
    const data = await res.json();
    if (data.succes) {
      await fetchReviews();
      setShowForm(false);
    } else {
      setError(data.mesaj || "Eroare la trimitere.");
    }
    setSubmitting(false);
  };

  const toggleLike = async () => {
    if (liked) {
      await unlikeStore(id);
    } else {
      await likeStore(id);
    }
    setLiked(!liked);
  };

  const myReview = reviews.find((r) => r.user_id === user?.id);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

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
          <StarRating value={avgRating} />
          {reviews.length > 0 && (
            <span className="text-sm text-gray-500 ml-1">
              {avgRating.toFixed(1)}
            </span>
          )}
          <button
            onClick={() => reviewsRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="text-sm text-indigo-500 hover:underline ml-1"
          >
            ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
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
              const data = await getCardById(id);
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

        {/* Reviews */}
        <div ref={reviewsRef} className="bg-white rounded-xl shadow-sm p-5 mb-4">
          <h2 className="font-semibold text-gray-800 mb-1">Recenzii și evaluări</h2>
          <div className="flex items-center gap-2 mb-4">
            <StarRating value={avgRating} />
            <span className="text-sm text-gray-500">
              {avgRating > 0 ? avgRating.toFixed(1) : "—"} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>

          {reviewsLoading ? (
            <p className="text-center text-gray-400 text-sm">Se încarcă reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-400 text-sm py-2">Niciun review încă. Fii primul!</p>
          ) : (
            <div className="space-y-3 mb-4">
              {reviews.map((r) => (
                <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800 text-sm">
                      {r.firstName} {r.lastName}
                      {r.user_id === user?.id && (
                        <span className="ml-2 text-xs text-indigo-500 font-normal">(tu)</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString("ro-RO")}
                    </span>
                  </div>
                  <StarRating value={r.rating} />
                  {r.comment && (
                    <p className="text-sm text-gray-600 mt-2">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-3 mt-4 border-t border-gray-100 pt-4">
              <StarSelector value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comentariu (opțional)"
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold transition-colors hover:bg-gray-50"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {submitting ? "Se trimite..." : myReview ? "Actualizează" : "Trimite"}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2.5 mt-2 border border-indigo-500 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-semibold transition-colors"
            >
              {myReview ? "Editează review" : "Adaugă review"}
            </button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
