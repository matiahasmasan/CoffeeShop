export default function Header() {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 max-w-5xl mx-auto px-5 py-5">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-white">CS</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 m-0">CoffeeShop</h1>
          <p className="text-xs text-gray-500 m-0">Coffee, curated for you</p>
        </div>
      </div>
    </div>
  );
}
