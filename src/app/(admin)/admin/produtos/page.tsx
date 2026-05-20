"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Search } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type Category = { id: string; name: string; emoji: string };
type Product = {
  id: string; name: string; description?: string; price: number;
  promotionalPrice?: number; stock: number; imageUrl?: string;
  isActive: boolean; categoryId?: string; category?: Category;
};

const empty = { name: "", description: "", price: "", promotionalPrice: "", stock: "0", imageUrl: "", categoryId: "", isActive: true };

export default function AdminProdutos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [p, c] = await Promise.all([
      fetch("/api/admin/produtos").then((r) => r.json()),
      fetch("/api/admin/categorias").then((r) => r.json()),
    ]);
    setProducts(p);
    setCategories(c);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm(empty);
    setModal("add");
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name, description: p.description ?? "", price: String(p.price),
      promotionalPrice: p.promotionalPrice ? String(p.promotionalPrice) : "",
      stock: String(p.stock), imageUrl: p.imageUrl ?? "",
      categoryId: p.categoryId ?? "", isActive: p.isActive,
    });
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    const body = {
      ...form,
      price: parseFloat(form.price),
      promotionalPrice: form.promotionalPrice ? parseFloat(form.promotionalPrice) : null,
      stock: parseInt(form.stock),
    };

    if (modal === "add") {
      await fetch("/api/admin/produtos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch(`/api/admin/produtos/${editing!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }

    setSaving(false);
    setModal(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir produto?")) return;
    await fetch(`/api/admin/produtos/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Produtos</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition">
          <Plus size={16} /> Adicionar
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">Nenhum produto encontrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Produto</th>
                <th className="px-4 py-3 text-right">Preço</th>
                <th className="px-4 py-3 text-right">Estoque</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.category && <p className="text-xs text-gray-400">{p.category.emoji} {p.category.name}</p>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className={p.promotionalPrice ? "line-through text-gray-400 text-xs" : "font-medium"}>{formatCurrency(p.price)}</p>
                    {p.promotionalPrice && <p className="font-medium text-green-600">{formatCurrency(p.promotionalPrice)}</p>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${p.stock === 0 ? "text-red-500" : p.stock < 5 ? "text-yellow-600" : "text-gray-900"}`}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{modal === "add" ? "Novo produto" : "Editar produto"}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { key: "name", label: "Nome *", type: "text" },
                { key: "description", label: "Descrição", type: "text" },
                { key: "price", label: "Preço (R$) *", type: "number" },
                { key: "promotionalPrice", label: "Preço promocional (R$)", type: "number" },
                { key: "stock", label: "Estoque *", type: "number" },
                { key: "imageUrl", label: "URL da imagem", type: "url" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={(form as Record<string, unknown>)[key] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Sem categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive as boolean}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded accent-green-600" />
                <span className="text-sm text-gray-700">Produto ativo (visível para clientes)</span>
              </label>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
