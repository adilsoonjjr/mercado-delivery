import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function checkAuth() {
  const jar = await cookies();
  const val = jar.get("sa-auth")?.value;
  return val && val === process.env.SUPERADMIN_SECRET;
}

// Assigns all records without a marketId to this market (migration helper)
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  const market = await prisma.market.findUnique({ where: { id } });
  if (!market) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });

  const [products, categories, orders, announcements, zones, configs, users] = await Promise.all([
    prisma.product.updateMany({ where: { marketId: null }, data: { marketId: id } }),
    prisma.category.updateMany({ where: { marketId: null }, data: { marketId: id } }),
    prisma.order.updateMany({ where: { marketId: null }, data: { marketId: id } }),
    prisma.announcement.updateMany({ where: { marketId: null }, data: { marketId: id } }),
    prisma.deliveryZone.updateMany({ where: { marketId: null }, data: { marketId: id } }),
    prisma.deliveryConfig.updateMany({ where: { marketId: null }, data: { marketId: id } }),
    prisma.user.updateMany({ where: { marketId: null, role: "ADMIN" }, data: { marketId: id } }),
  ]);

  return NextResponse.json({
    ok: true,
    updated: { products: products.count, categories: categories.count, orders: orders.count, announcements: announcements.count, zones: zones.count, configs: configs.count, adminUsers: users.count },
  });
}
