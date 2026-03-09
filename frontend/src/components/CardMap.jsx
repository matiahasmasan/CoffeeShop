export default function CardMap({ mapsLink }) {
  const getEmbedUrl = (link) => {
    if (!link) return null;
    try {
      const url = new URL(link);
      const q = url.searchParams.get("q");
      if (q) {
        return `https://maps.google.com/maps?output=embed&q=${encodeURIComponent(q)}`;
      }
    } catch {
      return null;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(mapsLink);

  return (
    <div className="animate-slide-up">
      <h3 className="font-bold text-gray-900 text-sm mb-3">Location</h3>
      <div className="relative overflow-hidden rounded-lg shadow-lg">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            width="100%"
            height="250"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps"
            className="rounded-lg"
          />
        ) : (
          <div className="flex items-center justify-center h-48 bg-gray-100 text-gray-500 text-sm rounded-lg">
            No location available
          </div>
        )}
      </div>
    </div>
  );
}
