import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

/**
 * StarRating — displays a 1-5 star rating with half-star precision.
 *
 * Props:
 *   value     {number}  — the rating (e.g. 4.5)
 *   size      {string}  — Tailwind text size class (default "text-md")
 */
export default function StarRating({ value, size = "text-md" }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => {
        const full = value >= i;
        const half = !full && value >= i - 0.5;
        return (
          <span key={i} className={`relative inline-block ${size}`}>
            <FontAwesomeIcon icon={faStar} className="text-gray-300" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: full ? "100%" : half ? "50%" : "0%" }}
            >
              <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
            </span>
          </span>
        );
      })}
    </div>
  );
}
