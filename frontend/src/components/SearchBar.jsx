export default function SearchBar({
  searchQuery,
  onSearchChange,
  placeholder = "Search coffee shops...",
}) {
  return (
    <div className="mb-8">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full md:w-96 px-5 py-3 pr-12 rounded-2xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 bg-white shadow-sm"
        />
        <svg
          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z" />
        </svg>
      </div>
    </div>
  );
}
