import { NextResponse } from "next/server";
import { getDoctor, slotsFor, bookingDates, isSunday } from "@/lib/data";

export function GET(request, { params }) {
  const doctor = getDoctor(params.id);
  if (!doctor) return NextResponse.json({ error: "Clinician not found." }, { status: 404 });
  const date = new URL(request.url).searchParams.get("date") || "";
  if (!bookingDates().includes(date)) return NextResponse.json({ error: "Use a date (YYYY-MM-DD) within the next 14 days." }, { status: 400 });
  return NextResponse.json({ doctorId: doctor.id, date, closed: isSunday(date), slots: slotsFor(doctor.id, date) });
}
