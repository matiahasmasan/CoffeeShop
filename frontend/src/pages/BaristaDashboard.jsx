import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faHouse,
  faQrcode,
  faArrowRightArrowLeft,
  faMugHot,
  faClipboard,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "../components/Sidebar";
import QrScannerModal from "../components/QrScannerModal";
import ToastMessage from "../components/ToastMessage";

const API = import.meta.env.VITE_API_URL;

const BARISTA_LINKS = [
  { label: "Home", icon: faHouse, path: "/barista-dashboard" },
  { label: "Scan QR", icon: faQrcode, path: "/barista/scan" },
  {
    label: "Transactions",
    icon: faArrowRightArrowLeft,
    path: "/barista/transactions",
  },
];

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export default function BaristaDashboard() {
  const [user] = useState(() => {
    const s = localStorage.getItem("user");
    return s ? JSON.parse(s) : null;
  });

  const [storeName, setStoreName] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── QR scanner state ──────────────────────────────────────────────────────
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scannedClient, setScannedClient] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState(1);
  const [addingPoints, setAddingPoints] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [scanMode, setScanMode] = useState("add"); // 'add' or 'redeem'
  const [redeemingReward, setRedeemingReward] = useState(false);
  const [storePointsThreshold, setStorePointsThreshold] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const resultRef = useRef(null);

  const handleManualSubmit = (mode) => {
    const trimmed = manualCode.trim().toUpperCase();
    if (!trimmed) return;
    setScanMode(mode);
    setScanResult("");
    setScannedClient(null);
    handleScan(trimmed, mode);
    setManualCode("");
  };

  useEffect(() => {
    if (!user?.store_id) return;
    fetch(`${API}/api/stores/${user.store_id}`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => {
        setStoreName(d.name ?? null);
        setStorePointsThreshold(d.max_points ?? 6);
      })
      .catch(() => {});
  }, [user?.store_id]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(""), 4200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Called by QrScannerModal on successful scan
  const handleScan = async (value, mode = scanMode) => {
    setScanLoading(true);
    setCopied(false);
    setScannedClient(null);
    try {
      // Detect input type: numeric userId, hashids short code, or QR token (JWT)
      let requestBody;
      if (/^\d+$/.test(value)) {
        requestBody = { userId: value };
      } else if (/^[A-Z2-9]+$/.test(value)) {
        requestBody = { shortCode: value };
      } else {
        requestBody = { qrToken: value };
      }

      const res = await fetch(`${API}/api/qr/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.mesaj || "Invalid QR token.");

      setScanResult(`${data.clientName}`);

      // If in redeem mode, fetch the customer's card for this store
      if (mode === "redeem") {
        try {
          const cardRes = await fetch(
            `${API}/api/barista/customer-card/${user?.store_id}/${data.userId}`,
            { headers: authHeader() },
          );
          const cardData = await cardRes.json();
          if (!cardRes.ok) {
            throw new Error(
              cardData?.mesaj || "Could not fetch customer points.",
            );
          }
          setScannedClient({
            userId: data.userId,
            name: data.clientName,
            points: cardData.points ?? 0,
          });
        } catch (err) {
          setScanResult(
            err.message || "Could not fetch customer points. No card found.",
          );
          setScannedClient(null);
        }
      } else {
        setScannedClient({ userId: data.userId, name: data.clientName });
      }
    } catch (err) {
      setScanResult(err.message || "Could not read this QR code.");
    } finally {
      setScanLoading(false);
      // Briefly highlight the textbox so the barista sees the result
      setTimeout(() => resultRef.current?.select(), 50);
    }
  };

  const handleAddPoints = async () => {
    if (!scannedClient?.userId || !pointsToAdd) return;

    setAddingPoints(true);
    try {
      const res = await fetch(`${API}/api/barista/points/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({
          customerUserId: scannedClient.userId,
          points: Number(pointsToAdd),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.mesaj || "Could not add points.");

      setCopied(false);
      setToastMessage(
        `You have added ${data.pointsAdded} points to ${data.clientName}. Now ${data.clientName} has ${data.pointsNow} points at ${data.storeName}.`,
      );
    } catch (err) {
      setScanResult(err.message || "Could not add points.");
    } finally {
      setAddingPoints(false);
    }
  };

  const handleRedeemReward = async () => {
    if (!scannedClient?.userId) return;

    setRedeemingReward(true);
    try {
      const res = await fetch(`${API}/api/barista/reward/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({
          customerUserId: scannedClient.userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.mesaj || "Could not redeem reward.");

      setCopied(false);
      setToastMessage(
        `${data.clientName} has redeemed a free coffee! Remaining points: ${data.pointsRemaining}`,
      );
    } catch (err) {
      setScanResult(err.message || "Could not redeem reward.");
    } finally {
      setRedeemingReward(false);
    }
  };

  const handleScanNextCustomer = () => {
    setScanResult("");
    setScannedClient(null);
    setPointsToAdd(1);
    setCopied(false);
    setScanMode("add"); // Reset to add mode
    setScannerOpen(true);
  };

  // Copy-to-clipboard helper
  const handleCopy = async () => {
    if (!scanResult) return;
    try {
      await navigator.clipboard.writeText(scanResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / HTTP
      resultRef.current?.select();
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        storeName={storeName}
        links={BARISTA_LINKS}
      />

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => {
          setScannerOpen(false);
        }}
        onScan={handleScan}
      />

      {/* Header */}
      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {storeName ?? "..."} — Barista
        </h2>
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <FontAwesomeIcon icon={faBars} className="text-lg" />
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 p-6 max-w-3xl w-full mx-auto">
        {/* Welcome */}
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">
            Hello, {user?.firstName ?? "Barista"}!
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Ready to serve some coffee today?
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
            onClick={() => {
              setScanMode("add");
              setScannerOpen(true);
            }}
          >
            <div className="w-12 h-12 rounded-lg bg-gray-900 text-white flex items-center justify-center">
              <FontAwesomeIcon icon={faQrcode} className="text-lg" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Scan QR</p>
              <p className="text-xs text-gray-500">Add points to a customer</p>
            </div>
          </button>

          <button
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
            onClick={() => {
              setScanMode("redeem");
              setScannerOpen(true);
            }}
          >
            <div className="w-12 h-12 rounded-lg bg-gray-900 text-white flex items-center justify-center">
              <FontAwesomeIcon icon={faMugHot} className="text-lg" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Redeem Reward</p>
              <p className="text-xs text-gray-500">Validate a customer claim</p>
            </div>
          </button>
        </div>

        {/* Manual code entry */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
            Or enter customer code manually
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. XK7P2M"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono uppercase tracking-widest text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
              maxLength={20}
            />
            <button
              onClick={() => handleManualSubmit("add")}
              disabled={!manualCode.trim() || scanLoading}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add points
            </button>
            <button
              onClick={() => handleManualSubmit("redeem")}
              disabled={!manualCode.trim() || scanLoading}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Redeem
            </button>
          </div>
        </div>

        {/* Scan result — only shown after a scan */}
        {(scanResult || scanLoading) && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6 animate-fade-in">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
              {scanMode === "add"
                ? "Last scan result"
                : "Customer for redemption"}
            </p>
            <div className="flex items-center gap-2">
              <input
                ref={resultRef}
                type="text"
                readOnly
                value={scanLoading ? "Looking up client..." : scanResult}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-gray-300 truncate"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={handleCopy}
                disabled={scanLoading}
                className={`shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center transition-colors
                  ${
                    copied
                      ? "bg-green-50 border-green-200 text-green-600"
                      : "bg-white border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300"
                  }`}
                aria-label="Copy to clipboard"
                title="Copy"
              >
                <FontAwesomeIcon
                  icon={copied ? faCheck : faClipboard}
                  className="text-sm"
                />
              </button>
            </div>

            {/* Add points section */}
            {scannedClient && scanMode === "add" && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setPointsToAdd((prev) => Math.max(1, Number(prev) - 1))
                    }
                    disabled={addingPoints}
                    className="h-10 w-10 rounded-lg border border-gray-200 bg-white text-lg font-semibold text-gray-700 disabled:opacity-50"
                    aria-label="Decrease points"
                  >
                    -
                  </button>
                  <div className="h-10 min-w-12 rounded-lg border border-gray-200 bg-gray-50 px-3 flex items-center justify-center text-sm font-semibold text-gray-800">
                    {pointsToAdd}
                  </div>
                  <button
                    onClick={() =>
                      setPointsToAdd((prev) => Math.min(20, Number(prev) + 1))
                    }
                    disabled={addingPoints}
                    className="h-10 w-10 rounded-lg border border-gray-200 bg-white text-lg font-semibold text-gray-700 disabled:opacity-50"
                    aria-label="Increase points"
                  >
                    +
                  </button>
                  <button
                    onClick={handleAddPoints}
                    disabled={addingPoints}
                    className="h-10 flex-1 rounded-lg bg-indigo-600 px-4 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingPoints ? "Adding..." : "Add points"}
                  </button>
                </div>
                <button
                  onClick={handleScanNextCustomer}
                  className="w-full h-10 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Scan next customer
                </button>
              </div>
            )}

            {/* Redeem reward section */}
            {scannedClient && scanMode === "redeem" && (
              <div className="mt-4 space-y-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-blue-700 font-semibold mb-2">
                    Points required for free coffee
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-blue-900">
                        {storePointsThreshold ?? 6}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        points needed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-800">
                        {scannedClient.points ?? 0}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        points available
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRedeemReward}
                  disabled={redeemingReward}
                  className={`w-full h-11 rounded-lg px-4 text-white text-sm font-semibold transition-colors
                    ${
                      scannedClient.points >= (storePointsThreshold ?? 6)
                        ? "bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                        : "bg-gray-300 cursor-not-allowed"
                    }`}
                >
                  {redeemingReward
                    ? "Processing..."
                    : scannedClient.points >= (storePointsThreshold ?? 6)
                      ? "✓ Redeem free coffee"
                      : "Insufficient points"}
                </button>

                <button
                  onClick={handleScanNextCustomer}
                  className="w-full h-10 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Scan another customer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats placeholder */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
              Scans today
            </p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">—</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
              Points given
            </p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">—</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 col-span-2 sm:col-span-1">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
              Rewards claimed
            </p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">—</p>
          </div>
        </div>

        {/* Recent activity placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800">
              Recent activity
            </h4>
          </div>
          <div className="flex justify-center items-center py-12 text-gray-400 text-sm">
            No activity yet.
          </div>
        </div>
      </main>
      <ToastMessage message={toastMessage} visible={Boolean(toastMessage)} />
    </div>
  );
}
