"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode, Download, Copy, Check } from "lucide-react";
import QRCode from "qrcode";

export function QRCodeCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storeUrl = window.location.origin;
    setUrl(storeUrl);
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, storeUrl, {
        width: 200,
        margin: 2,
        color: { dark: "#111827", light: "#ffffff" },
      });
    }
  }, []);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "qrcode-loja.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function copyUrl() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <QrCode size={16} className="text-green-600" />
        <h2 className="font-semibold text-gray-900">QR Code da loja</h2>
      </div>
      <p className="text-xs text-gray-500">
        Compartilhe com os clientes para que eles acessem a loja pelo celular.
      </p>

      <div className="flex justify-center">
        <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm inline-block">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {url && (
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <span className="text-xs text-gray-500 truncate flex-1">{url}</span>
          <button onClick={copyUrl} className="text-gray-400 hover:text-green-600 shrink-0">
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
          </button>
        </div>
      )}

      <button
        onClick={download}
        className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition"
      >
        <Download size={15} />
        Baixar QR Code (PNG)
      </button>
    </div>
  );
}
