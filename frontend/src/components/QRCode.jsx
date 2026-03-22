import { QRCodeSVG } from "qrcode.react";

export default function QRCode({ token }) {
  return (
    <div className="p-4 bg-white rounded-2xl shadow-lg">
      <QRCodeSVG value={token} size={220} />
    </div>
  );
}
