"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, CheckCircle, XCircle, Clock, ChevronDown } from "lucide-react";

type Market = {
  id: string;
  slug: string;
  status: string;
  trialEndsAt: string;
  subscriptionExpiresAt: string | null;
  createdAt: string;
  _count: { orders: number; users: number };
};

const STATUS_LABEL: Record<string, string> = { TRIAL: "Trial", ACTIVE: "Ativo", SUSPENDED: "Suspenso" };
const STATUS_COLOR: Record<string, string> = {
  TRIAL: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-red-100 text-red-600",
};

export default function SuperAdmin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ slug: "", adminName: "", adminEmail: "", adminPassword: "", trialDays: "7" });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [actioning, setActioning] = useState<string | null>(null);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginErr("");
    const res = await fetch("/api/superadmin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoggingIn(false);
    if (res.ok) { setAuthed(true); loadMarkets(); }
    else setLoginErr("Senha incorreta.");
  }

  async function loadMarkets() {
    setLoading(true);
    const data = await fetch("/api/superadmin/mercados").then((r) => r.json());
    setLoading(false);
    if (Array.isArray(data)) setMarkets(data);
  }

  async function createMarket(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    const res = await fetch("/api/superadmin/mercados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, trialDays: Number(form.trialDays) }),
    });
    const data = await res.json();
    setCreating(false);
    if (res.ok) {
      setCreateMsg({ ok: true, text: `Mercado "${form.slug}" criado com sucesso!` });
      setForm({ slug: "", adminName: "", adminEmail: "", adminPassword: "", trialDays: "7" });
      setShowForm(false);
      loadMarkets();
    } else {
      setCreateMsg({ ok: false, text: data.error });
    }
  }

  async function activate(id: string) {
    setActioning(id + "-activate");
    await fetch(`/api/superadmin/mercados/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionDays: 31 }),
    });
    setActioning(null);
    loadMarkets();
  }

  async function suspend(id: string) {
    if (!confirm("Suspender este mercado?")) return;
    setActioning(id + "-suspend");
    await fetch(`/api/superadmin/mercados/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SUSPENDED" }),
    });
    setActioning(null);
    loadMarkets();
  }

  async function extendTrial(id: string) {
    setActioning(id + "-trial");
    await fetch(`/api/superadmin/mercados/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trialDays: 7 }),
    });
    setActioning(null);
    loadMarkets();
  }

  async function backfill(id: string) {
    if (!confirm("Migrar todos os dados sem mercado para este? Isso é irreversível.")) return;
    setActioning(id + "-backfill");
    const res = await fetch(`/api/superadmin/mercados/${id}/backfill`, { method: "POST" });
    const data = await res.json();
    setActioning(null);
    alert(JSON.stringify(data.updated, null, 2));
    loadMarkets();
  }

  useEffect(() => {
    // Try to auto-auth from existing cookie
    fetch("/api/superadmin/mercados").then((r) => {
      if (r.ok) { setAuthed(true); r.json().then((d) => { if (Array.isArray(d)) setMarkets(d); }); }
    });
  }, []);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6">
        <form onSubmit={login} className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm space-y-4">
          <h1 className="text-white font-bold text-lg">Super Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha de acesso"
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {loginErr && <p className="text-red-400 text-sm">{loginErr}</p>}
          <button
            type="submit"
            disabled={loggingIn}
            className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loggingIn && <Loader2 size={15} className="animate-spin" />} Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Super Admin — Mercados</h1>
        <div className="flex gap-2">
          <button onClick={loadMarkets} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition"
          >
            <Plus size={15} /> Novo mercado
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createMarket} className="bg-gray-900 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Novo mercado</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Slug (subdomínio)", field: "slug", placeholder: "mercado-joao" },
              { label: "Nome do admin", field: "adminName", placeholder: "João Silva" },
              { label: "E-mail do admin", field: "adminEmail", placeholder: "joao@email.com" },
              { label: "Senha do admin", field: "adminPassword", placeholder: "Mínimo 8 caracteres" },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  type={field === "adminPassword" ? "password" : "text"}
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  placeholder={placeholder}
                  required
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dias de trial</label>
              <input
                type="number"
                min="1"
                value={form.trialDays}
                onChange={(e) => setForm((f) => ({ ...f, trialDays: e.target.value }))}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          {createMsg && (
            <p className={`text-sm ${createMsg.ok ? "text-green-400" : "text-red-400"}`}>{createMsg.text}</p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-700 text-gray-400 rounded-xl py-2.5 text-sm hover:bg-gray-800">
              Cancelar
            </button>
            <button type="submit" disabled={creating} className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {creating && <Loader2 size={14} className="animate-spin" />} Criar
            </button>
          </div>
        </form>
      )}

      {/* Markets list */}
      <div className="space-y-3">
        {markets.length === 0 && !loading && (
          <p className="text-gray-500 text-sm text-center py-8">Nenhum mercado cadastrado.</p>
        )}
        {markets.map((m) => (
          <div key={m.id} className="bg-gray-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{m.slug}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[m.status]}`}>
                    {STATUS_LABEL[m.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {m._count.orders} pedidos · {m._count.users} usuários
                </p>
                {m.status === "TRIAL" && (
                  <p className="text-xs text-yellow-500 mt-0.5">
                    Trial até {new Date(m.trialEndsAt).toLocaleDateString("pt-BR")}
                  </p>
                )}
                {m.status === "ACTIVE" && m.subscriptionExpiresAt && (
                  <p className="text-xs text-green-400 mt-0.5">
                    Ativo até {new Date(m.subscriptionExpiresAt).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
              <ChevronDown size={16} className="text-gray-600 mt-1 shrink-0" />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => activate(m.id)}
                disabled={actioning === m.id + "-activate"}
                className="flex items-center gap-1.5 bg-green-900 text-green-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-800 disabled:opacity-60"
              >
                {actioning === m.id + "-activate" ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                Ativar 30 dias (R$30)
              </button>
              <button
                onClick={() => extendTrial(m.id)}
                disabled={actioning === m.id + "-trial"}
                className="flex items-center gap-1.5 bg-yellow-900 text-yellow-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-yellow-800 disabled:opacity-60"
              >
                {actioning === m.id + "-trial" ? <Loader2 size={11} className="animate-spin" /> : <Clock size={11} />}
                +7 dias trial
              </button>
              <button
                onClick={() => suspend(m.id)}
                disabled={actioning === m.id + "-suspend"}
                className="flex items-center gap-1.5 bg-red-900 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-800 disabled:opacity-60"
              >
                {actioning === m.id + "-suspend" ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                Suspender
              </button>
              {(m._count.orders === 0 || m.status === "TRIAL") && (
                <button
                  onClick={() => backfill(m.id)}
                  disabled={actioning === m.id + "-backfill"}
                  className="flex items-center gap-1.5 bg-gray-800 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-700 disabled:opacity-60"
                >
                  {actioning === m.id + "-backfill" ? <Loader2 size={11} className="animate-spin" /> : null}
                  Migrar dados legados
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
