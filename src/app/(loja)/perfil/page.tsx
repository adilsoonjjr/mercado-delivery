"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Lock, ShoppingBag, LogOut, Loader2, CheckCircle, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/contexts/CartContext";

function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { count, total } = useCart();

  const [tab, setTab] = useState<"dados" | "senha">("dados");
  const [form, setForm] = useState({ name: "", phone: "", cpf: "", address: "" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login?redirect=/perfil"); return; }
    if (session?.user) {
      fetch("/api/me").then((r) => r.json()).then((u) => {
        setForm({ name: u.name ?? "", phone: u.phone ?? "", cpf: u.cpf ?? "", address: u.address ?? "" });
      });
    }
  }, [session, status, router]);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleDados(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Erro ao salvar."); return; }
    setSuccess("Dados atualizados com sucesso!");
  }

  async function handleSenha(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) { setError("As novas senhas não coincidem."); return; }
    setLoading(true); setError(""); setSuccess("");
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Erro ao trocar senha."); return; }
    setSuccess("Senha alterada com sucesso!");
    setPasswords({ current: "", newPass: "", confirm: "" });
  }

  if (status === "loading") return null;

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="font-bold text-gray-900">Meu perfil</h1>
          </div>
          {count > 0 && (
            <Link href="/carrinho" className="flex items-center gap-1.5 bg-green-600 text-white rounded-full px-3 py-1.5 text-sm font-semibold">
              <ShoppingCart size={15} />
              {formatCurrency(total)}
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* User info card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <User size={28} className="text-green-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{form.name || session?.user?.name}</p>
            <p className="text-sm text-gray-500 truncate">{session?.user?.email}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/meus-pedidos" className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:border-green-300 transition">
            <ShoppingBag size={20} className="text-green-600 shrink-0" />
            <span className="text-sm font-medium text-gray-800">Meus pedidos</span>
          </Link>
          <Link href="/carrinho" className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:border-green-300 transition">
            <ShoppingCart size={20} className="text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">Carrinho</p>
              {count > 0 && <p className="text-xs text-green-600">{count} {count === 1 ? "item" : "itens"}</p>}
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button onClick={() => { setTab("dados"); setError(""); setSuccess(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${tab === "dados" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
            <User size={15} /> Meus dados
          </button>
          <button onClick={() => { setTab("senha"); setError(""); setSuccess(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${tab === "senha" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
            <Lock size={15} /> Trocar senha
          </button>
        </div>

        {/* Feedback */}
        {success && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm">
            <CheckCircle size={16} /> {success}
          </div>
        )}
        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {/* Dados pessoais */}
        {tab === "dados" && (
          <form onSubmit={handleDados} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input required type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input required type="tel" value={form.phone}
                onChange={(e) => set("phone", maskPhone(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input type="text" value={form.cpf}
                onChange={(e) => set("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input type="text" value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Rua, número, bairro, cidade" className={inputClass} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              Salvar dados
            </button>
          </form>
        )}

        {/* Trocar senha */}
        {tab === "senha" && (
          <form onSubmit={handleSenha} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
              <input required type="password" value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} className={inputClass} placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
              <input required type="password" value={passwords.newPass}
                onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))} className={inputClass} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
              <input required type="password" value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} className={inputClass} placeholder="Repita a nova senha" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              Alterar senha
            </button>
          </form>
        )}

        {/* Logout */}
        <button onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition">
          <LogOut size={16} /> Sair da conta
        </button>
      </div>
    </div>
  );
}
