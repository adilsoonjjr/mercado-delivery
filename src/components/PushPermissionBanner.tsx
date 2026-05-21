"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

export function PushPermissionBanner() {
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "default") return;
    // Show banner after 3s
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, []);

  async function enable() {
    setSubscribing(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setShow(false); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
    } catch {
      // permission denied or not supported — silently ignore
    } finally {
      setShow(false);
      setSubscribing(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-start gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
          <Bell size={18} className="text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Receba nossas promoções</p>
          <p className="text-xs text-gray-500 mt-0.5">Ative as notificações e fique por dentro das ofertas e do status do seu pedido.</p>
          <button
            onClick={enable}
            disabled={subscribing}
            className="mt-2 bg-green-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
          >
            {subscribing ? "Ativando..." : "Ativar notificações"}
          </button>
        </div>
        <button onClick={() => setShow(false)} className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
