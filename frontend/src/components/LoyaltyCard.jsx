import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faHeart } from "@fortawesome/free-solid-svg-icons";

export default function LoyaltyCard({
  card,
  onCardClick,
  isLiked,
  onToggleLike,
}) {
  const handleClick = () => {
    onCardClick(card.id);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onCardClick(card.id);
    }
  };

  return (
    <div
      className="bg-white rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
      onClick={handleClick}
      role="button"
      tabIndex="0"
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full h-44 bg-cover bg-center relative overflow-hidden"
        style={{ backgroundImage: card.images?.[0] ? `url(${card.images[0]})` : "none" }}
      >
        <div className="absolute inset-0 bg-black/30 hover:bg-black/50 transition-colors" />
        {card.logo_url && (
          <div className="absolute top-3 right-3">
            <img
              src={card.logo_url}
              alt={card.name}
              className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-lg"
            />
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{card.name}</h3>
            <p className="text-xs text-indigo-600 font-semibold">
              {card.category}
            </p>
          </div>
          {onToggleLike && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(card.id);
              }}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={isLiked ? "Unlike store" : "Like store"}
            >
              <FontAwesomeIcon
                icon={faHeart}
                className={`text-lg ${isLiked ? "text-purple-600" : "text-gray-300"}`}
              />
            </button>
          )}
        </div>
        {card.rating != null && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <FontAwesomeIcon
                  key={i}
                  icon={faStar}
                  className={
                    i < card.rating
                      ? "text-yellow-400 text-sm"
                      : "text-gray-300 text-sm"
                  }
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">{card.rating}/5</span>
          </div>
        )}
        <p className="text-xs text-gray-500 leading-relaxed">{card.address}</p>
      </div>
    </div>
  );
}
