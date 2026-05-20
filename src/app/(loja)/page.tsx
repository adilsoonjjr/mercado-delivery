"use client";

import { useEffect, useState, useCallback } from "react";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import { ShoppingCart, Plus, Minus, Search, User, Tag } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useSession } from "next-auth/react";
import Image from "next/image";

type Category = { id: string; name: string; emoji: string };
type Product = {
  id: string; name: string; description?: string; price: number;
  promotionalPrice?: number; stock: number; imageUrl?: string; category?: Category;
};
type Announcement = { id: string; title: string; content?: string; type: string };
type Config = { marketName: string; estimatedMinutes: number; isDeliveryActive: boolean; fee: number };

function ProductCard({ product, qty, onAdd, onInc, onDec }: {
  product: Product;
  qty: number;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
}) {
  const displayPrice = product.promotionalPrice ?? product.price;
  const discount = product.promotionalPrice
    ? Math.round((1 - product.promotionalPrice / product.price) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="aspect-square bg-gray-100 relative">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
        )}
        {product.promotionalPrice && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-lg">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">{product.name}</p>
        <div className="mt-1">
          {product.promotionalPrice && (
            <p className="text-xs text-gray-400 line-through">{formatCurrency(product.price)}</p>
          )}
          <p className="text-green-700 font-bold">{formatCurrency(displayPrice)}</p>
        </div>
        <div className="mt-2">
          {qty === 0 ? (
            <button onClick={onAdd}
              className="w-full flex items-center justify-center gap-1.5 bg-green-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-green-700 transition">
              <Plus size={14} /> Adicionar
            </button>
          ) : (
            <div className="flex items-center justify-between bg-green-50 rounded-xl px-2 py-1">
              <button onClick={onDec} className="p-1 rounded-lg hover:bg-green-100">
                <Minus size={14} className="text-green-700" />
              </button>
              <span className="text-sm font-bold text-green-700">{qty}</span>
              <button onClick={onInc} className="p-1 rounded-lg hover:bg-green-100">
                <Plus size={14} className="text-green-700" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { items, addItem, updateQty, count, total } = useCart();
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  const load = useCallback(async () => {
    const [p, c, a, cfg] = await Promise.all([
      fetch("/api/produtos").then((r) => r.json()),
      fetch("/api/categorias").then((r) => r.json()),
      fetch("/api/anuncios").then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()),
    ]);
    setProducts(p);
    setCategories(c);
    setAnnouncements(a);
    setConfig(cfg);
  }, []);

  useEffect(() => { load(); }, [load]);

  function getQty(id: string) {
    return items.find((i) => i.productId === id)?.quantity ?? 0;
  }

  const promos = products.filter((p) => p.promotionalPrice && p.stock > 0);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "ALL" || p.category?.id === category;
    return matchSearch && matchCat && p.stock > 0;
  });

  const typeColor: Record<string, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    promo: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-green-700 text-lg leading-tight">{config?.marketName ?? "Mercado"}</h1>
            {config && (
              <p className="text-xs text-gray-400">
                {config.isDeliveryActive ? `Entrega ~${config.estimatedMinutes}min · ${formatCurrency(config.fee)}` : "Delivery indisponível"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Link href="/carrinho" className="p-2 rounded-full hover:bg-gray-100 relative">
              <ShoppingCart size={20} className="text-gray-600" />
              {count > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>
            {session ? (
              <Link href="/perfil" className="p-2 rounded-full hover:bg-gray-100">
                <User size={20} className="text-gray-600" />
              </Link>
            ) : (
              <Link href="/login" className="text-sm text-green-600 font-medium px-3 py-1.5 rounded-full hover:bg-green-50">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
        {/* Announcements */}
        {announcements.map((a) => (
          <div key={a.id} className={`border rounded-xl px-4 py-3 text-sm ${typeColor[a.type] ?? "bg-gray-50 border-gray-200"}`}>
            <p className="font-semibold">{a.title}</p>
            {a.content && <p className="mt-0.5 opacity-80">{a.content}</p>}
          </div>
        ))}

        {/* Promoções do Dia */}
        {promos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Tag size={18} className="text-red-500" />
              <h2 className="font-bold text-gray-900 text-base">Promoções do Dia</h2>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {promos.length} {promos.length === 1 ? "oferta" : "ofertas"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {promos.map((product) => {
                const qty = getQty(product.id);
                const displayPrice = product.promotionalPrice ?? product.price;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    qty={qty}
                    onAdd={() => addItem({ productId: product.id, name: product.name, price: displayPrice, imageUrl: product.imageUrl })}
                    onInc={() => addItem({ productId: product.id, name: product.name, price: displayPrice, imageUrl: product.imageUrl })}
                    onDec={() => updateQty(product.id, qty - 1)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Divisor */}
        {promos.length > 0 && (
          <div className="border-t border-gray-200" />
        )}

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produtos..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setCategory("ALL")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${category === "ALL" ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
            Todos
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${category === c.id ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>

        {/* All products grid */}
        <section>
          <h2 className="font-bold text-gray-900 text-base mb-3">
            {search || category !== "ALL" ? "Resultados" : "Todos os Produtos"}
          </h2>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">Nenhum produto encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((product) => {
                const qty = getQty(product.id);
                const displayPrice = product.promotionalPrice ?? product.price;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    qty={qty}
                    onAdd={() => addItem({ productId: product.id, name: product.name, price: displayPrice, imageUrl: product.imageUrl })}
                    onInc={() => addItem({ productId: product.id, name: product.name, price: displayPrice, imageUrl: product.imageUrl })}
                    onDec={() => updateQty(product.id, qty - 1)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Floating cart */}
      {count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 z-20 pb-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <Link href="/carrinho"
            className="flex items-center justify-between bg-green-600 text-white rounded-2xl px-5 py-4 w-full max-w-sm shadow-lg hover:bg-green-700 transition">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} />
              <span className="font-semibold">{count} {count === 1 ? "item" : "itens"}</span>
            </div>
            <span className="font-bold text-lg">{formatCurrency(total)}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
