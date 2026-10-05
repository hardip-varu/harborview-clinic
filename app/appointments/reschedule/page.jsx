"use client";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, getSession, mergeAppointments, saveAppointment } from "@/lib/client";
import { bookingDates, slotsFor, isSunday, parseDateKey, formatDate, startsAt } from "@/lib/data";

function Reschedule() {
  const ref = useSearchParams().get("ref");
  const router = useRouter();
  const [appt, setAppt] = useState(undefined);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState(null);
  const dates = useMemo(() => bookingDates().filter((k) => !isSunday(k)), []);

  useEffect(() => {
    (async () => {
      const s = getSession();
      if (!s) { setAppt(null); return; }
      const { status, data } = await api("/api/appointments", { auth: true });
      const all = mergeAppointments(status === 200 ? data.appointments : [], s.user.email);
      setAppt(all.find((a) => a.ref === ref) || null);
    })();
  }, [ref]);

  if (appt === undefined) return <p className="muted">Loading...</p>;
  if (!appt) return <div className="panel empty" data-testid="reschedule-missing"><h2>Appointment not found</h2><p style={{ margin: "0 auto 16px" }}>Log in, then open the appointment from My appointments.</p><Link className="btn" href="/appointments">My appointments</Link></div>;

  const pickDate = date || dates[0];
  const slots = slotsFor(appt.doctorId, pickDate);

  async function save() {
    setError(null);
    const { status, data } = await api(`/api/appointments/${appt.ref}`, { method: "PATCH", auth: true, body: { startsAt: appt.startsAt, doctorId: appt.doctorId, date: pickDate, time } });
    if (status === 200) { saveAppointment({ ...appt, ...data, startsAt: startsAt(pickDate, time).toISOString() }); router.push(`/appointments/confirmation?ref=${appt.ref}`); }
    else setError(data.error || "We couldn't move that appointment.");
  }

  return (
    <>
      <p><Link href="/appointments">Back to My appointments</Link></p>
      <h1>Reschedule with {appt.doctorName}</h1>
      <p className="muted" data-testid="current-slot">Currently {formatDate(appt.date, { weekday: "long", day: "numeric", month: "long" })} at {appt.time}.</p>
      {error && <div className="notice error" role="alert" data-testid="reschedule-error">{error}</div>}
      <div className="panel">
        <div className="field" style={{ maxWidth: 320 }}>
          <label htmlFor="new-date">New date</label>
          <select id="new-date" data-testid="reschedule-date" value={pickDate} onChange={(e) => { setDate(e.target.value); setTime(""); }}>
            {dates.map((k) => <option key={k} value={k}>{parseDateKey(k).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</option>)}
          </select>
        </div>
        <div className="slots" role="group" aria-label="Times">
          {slots.map((s) => (
            <button key={s.time} className="slot" data-testid={`reschedule-slot-${s.time}`} aria-pressed={s.time === time} disabled={!s.available} onClick={() => setTime(s.time)}>{s.time}</button>
          ))}
        </div>
        <div className="continue">
          <span className="muted">{time ? `New time: ${formatDate(pickDate)} at ${time}` : "Choose a new time."}</span>
          <button className="btn" data-testid="confirm-reschedule" disabled={!time} onClick={save}>Confirm new time</button>
        </div>
      </div>
    </>
  );
}
export default function Page() { return <Suspense fallback={<p className="muted">Loading...</p>}><Reschedule /></Suspense>; }
