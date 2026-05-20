import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import LogoutButton from "./LogoutButton";

/**
 * Sidebar — reusable across all roles
 *
 * Props:
 *   isOpen    {boolean}
 *   onClose   {() => void}
 *   storeName {string | null}
 *   links     {{ label: string, icon: IconDefinition, path: string }[]}
 */
export default function Sidebar({ isOpen, onClose, storeName, links = [] }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = () => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    localStorage.clear();
    if (rememberedEmail) {
      localStorage.setItem("rememberedEmail", rememberedEmail);
    }
    navigate("/");
  };

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
          isOpen
            ? "opacity-40 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top — store name + close button */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
          <span className="text-base font-semibold text-gray-800 truncate">
            {storeName ?? "Dashboard"}
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Close sidebar"
          >
            <FontAwesomeIcon icon={faX} className="text-sm" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {links.map(({ label, icon, path }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium w-full text-left transition-colors ${
                  active
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <FontAwesomeIcon icon={icon} className="w-4 text-center" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Bottom — logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <LogoutButton onClick={handleLogout} className="w-full" />
        </div>
      </aside>
    </>
  );
}
