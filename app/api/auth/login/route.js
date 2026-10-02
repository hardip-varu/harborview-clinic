import { NextResponse } from "next/server";
import { USERS, makeToken } from "@/lib/users";

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!email || !password) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  const user = USERS.find((u) => u.email === email && u.password === password);
  if (!user) return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  return NextResponse.json({ token: makeToken(user), user: { email: user.email, name: user.name, role: user.role } });
}
