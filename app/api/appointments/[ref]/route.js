import { NextResponse } from "next/server";
import { readToken } from "@/lib/users";
import { checkChangeWindow, inWindow } from "@/lib/booking";
import { getDoctor, slotsFor, startsAt, bookingDates, ALWAYS_TAKEN_TIME } from "@/lib/data";

async function read(request) {
  try { return await request.json(); } catch (e) { return null; }
}

// Reschedule: { startsAt (current), doctorId, date, time (new) }
export async function PATCH(request, { params }) {
  if (!readToken(request)) return NextResponse.json({ error: "Log in to change an appointment." }, { status: 401 });
  const body = await read(request);
  if (!body) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  const window = checkChangeWindow(body.startsAt);
  if (!window.ok) return NextResponse.json({ error: window.error, code: window.code }, { status: window.status });
  const doctor = getDoctor(body.doctorId);
  if (!doctor) return NextResponse.json({ error: "Clinician not found." }, { status: 404 });
  if (!inWindow(body.date)) return NextResponse.json({ error: "Choose a date within the next 14 days." }, { status: 400 });
  const slot = slotsFor(doctor.id, body.date, new Date(0)).find((s) => s.time === body.time);
  if (!slot || !slot.available || body.time === ALWAYS_TAKEN_TIME)
    return NextResponse.json({ error: "That time is no longer available. Choose another slot.", code: "slot_unavailable" }, { status: 409 });
  return NextResponse.json({ ref: params.ref, date: body.date, time: body.time, startsAt: startsAt(body.date, body.time).toISOString(), status: "confirmed" });
}

// Cancel: { startsAt }
export async function DELETE(request, { params }) {
  if (!readToken(request)) return NextResponse.json({ error: "Log in to cancel an appointment." }, { status: 401 });
  const body = await read(request);
  const window = checkChangeWindow(body?.startsAt);
  if (!window.ok) return NextResponse.json({ error: window.error, code: window.code }, { status: window.status });
  return NextResponse.json({ ref: params.ref, status: "cancelled" });
}
