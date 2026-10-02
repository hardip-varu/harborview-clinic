import { NextResponse } from "next/server";
import { readToken } from "@/lib/users";
import { validateBooking, seededAppointments } from "@/lib/booking";

export function GET(request) {
  const user = readToken(request);
  if (!user) return NextResponse.json({ error: "Log in to see your appointments." }, { status: 401 });
  const appointments = seededAppointments(user.email);
  return NextResponse.json({ count: appointments.length, appointments });
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const result = validateBooking(body);
  if (!result.ok) return NextResponse.json({ error: result.error, code: result.code, errors: result.errors }, { status: result.status });
  return NextResponse.json(result.appointment, { status: 201 });
}
