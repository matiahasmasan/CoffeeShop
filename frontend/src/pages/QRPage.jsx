import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "../components/QRCode";

export default function QRPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQRToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/qr-token", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      setToken(data.qr_token);
    } catch (err) {
      setError("Nu s-a putut genera codul QR.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRToken();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 bg-gray-50">
      <h2 className="text-xl font-bold text-gray-800">Codul tău QR</h2>

      {loading && <p className="text-gray-400 text-sm">Se generează...</p>}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {token && <QRCode token={token} />}

      <button
        onClick={fetchQRToken}
        className="mt-2 px-6 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-lg hover:bg-indigo-600 transition-colors"
      >
        Regenerează
      </button>

      <button
        onClick={() => navigate(-1)}
        className="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
      >
        Înapoi
      </button>

      <p className="text-xs text-gray-400 text-center">
        Prezintă acest cod la casă. Expiră în 5 minute.
      </p>
    </div>
  );
}
