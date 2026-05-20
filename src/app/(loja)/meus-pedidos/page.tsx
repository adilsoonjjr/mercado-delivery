"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, CheckCircle2, Clock, Truck, ChefHat, XCircle, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate, PAYMENT_LABEL } from "@/lib/format";

type OrderItem = { id: string; productName: string; quantity: number; subtotal: number };
type Order = {
  id: string; status: string; total: number; deliveryFee: number; subtotal: number;
  paymentMethod: string; changeFor?: number; zoneName?: string;
  deliveryAddress: string; notes?: string; createdAt: string; items: OrderItem[];
};

const STEPS = [
  { status: "PENDING",          label: "Pedido recebido",    icon: Clock },
  { status: "CONFIRMED",        label: "Confirmado",          icon: CheckCircle2 },
  { status: "PREPARING",        label: "Em preparação",       icon: ChefHat },
  { status: "OUT_FOR_DELIVERY", label: "Saiu para entrega",   icon: Truck },
  { status: "DELIVERED",        label: "Entregue",            icon: CheckCircle2 },
];

function StatusTimeline({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
        <XCircle size={16} /> Pedido cancelado
      </div>
    );
  }
  const currentIdx = STEPS.findIndex((s) => s.status === status);
  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-1">
      <div className="flex items-start gap-0 min-w-max">
        {STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.status} className="flex items-start">
              <div className={`flex flex-col items-center gap-1.5 w-14 ${active ? "opacity-100" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${done ? "bg-green-600" : "bg-gray-200"} ${active ? "ring-2 ring-green-300 ring-offset-1" : ""}`}>
                  <Icon size={15} className={done ? "text-white" : "text-gray-400"} />
                </div>
                <p className={`text-[10px] text-center leading-tight font-medium w-full ${done ? "text-green-700" : "text-gray-400"}`}>
                  {step.label}
                </p>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 w-5 mt-4 mx-0.5 shrink-0 ${idx < currentIdx ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MeusPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await fetch("/api/pedidos").then((r) => r.json());
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Poll for status updates every 15 seconds for active orders
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeOrders = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="font-bold text-gray-900">Meus pedidos</h1>
          </div>
          <button onClick={load} className="p-2 rounded-full hover:bg-gray-100">
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {loading && <p className="text-center text-gray-400 py-12 text-sm">Carregando...</p>}

        {!loading && orders.length === 0 && (
          <div className="text-center py-16">
            <Package size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum pedido ainda.</p>
            <Link href="/" className="mt-4 inline-block text-green-600 text-sm font-medium">Fazer primeiro pedido →</Link>
          </div>
        )}

        {activeOrders.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-gray-500 font-medium uppercase mb-2">Em andamento · atualiza automaticamente</p>
          </div>
        )}

        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                    {order.zoneName && <p className="text-xs text-gray-500 mt-0.5">📍 {order.zoneName}</p>}
                  </div>
                  <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
                </div>
                <StatusTimeline status={order.status} />
              </div>

              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="w-full text-center text-xs text-gray-400 py-2 border-t border-gray-50 hover:bg-gray-50"
              >
                {expanded === order.id ? "Ocultar detalhes ▲" : "Ver detalhes ▼"}
              </button>

              {expanded === order.id && (
                <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                  <div className="space-y-1.5">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-gray-600">
                        <span>{item.quantity}x {item.productName}</span>
                        <span>{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Entrega</span><span>{formatCurrency(order.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-900">
                      <span>Total</span><span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Pagamento: {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
                      {order.changeFor ? ` · Troco para ${formatCurrency(order.changeFor)}` : ""}
                    </p>
                    {order.deliveryAddress && <p>📍 {order.deliveryAddress}</p>}
                    {order.notes && <p>📝 {order.notes}</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
