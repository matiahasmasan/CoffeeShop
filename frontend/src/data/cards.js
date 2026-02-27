export const cards = [
  {
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
  {
    id: 2,
    name: "Bean & Bloom",
    category: "COFFEE SHOP",
    address: "Strada Lalelelor 45, Bucuresti",
    image:
      "https://media-cdn.tripadvisor.com/media/photo-m/1280/2e/99/e4/e1/profitez-de-notre-terrasse.jpg",
    points: 3,
    description:
      "Modern café with artistic vibes, featuring specialty coffee and a curated selection of pastries from local bakeries.",
    hours: {
      label: "Tue-Sun · 8:00 – 20:00",
    },
    specialty: "Specialty lattes & homemade pastries",
    wifi: "Fast Wi-Fi · 15+ seats · Cozy ambiance",
  },
  {
    id: 3,
    name: "Urban Roast",
    category: "COFFEE SHOP",
    address: "Calea Victoriei 210, Bucuresti",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcGrRrGtCAd0yr8rrMkcQZyqBcjPGfsOaWDg&s",
    points: 4,
    description:
      "Contemporary roastery with an industrial aesthetic, serving freshly roasted beans and hosting coffee tasting events.",
    hours: {
      label: "Daily · 7:00 – 22:00",
    },
    specialty: "Fresh roasted beans & coffee workshops",
    wifi: "Strong Wi-Fi · 25+ seats · Workspace friendly",
  },
  {
    id: 4,
    name: "Morning Grind",
    category: "COFFEE SHOP",
    address: "Bulevardul Unirii 75, Bucuresti",
    image:
      "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=600&h=400&fit=crop",
    points: 2,
    description:
      "Bustling morning café perfect for grab-and-go coffee, breakfast sandwiches, and quick meetings before work.",
    hours: {
      label: "Mon-Fri · 6:30 – 19:00",
    },
    specialty: "Quick service & breakfast combos",
    wifi: "Good Wi-Fi · 10+ seats · Quick service",
  },
];

export function getCardById(id) {
  return cards.find((card) => String(card.id) === String(id));
}

