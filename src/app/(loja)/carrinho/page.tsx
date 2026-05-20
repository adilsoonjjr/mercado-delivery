"use client";

import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import Image from "next/image";

type Config = { fee: number; minOrderValue: number; isDeliveryActive: boolean };

export default function CarrinhoPage() {
  const { items, updateQty, removeItem, total } = useCart();
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then(setConfig);
  }, []);

  const deliveryFee = config?.fee ?? 0;
  const grandTotal = total + deliveryFee;
  const belowMin = config ? total < config.minOrderValue : false;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <ShoppingBag size={56} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Carrinho vazio</h2>
        <p className="text-gray-400 text-sm mb-6">Adicione produtos para fazer seu pedido.</p>
        <Link href="/" className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-green-700">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="font-bold text-gray-900">Meu carrinho</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {items.map((item) => (
          <div key={item.productId} className="bg-white rounded-2xl border border-gray-100 flex items-center gap-3 p-3">
            <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name} width={56} height={56} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">🛒</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-green-700 font-bold text-sm">{formatCurrency(item.price)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200">
                <Minus size={12} />
              </button>
              <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
              <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200">
                <Plus size={12} />
              </button>
              <button onClick={() => removeItem(item.productId)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 ml-1">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Taxa de entrega</span><span>{formatCurrency(deliveryFee)}</span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex justify-between font-bold text-gray-900">
            <span>Total</span><span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {belowMin && config && (
          <p className="text-sm text-orange-600 bg-orange-50 rounded-xl px-4 py-3 text-center">
            Pedido mínimo: {formatCurrency(config.minOrderValue)}. Adicione mais {formatCurrency(config.minOrderValue - total)}.
          </p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <div className="max-w-lg mx-auto">
          <Link
            href={belowMin ? "#" : "/checkout"}
            className={`block text-center w-full py-4 rounded-2xl font-bold text-white transition ${belowMin ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
            onClick={(e) => belowMin && e.preventDefault()}
          >
            Finalizar pedido · {formatCurrency(grandTotal)}
          </Link>
        </div>
      </div>
    </div>
  );
}
