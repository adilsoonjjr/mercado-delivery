import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendPushToMarket } from "@/lib/push";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN" || !session.user.marketId) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const { title, body, url } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "Título e mensagem são obrigatórios." }, { status: 400 });
  }

  const result = await sendPushToMarket(session.user.marketId, {
    title,
    body,
    url: url || "/",
    tag: "promo",
  });

  return NextResponse.json(result);
}
