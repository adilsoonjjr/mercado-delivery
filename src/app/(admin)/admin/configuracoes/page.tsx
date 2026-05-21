"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Plus, Pencil, Trash2, X, MapPin, Lock, Mail } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { QRCodeCard } from "@/components/QRCodeCard";

type Config = {
  id?: string;
  marketName: string;
  marketPhone: string;
  fee: number;
  minOrderValue: number;
  estimatedMinutes: number;
  isDeliveryActive: boolean;
};

type Zone = { id: string; name: string; fee: number; estimatedMinutes: number; isActive: boolean };

const defaultConfig: Config = {
  marketName: "", marketPhone: "", fee: 5, minOrderValue: 20, estimatedMinutes: 45, isDeliveryActive: true,
};
const emptyZone = { name: "", fee: "", estimatedMinutes: "45", isActive: true };

export default function AdminConfiguracoes() {
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneModal, setZoneModal] = useState<"add" | "edit" | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneForm, setZoneForm] = useState(emptyZone);
  const [savingZone, setSavingZone] = useState(false);

  // Conta admin
  const [emailForm, setEmailForm] = useState({ currentPassword: "", newEmail: "" });
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config").then((r) => r.json()).then(setConfig);
    loadZones();
  }, []);

  async function loadZones() {
    const data = await fetch("/api/admin/zonas").then((r) => r.json());
    setZones(Array.isArray(data) ? data : []);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function openAddZone() {
    setEditingZone(null);
    setZoneForm(emptyZone);
    setZoneModal("add");
  }

  function openEditZone(z: Zone) {
    setEditingZone(z);
    setZoneForm({ name: z.name, fee: String(z.fee), estimatedMinutes: String(z.estimatedMinutes), isActive: z.isActive });
    setZoneModal("edit");
  }

  async function handleSaveZone() {
    setSavingZone(true);
    const body = { name: zoneForm.name, fee: parseFloat(zoneForm.fee), estimatedMinutes: parseInt(zoneForm.estimatedMinutes), isActive: zoneForm.isActive };
    if (zoneModal === "add") {
      await fetch("/api/admin/zonas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch(`/api/admin/zonas/${editingZone!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setSavingZone(false);
    setZoneModal(null);
    loadZones();
  }

  async function handleDeleteZone(id: string) {
    if (!confirm("Remover zona de entrega?")) return;
    await fetch(`/api/admin/zonas/${id}`, { method: "DELETE" });
    loadZones();
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setSavingEmail(true);
    setEmailMsg(null);
    const res = await fetch("/api/admin/conta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: emailForm.currentPassword, newEmail: emailForm.newEmail }),
    });
    const data = await res.json();
    setSavingEmail(false);
    if (res.ok) {
      setEmailMsg({ ok: true, text: "E-mail atualizado! Faça login novamente." });
      setEmailForm({ currentPassword: "", newEmail: "" });
    } else {
      setEmailMsg({ ok: false, text: data.error });
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ ok: false, text: "As senhas não coincidem." });
      return;
    }
    setSavingPw(true);
    setPwMsg(null);
    const res = await fetch("/api/admin/conta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    });
    const data = await res.json();
    setSavingPw(false);
    if (res.ok) {
      setPwMsg({ ok: true, text: "Senha alterada com sucesso!" });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setPwMsg({ ok: false, text: data.error });
    }
  }

  async function toggleZone(z: Zone) {
    await fetch(`/api/admin/zonas/${z.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...z, isActive: !z.isActive }),
    });
    loadZones();
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Configurações</h1>

      {/* Mercado */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-500">Informações do mercado</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do mercado</label>
            <input value={config.marketName} onChange={(e) => setConfig((c) => ({ ...c, marketName: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
            <input value={config.marketPhone} onChange={(e) => setConfig((c) => ({ ...c, marketPhone: e.target.value }))}
              placeholder="(11) 99999-9999"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-500">Entrega</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-gray-700">Delivery ativo</span>
            <div className="relative">
              <input type="checkbox" className="sr-only peer" checked={config.isDeliveryActive}
                onChange={(e) => setConfig((c) => ({ ...c, isDeliveryActive: e.target.checked }))} />
              <div className="w-10 h-6 bg-gray-200 peer-checked:bg-green-500 rounded-full transition peer-focus:ring-2 peer-focus:ring-green-300" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition peer-checked:translate-x-4 shadow" />
            </div>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Taxa de entrega padrão (R$)
              <span className="ml-1 text-xs text-gray-400 font-normal">— usada quando não há zonas cadastradas</span>
            </label>
            <input type="number" step="0.01" min="0" value={config.fee}
              onChange={(e) => setConfig((c) => ({ ...c, fee: parseFloat(e.target.value) }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pedido mínimo (R$)</label>
            <input type="number" step="0.01" min="0" value={config.minOrderValue}
              onChange={(e) => setConfig((c) => ({ ...c, minOrderValue: parseFloat(e.target.value) }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tempo estimado padrão (minutos)</label>
            <input type="number" min="1" value={config.estimatedMinutes}
              onChange={(e) => setConfig((c) => ({ ...c, estimatedMinutes: parseInt(e.target.value) }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saved ? "Salvo!" : "Salvar configurações"}
        </button>
      </form>

      {/* Zonas de entrega */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-green-600" />
            <h2 className="font-semibold text-gray-900">Zonas de entrega por bairro</h2>
          </div>
          <button onClick={openAddZone}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition">
            <Plus size={13} /> Adicionar
          </button>
        </div>

        {zones.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            Nenhuma zona cadastrada. A taxa padrão será usada para todos.
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {zones.map((z) => (
              <div key={z.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleZone(z)}
                    className={`w-9 h-5 rounded-full transition relative shrink-0 ${z.isActive ? "bg-green-500" : "bg-gray-200"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${z.isActive ? "left-4" : "left-0.5"}`} />
                  </button>
                  <div>
                    <p className={`text-sm font-medium ${z.isActive ? "text-gray-900" : "text-gray-400"}`}>{z.name}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(z.fee)} · ~{z.estimatedMinutes}min</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditZone(z)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDeleteZone(z.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code */}
      <QRCodeCard />

      {/* Alterar e-mail */}
      <form onSubmit={handleChangeEmail} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-green-600" />
          <h2 className="font-semibold text-gray-900">Alterar e-mail de acesso</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
          <input
            type="password"
            required
            value={emailForm.currentPassword}
            onChange={(e) => setEmailForm((f) => ({ ...f, currentPassword: e.target.value }))}
            placeholder="••••••••"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Novo e-mail</label>
          <input
            type="email"
            required
            value={emailForm.newEmail}
            onChange={(e) => setEmailForm((f) => ({ ...f, newEmail: e.target.value }))}
            placeholder="novo@email.com"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        {emailMsg && (
          <p className={`text-sm ${emailMsg.ok ? "text-green-600" : "text-red-500"}`}>{emailMsg.text}</p>
        )}
        <button
          type="submit"
          disabled={savingEmail}
          className="w-full bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {savingEmail ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Salvar novo e-mail
        </button>
      </form>

      {/* Alterar senha */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-green-600" />
          <h2 className="font-semibold text-gray-900">Alterar senha de acesso</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
          <input
            type="password"
            required
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
            placeholder="••••••••"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
          <input
            type="password"
            required
            minLength={8}
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
            placeholder="Mínimo 8 caracteres"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
          <input
            type="password"
            required
            minLength={8}
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            placeholder="Repita a nova senha"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        {pwMsg && (
          <p className={`text-sm ${pwMsg.ok ? "text-green-600" : "text-red-500"}`}>{pwMsg.text}</p>
        )}
        <button
          type="submit"
          disabled={savingPw}
          className="w-full bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {savingPw ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
          Alterar senha
        </button>
      </form>

      {/* Modal zona */}
      {zoneModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{zoneModal === "add" ? "Nova zona" : "Editar zona"}</h2>
              <button onClick={() => setZoneModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do bairro / zona *</label>
                <input value={zoneForm.name} onChange={(e) => setZoneForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Centro, Vila Nova, Zona Sul..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de entrega (R$) *</label>
                <input type="number" step="0.01" min="0" value={zoneForm.fee}
                  onChange={(e) => setZoneForm((f) => ({ ...f, fee: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tempo estimado (minutos)</label>
                <input type="number" min="1" value={zoneForm.estimatedMinutes}
                  onChange={(e) => setZoneForm((f) => ({ ...f, estimatedMinutes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={zoneForm.isActive}
                  onChange={(e) => setZoneForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded accent-green-600" />
                <span className="text-sm text-gray-700">Zona ativa (visível no checkout)</span>
              </label>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setZoneModal(null)} className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSaveZone} disabled={savingZone || !zoneForm.name || !zoneForm.fee}
                className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {savingZone && <Loader2 size={14} className="animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
