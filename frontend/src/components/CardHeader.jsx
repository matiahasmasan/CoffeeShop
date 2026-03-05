import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function CardHeader({ card }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between max-w-5xl mx-auto px-5 py-4">
        <div className="flex items-center gap-3">
          {card.logo_url && (
            <img
              src={card.logo_url}
              alt={card.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          {!card.logo_url && (
            <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-700 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">
                {card.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <span className="font-bold text-gray-900 block">{card.name}</span>
            <span className="text-xs text-gray-500">{card.category}</span>
          </div>
        </div>
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-sm text-indigo-500 hover:text-purple-700 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to home
        </button>
      </div>
    </div>
  );
}
