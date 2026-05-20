"use client";

import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, CheckCircle, MapPin } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";

type Config = { fee: number; minOrderValue: number; estimatedMinutes: number };
type Zone = { id: string; name: string; fee: number; estimatedMinutes: number };

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [config, setConfig] = useState<Config | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState("");

  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("PIX");
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then(setConfig);
    fetch("/api/zonas").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setZones(data);
    });
  }, []);

  // Pre-fill address from user profile if available
  useEffect(() => {
    if (session?.user) {
      fetch("/api/me").then((r) => r.json()).then((u) => {
        if (u.address && !address) setAddress(u.address);
      }).catch(() => {});
    }
  }, [session, address]);

  useEffect(() => {
    if (items.length === 0 && !done) router.push("/");
  }, [items, done, router]);

  const selectedZone = zones.find((z) => z.id === selectedZoneId) ?? null;
  const deliveryFee = selectedZone ? selectedZone.fee : (config?.fee ?? 0);
  const estimatedMinutes = selectedZone ? selectedZone.estimatedMinutes : (config?.estimatedMinutes ?? 45);
  const grandTotal = total + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) { router.push("/login?redirect=/checkout"); return; }
    if (zones.length > 0 && !selectedZoneId) { alert("Selecione seu bairro de entrega."); return; }
    setLoading(true);

    const res = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity })),
        deliveryAddress: address,
        paymentMethod: payment,
        notes,
        deliveryFee,
        changeFor: payment === "CASH" ? changeFor : null,
        zoneName: selectedZone?.name ?? null,
      }),
    });

    if (res.ok) { clearCart(); setDone(true); }
    else alert("Erro ao criar pedido. Tente novamente.");
    setLoading(false);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <CheckCircle size={64} className="text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido feito!</h2>
        <p className="text-gray-500 mb-2">Seu pedido foi recebido e está sendo preparado.</p>
        <p className="text-sm text-gray-400 mb-8">Previsão de entrega: ~{estimatedMinutes} minutos.</p>
        <div className="flex gap-3">
          <Link href="/meus-pedidos" className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-green-700">
            Acompanhar pedido
          </Link>
          <Link href="/" className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium text-sm hover:bg-gray-50">
            Início
          </Link>
        </div>
      </div>
    );
  }

  const paymentOptions = [
    { value: "PIX", label: "Pix", desc: "Chave enviada na confirmação" },
    { value: "CASH", label: "Dinheiro", desc: "Pague na entrega" },
    { value: "CARD_ON_DELIVERY", label: "Cartão na entrega", desc: "Débito ou crédito" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/carrinho" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="font-bold text-gray-900">Finalizar pedido</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {zones.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-green-600" />
              <h2 className="font-semibold text-gray-900">Bairro de entrega</h2>
            </div>
            <select required value={selectedZoneId} onChange={(e) => setSelectedZoneId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
              <option value="">Selecione seu bairro...</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name} — {formatCurrency(z.fee)}</option>
              ))}
            </select>
            {selectedZone && (
              <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                Taxa: <strong>{formatCurrency(selectedZone.fee)}</strong> · Previsão: ~{selectedZone.estimatedMinutes}min
              </p>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Endereço de entrega</h2>
          <textarea required value={address} onChange={(e) => setAddress(e.target.value)}
            placeholder="Rua, número, complemento..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Forma de pagamento</h2>
          {paymentOptions.map((opt) => (
            <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${payment === opt.value ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
              <input type="radio" name="payment" value={opt.value} checked={payment === opt.value}
                onChange={() => setPayment(opt.value)} className="accent-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-400">{opt.desc}</p>
              </div>
            </label>
          ))}

          {payment === "CASH" && (
            <div className="pt-1 space-y-2">
              <p className="text-sm font-medium text-gray-700">Precisa de troco?</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setChangeFor("")}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${changeFor === "" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-200"}`}>
                  Não preciso
                </button>
                <button type="button" onClick={() => setChangeFor(changeFor || String(Math.ceil(grandTotal / 10) * 10))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${changeFor !== "" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-200"}`}>
                  Sim, preciso
                </button>
              </div>
              {changeFor !== "" && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Troco para quanto?</label>
                  <input type="number" min={grandTotal} step="0.01" value={changeFor}
                    onChange={(e) => setChangeFor(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={`Mínimo ${formatCurrency(grandTotal)}`} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Observações (opcional)</h2>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: sem cebola, portão azul..."
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <h2 className="font-semibold text-gray-900 mb-3">Resumo</h2>
          {items.map((i) => (
            <div key={i.productId} className="flex justify-between text-sm text-gray-600">
              <span>{i.quantity}x {i.name}</span>
              <span>{formatCurrency(i.price * i.quantity)}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-100 space-y-1">
            <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>{formatCurrency(total)}</span></div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Entrega{selectedZone ? ` · ${selectedZone.name}` : ""}</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
            {payment === "CASH" && changeFor && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Troco para</span><span>{formatCurrency(parseFloat(changeFor))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
              <span>Total</span><span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
          <div className="max-w-lg mx-auto">
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 text-white rounded-2xl py-4 font-bold hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 size={18} className="animate-spin" />}
              Confirmar pedido · {formatCurrency(grandTotal)}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
