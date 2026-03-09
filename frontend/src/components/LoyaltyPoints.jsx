export default function LoyaltyPoints({ currentPoints = 2, maxPoints = 6 }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-0.5">
            Loyalty Card
          </p>
          <p className="text-sm font-semibold text-gray-800">
            {currentPoints} / {maxPoints} coffees
          </p>
        </div>
        {/* Icon 
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-full flex items-center justify-center text-base shadow-md">
          ☕
        </div>
        */}
      </div>

      {/* Stamps */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[...Array(maxPoints)].map((_, index) => (
          <div
            key={index}
            className={`h-14 rounded-xl flex items-center justify-center transition-all ${
              index < currentPoints
                ? "bg-indigo-50 border-2 border-indigo-500"
                : "bg-gray-50 border-2 border-dashed border-gray-200"
            }`}
          >
            {index < currentPoints ? (
              <span className="text-xl">☕</span>
            ) : (
              <span className="text-lg text-gray-300">·</span>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-linear-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
          style={{ width: `${(currentPoints / maxPoints) * 100}%` }}
        />
      </div>

      {/* Footer */}
      <p className="text-xs text-center text-gray-400">
        {maxPoints - currentPoints === 0
          ? "🎉 You've earned a free coffee!"
          : `${maxPoints - currentPoints} more to get a free coffee`}
      </p>
    </div>
  );
}
