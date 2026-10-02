"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { findLocal } from "@/lib/client";
import { formatDate, formatMoney } from "@/lib/data";

function Confirmation() {
  const ref = useSearchParams().get("ref");
  const [appt, setAppt] = useState(undefined);
  useEffect(() => { setAppt(findLocal(ref)); }, [ref]);
  if (appt === undefined) return <p className="muted">Loading...</p>;
  if (!appt) {
    return (
      <div className="panel empty" data-testid="confirmation-missing">
        <h2>We couldn't find that booking</h2>
        <p style={{ margin: "0 auto 16px" }}>Check My appointments, or call the clinic on (555) 010-4400.</p>
        <Link className="btn" href="/appointments">Go to My appointments</Link>
      </div>
    );
  }
  return (
    <>
      <h1 data-testid="confirmation-heading">You're booked in.</h1>
      <p className="muted">We've sent the details to {appt.patient.email}. Please arrive 10 minutes early.</p>
      <div className="ticket" data-testid="confirmation-ticket">
        <div className="ticket-top">
          <span className="small">Booking reference</span>
          <div className="ref" data-testid="booking-reference">{appt.ref}</div>
        </div>
        <div className="ticket-body">
          <div><span>Clinician</span><strong data-testid="confirmation-doctor">{appt.doctorName}</strong></div>
          <div><span>Specialty</span><strong>{appt.specialty}</strong></div>
          <div><span>Date</span><strong data-testid="confirmation-date">{formatDate(appt.date, { weekday: "long", day: "numeric", month: "long" })}</strong></div>
          <div><span>Time</span><strong data-testid="confirmation-time">{appt.time}</strong></div>
          <div><span>Where</span><strong>{appt.room}, 48 Harbor Road</strong></div>
          <div><span>Patient</span><strong>{appt.patient.name}</strong></div>
          {appt.deposit > 0 && <div><span>Deposit paid</span><strong data-testid="confirmation-deposit">{formatMoney(appt.deposit)}</strong></div>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
        <Link className="btn" href="/appointments" data-testid="view-my-appointments">View my appointments</Link>
        <Link className="btn secondary" href="/">Book another</Link>
      </div>
    </>
  );
}
export default function Page() { return <Suspense fallback={<p className="muted">Loading...</p>}><Confirmation /></Suspense>; }
