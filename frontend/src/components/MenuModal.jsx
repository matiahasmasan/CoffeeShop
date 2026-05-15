import React, { useState, useEffect } from "react";
import Modal from "./Modal";

export default function MenuModal({ isOpen, onClose, storeId, storeName }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasMenu, setHasMenu] = useState(false);

  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (isOpen && storeId) {
      fetchMenu();
    }
  }, [isOpen, storeId]);

  const fetchMenu = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/menu/store/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.hasMenu) {
        setCategories(data.categories);
        setHasMenu(true);
      } else {
        setHasMenu(false);
        setCategories([]);
      }
    } catch (err) {
      console.error("Error fetching menu:", err);
      setError("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Menu - ${storeName}`}
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">Loading menu...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      ) : !hasMenu ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-700 text-sm">
            This coffee shop doesn't have a menu yet.
          </p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-700 text-sm">No menu items available.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id}>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {category.name}
              </h3>

              {category.items.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No items in this category
                </p>
              ) : (
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-4 ${
                        item.available
                          ? "border-gray-200 bg-white"
                          : "border-gray-200 bg-gray-50 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm flex-1">
                          {item.name}
                          {!item.available && (
                            <span className="ml-2 text-xs font-normal text-gray-500">
                              (Unavailable)
                            </span>
                          )}
                        </h4>
                        <p className="text-indigo-600 font-bold text-sm whitespace-nowrap">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      {item.description && (
                        <p className="text-gray-600 text-xs leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
