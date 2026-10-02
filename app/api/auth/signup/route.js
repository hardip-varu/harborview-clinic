import { NextResponse } from "next/server";
import { USERS, REGISTERED_EMAIL, MIN_PASSWORD, isValidEmail, makeToken } from "@/lib/users";

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const errors = {};
  if (name.length < 2) errors.name = "Enter your full name.";
  if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  if (Object.keys(errors).length) return NextResponse.json({ error: "Some details need fixing.", errors }, { status: 400 });
  if (email === REGISTERED_EMAIL || USERS.some((u) => u.email === email))
    return NextResponse.json({ error: "An account with this email already exists. Log in instead." }, { status: 409 });
  const user = { email, name, role: "patient" };
  return NextResponse.json({ token: makeToken(user), user }, { status: 201 });
}
