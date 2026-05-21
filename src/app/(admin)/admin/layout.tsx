import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import {
  ShoppingCart, Package, ClipboardList, Megaphone,
  Settings, LogOut, LayoutDashboard, Users, QrCode,
} from "lucide-react";
import { AdminNotificationProvider } from "@/components/AdminNotificationProvider";
import { prisma } from "@/lib/prisma";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/anuncios", label: "Anúncios", icon: Megaphone },
  { href: "/admin/compartilhar", label: "QR Code", icon: QrCode },
  { href: "/admin/configuracoes", label: "Config", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  // Check subscription / trial status
  if (session.user.marketId) {
    const market = await prisma.market.findUnique({ where: { id: session.user.marketId } });
    if (market) {
      const now = new Date();
      // Auto-expire trial
      if (market.status === "TRIAL" && market.trialEndsAt < now) {
        await prisma.market.update({ where: { id: market.id }, data: { status: "SUSPENDED" } });
        redirect("/suspenso");
      }
      if (market.status === "SUSPENDED") redirect("/suspenso");
      // Expire paid subscription
      if (market.status === "ACTIVE" && market.subscriptionExpiresAt && market.subscriptionExpiresAt < now) {
        await prisma.market.update({ where: { id: market.id }, data: { status: "SUSPENDED" } });
        redirect("/suspenso");
      }
    }
  }

  return (
    <AdminNotificationProvider>
      <div className="min-h-screen flex bg-gray-50">
        {/* Sidebar — desktop only */}
        <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 flex-col shrink-0">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <ShoppingCart size={16} className="text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm">Admin</span>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition"
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition w-full">
                <LogOut size={18} />
                Sair
              </button>
            </form>
          </div>
        </aside>

        {/* Main content — extra bottom padding on mobile for the bottom nav */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>

        {/* Bottom navigation — mobile only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around z-50">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-2 px-1 text-gray-500 hover:text-green-700 transition min-w-0 flex-1"
            >
              <Icon size={20} />
              <span className="text-[10px] leading-tight truncate w-full text-center">{label}</span>
            </Link>
          ))}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            className="flex-1"
          >
            <button className="flex flex-col items-center gap-0.5 py-2 px-1 text-gray-500 hover:text-red-600 transition w-full">
              <LogOut size={20} />
              <span className="text-[10px] leading-tight">Sair</span>
            </button>
          </form>
        </nav>
      </div>
    </AdminNotificationProvider>
  );
}
