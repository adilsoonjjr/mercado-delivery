"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Bell } from "lucide-react";
import { formatCurrency } from "@/lib/format";

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    [0, 0.15, 0.3].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.12);
    });
  } catch { /* no audio */ }
}

type Toast = { id: string; title: string; message: string };

export function AdminNotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const esRef = useRef<EventSource | null>(null);

  const addToast = useCallback((t: Toast) => {
    setToasts((prev) => [t, ...prev].slice(0, 5));
    playBeep();
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/admin/sse");
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "NEW_ORDER") {
          addToast({
            id: data.order.id,
            title: "🛒 Novo pedido!",
            message: `${data.order.user.name} · ${formatCurrency(data.order.total)}`,
          });
        }
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      // Browser will auto-reconnect for SSE
    };

    return () => { es.close(); };
  }, [addToast]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-80 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-green-200 rounded-2xl shadow-xl p-4 flex items-start gap-3 pointer-events-auto"
            style={{ animation: "slideIn 0.3s ease-out" }}
          >
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <Bell size={16} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{t.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{t.message}</p>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
