import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "4+", label: "★★★★+ (4+)" },
  { value: "3+", label: "★★★+ (3+)" },
];

export default function FilterWidget({ filter, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 h-9 rounded-lg text-sm font-medium transition-colors ${
          open || filter !== "all"
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        <FontAwesomeIcon icon={faFilter} />
        Filter
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { onChange(value); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                filter === value
                  ? "bg-indigo-50 text-indigo-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
