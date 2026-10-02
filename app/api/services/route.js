import { NextResponse } from "next/server";
import { SERVICES } from "@/lib/data";

export function GET() {
  return NextResponse.json({ count: SERVICES.length, services: SERVICES });
}
