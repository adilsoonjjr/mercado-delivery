"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronDown, ChevronUp, RefreshCw, Phone, MapPin } from "lucide-react";
import { formatCurrency, formatDate, STATUS_LABEL, STATUS_COLOR, PAYMENT_LABEL } from "@/lib/format";

type OrderItem = { id: string; productName: string; quantity: number; productPrice: number; subtotal: number };
type Order = {
  id: string; status: string; total: number; subtotal: number; deliveryFee: number;
  paymentMethod: string; changeFor?: number; deliveryAddress: string; zoneName?: string;
  notes?: string; createdAt: string;
  user: { name: string; email: string; phone?: string; cpf?: string; address?: string };
  items: OrderItem[];
};

const STATUS_FLOW = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

export default function AdminPedidos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/pedidos");
    setOrders(await res.json());
  }, []);

  useEffect(() => {
    load();
    // Poll every 20s as fallback
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await fetch(`/api/admin/pedidos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    load();
  }

  const filters = [
    { value: "ALL", label: "Todos" },
    { value: "PENDING", label: "Aguardando" },
    { value: "CONFIRMED", label: "Confirmados" },
    { value: "PREPARING", label: "Preparando" },
    { value: "OUT_FOR_DELIVERY", label: "Na entrega" },
    { value: "DELIVERED", label: "Entregues" },
    { value: "CANCELLED", label: "Cancelados" },
  ];

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;

  function whatsappLink(order: Order) {
    const phone = order.user.phone?.replace(/\D/g, "");
    if (!phone) return null;
    const status = STATUS_LABEL[order.status] ?? order.status;
    const msg = encodeURIComponent(`Olá ${order.user.name}! Seu pedido está: *${status}*. Total: ${formatCurrency(order.total)}. Obrigado pela preferência! 🛒`);
    return `https://wa.me/55${phone}?text=${msg}`;
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
          {pendingCount > 0 && (
            <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              {pendingCount} novo{pendingCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map(({ value, label }) => (
          <button key={value} onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === value ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-green-400"}`}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-16 text-sm">Nenhum pedido aqui.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className={`bg-white rounded-2xl border overflow-hidden ${order.status === "PENDING" ? "border-yellow-300" : "border-gray-100"}`}>
              <div
                className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div>
                  <p className="font-medium text-sm text-gray-900">{order.user.name}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(order.createdAt)} · {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
                    {order.zoneName && ` · ${order.zoneName}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <span className="font-semibold text-sm text-gray-900">{formatCurrency(order.total)}</span>
                  {expanded === order.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>

              {expanded === order.id && (
                <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                  {/* Customer info */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">Cliente</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Nome</p>
                        <p className="font-medium text-gray-900">{order.user.name}</p>
                      </div>
                      {order.user.cpf && (
                        <div>
                          <p className="text-xs text-gray-400">CPF</p>
                          <p className="font-medium text-gray-900">{order.user.cpf}</p>
                        </div>
                      )}
                      {order.user.phone && (
                        <div className="flex items-start gap-1.5">
                          <Phone size={12} className="text-gray-400 mt-1 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Telefone</p>
                            <p className="font-medium text-gray-900">{order.user.phone}</p>
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400">E-mail</p>
                        <p className="font-medium text-gray-900 text-xs">{order.user.email}</p>
                      </div>
                    </div>
                    {order.user.phone && (
                      <a href={whatsappLink(order) ?? "#"} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition mt-1">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Enviar WhatsApp
                      </a>
                    )}
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Itens</p>
                    <div className="space-y-1.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.quantity}x {item.productName}</span>
                          <span className="text-gray-900 font-medium">{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 space-y-1 text-sm">
                      <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                      <div className="flex justify-between text-gray-500"><span>Entrega</span><span>{formatCurrency(order.deliveryFee)}</span></div>
                      <div className="flex justify-between font-semibold text-gray-900"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
                      {order.changeFor && (
                        <div className="flex justify-between text-orange-600 text-xs">
                          <span>Troco para</span><span>{formatCurrency(order.changeFor)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery address */}
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Endereço de entrega</p>
                      <p className="text-gray-700">{order.deliveryAddress}</p>
                    </div>
                  </div>
                  {order.notes && (
                    <div className="text-sm text-gray-500 bg-yellow-50 rounded-xl px-3 py-2">
                      📝 {order.notes}
                    </div>
                  )}

                  {/* Status update */}
                  {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">Atualizar status</p>
                      <div className="flex gap-2 flex-wrap">
                        {STATUS_FLOW.filter((s) => s !== order.status).map((s) => (
                          <button key={s} onClick={() => updateStatus(order.id, s)}
                            disabled={updating === order.id}
                            className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition disabled:opacity-60">
                            → {STATUS_LABEL[s]}
                          </button>
                        ))}
                        <button onClick={() => updateStatus(order.id, "CANCELLED")}
                          disabled={updating === order.id}
                          className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition disabled:opacity-60">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
