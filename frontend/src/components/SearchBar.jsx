import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMugHot } from "@fortawesome/free-solid-svg-icons";

export default function SearchBar({
  searchQuery,
  onSearchChange,
  placeholder = "Search coffee shops...",
}) {
  return (
    <div className="mb-4">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-5 py-3 pr-12 rounded-2xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 bg-white shadow-sm"
        />
        <FontAwesomeIcon
          icon={faMugHot}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5"
        />
      </div>
    </div>
  );
}
