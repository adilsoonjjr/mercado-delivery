import { headers } from "next/headers";
import { prisma } from "./prisma";

export async function getCurrentMarket() {
  const h = await headers();
  const slug = h.get("x-market-slug") ?? "default";
  return prisma.market.findUnique({ where: { slug } });
}

export async function requireMarket() {
  const market = await getCurrentMarket();
  if (!market) return null;
  return market;
}
