import React from "react";
import Modal from "./Modal";

export default function ViewMenuItemModal({ item, onClose }) {
  if (!item) return null;

  return (
    <Modal isOpen={!!item} onClose={onClose} title="View Product" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Product Name
          </label>
          <p className="text-gray-800 font-medium">{item.name}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Category
          </label>
          <p className="text-gray-800">{item.categoryName || "—"}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Price
          </label>
          <p className="text-gray-800 font-semibold">
            ${item.price.toFixed(2)}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Description
          </label>
          <p className="text-gray-800 leading-relaxed">
            {item.description || "—"}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Status
          </label>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${
              item.available
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {item.available ? "Available" : "Unavailable"}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
