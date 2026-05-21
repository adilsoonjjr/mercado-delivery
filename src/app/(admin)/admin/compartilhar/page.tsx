"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Share2, Printer, Copy, Check } from "lucide-react";

export default function CompartilharPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [marketName, setMarketName] = useState("Meu Mercado");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storeUrl = window.location.origin;
    setUrl(storeUrl);

    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => { if (d.marketName) setMarketName(d.marketName); });
  }, []);

  useEffect(() => {
    if (!url || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 260,
      margin: 2,
      color: { dark: "#14532d", light: "#ffffff" },
    });
  }, [url]);

  function copyUrl() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function downloadPng() {
    // Generate high-res QR
    const dataUrl = await QRCode.toDataURL(url, {
      width: 800,
      margin: 3,
      color: { dark: "#14532d", light: "#ffffff" },
    });

    // Draw card on an off-screen canvas
    const card = document.createElement("canvas");
    card.width = 900;
    card.height = 1100;
    const ctx = card.getContext("2d")!;

    // Background
    ctx.fillStyle = "#f0fdf4";
    ctx.fillRect(0, 0, 900, 1100);

    // Green top bar
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(0, 0, 900, 160);

    // Market name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(marketName, 450, 105);

    // Subtitle on bar
    ctx.font = "32px sans-serif";
    ctx.fillStyle = "#bbf7d0";
    ctx.fillText("Faça seu pedido online", 450, 150);

    // QR code image
    const img = new Image();
    img.src = dataUrl;
    await new Promise((res) => { img.onload = res; });
    ctx.drawImage(img, 50, 180, 800, 800);

    // Bottom text
    ctx.fillStyle = "#15803d";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("Escaneie e peça agora", 450, 1030);

    ctx.fillStyle = "#6b7280";
    ctx.font = "26px sans-serif";
    ctx.fillText(url, 450, 1080);

    const link = document.createElement("a");
    link.download = `qrcode-${marketName.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = card.toDataURL("image/png");
    link.click();
  }

  function shareWhatsApp() {
    const text = `Olá! Agora você pode fazer seus pedidos pelo celular 📱\n\nAcesse nossa loja online: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function print() {
    window.print();
  }

  return (
    <div className="p-6 max-w-sm space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Compartilhar loja</h1>
      <p className="text-sm text-gray-500">
        Mostre este QR code para os clientes ou baixe o cartão para imprimir.
      </p>

      {/* Cartão de prévia */}
      <div
        ref={cardRef}
        id="qr-card"
        className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100"
      >
        {/* Header verde */}
        <div className="bg-green-600 px-6 py-5 text-center">
          <p className="text-white font-bold text-xl leading-tight">{marketName}</p>
          <p className="text-green-200 text-sm mt-1">Faça seu pedido online</p>
        </div>

        {/* QR code */}
        <div className="flex flex-col items-center py-6 px-4 gap-3">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <canvas ref={canvasRef} />
          </div>
          <p className="text-green-800 font-semibold text-sm">Escaneie e peça agora</p>

          {/* URL */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 w-full">
            <span className="text-xs text-gray-400 truncate flex-1">{url}</span>
            <button onClick={copyUrl} className="shrink-0 text-gray-400 hover:text-green-600">
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="space-y-3">
        <button
          onClick={downloadPng}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-700 transition"
        >
          <Download size={16} />
          Baixar cartão (PNG)
        </button>

        <button
          onClick={shareWhatsApp}
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#1ebe5d] transition"
        >
          <Share2 size={16} />
          Compartilhar no WhatsApp
        </button>

        <button
          onClick={print}
          className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition"
        >
          <Printer size={16} />
          Imprimir
        </button>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #qr-card { display: block !important; position: fixed; top: 0; left: 0; width: 100vw; }
        }
      `}</style>
    </div>
  );
}
