import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function authorized() {
  return true; // cookie checked by the page; API double-checks via helper below
}

async function checkAuth() {
  const jar = await cookies();
  const val = jar.get("sa-auth")?.value;
  return val && val === process.env.SUPERADMIN_SECRET;
}

export async function GET() {
  if (!(await checkAuth())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const markets = await prisma.market.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true, users: true } } },
  });
  return NextResponse.json(markets);
}

export async function POST(req: Request) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { slug, adminEmail, adminPassword, adminName, trialDays = 7 } = await req.json();

  if (!slug || !adminEmail || !adminPassword) {
    return NextResponse.json({ error: "slug, adminEmail e adminPassword são obrigatórios." }, { status: 400 });
  }

  const slugClean = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");
  const existing = await prisma.market.findUnique({ where: { slug: slugClean } });
  if (existing) return NextResponse.json({ error: "Slug já em uso." }, { status: 400 });

  const emailExists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (emailExists) return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 400 });

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

  const market = await prisma.market.create({
    data: { slug: slugClean, status: "TRIAL", trialEndsAt },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.create({
    data: {
      name: adminName || "Administrador",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      marketId: market.id,
    },
  });

  // Create default delivery config for the new market
  await prisma.deliveryConfig.create({
    data: { marketId: market.id, marketName: slugClean, fee: 5, minOrderValue: 0, estimatedMinutes: 45, isDeliveryActive: true },
  });

  return NextResponse.json(market, { status: 201 });
}

void authorized; // suppress unused warning
