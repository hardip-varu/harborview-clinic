import { NextResponse } from "next/server";
import { readToken } from "@/lib/users";
import { getDoctor, bookingDates } from "@/lib/data";

// Staff only: block a slot (for leave, training, room maintenance).
export async function POST(request) {
  const user = readToken(request);
  if (!user) return NextResponse.json({ error: "Log in as staff to block time." }, { status: 401 });
  if (user.role !== "staff") return NextResponse.json({ error: "Only clinic staff can block time." }, { status: 403 });
  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const errors = {};
  if (!getDoctor(body?.doctorId)) errors.doctorId = "Choose a clinician.";
  if (!bookingDates().includes(body?.date)) errors.date = "Choose a date within the next 14 days.";
  if (!/^\d{2}:\d{2}$/.test(String(body?.time || ""))) errors.time = "Choose a time.";
  if (String(body?.reason || "").trim().length < 3) errors.reason = "Add a short reason.";
  if (Object.keys(errors).length) return NextResponse.json({ error: "Some details need fixing.", errors }, { status: 400 });
  return NextResponse.json({ id: "BLK-" + Math.random().toString(36).slice(2, 7).toUpperCase(), ...body, status: "blocked" }, { status: 201 });
}
