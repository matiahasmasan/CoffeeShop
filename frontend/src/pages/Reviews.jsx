import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

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

function StarDisplay({ value }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-base ${i <= value ? "text-yellow-400" : "text-gray-300"}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function Reviews() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const fetchReviews = async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/reviews/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setReviews(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
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
    } else {
      setError(data.mesaj || "Eroare la trimitere.");
    }
    setSubmitting(false);
  };

  const myReview = reviews.find((r) => r.user_id === user?.id);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm h-14 flex items-center px-4 gap-3">
        <button
          onClick={() => navigate(`/card/${id}`)}
          className="text-gray-500 hover:text-gray-800 transition-colors text-lg"
        >
          ←
        </button>
        <h1 className="font-semibold text-gray-800">Reviews</h1>
        {reviews.length > 0 && (
          <span className="text-sm text-gray-500 ml-1">
            {avgRating.toFixed(1)} ★ · {reviews.length}{" "}
            {reviews.length === 1 ? "review" : "reviews"}
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full space-y-6">
        {/* Formular adăugare/editare review */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-3">
            {myReview ? "Review-ul tău" : "Adaugă un review"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
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
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {submitting ? "Se trimite..." : myReview ? "Actualizează" : "Trimite review"}
            </button>
          </form>
        </div>

        {/* Lista review-uri */}
        {loading ? (
          <p className="text-center text-gray-400 text-sm">Se încarcă...</p>
        ) : reviews.length === 0 ? (
          <p className="text-center text-gray-400 text-sm">
            Niciun review încă. Fii primul!
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-800 text-sm">
                    {r.firstName} {r.lastName}
                    {r.user_id === user?.id && (
                      <span className="ml-2 text-xs text-indigo-500 font-normal">
                        (tu)
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString("ro-RO")}
                  </span>
                </div>
                <StarDisplay value={r.rating} />
                {r.comment && (
                  <p className="text-sm text-gray-600 mt-2">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
