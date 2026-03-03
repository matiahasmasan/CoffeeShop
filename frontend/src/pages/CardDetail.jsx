import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SocialLinks from "../components/SocialLinks";
import LoyaltyPoints from "../components/LoyaltyPoints";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { getCardById } from "../data/cards";

export default function CardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCard = async () => {
      setLoading(true);
      const data = await getCardById(id);

      // Parse links if it's a string (JSON from database)
      if (data && typeof data.links === "string") {
        try {
          data.links = JSON.parse(data.links);
        } catch (error) {
          console.error("Error parsing links:", error);
          data.links = null;
        }
      }

      setCard(data);
      setLoading(false);
    };
    fetchCard();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Card not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between max-w-5xl mx-auto px-5 py-4">
          <div className="flex items-center gap-3">
            {card.logo_url && (
              <img
                src={card.logo_url}
                alt={card.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            {!card.logo_url && (
              <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-700 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">
                  {card.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <span className="font-bold text-gray-900 block">{card.name}</span>
              <span className="text-xs text-gray-500">{card.category}</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 text-sm text-indigo-500 hover:text-purple-700 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to home
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 max-w-2xl mx-auto w-full">
        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-2">
          {card.category}
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{card.name}</h1>

        <div className="flex items-center gap-2 text-gray-600 mb-6">
          <span>📍</span>
          <p className="text-sm">{card.address}</p>
        </div>

        <div
          className="w-full h-56 rounded-lg overflow-hidden mb-6"
          style={{
            backgroundImage: `url(${card.background_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <LoyaltyPoints currentPoints={card.points} maxPoints={6} />

        <div className="bg-white rounded-lg p-6 mb-6">
          <p className="text-gray-700 text-sm leading-relaxed mb-6">
            {card.description}
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Hours</h3>
              <p className="text-gray-600 text-sm">{card.hours}</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Phone</h3>
              <p className="text-gray-600 text-sm">{card.phone}</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Email</h3>
              <p className="text-gray-600 text-sm">{card.email}</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-3">
                Follow Us
              </h3>
              <SocialLinks links={card.links} />
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Location</h3>
              <a
                href={card.maps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:text-purple-700 text-sm underline"
              >
                View on Google Maps
              </a>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
