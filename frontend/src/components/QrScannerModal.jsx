import React, { useEffect, useRef, useState, useCallback } from "react";
import QrScanner from "qr-scanner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faLightbulb } from "@fortawesome/free-solid-svg-icons";
import Modal from "../components/Modal";

/**
 * QrScannerModal
 *
 * Props:
 *   isOpen   — boolean
 *   onClose  — () => void
 *   onScan   — (result: string) => void   called once on first successful scan
 */
export default function QrScannerModal({ isOpen, onClose, onScan }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const [error, setError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [scanned, setScanned] = useState(false); // prevent double-firing
  const [manualId, setManualId] = useState(""); // manual user ID entry

  // ── Bootstrap scanner when modal opens ───────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    // Reset state on each open
    setError(null);
    setScanned(false);
    setTorchOn(false);

    if (!videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        // result is { data: string } in @nimiq/qr-scanner v1.4+
        const value = typeof result === "object" ? result.data : result;
        setScanned(true);
        scanner.stop();
        onScan(value);
        onClose();
      },
      {
        // Prefer back camera (faster for baristas pointing at customers)
        preferredCamera: "environment",
        // Highlight the detected QR region
        highlightScanRegion: true,
        highlightCodeOutline: true,
        // Return detailed result object
        returnDetailedScanResult: true,
      },
    );

    scannerRef.current = scanner;

    scanner
      .start()
      .then(() => {
        QrScanner.hasCamera().then((has) => {
          if (!has) setError("No camera found on this device.");
        });
        // Check torch support after start
        scanner
          .hasFlash()
          .then((has) => setTorchAvailable(has))
          .catch(() => setTorchAvailable(false));
      })
      .catch((err) => {
        console.error("QrScanner start error:", err);
        if (err?.name === "NotAllowedError") {
          setError(
            "Camera permission denied. Please allow camera access and try again.",
          );
        } else if (err?.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError("Could not start camera. Please try again.");
        }
      });

    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Torch toggle ─────────────────────────────────────────────────────────
  const toggleTorch = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      if (torchOn) {
        await scannerRef.current.turnFlashOff();
      } else {
        await scannerRef.current.turnFlashOn();
      }
      setTorchOn((prev) => !prev);
    } catch {
      // Torch not supported — silently ignore
    }
  }, [torchOn]);

  // ── Manual user ID submission ────────────────────────────────────────────
  const handleManualIdSubmit = (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    setScanned(true);
    onScan(manualId.trim());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Customer QR" size="md">
      <div className="flex flex-col items-center gap-4">
        {/* Camera viewport */}
        <div
          className="relative w-full rounded-xl overflow-hidden bg-black"
          style={{ aspectRatio: "1 / 1" }}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />

          {/* Corner-bracket overlay — purely decorative targeting UI */}
          {!error && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-48 h-48">
                {/* Top-left */}
                <span className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-white rounded-tl-sm" />
                {/* Top-right */}
                <span className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-white rounded-tr-sm" />
                {/* Bottom-left */}
                <span className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-white rounded-bl-sm" />
                {/* Bottom-right */}
                <span className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-white rounded-br-sm" />
              </div>
            </div>
          )}

          {/* Torch button — overlaid bottom-right */}
          {torchAvailable && !error && (
            <button
              onClick={toggleTorch}
              className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md
                ${
                  torchOn
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-black/50 text-white hover:bg-black/70"
                }`}
              aria-label={torchOn ? "Turn torch off" : "Turn torch on"}
            >
              <FontAwesomeIcon
                icon={torchOn ? faBolt : faLightbulb}
                className="text-sm"
              />
            </button>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white text-center p-6 gap-3">
              <p className="text-sm leading-relaxed">{error}</p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-lg bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Hint */}
        {!error && (
          <p className="text-xs text-gray-400 text-center">
            Point the camera at the customer's QR code. It will scan
            automatically.
          </p>
        )}

        {/* Manual user ID entry */}
        <div className="w-full">
          <form onSubmit={handleManualIdSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Or enter user ID..."
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!manualId.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Search
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            No camera? Enter the customer's user ID manually.
          </p>
        </div>
      </div>
    </Modal>
  );
}
