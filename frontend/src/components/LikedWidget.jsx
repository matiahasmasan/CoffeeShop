import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

export default function LikedWidget({ likedOnly, onChange }) {
  return (
    <button
      onClick={() => onChange(!likedOnly)}
      className={`flex items-center gap-2 px-3 h-9 rounded-lg text-sm font-medium transition-colors ${
        likedOnly
          ? "bg-purple-600 text-white"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      <FontAwesomeIcon icon={faHeart} />
      Liked
    </button>
  );
}
