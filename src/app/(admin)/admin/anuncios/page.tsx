"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

type Announcement = { id: string; title: string; content?: string; type: string; isActive: boolean; createdAt: string };

const empty = { title: "", content: "", type: "info", isActive: true };

export default function AdminAnuncios() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/anuncios");
    setItems(await res.json());
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(empty); setModal(true); }
  function openEdit(a: Announcement) {
    setEditing(a);
    setForm({ title: a.title, content: a.content ?? "", type: a.type, isActive: a.isActive });
    setModal(true);
  }

  async function handleSave() {
    setSaving(true);
    if (editing) {
      await fetch(`/api/admin/anuncios/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/admin/anuncios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setSaving(false);
    setModal(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir anúncio?")) return;
    await fetch(`/api/admin/anuncios/${id}`, { method: "DELETE" });
    load();
  }

  const typeColor: Record<string, string> = {
    info: "bg-blue-100 text-blue-800",
    promo: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Anúncios & Novidades</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700">
          <Plus size={16} /> Novo anúncio
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-gray-400 py-16 text-sm">Nenhum anúncio criado.</p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor[a.type] ?? "bg-gray-100 text-gray-600"}`}>
                      {a.type === "info" ? "Info" : a.type === "promo" ? "Promoção" : "Aviso"}
                    </span>
                    {!a.isActive && <span className="text-xs text-gray-400">Inativo</span>}
                  </div>
                  <p className="font-medium text-gray-900">{a.title}</p>
                  {a.content && <p className="text-sm text-gray-500 mt-0.5">{a.content}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold">{editing ? "Editar anúncio" : "Novo anúncio"}</h2>
              <button onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo</label>
                <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="info">Informação</option>
                  <option value="promo">Promoção</option>
                  <option value="warning">Aviso</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-green-600" />
                <span className="text-sm text-gray-700">Ativo (visível para clientes)</span>
              </label>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setModal(false)} className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
