import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { Package, ShoppingBag, TrendingUp, Clock } from "lucide-react";

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [allOrders, todayOrders, products, pendingOrders] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: today } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  const todayRevenue = todayOrders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((s, o) => s + o.total, 0);

  const cards = [
    { label: "Pedidos hoje", value: todayOrders.length, icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
    { label: "Receita hoje", value: formatCurrency(todayRevenue), icon: TrendingUp, color: "bg-green-50 text-green-600" },
    { label: "Aguardando", value: pendingOrders, icon: Clock, color: "bg-yellow-50 text-yellow-600" },
    { label: "Produtos ativos", value: products, icon: Package, color: "bg-purple-50 text-purple-600" },
  ];

  const statusLabel: Record<string, string> = {
    PENDING: "Aguardando", CONFIRMED: "Confirmado", PREPARING: "Preparando",
    OUT_FOR_DELIVERY: "Saiu", DELIVERED: "Entregue", CANCELLED: "Cancelado",
  };
  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800", CONFIRMED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-orange-100 text-orange-800", OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800", CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Pedidos recentes</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {allOrders.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhum pedido ainda.</p>
          )}
          {allOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{order.user.name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString("pt-BR")} — {formatCurrency(order.total)}
                </p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                {statusLabel[order.status] ?? order.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
