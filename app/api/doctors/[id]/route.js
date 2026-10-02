import { NextResponse } from "next/server";
import { getDoctor, nextAvailable } from "@/lib/data";

export function GET(request, { params }) {
  const doctor = getDoctor(params.id);
  if (!doctor) return NextResponse.json({ error: "Clinician not found." }, { status: 404 });
  return NextResponse.json({ ...doctor, nextAvailable: nextAvailable(doctor.id) });
}
