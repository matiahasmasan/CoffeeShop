import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "../components/QRCode";
import Footer from "../components/Footer";
import Header from "../components/Header";

const API = import.meta.env.VITE_API_URL;

export default function QRPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [shortCode, setShortCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("qr");

  const fetchQRToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = localStorage.getItem("token");
      const res = await fetch(`${API}/api/qr-token`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      setToken(data.qr_token);
      setShortCode(data.short_code);
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

        {shortCode && (
          <div className="text-center mt-2">
            <p className="text-xs text-gray-500 mb-1">Or enter this code</p>
            <p className="text-3xl font-mono font-bold tracking-widest text-gray-800">
              {shortCode}
            </p>
          </div>
        )}
      </div>
      <Footer activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
