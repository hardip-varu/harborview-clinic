"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { getDoctor, bookingDates, slotsFor, isSunday, parseDateKey, formatDate, formatMoney, DOCTORS, DEPOSIT_SPECIALTIES, DEPOSIT_AMOUNT } from "@/lib/data";
import { initials } from "@/lib/client";

export default function DoctorPage({ params }) {
  const router = useRouter();
  const doctor = getDoctor(params.id);
  const dates = useMemo(() => bookingDates(), []);
  const firstOpen = useMemo(() => dates.find((k) => slotsFor(params.id, k).some((s) => s.available)) || dates[0], [dates, params.id]);
  const [week, setWeek] = useState(dates.indexOf(firstOpen) >= 7 ? 1 : 0);
  const [date, setDate] = useState(firstOpen);
  const [time, setTime] = useState("");

  if (!doctor) {
    return (
      <div className="panel empty" data-testid="doctor-not-found">
        <h2>Clinician not found</h2>
        <p style={{ margin: "0 auto 16px" }}>This profile doesn't exist or has moved.</p>
        <Link className="btn" href="/">See all clinicians</Link>
      </div>
    );
  }

  const slots = slotsFor(doctor.id, date);
  const visible = dates.slice(week * 7, week * 7 + 7);
  const alternative = doctor.fullyBooked ? DOCTORS.find((d) => d.specialty === doctor.specialty && d.id !== doctor.id) : null;

  return (
    <>
      <p><Link href="/" data-testid="back-to-clinicians">Back to all clinicians</Link></p>
      <section className="profile">
        <span className="avatar lg" aria-hidden="true">{initials(doctor.name)}</span>
        <div>
          <h1 data-testid="doctor-name">{doctor.name}</h1>
          <ul className="facts">
            <li data-testid="doctor-specialty">{doctor.specialty}</li>
            <li>{doctor.years} years experience</li>
            <li>Speaks {doctor.languages.join(" and ")}</li>
            <li>{doctor.room}</li>
          </ul>
          <p>{doctor.bio}</p>
          <p className="small muted" data-testid="doctor-fee">
            Visit fee {formatMoney(doctor.fee)}, paid at the clinic.
            {DEPOSIT_SPECIALTIES.includes(doctor.specialty) && ` A refundable ${formatMoney(DEPOSIT_AMOUNT)} deposit is taken when you book.`}
          </p>
        </div>
      </section>

      <section className="panel" aria-labelledby="pick-time">
        <div className="week-nav">
          <h2 id="pick-time" style={{ margin: 0 }}>Choose an appointment time</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn secondary" data-testid="prev-week" disabled={week === 0} onClick={() => setWeek(0)}>This week</button>
            <button className="btn secondary" data-testid="next-week" disabled={week === 1} onClick={() => setWeek(1)}>Next week</button>
          </div>
        </div>

        {doctor.fullyBooked && (
          <div className="notice warn" style={{ marginTop: 16 }} data-testid="fully-booked-notice">
            {doctor.name} has no free appointments in the next 14 days.
            {alternative && <> <Link href={`/doctors/${alternative.id}`} data-testid="alternative-doctor">See {alternative.name}</Link>, also in {doctor.specialty}.</>}
          </div>
        )}

        <div className="days" role="group" aria-label="Dates">
          {visible.map((k) => {
            const free = slotsFor(doctor.id, k).filter((s) => s.available).length;
            const d = parseDateKey(k);
            return (
              <button key={k} className="day" data-testid={`day-${k}`} aria-pressed={k === date} disabled={isSunday(k)}
                onClick={() => { setDate(k); setTime(""); }}>
                <span className="dow">{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                <span className="dnum">{d.getDate()}</span>
                <span className="dfree">{isSunday(k) ? "Closed" : free ? `${free} free` : "Full"}</span>
              </button>
            );
          })}
        </div>

        <h3>{formatDate(date, { weekday: "long", day: "numeric", month: "long" })}</h3>
        {isSunday(date) ? (
          <p className="muted" data-testid="closed-message">The clinic is closed on Sundays.</p>
        ) : slots.every((s) => !s.available) ? (
          <p className="muted" data-testid="no-slots">No free times on this day. Choose another date.</p>
        ) : null}
        <div className="slots" role="group" aria-label="Times">
          {slots.map((s) => (
            <button key={s.time} className="slot" data-testid={`slot-${s.time}`} aria-pressed={s.time === time} disabled={!s.available}
              aria-label={`${s.time}${s.available ? "" : ", unavailable"}`} onClick={() => setTime(s.time)}>
              {s.time}
            </button>
          ))}
        </div>

        <div className="continue">
          <span data-testid="selected-slot">{time ? <>Selected: <strong>{formatDate(date)} at {time}</strong></> : <span className="muted">Pick a time to continue.</span>}</span>
          <button className="btn" data-testid="continue-to-booking" disabled={!time}
            onClick={() => router.push(`/book?doctor=${doctor.id}&date=${date}&time=${time}`)}>
            Continue to booking
          </button>
        </div>
      </section>
    </>
  );
}
