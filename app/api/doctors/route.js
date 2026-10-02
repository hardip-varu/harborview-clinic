import { NextResponse } from "next/server";
import { searchDoctors, nextAvailable } from "@/lib/data";

export function GET(request) {
  const { searchParams } = new URL(request.url);
  const doctors = searchDoctors({ q: searchParams.get("search") || "", specialty: searchParams.get("specialty") || "" })
    .map((d) => ({ ...d, nextAvailable: nextAvailable(d.id) }));
  return NextResponse.json({ count: doctors.length, doctors });
}
