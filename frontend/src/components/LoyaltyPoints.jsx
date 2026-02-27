export default function LoyaltyPoints({ currentPoints = 5, maxPoints = 6 }) {
  return (
    <div className="bg-white rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wide">
          Loyalty Card
        </h3>
        <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
          ☕
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {[...Array(maxPoints)].map((_, index) => (
          <div
            key={index}
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
              index < currentPoints
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            {index < currentPoints && (
              <div className="w-6 h-6 border-2 border-indigo-500 rounded-full"></div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-gray-600">
        at {maxPoints} points, you get one free coffee
      </p>
    </div>
  );
}
