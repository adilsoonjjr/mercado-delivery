import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();
  const secret = process.env.SUPERADMIN_SECRET;

  if (!secret) return NextResponse.json({ error: "Superadmin não configurado." }, { status: 500 });
  if (password !== secret) return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("sa-auth", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
  return res;
}
