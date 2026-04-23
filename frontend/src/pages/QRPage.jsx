import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "../components/QRCode";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function QRPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("qr");

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
      setError("Could not generate QR code.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRToken();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <h2 className="text-xl font-bold text-gray-800">Your QR Code</h2>

        {loading && <p className="text-gray-400 text-sm">Waiting...</p>}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {token && <QRCode token={token} />}

        <button
          onClick={fetchQRToken}
          className="mt-2 px-6 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-lg hover:bg-indigo-600 transition-colors"
        >
          Generate
        </button>

        <p className="text-xs text-gray-400 text-center">
          Show this QR code to customers to let them check in at your business.
        </p>
      </div>
      <Footer activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
