export default function LoyaltyPoints({ currentPoints, maxPoints }) {
  const safeMax = Math.max(1, Number(maxPoints) || 1);
  const filled = Math.min(Math.max(Number(currentPoints) || 0, 0), safeMax);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-0.5">
            Loyalty Card
          </p>
          <p className="text-sm font-semibold text-gray-800">
            {currentPoints} / {safeMax} coffees
          </p>
        </div>
        {/* Icon 
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-full flex items-center justify-center text-base shadow-md">
          ☕
        </div>
        */}
      </div>

      {/* Stamps */}
      <div
        className="grid gap-2 sm:gap-3 mb-5"
        style={{
          gridTemplateColumns: `repeat(${safeMax}, minmax(0, 1fr))`,
        }}
      >
        {[...Array(safeMax)].map((_, index) => (
          <div
            key={index}
            className={`h-12 sm:h-14 rounded-xl flex items-center justify-center transition-all ${
              index < filled
                ? "bg-indigo-50 border-2 border-indigo-500"
                : "bg-gray-50 border-2 border-dashed border-gray-200"
            }`}
          >
            {index < filled ? (
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
          style={{
            width: `${Math.min((Number(currentPoints) || 0) / safeMax, 1) * 100}%`,
          }}
        />
      </div>

      {/* Footer */}
      <p className="text-xs text-center text-gray-400">
        {(Number(currentPoints) || 0) >= safeMax
          ? "🎉 You've earned a free coffee!"
          : `${safeMax - (Number(currentPoints) || 0)} more to get a free coffee`}
      </p>
    </div>
  );
}
