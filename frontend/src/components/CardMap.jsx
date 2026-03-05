export default function CardMap({ mapsLink, shopName }) {
  console.log("CardMap received mapsLink:", mapsLink);
  return (
    <div className="animate-slide-up">
      <h3 className="font-bold text-gray-900 text-sm mb-3">Location</h3>
      <div className="relative overflow-hidden rounded-lg shadow-lg">
        <iframe
          src={mapsLink}
          width="100%"
          height="200"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`${shopName} location on Google Maps`}
          className="hover:scale-105 transition-transform duration-700"
        />
      </div>
    </div>
  );
}
