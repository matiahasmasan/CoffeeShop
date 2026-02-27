export default function LoyaltyCard({ card, onCardClick }) {
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
        style={{ backgroundImage: `url(${card.image})` }}
      >
        <div className="absolute inset-0 bg-black/30 hover:bg-black/50 transition-colors" />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{card.name}</h3>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          {card.address}
        </p>
        <div className="flex items-center justify-between">
          <a
            href="#details"
            className="text-xs text-indigo-500 font-semibold hover:text-purple-700 transition-colors"
          >
            View details →
          </a>
          {card.points && (
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {card.points}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
