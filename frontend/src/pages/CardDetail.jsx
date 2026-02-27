import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoyaltyPoints from "../components/LoyaltyPoints";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function CardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");

  // Coffee shop data with details
  const cardsData = {
    1: {
      id: 1,
      name: "MAZO",
      category: "COFFEE SHOP",
      address: "Strada Dealul Groeului nr 123",
      image:
        "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&h=400&fit=crop",
      points: 5,
      description:
        "A cozy neighborhood spot known for single-origin espresso, slow brews, and a calm atmosphere perfect for reading or working.",
      hours: {
        label: "Mon-Sun · 7:30 – 21:00",
      },
      specialty: "Single-origin espresso & V60 pour-over",
      wifi: "Fast Wi-Fi · 20+ seats · Power outlets",
    },
    2: {
      id: 2,
      name: "Bean & Bloom",
      category: "COFFEE SHOP",
      address: "Strada Lalelelor 45, Bucuresti",
      image:
        "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=600&h=400&fit=crop",
      points: 3,
      description:
        "Modern café with artistic vibes, featuring specialty coffee and a curated selection of pastries from local bakeries.",
      hours: {
        label: "Tue-Sun · 8:00 – 20:00",
      },
      specialty: "Specialty lattes & homemade pastries",
      wifi: "Fast Wi-Fi · 15+ seats · Cozy ambiance",
    },
    3: {
      id: 3,
      name: "Urban Roast",
      category: "COFFEE SHOP",
      address: "Calea Victoriei 210, Bucuresti",
      points: 4,
      image:
        "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&h=400&fit=crop",
      description:
        "Contemporary roastery with an industrial aesthetic, serving freshly roasted beans and hosting coffee tasting events.",
      hours: {
        label: "Daily · 7:00 – 22:00",
      },
      specialty: "Fresh roasted beans & coffee workshops",
      wifi: "Strong Wi-Fi · 25+ seats · Workspace friendly",
    },
    4: {
      id: 4,
      name: "Morning Grind",
      category: "COFFEE SHOP",
      address: "Bulevardul Unirii 75, Bucuresti",
      points: 2,
      image:
        "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=600&h=400&fit=crop",
      description:
        "Bustling morning café perfect for grab-and-go coffee, breakfast sandwiches, and quick meetings before work.",
      hours: {
        label: "Mon-Fri · 6:30 – 19:00",
      },
      specialty: "Quick service & breakfast combos",
      wifi: "Good Wi-Fi · 10+ seats · Quick service",
    },
  };

  const card = cardsData[id];

  if (!card) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Card not found</p>
        </div>
        <Footer activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between max-w-5xl mx-auto px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-700 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">CS</span>
            </div>
            <span className="font-bold text-gray-900">CoffeeShop</span>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
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
            backgroundImage: `url(${card.image})`,
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
              <p className="text-gray-600 text-sm">{card.hours.label}</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">
                Specialty
              </h3>
              <p className="text-gray-600 text-sm">{card.specialty}</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">
                Wi-Fi & seats
              </h3>
              <p className="text-gray-600 text-sm">{card.wifi}</p>
            </div>
          </div>
        </div>
      </div>

      <Footer activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
